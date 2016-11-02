
'use strict';

module.exports = (input, output) => {
	const file = input.read();
	file.transformed = true;
	output.send(file);
};

