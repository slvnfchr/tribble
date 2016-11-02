
'use strict';

/**
 * Task class based on flow-based programming core Graph
 */

const path = require('path');
const core = require('tribble-core');
const File = require('./File');

class Task {

	constructor(parameters) {

		const _components = []; // eslint-disable-line no-underscore-dangle
		const _parameters = parameters || {}; // eslint-disable-line no-underscore-dangle

		this.add = (component) => {
			_components.push(component);
		};

		this.run = (configuration, cb) => {
			let callback = cb;
			if (typeof configuration === 'string') { // single file processing
				_parameters.base = configuration;
			} else if (typeof configuration === 'object') { // multiple file processing
				Object.assign(_parameters, configuration);
			} else if (typeof configuration === 'function') {
				callback = configuration;
			}
			const graph = new core.Graph();
			const reader = new core.Component(path.resolve(__dirname, '../plugins/reader'));
			if (_parameters.mask === undefined) {
				graph.initialize(reader, { in: new File({ fullPath: _parameters.base }) });
			} else {
				const walker = new core.Component(path.resolve(__dirname, '../plugins/walker'));
				graph.initialize(walker, _parameters);
				graph.connect(walker, 'out', reader, 'in');
			}
			let parent = reader;
			_components.forEach((component) => {
				const node = new core.Component(typeof component === 'function' ? component : component.handler);
				graph.connect(parent, 'out', node, 'in');
				parent = node;
			});
			graph.run(callback);
		};

	}

}

module.exports = Task;
