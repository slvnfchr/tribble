
'use strict';

const expect = require('chai').expect;
const path = require('path');
const Plugin = require('../lib/core/Plugin');
const Task = require('../lib/core/Task');
const Runner = require('../lib/core/Runner');
const File = require('../lib/core/File');

describe('Core classes', () => {

	it('Plugin class', (done) => {
		const plugin = new Plugin();
		expect(plugin).to.have.property('type');
		expect(plugin).to.have.property('priority');
		expect(plugin).to.have.property('mediatypes');
		expect(plugin.mediatypes).to.have.property('input');
		expect(plugin.mediatypes).to.have.property('output');
		expect(plugin).to.have.property('parent');
		expect(plugin.parent).to.be.null;
		expect(plugin).to.have.property('root');
		expect(plugin.parent).to.be.null;
		expect(plugin).to.have.property('children');
		expect(plugin.children).to.be.instanceof(Array);
		expect(plugin).to.have.property('ancestors');
		expect(plugin.ancestors).to.be.instanceof(Array);
		done();
	});

	it('Task class', (done) => {
		const task = new Task();
		expect(task).to.respondTo('add');
		expect(task).to.respondTo('run');
		done();
	});

	it('Runner class', (done) => {
		const runner = new Runner();
		expect(runner).to.have.property('library');
		expect(runner).to.respondTo('load');
		expect(runner).to.respondTo('build');
		expect(runner).to.respondTo('getTaskTo');
		done();
	});

	describe('File class', () => {

		it('Required parameters for instantiation', (done) => {
			expect(File.create).to.throw(Error);
			expect(File.create.bind(File, { fullPath: null })).to.throw(Error);
			expect(File.create.bind(File, { fullPath: '' })).to.throw(Error);
			expect(File.create.bind(File, { fullPath: '/path/to/file' })).not.to.throw(Error);
			done();
		});

		it('Minimal instantiation', (done) => {
			const name = 'test.htm';
			const file = File.create({ fullPath: path.resolve(__dirname, name) });
			expect(file).to.have.all.keys('base', 'name', 'path', 'fullPath', 'extension', 'mediatype', 'contents');
			expect(file.base).to.be.null;
			expect(file.name).to.equal(name);
			expect(file.path).to.be.null;
			expect(file.fullPath).to.equal(path.resolve(__dirname, name));
			expect(file.mediatype).to.equal('text/html');
			expect(file.contents).to.be.null;
			done();
		});

		it('Extended instantiation', (done) => {
			const properties = { fullPath: __filename };
			const file = File.create(properties);
			Object.assign(properties, {
				base: null,
				contents: null,
				path: null,
				name: path.basename(__filename),
				extension: 'js',
				mediatype: 'application/javascript',
			});
			Object.keys(properties).forEach((name) => {
				expect(file).to.have.property(name);
				expect(file[name]).to.equal(properties[name]);
			});
			done();
		});

	});

});
