
'use strict';

module.exports = (input, output) => {
	const file = input.read();
	file.postprocessed = true;
	output.send(file);
};

