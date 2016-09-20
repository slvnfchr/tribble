#!/usr/bin/env node

/**
 * CLI bootstrap
 */

const path = require('path');
const fs = require('fs');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2));

process.on('uncaughtException', (err) => {
	console.log(err.message); // eslint-disable-line no-console
	console.log(err.stack); // eslint-disable-line no-console
});

if (args._.length === 0) {
	throw new Error('No command not found');
}

const command = path.resolve(__dirname, `${args._[0]}.js`);
try {
	if (fs.statSync(command)) {
		require(command)(args); // eslint-disable-line global-require
	}
} catch (e) {
	throw new Error('Command not found');
}
