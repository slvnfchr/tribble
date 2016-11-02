#!/usr/bin/env node

'use strict';

/**
 * CLI bootstrap
 */

const path = require('path');
const fs = require('fs');

process.on('uncaughtException', (err) => {
	console.log(err.message); // eslint-disable-line no-console
	console.log(err.stack); // eslint-disable-line no-console
});

let runtimeConfiguration = path.resolve(process.cwd(), '.tribblerc');
const args = process.argv.slice(2);
const commands = [];
const flag = /^[\-]{1,2}([^\s]+)/i;
const flags = {};
for (let i = 0, n = args.length; i < n; i += 1) {
	if (args[i].match(flag)) {
		flags[args[i].match(flag)[1]] = args[i + 1];
		i += 1;
	} else {
		commands.push(args[i]);
	}
}

if (commands.length === 0) {
	throw new Error('No command not found');
}

const command = path.resolve(__dirname, `${commands[0]}.js`);
runtimeConfiguration = fs.statSync(runtimeConfiguration) ? JSON.parse(fs.readFileSync(runtimeConfiguration)) : {};

try {
	if (fs.statSync(command)) {
		require(command)(Object.assign(runtimeConfiguration, flags)); // eslint-disable-line global-require
	}
} catch (e) {
	throw new Error('Command not found');
}
