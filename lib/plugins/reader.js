
'use strict';

/**
 * Text file reader plugin
 */

const fs = require('fs');
const File = require('../core/File');

module.exports = function reader(input, output) {
	let file = input.read();
	if (typeof file === 'string') {
		try {
			file = new File({ fullPath: file, stats: fs.statSync(file) });
		} catch (e) {
			file = new File({ fullPath: file });
		}
	}
	if (file.stats && !file.stats.isDirectory() && file.isText()) {
		if (file.mediatype === File.mediatypes.json) {
			file.contents = require(file.fullPath); // eslint-disable-line global-require
			output.send(file);
		} else {
			file.contents = fs.readFileSync(file.fullPath, { encoding: 'utf8' });
			output.send(file);
		}
	} else {
		output.send(file);
	}
};
