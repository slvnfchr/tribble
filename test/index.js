
'use strict';

const expect = require('chai').expect;
const path = require('path');
const Plugin = require('../lib/core/Plugin');
const Task = require('../lib/core/Task');
const Runner = require('../lib/core/Runner');

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

});

const getPlugin = (runner, name) => runner.plugins.filter(plugin => plugin.handler.match(new RegExp(name, 'i')))[0];

describe('Task execution', () => {

	it('Runner plugins graph loading', (done) => {
		const runner = new Runner(path.resolve(__dirname, 'tasks/stylesheets'));
		runner.load(() => {
			const preprocessor = getPlugin(runner, 'preprocessor'); // ex: SASS
			const transform = getPlugin(runner, 'transform'); // any CSS transformation
			const postprocessor = getPlugin(runner, 'postprocessor'); // ex: postCSS
			const minifier = getPlugin(runner, 'minifier'); // ex: clean-css
			expect(preprocessor.parent).to.be.null;
			expect(preprocessor.ancestors.length).to.equal(0);
			expect(preprocessor.children.length).to.equal(1);
			expect(preprocessor.children[0]).to.equal(transform);
			expect(transform.parent).to.equal(preprocessor);
			expect(transform.ancestors.length).to.equal(1);
			expect(transform.ancestors[0]).to.equal(preprocessor);
			expect(transform.children.length).to.equal(1);
			expect(transform.children[0]).to.equal(postprocessor);
			expect(postprocessor.parent).to.equal(transform);
			expect(postprocessor.ancestors.length).to.equal(2);
			expect(postprocessor.ancestors[0]).to.equal(preprocessor);
			expect(postprocessor.ancestors[1]).to.equal(transform);
			expect(postprocessor.children.length).to.equal(1);
			expect(postprocessor.children[0]).to.equal(minifier);
			expect(minifier.parent).to.equal(postprocessor);
			expect(minifier.ancestors.length).to.equal(3);
			expect(minifier.ancestors[0]).to.equal(preprocessor);
			expect(minifier.ancestors[1]).to.equal(transform);
			expect(minifier.ancestors[2]).to.equal(postprocessor);
			expect(minifier.children.length).to.equal(0);
			expect(runner.mediatypes.input).to.deep.equal(preprocessor.mediatypes.input);
			expect(runner.mediatypes.output).to.deep.equal(minifier.mediatypes.output);
			done();
		});
	});

	it('Runner reverse task chain running', (done) => {
		const runner = new Runner(path.resolve(__dirname, 'tasks/stylesheets'));
		runner.load(() => {
			const chain = runner.getTaskTo(path.resolve(__dirname, 'src/test.css'));
			chain.add((input) => {
				const file = input.read();
				expect(file.mediatype).to.equal('text/css');
				expect(file.preprocessed).to.be.true;
				expect(file.transformed).to.be.true;
				expect(file.postprocessed).to.be.true;
				expect(file.minified).to.be.true;
			});
			chain.run(done);
		});
	});

});
