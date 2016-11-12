
'use strict';

/**
 * File writer plugin
 */

const fs = require('fs');
const path = require('path');

let dest;
const cache = [];

module.exports = function writer(input, output) {
	const file = input.in.read().data;
	dest = input.dest.read() || dest;
	const target = path.basename(dest.data) === file.name ? dest.data : path.resolve(dest.data, file.path.replace(new RegExp(`^[${path.sep}]`), ''));
	const parts = target.replace(file.name, file.stats.isDirectory() ? file.name : '').split(path.sep);
	let index = parts.length - 1;
	let base;
	// Find first non existing folder
	while (index >= 0) {
		try {
			const folder = parts.slice(0, index).join(path.sep);
			if (cache.indexOf(folder) === -1) cache.push(folder);
			fs.statSync(folder);
			index += 1;
			break;
		} catch (e) {
			index -= 1;
		}
	}
	// Create required nested folders
	while (index < parts.length) {
		base = path.resolve(dest.data, parts.slice(0, index).join(path.sep));
		fs.mkdirSync(base);
		index += 1;
	}
	// Copy file or create folder
	const callback = () => {
		Object.assign(file, { base: dest.data, fullPath: target });
		output.send(file);
	};
	if (file.stats.isFile()) {
		if (file.isText() && file.contents) {
			const data = (typeof file.contents === 'object') ? JSON.stringify(file.contents, null, 2) : file.contents;
			fs.writeFile(target, data, callback);
		} else {
			fs.createReadStream(file.fullPath).pipe(fs.createWriteStream(target)).on('finish', callback);
		}
	} else if (cache.indexOf(target) === -1) { // create empty directory
		fs.mkdir(target, callback);
	} else { // skip directory
		callback.call();
	}
};
