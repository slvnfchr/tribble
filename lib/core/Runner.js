
'use strict';

/**
 * Graph class
 */

const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const Task = require('./Task');
const Plugin = require('./Plugin');
const File = require('./File');

function intersect(arr1, arr2) {
	return arr1.filter(item => arr2.indexOf(item) !== -1);
}

function isConcurrent(plugin1, plugin2) {
	return intersect(plugin1.mediatypes.input, plugin2.mediatypes.input).length > 0 &&
		intersect(plugin1.mediatypes.output, plugin2.mediatypes.output).length > 0;
}

class Runner {

	constructor(library) {
		this.plugins = [];
		this.library = library || process.cwd();
		this.mediatypes = { input: null, output: null };
		this.extensions = { input: null, output: null };
	}

	load(cb) {
		const task = new Task({ base: this.library, mask: 'tribble.json$' });
		task.pipe((input) => {
			const file = input.read();
			const configuration = file.contents; // eslint-disable-line global-require
			Object.keys(configuration).forEach((key) => {
				const plugin = new Plugin(path.resolve(path.dirname(file.fullPath), `.${key}`));
				const pluginConfiguration = configuration[key];
				plugin.type = intersect(Object.keys(Plugin.types).map(type => Plugin.types[type]), pluginConfiguration.tags)[0];
				plugin.type = intersect(Object.keys(Plugin.types).map(type => Plugin.types[type]), pluginConfiguration.tags)[0];
				plugin.mediatypes.input = pluginConfiguration.consumes;
				plugin.mediatypes.output = pluginConfiguration.produces;
				plugin.extensions.input = plugin.mediatypes.input.reduce((ext, mediatype) => ext.concat(File.extensions[mediatype]), []);
				plugin.extensions.output = plugin.mediatypes.output.reduce((ext, mediatype) => ext.concat(File.extensions[mediatype]), []);
				this.plugins.push(plugin);
			});
		});
		task.run(() => {
			this.build();
			cb.call();
		});
	}

	build() {
		this.plugins.forEach((plugin) => {
			let parents = [];
			let children = [];
			this.plugins.filter(item => item !== plugin && item.phase === plugin.phase).forEach((other) => {
				const concurrent = isConcurrent(plugin, other);
				if ((!concurrent && intersect(plugin.mediatypes.input, other.mediatypes.output).length > 0) || (concurrent && other.priority < plugin.priority)) parents.push(other);
				if ((!concurrent && intersect(plugin.mediatypes.output, other.mediatypes.input).length > 0) || (concurrent && other.priority > plugin.priority)) children.push(other);
			});
			if (parents.length > 0 && plugin) {
				const max = parents.reduce((value, parent) => Math.max(parent.priority, value), 0);
				parents = parents.filter(parent => parent.priority === max);
			}
			if (children.length > 0) {
				const min = children.reduce((value, child) => Math.min(child.priority, value), Infinity);
				children = children.filter(child => child.priority === min);
			}
			Object.assign(plugin, { parent: parents.length > 0 ? parents[0] : null, children });
		});
		this.mediatypes.input = this.plugins.filter((plugin) => plugin.phase === Plugin.phases.PROCESSING && plugin.children.length === 0).reduce((ext, plugin) => ext.concat(plugin.root.mediatypes.input), []);
		this.mediatypes.output = this.plugins.filter((plugin) => plugin.phase === Plugin.phases.PROCESSING && plugin.children.length === 0).reduce((ext, plugin) => ext.concat(plugin.mediatypes.output), []);
		this.extensions.input = this.mediatypes.input.reduce((ext, mediatype) => ext.concat(File.extensions[mediatype]), []);
		this.extensions.output = this.mediatypes.output.reduce((ext, mediatype) => ext.concat(File.extensions[mediatype]), []);
	}

	getPluginByPath(pluginPath) {
		return this.plugins.filter(plugin => plugin.handler.match(new RegExp(`${pluginPath}`, 'i')))[0];
	}

	getLeafPlugins(phase, filter) {
		let plugins = this.plugins
			.filter(plugin => plugin.phase === phase)
			.filter(plugin => plugin.children.length === 0);
		if (filter) plugins = plugins.filter(filter);
		return plugins;
	}

	getTask(phase, filter) {
		const plugins = this.getLeafPlugins(phase, filter);
		const task = new Task();
		plugins.forEach(plugin => task.add(plugin));
		return task;
	}

	getTaskTo(filepath) {
		const extension = path.extname(filepath).substring(1);
		let source;
		const task = this.getTask(Plugin.phases.PROCESSING, plugin => {
			const candidate = plugin.extensions.output.indexOf(extension) !== -1;
			if (candidate && plugin.root.extensions.input.length === 1) {
				source = filepath.replace(extension, plugin.root.extensions.input[0]);
			} else if (candidate) {
				source = { base: path.dirname(filepath), mask: `${path.basename(filepath, `.${extension}`)}.(${plugin.root.extensions.input.join('|')})` };
			}
			return candidate;
		});
		const proxy = {
			pipe: task.pipe,
			run: (cb) => {
				task.run(source, cb);
			},
		};
		return proxy;
	}

	getBuildTasks(source, dest) {
		const temp = path.resolve(os.tmpdir(), `tribble-${crypto.createHash('md5').update(`${process.pid}`).digest('hex')}`);
		const writer = path.resolve(__dirname, '../plugins/writer');
		const remover = path.resolve(__dirname, '../plugins/remover');
		const processing = this.getTask(Plugin.phases.PROCESSING).pipe(writer, { dest: temp });
		this.getLeafPlugins(Plugin.phases.INDEXING).forEach(plugin => processing.pipe(plugin));
		const bundling = this.getTask(Plugin.phases.OPTIMIZATION).pipe(writer, { dest });
		const cleaning = this.getTask(() => false).pipe(remover);
		const proxy = {
			pipe: bundling.pipe,
			run: (cb) => {
				processing.run({ base: source }, () => {
					bundling.run({ base: temp }, () => {
						cleaning.run({ base: temp }, () => { // empty temporary working directory
							fs.rmdirSync(temp); // remove temporary working directory
							if (cb) cb.call(this);
						});
					});
				});
			},
		};
		return proxy;
	}

}

module.exports = Runner;
