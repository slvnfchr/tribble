
'use strict';

/**
 * Texts file writer plugin
 */

const fs = require('fs');

module.exports = function writer(input, output) {
	const file = input.read();
	let data = file.contents;
	data = (typeof data === 'object') ? JSON.stringify(data, null, 2) : data;
	fs.writeFile(file.fullPath, data, () => {
		output.send(file);
	});
};
