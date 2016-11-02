
'use strict';

/**
 * Files tree traversal plugin
 */

const fs = require('fs');
const path = require('path');
const File = require('../core/File');

const ignore = /^(LICENSE|\.)/i;

module.exports = function walker(input, output) {
	const parameters = input.read();
	const base = parameters.base; // base path
	const mask = new RegExp(parameters.mask, 'i'); // filename mask
	const traversed = {};

	const _getFiles = (basepath, level) => { // eslint-disable-line no-underscore-dangle
		traversed[basepath] = false;
		const current = level || 0;
		fs.readdir(basepath, (err, files) => {
			files
				.filter(name => !ignore.test(name))
				.filter(name => (path.resolve(basepath, name).replace(base, '').match(/node_modules/g) || []).length < 2)
				.map(name => ({ name, filepath: path.resolve(basepath, name) }))
				.map(file => Object.assign(file, { stats: fs.statSync(file.filepath) }))
				.forEach((file) => {
					if (file.stats.isFile() && mask.test(file.name)) {
						output.send(new File({
							base,
							fullPath: file.filepath,
							level: current,
						}));
					} else if (file.stats.isDirectory()) {
						_getFiles(file.filepath, current + 1);
					}
				});
			traversed[basepath] = true;
			if (Object.keys(traversed).map(key => traversed[key]).filter(value => !value).length === 0) {
				output.send(null); // send null IP to close connection
			}
		});
	};
	_getFiles(base);

};
