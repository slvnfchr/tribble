
'use strict';

/**
 * Serve command
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const stream = require('stream');
const pluginLib = require('tribble-plugin');
const bs = require('browser-sync').create();

module.exports = function serve(options) {
	const bsOptions = {
		server: options.source,
		files: [],
		port: options.port || 3000,
		middleware: [],
	};
	// Build a middleware per plugin output and build plugin chain
	const plugins = pluginLib.util.load();
	plugins.filter((plugin) => plugin.children.length === 0).forEach((plugin) => {
		plugin.root.input.extensions
		bsOptions.files = bsOptions.files.concat(plugin.root.input.extensions.map((extension) => `${options.source}/**/*.${extension}`));
		plugin.output.extensions.forEach((extension) => {
			bsOptions.middleware.push((req, res, next) => {
				const matches = req.url.match(new RegExp(`\/(([^\.]+)\.${extension})$`, 'i'));
				if (matches) {
					let processStream = plugin.root.getSources(path.resolve(options.source, `.${req.url}`));
					plugin.ancestors.forEach((ancestor) => {
						processStream = processStream.pipe(ancestor);
					});
					processStream = processStream.pipe(plugin);
					processStream.on('data', (file) => {
						Object.assign(res, { statusCode: 200 });
						res.setHeader('Content-Type', file.type);
						res.end(file.data);
					});
				} else {
					next();
				}
			});
		});
	});
	bs.init(bsOptions);
};
