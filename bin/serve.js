
'use strict';

/**
 * Serve command
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const stream = require('stream');
const mime = require('mime-types');
const bs = require('browser-sync').create();

const manifest = require(path.resolve(process.cwd(), 'package.json'));

function unique(value, index, arr) {
	return arr.indexOf(value) === index;
}

function getOutput(plugin) {
	let output = [plugin.output];
	plugin.dependencies.forEach((child) => {
		output = output.concat(getOutput(child));
	});
	output = output.filter(unique);
	return output;
}

function getDependencies(plugin) {
	let deps = plugin.dependencies;
	plugin.dependencies.forEach((child) => {
		deps = deps.concat(getDependencies(child));
	});
	return deps;
}

function File(properties) {
	if (properties === undefined || !properties.fullPath) throw new Error('A fullPath property should be specified to instantiate a File object');
	this.root = properties.root || null;
	this.path = properties.path || null;
	this.fullPath = properties.fullPath || null;
	this.type = properties.type || (properties.fullPath ? mime.lookup(properties.fullPath) : null);
	this.name = properties.name || (this.fullPath ? path.basename(this.fullPath) : null);
	this.data = null;
}


function ReadFileStream(properties) {
	stream.Readable.call(this, { objectMode: true });
	this.file = new File(properties);
}
util.inherits(ReadFileStream, stream.Readable);

ReadFileStream.create = function create(properties) {
	const instance = new ReadFileStream(properties);
	return instance;
};

ReadFileStream.prototype.setup = function setup() {
	this.readfile = true;
	fs.readFile(this.file.fullPath, 'utf8', (err, data) => {
		Object.assign(this.file, { data });
		this.push(this.file);
		this.push(null);
	});
};

ReadFileStream.prototype._read = function read() { // eslint-disable-line no-underscore-dangle
	if (!this.readfile) this.setup();
};

module.exports = function serve(options) {
	const bsOptions = {
		server: options.source,
		files: [],
		port: options.port || 3000,
		middleware: [],
	};
	const plugins = [];
	Object.keys(manifest.devDependencies).forEach((dependency) => {
		if (dependency.match(/^tribble\-.+/i)) {
			plugins.push(require(dependency)); // eslint-disable-line global-require
		}
	});
	// Build plugin hierarchy
	plugins.forEach((plugin) => {
		Object.assign(plugin, { parents: plugins.filter((parent) => plugin.input.indexOf(parent.output) !== -1) });
		Object.assign(plugin, { dependencies: plugins.filter((child) => child.input.indexOf(plugin.output) !== -1) });
	});
	plugins.forEach((plugin) => {
		bsOptions.files = bsOptions.files.concat(plugin.input.map((type) => `${options.source}/**/*.${mime.extension(type)}`));
	});
	// Build a middleware per plugin chain
	plugins.filter((plugin) => plugin.parents.length === 0).forEach((plugin) => {
		const output = getOutput(plugin);
		const deps = [plugin].concat(getDependencies(plugin));
		const middleware = (req, res, next) => {
			let found = false;
			output.forEach((type) => {
				const matches = req.url.match(new RegExp(`\/(([^\.]+)\.${mime.extension(type)})$`, 'i'));
				if (matches) {
					found = true;
					const sourceFiles = plugin.input.reduce((arr, input) => {
						const filepath = path.resolve(options.source, `${matches[2]}.${mime.extension(input)}`);
						try {
							fs.accessSync(filepath, fs.F_OK);
							arr.push(filepath);
						} catch (e) {
							// do nothing
						}
						return arr;
					}, []);
					if (sourceFiles.length > 1) {
						Object.assign(res, { statusCode: 409, statusMessage: 'Conflict with several source files' });
						res.end();
					} else {
						let processStream = ReadFileStream.create({ root: options.source, fullPath: sourceFiles[0] });
						deps.forEach((dep) => {
							processStream = processStream.pipe(dep.getStream());
						});
						processStream.on('data', (file) => {
							Object.assign(res, { statusCode: 200 });
							res.setHeader('Content-Type', file.type);
							res.end(file.data);
						});
					}
				}
			});
			if (!found) next();
		};
		bsOptions.middleware.push(middleware);
	});
	bs.init(bsOptions);
};
