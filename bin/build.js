
'use strict';

/**
 * Build command
 */

const path = require('path');
const Runner = require('../lib/core/Runner');

module.exports = function serve(options) {
	const runner = new Runner(process.cwd());
	runner.load(() => {
		const source = path.resolve(process.cwd(), options.source);
		const target = path.resolve(process.cwd(), options.target);
		runner.getBuildTasks(source, target).run();
	});
};
