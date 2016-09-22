
'use strict';

/**
 * Plugins utilities
 */

const path = require('path');
const core = require('tribble-plugin');

function intersect(arr1, arr2) {
	return arr1.filter(item => arr2.indexOf(item) !== -1);
}

function isConcurrent(plugin1, plugin2) {
	return intersect(plugin1.input.mediatypes, plugin2.input.mediatypes).length > 0 &&
		intersect(plugin1.output.mediatypes, plugin2.output.mediatypes).length > 0;
}

// Build plugin hierarchy
function build(plugins) {
	plugins.forEach((plugin) => {
		let parents = [];
		let children = [];
		plugins.filter(item => item !== plugin).forEach((other) => {
			const concurrent = isConcurrent(plugin, other);
			if ((!concurrent && intersect(plugin.input.mediatypes, other.output.mediatypes).length > 0) || (concurrent && other.priority < plugin.priority)) parents.push(other);
			if ((!concurrent && intersect(plugin.output.mediatypes, other.input.mediatypes).length > 0) || (concurrent && other.priority > plugin.priority)) children.push(other);
		});
		if (parents.length > 0 && plugin) {
			const max = parents.reduce((value, parent) => Math.max(parent.priority, value), 0);
			parents = parents.filter(parent => parent.priority === max);
		}
		if (children.length > 0) {
			const min = children.reduce((value, child) => Math.min(child.priority, value), Infinity);
			children = children.filter(child => child.priority === min);
		}
		if (plugin.type === core.types.AGGREGATOR) {
			Object.assign(plugin, { parents, children });
		} else {
			Object.assign(plugin, { parent: parents.length > 0 ? parents[0] : null, children });
			Object.defineProperty(plugin, 'ancestors', {
				enumerable: true,
				get: function get() {
					return plugin.parent ? plugin.parent.ancestors.concat([plugin.parent]) : [];
				},
			});
			Object.defineProperty(plugin, 'root', {
				enumerable: true,
				get: function get() {
					const ancestors = plugin.ancestors;
					return ancestors.length > 0 ? ancestors[0] : plugin;
				},
			});
		}
	});
	return true;
}

// Load plugins
function load() {
	const plugins = [];
	const manifest = require(path.resolve(process.cwd(), 'package.json')); // eslint-disable-line global-require
	Object.keys(manifest.devDependencies).forEach((child) => {
		if (child.match(/^tribble\-.+/i)) {
			plugins.push(require(child)); // eslint-disable-line global-require
		}
	});
	build(plugins);
	return plugins;
}

module.exports = {
	build,
	load,
};
