
'use strict';

/**
 * Files tree traversal plugin
 */

const fs = require('fs');
const path = require('path');
const File = require('../core/File');

const ignore = /^(LICENSE|\.DS_Store|\.gitkeep)/i;

module.exports = function walker(input, output) {
	const base = input.base ? input.base.read().data : input.read(); // base path
	let mask = input.mask ? input.mask.read().data : '.*'; // filename mask
	mask = new RegExp(mask, 'i');
	const traversed = {};
	const baseFolder = new File({ fullPath: base, stats: fs.statSync(base) });
	const _getFiles = (folder) => { // eslint-disable-line no-underscore-dangle
		traversed[folder.fullPath] = false;
		if (folder.stats.isFile()) {
			output.send(folder);
		} else {
			fs.readdir(folder.fullPath, (err, files) => {
				files
					.filter(name => !ignore.test(name))
					.filter(name => (path.resolve(folder.fullPath, name).replace(base, '').match(/node_modules/g) || []).length < 2)
					.map(name => File.create({ base, name, fullPath: path.resolve(folder.fullPath, name) }))
					.map(file => Object.assign(file, { stats: fs.statSync(file.fullPath) }))
					.forEach((file) => {
						if (file.stats.isFile() && mask.test(file.name)) {
							output.send(file);
						} else if (file.stats.isDirectory()) {
							_getFiles(file);
						}
					});
				traversed[folder.fullPath] = folder;
				if (Object.keys(traversed).map(key => traversed[key]).filter(value => value === false).length === 0) {
					Object.keys(traversed)
						.slice(1)
						.filter(folderPath => mask.test(path.basename(folderPath)))
						.reverse() // reverse order for directories deletion
						.forEach((folderPath) => {
							output.send(traversed[folderPath]);
						});
					output.send(null); // send null IP to close connection
				}
			});
		}
	};
	_getFiles(baseFolder);
};
