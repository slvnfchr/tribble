
'use strict';

module.exports = (input, output) => {
	const file = input.read();
	file.minified = true;
	output.send(file);
};

