
'use strict';

/**
 * Task class based on flow-based programming core Graph
 */

const path = require('path');
const core = require('tribble-core');

const _getGraphComponent = (component, timeout) => new core.Component(typeof component === 'function' || typeof component === 'string' ? component : component.handler, timeout || 100); // eslint-disable-line no-underscore-dangle

class Task {

	constructor(parameters) {

		const _components = []; // eslint-disable-line no-underscore-dangle
		const _pipeline = []; // eslint-disable-line no-underscore-dangle
		const _parameters = parameters || {}; // eslint-disable-line no-underscore-dangle

		this.add = (component) => {
			_components.push(component);
		};

		this.pipe = (component, configuration) => {
			_pipeline.push({ component, parameters: configuration });
			return this; // for chaining purpose
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
			// Build processing graph
			const graph = new core.Graph();
			const walker = _getGraphComponent(path.resolve(__dirname, '../plugins/walker'), 20);
			graph.initialize(walker, _parameters);
			// Dispatch files per mediatype
			const dispatcher = new core.Component((input, output) => {
				const file = input.read();
				if (file.mediatype && output[file.mediatype] !== undefined) {
					output[file.mediatype].send(file);
				} else {
					output.out.send(file);
				}
			});
			graph.connect(walker, 'out', dispatcher, 'in');
			// Create a process chain for each leaf component
			const receiver = new core.Component((input, output) => {
				const file = input.read();
				output.send(file);
			});
			let parent;
			let chain;
			_components.forEach((component) => {
				component.root.mediatypes.input.forEach((mediatype) => {
					const reader = _getGraphComponent(path.resolve(__dirname, '../plugins/reader'));
					graph.connect(dispatcher, mediatype, reader, 'in');
					parent = reader;
					chain = component.ancestors.concat(component);
					chain.forEach((ancestor) => {
						const node = _getGraphComponent(ancestor);
						graph.connect(parent, 'out', node, 'in');
						parent = node;
					});
					graph.connect(parent, 'out', receiver, 'in');
				});
			});
			graph.connect(dispatcher, 'out', receiver, 'in'); // Other files are copied as they are
			// Piped components
			parent = receiver;
			_pipeline.forEach((item) => {
				const node = _getGraphComponent(item.component);
				if (item.parameters) graph.initialize(node, item.parameters);
				graph.connect(parent, 'out', node, 'in');
				parent = node;
			});
			graph.run(callback);
		};

	}

}

module.exports = Task;
