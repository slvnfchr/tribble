
'use strict';

/**
 * Files tree traversal plugin
 */

const fs = require('fs');
const path = require('path');
const File = require('../core/File');

const ignore = /^(LICENSE|\.DS_Store|\.git|\.bin|\..*rc|\..*ignore)/i;

module.exports = function walker(input, output) {
	const base = input.base ? input.base.read().data : input.read(); // base path
	let mask = input.mask ? input.mask.read().data : '.*'; // filename mask
	mask = new RegExp(mask, 'i');
	const traversed = {};
	let baseFolder;
	try {
		baseFolder = new File({ fullPath: base, stats: fs.statSync(base) });
	} catch (e) {
		baseFolder = new File({ fullPath: base });
	}
	const _getFiles = (folder) => { // eslint-disable-line no-underscore-dangle
		traversed[folder.fullPath] = false;
		if (!folder.stats || folder.stats.isFile()) {
			output.send(folder);
		} else {
			fs.readdir(folder.fullPath, (err, files) => {
				files
					.filter(name => !ignore.test(name))
					.filter(filepath => /^((?!node_modules|bower_components)|node_modules\/tribble)/i.test(filepath))
					.filter(name => (path.resolve(folder.fullPath, name).replace(base, '').match(/node_modules/g) || []).length < 2)
					.map(name => File.create({ base, name, fullPath: path.resolve(folder.fullPath, name) }))
					.map((file) => {
						try {
							return Object.assign(file, { stats: fs.statSync(file.fullPath) });
						} catch (e) {
							return file;
						}
					})
					.filter(file => file.stats !== undefined)
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
