
'use strict';

/**
 * Text file reader plugin
 */

const fs = require('fs');
const File = require('../core/File');

module.exports = function reader(input, output) {
	let file = input.read();
	file = (typeof file === 'string') ? new File({ fullPath: file, stats: fs.statSync(file) }) : file;
	if (!file.stats.isDirectory() && file.isText()) {
		fs.readFile(file.fullPath, { encoding: 'utf8' }, (err, data) => {
			file.contents = file.mediatype === File.mediatypes.json ? JSON.parse(data) : data;
			output.send(file);
		});
	} else {
		output.send(file);
	}
};
