
'use strict';

/**
 * Post install script
 */

const path = require('path');
const core = require('tribble-core');

const template = path.resolve(__dirname, '../default');
const host = path.resolve(__dirname, '../../../');
const manifest = path.resolve(host, 'package.json');

const walker = new core.Component(path.resolve(__dirname, './plugins/walker'));
const reader = new core.Component(path.resolve(__dirname, './plugins/reader'));
const writer = new core.Component(path.resolve(__dirname, './plugins/writer'));

const graph = new core.Graph();
graph.initialize(walker, template);
const sorter = new core.Component((input, output) => {
	const file = input.read();
	if (file.name === 'package.json') {
		output.configuration.send(file); // package.json will be merged with project own package.json
	} else {
		output.out.send(file); // output port for files that will be copied as they are
	}
});
graph.connect(walker, 'out', sorter, 'in');

// package.json merging branch
graph.connect(sorter, 'configuration', reader, 'in');
const merger = new core.Component((input, output) => {
	const file = input.read();
	const manifestData = require(manifest); // eslint-disable-line global-require
	Object.keys(file.contents.scripts).forEach((command) => {
		manifestData.scripts[command] = file.contents.scripts[command];
	});
	file.fullPath = manifest;
	file.contents = manifestData;
	output.send(file);
});
graph.connect(reader, 'out', merger, 'in');
graph.connect(merger, 'out', writer, 'in');

// file copying branch
graph.initialize(writer, { dest: host });
graph.connect(sorter, 'out', writer, 'in');

graph.run();
