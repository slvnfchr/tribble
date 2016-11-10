
'use strict';

/**
 * Texts file writer plugin
 */

const fs = require('fs');
const File = require('../core/File');

module.exports = function writer(input, output) {
	let file = input.read();
	file = (typeof file === 'string') ? new File({ fullPath: file, stats: fs.statSync(file) }) : file;
	if (file.stats.isDirectory()) {
		fs.rmdir(file.fullPath, () => {
			output.send(file);
		});
	} else {
		fs.unlink(file.fullPath, () => {
			output.send(file);
		});
	}
};
