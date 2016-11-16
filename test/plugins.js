
'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const core = require('tribble-core');

const library = path.resolve(__dirname, '../lib/plugins/');
const walkerPlugin = path.resolve(library, 'walker');
const readerPlugin = path.resolve(library, 'reader');
const writerPlugin = path.resolve(library, 'writer');
const removerPlugin = path.resolve(library, 'remover');

describe('Built-in file manipulation plugins', () => {

	describe('Walker', () => {

		it('Initialization with file path', (done) => {
			const graph = new core.Graph();
			const walker = new core.Component(walkerPlugin, 10);
			const base = __filename;
			const files = [];
			graph.initialize(walker, base);
			const tester = new core.Component((input) => {
				const file = input.read();
				files.push(file);
			});
			graph.connect(walker, 'out', tester, 'in');
			graph.run(() => {
				expect(files.length).to.equal(1);
				expect(files[0].fullPath).to.equal(__filename);
				done();
			});
		});

		it('Initialization with folder path', (done) => {
			const graph = new core.Graph();
			const walker = new core.Component(walkerPlugin, 10);
			const base = path.resolve(__dirname, 'tasks/stylesheets/');
			const subfolders = ['minifier', 'postprocessor', 'preprocessor', 'transform'];
			const files = [];
			graph.initialize(walker, base);
			const tester = new core.Component((input) => {
				const file = input.read();
				files.push(file);
			});
			graph.connect(walker, 'out', tester, 'in');
			graph.run(() => {
				expect(files.length).to.equal(12);
				for (let i = 0, n = subfolders.length; i < n; i += 1) { // return subfolders in reverse order
					expect(files[files.length - 1 - i].fullPath).to.equal(path.resolve(base, subfolders[i]));
				}
				done();
			});
		});

		it('Initialization with folder path and filename regular expression mask', (done) => {
			const graph = new core.Graph();
			const walker = new core.Component(walkerPlugin, 10);
			const base = path.resolve(__dirname, 'tasks/stylesheets');
			const mask = '.js$';
			const files = [];
			graph.initialize(walker, { base, mask });
			const tester = new core.Component((input) => {
				const file = input.read();
				expect(file.name).to.match(new RegExp(mask, 'i'));
				files.push(file);
			});
			graph.connect(walker, 'out', tester, 'in');
			graph.run(() => {
				expect(files.length).to.equal(4);
				expect(files.filter(file => file.name !== 'index.js').length).to.equal(0);
				done();
			});
		});

	});

	describe('Reader', () => {

		it('Initialization with file path', (done) => {
			const fullPath = __filename;
			const graph = new core.Graph();
			const reader = new core.Component(readerPlugin, 10);
			graph.initialize(reader, fullPath);
			const tester = new core.Component((input) => {
				const file = input.read();
				expect(file.fullPath).to.equal(fullPath);
				expect(file).to.have.property('contents');
			});
			graph.connect(reader, 'out', tester, 'in');
			graph.run(() => {
				done();
			});
		});

		it('Initialization with plain text file', (done) => {
			const fullPath = path.resolve(__dirname, 'src/test.scss');
			const graph = new core.Graph();
			const reader = new core.Component(readerPlugin, 10);
			graph.initialize(reader, fullPath);
			const tester = new core.Component((input) => {
				const file = input.read();
				expect(file.contents).to.equal(fs.readFileSync(fullPath, 'utf-8'));
			});
			graph.connect(reader, 'out', tester, 'in');
			graph.run(() => {
				done();
			});
		});

		it('Initialization with JSON file', (done) => {
			const fullPath = path.resolve(__dirname, '../package.json');
			const graph = new core.Graph();
			const reader = new core.Component(readerPlugin, 10);
			graph.initialize(reader, fullPath);
			const tester = new core.Component((input) => {
				const file = input.read();
				expect(file.contents).to.deep.equal(require(fullPath)); // eslint-disable-line global-require
			});
			graph.connect(reader, 'out', tester, 'in');
			graph.run(() => {
				done();
			});
		});

	});

	describe('Writer', () => {

		it('Initialization with single text file', (done) => {
			const fullPath = path.resolve(__dirname, 'src/test.scss');
			const targetPath = path.resolve(__dirname, 'dist/test.scss');
			const graph = new core.Graph();
			const reader = new core.Component(readerPlugin, 10);
			const writer = new core.Component(writerPlugin, 10);
			graph.initialize(reader, fullPath);
			graph.connect(reader, 'out', writer, 'in');
			graph.initialize(writer, { dest: targetPath });
			const tester = new core.Component((input) => {
				const file = input.read();
				expect(file.fullPath).to.equal(targetPath);
				expect(fs.readFileSync(file.fullPath, 'utf-8')).to.equal(file.contents);
				const stats = fs.statSync(targetPath);
				expect(stats.mtime.getTime()).to.be.above(file.stats.mtime.getTime());
			});
			graph.connect(writer, 'out', tester, 'in');
			graph.run(() => {
				done();
			});
		});

		it('Initialization with single JSON file', (done) => {
			const fullPath = path.resolve(__dirname, '../package.json');
			const targetPath = path.resolve(__dirname, 'dist/package.json');
			const newKey = { foo: 'bar' };
			const graph = new core.Graph();
			const reader = new core.Component(readerPlugin, 10);
			const writer = new core.Component(writerPlugin, 10);
			graph.initialize(reader, { fullPath });
			const rewriter = new core.Component((input, output) => {
				const file = input.read();
				const data = JSON.parse(JSON.stringify(file.contents));
				Object.assign(data, newKey);
				Object.assign(file, { contents: data });
				output.send(file);
			});
			graph.connect(reader, 'out', rewriter, 'in');
			graph.connect(rewriter, 'out', writer, 'in');
			graph.initialize(writer, { dest: targetPath });
			const tester = new core.Component((input) => {
				const file = input.read();
				const data = require(fullPath); // eslint-disable-line global-require
				const newData = require(file.fullPath); // eslint-disable-line global-require
				expect(newData).not.to.deep.equal(data);
				Object.assign(data, newKey);
				expect(newData).to.deep.equal(data);
			});
			graph.connect(writer, 'out', tester, 'in');
			graph.run(() => {
				done();
			});
		});

		it('Initialization with folder path', (done) => {
			const graph = new core.Graph();
			const walker = new core.Component(walkerPlugin, 10);
			const writer = new core.Component(writerPlugin, 10);
			const base = path.resolve(__dirname, 'tasks');
			const dest = path.resolve(__dirname, 'dist');
			const sources = {};
			graph.initialize(walker, base);
			const register = new core.Component((input, output) => {
				const file = input.read();
				sources[file.path] = file;
				output.send(file);
			});
			graph.connect(walker, 'out', register, 'in');
			graph.initialize(writer, { dest });
			graph.connect(register, 'out', writer, 'in');
			const tester = new core.Component((input) => {
				const file = input.read();
				expect(file.base).to.equal(dest);
				expect(file.fullPath).to.equal(sources[file.path].fullPath.replace(base, dest));
				expect(() => fs.statSync(file.fullPath)).to.not.throw(Error);
				delete sources[file.path];
			});
			graph.connect(writer, 'out', tester, 'in');
			graph.run(() => {
				expect(Object.getOwnPropertyNames(sources).length).to.equal(0);
				done();
			});
		});

	});

	describe('Remover', () => {

		it('Initialization with file distribution path', (done) => {
			const graph = new core.Graph();
			const walker = new core.Component(walkerPlugin, 10);
			const remover = new core.Component(removerPlugin, 10);
			const base = path.resolve(__dirname, 'dist');
			const sources = {};
			graph.initialize(walker, { base });
			const register = new core.Component((input, output) => {
				const file = input.read();
				sources[file.path] = file;
				output.send(file);
			});
			graph.connect(walker, 'out', register, 'in');
			graph.connect(register, 'out', remover, 'in');
			const tester = new core.Component((input) => {
				const file = input.read();
				expect(() => fs.statSync(file.fullPath)).to.throw(Error);
				delete sources[file.path];
			});
			graph.connect(remover, 'out', tester, 'in');
			graph.run(() => {
				done();
			});
		});

	});
});
