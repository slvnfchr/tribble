
'use strict';

/**
 * Install command
 */

const spawn = require('child_process').spawn;
const manifest = require('../package.json');

module.exports = function install(options) {
	const command = spawn('npm', ['install', `${manifest.name}-${options._[1]}`, '--save-dev']);
	command.stdout.on('data', (data) => {
		console.log(`${data}`); // eslint-disable-line no-console
	});
};
