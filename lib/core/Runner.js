
'use strict';

/**
 * Graph class
 */

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
		task.add((input) => {
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
			this.plugins.filter(item => item !== plugin).forEach((other) => {
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
			if (plugin.type === Plugin.types.AGGREGATOR) {
				Object.assign(plugin, { parents, children });
			} else {
				Object.assign(plugin, { parent: parents.length > 0 ? parents[0] : null, children });
			}
		});
		this.mediatypes.input = this.plugins.filter((plugin) => plugin.children.length === 0).reduce((ext, plugin) => ext.concat(plugin.root.mediatypes.input), []);
		this.mediatypes.output = this.plugins.filter((plugin) => plugin.children.length === 0).reduce((ext, plugin) => ext.concat(plugin.mediatypes.output), []);
		this.extensions.input = this.mediatypes.input.reduce((ext, mediatype) => ext.concat(File.extensions[mediatype]), []);
		this.extensions.output = this.mediatypes.output.reduce((ext, mediatype) => ext.concat(File.extensions[mediatype]), []);
	}

	getTaskTo(filepath) {
		const extension = path.extname(filepath).substring(1);
		const candidate = this.plugins
			.filter(plugin => plugin.children.length === 0)
			.filter(plugin => plugin.extensions.output.indexOf(extension) !== -1)[0];
		if (!candidate) throw new Error(`${extension} can't be produced`);
		const task = new Task();
		candidate.ancestors.forEach((ancestor) => task.add(ancestor));
		task.add(candidate);
		const proxy = {
			add: task.add,
			run: (cb) => {
				let source;
				if (candidate.root.extensions.input.length === 1) {
					source = filepath.replace(extension, candidate.root.extensions.input[0]);
				} else {
					source = { base: path.dirname(filepath), mask: `${path.basename(filepath, `.${extension}`)}.(${candidate.root.extensions.input.join('|')})` };
				}
				task.run(source, cb);
			},
		};
		return proxy;
	}

}

module.exports = Runner;
