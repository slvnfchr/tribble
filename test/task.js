
'use strict';

const expect = require('chai').expect;
const path = require('path');
const Runner = require('../lib/core/Runner');

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
		const runner = new Runner(path.resolve(__dirname, 'tasks'));
		runner.load(() => {
			const chain = runner.getTaskTo(path.resolve(__dirname, 'src/test.css'));
			chain.pipe((input) => {
				const file = input.read();
				expect(file.contents.trim()).to.equal('body { background-color:#FFF; }');
				expect(file.mediatype).to.equal('text/css');
				expect(file.preprocessed).to.be.true;
				expect(file.transformed).to.be.true;
				expect(file.postprocessed).to.be.true;
				expect(file.minified).to.be.true;
				done();
			});
			chain.run();
		});
	});

	it('Runner build task chain running', (done) => {
		const runner = new Runner(path.resolve(__dirname, 'tasks'));
		runner.load(() => {
			const chain = runner.getAllTasks(path.resolve(__dirname, 'src/'), path.resolve(__dirname, 'dist/'));
			chain.pipe((input) => {
				const file = input.read();
				expect(file.base).to.equal(path.resolve(__dirname, 'dist/'));
				expect(file.name).to.equal('test.css');
				done();
			});
			chain.run();
		});
	});

});
