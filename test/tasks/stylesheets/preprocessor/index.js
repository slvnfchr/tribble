
'use strict';

module.exports = (input, output) => {
	const file = input.read();
	file.mediatype = 'text/css';
	file.preprocessed = true;
	output.send(file);
};

