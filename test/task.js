
'use strict';

const expect = require('chai').expect;
const path = require('path');
const Runner = require('tribble').Runner;
const File = require('tribble').File;
const Plugin = require('tribble').Plugin;

describe('Task execution', () => {

	it('Runner plugins graph loading', (done) => {
		const runner = new Runner(path.resolve(__dirname, 'tasks/stylesheets'));
		runner.load(() => {
			const preprocessor = runner.getPluginByPath('preprocessor'); // ex: SASS
			const transform = runner.getPluginByPath('transform'); // any CSS transformation
			const postprocessor = runner.getPluginByPath('postprocessor'); // ex: postCSS
			const minifier = runner.getPluginByPath('minifier'); // ex: clean-css
			expect(preprocessor).to.be.instanceof(Plugin);
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
			expect(postprocessor.children.length).to.equal(0);
			expect(runner.mediatypes.input).to.deep.equal(preprocessor.mediatypes.input);
			expect(runner.mediatypes.output).to.deep.equal(postprocessor.mediatypes.output);
			// minification is not part of single file processing phase
			expect(minifier.parent).to.be.null;
			expect(minifier.ancestors.length).to.equal(0);
			expect(minifier.children.length).to.equal(0);
			done();
		});
	});

	it('Runner reverse task chain running', (done) => {
		const runner = new Runner(path.resolve(__dirname, 'tasks'));
		runner.load(() => {
			const chain = runner.getTaskTo(path.resolve(__dirname, 'src/test.css'));
			chain.pipe((input) => {
				const file = input.read();
				expect(file).to.be.instanceof(File);
				expect(file.contents.trim()).to.equal('body { background-color:#FFF; }');
				expect(file.mediatype).to.equal('text/css');
				expect(file.preprocessed).to.be.true;
				expect(file.transformed).to.be.true;
				expect(file.postprocessed).to.be.true;
				expect(file.minified).to.be.undefined; // Minification is not part of processing phase
				done();
			});
			chain.run();
		});
	});

	it('Runner build task chain running', (done) => {
		const runner = new Runner(path.resolve(__dirname, 'tasks'));
		runner.load(() => {
			const chain = runner.getBuildTasks(path.resolve(__dirname, 'src/'), path.resolve(__dirname, 'dist/'));
			chain.pipe((input) => {
				const file = input.read();
				expect(file).to.be.instanceof(File);
				expect(file.base).to.equal(path.resolve(__dirname, 'dist/'));
				expect(file.name).to.equal('test.css');
				expect(file.preprocessed).to.be.undefined;
				expect(file.transformed).to.be.undefined;
				expect(file.postprocessed).to.be.undefined;
				expect(file.minified).to.be.true; // Minification is part of build
				done();
			});
			chain.run();
		});
	});

});
