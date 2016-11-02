
'use strict';

/**
 * Text file reader plugin
 */

const fs = require('fs');
const File = require('../core/File');

module.exports = function reader(input, output) {
	const file = input.read();
	fs.readFile(file.fullPath, { encoding: 'utf8' }, (err, data) => {
		file.contents = file.mediatype === File.mediatypes.json ? JSON.parse(data) : data;
		output.send(file);
	});
};
