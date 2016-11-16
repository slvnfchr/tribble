
'use strict';

module.exports = (input, output) => {
	const file = input.read();
	Object.assign(file, {
		fullPath: file.fullPath.replace(/\.[^\.]+$/i, '.css'), // change extension
		preprocessed: true,
	});
	output.send(file);
};

