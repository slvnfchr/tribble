
'use strict';

/**
 * Serve command
 */

const path = require('path');
const Runner = require('../lib/core/Runner');
const bs = require('browser-sync').create();

module.exports = function serve(options) {
	const bsOptions = {
		server: { baseDir: options.source, index: 'index.htm' },
		files: [],
		port: options.port || 3000,
		middleware: [],
	};
	const runner = new Runner(process.cwd());
	runner.load(() => {
		bsOptions.files = runner.extensions.input.map((extension) => `${options.source}/**/*.${extension}`);
		// Build a middleware per extension
		runner.extensions.output.forEach((extension) => {
			bsOptions.middleware.push((req, res, next) => {
				const url = req.url.match(/\/$/i) ? `${req.url}${bsOptions.server.index}` : req.url;
				const matches = url.match(new RegExp(`\/(([^\.]+)\.${extension})$`, 'i'));
				if (matches) {
					const task = runner.getTaskTo(path.resolve(path.resolve(process.cwd(), options.source), `.${url}`));
					task.pipe((input) => {
						const file = input.read();
						Object.assign(res, { statusCode: 200 });
						res.setHeader('Content-Type', file.mediatype);
						res.end(file.contents);
					});
					task.run();
				} else {
					next();
				}
			});
		});
		bs.init(bsOptions);
	});
};
