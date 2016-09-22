
'use strict';

const expect = require('chai').expect;
const plugin = require('tribble-plugin');
const plugins = require('../lib/plugins');

function shuffle(arr) {
	let j;
	let x;
	let i;
	for (i = arr.length; i; i -= 1) {
		j = Math.floor(Math.random() * i);
		x = arr.splice(i - 1, 1, arr[j]);
		arr.splice(j, 1, x[0]);
	}
	return arr;
}

describe('Utilities functions', () => {

	it('Simple hierarchy', (done) => {
		const plugin1 = plugin([plugin.mediatypes.sass, plugin.mediatypes.scss], [plugin.mediatypes.css, plugin.mediatypes.map], plugin.types.PREPROCESSOR, () => {}); // ex: SASS
		const plugin2 = plugin(plugin.mediatypes.css, plugin.mediatypes.css, plugin.types.TRANSFORM, () => {}); // any CSS transformation
		const plugin3 = plugin(plugin.mediatypes.css, plugin.mediatypes.css, plugin.types.POSTPROCESSOR, () => {}); // ex: postCSS
		const plugin4 = plugin(plugin.mediatypes.css, plugin.mediatypes.css, plugin.types.MINIFIER, () => {}); // ex: clean-css
		const all = shuffle([plugin1, plugin2, plugin3, plugin4]);
		plugins.build(all);
		all.forEach((item) => {
			expect(item).to.have.property('parent');
			if (item.parent !== null) expect(item.parent).to.be.instanceof(plugin1.constructor);
			expect(item).to.have.property('root');
			expect(item.root).to.equal(plugin1);
			expect(item).to.have.property('children');
			expect(item.children).to.be.instanceof(Array);
			expect(item).to.have.property('ancestors');
			expect(item.ancestors).to.be.instanceof(Array);
		});
		expect(plugin1.parent).to.be.null;
		expect(plugin1.ancestors.length).to.equal(0);
		expect(plugin1.children.length).to.equal(1);
		expect(plugin1.children[0]).to.equal(plugin2);
		expect(plugin2.parent).to.equal(plugin1);
		expect(plugin2.ancestors.length).to.equal(1);
		expect(plugin2.ancestors[0]).to.equal(plugin1);
		expect(plugin2.children.length).to.equal(1);
		expect(plugin2.children[0]).to.equal(plugin3);
		expect(plugin3.parent).to.equal(plugin2);
		expect(plugin3.ancestors.length).to.equal(2);
		expect(plugin3.ancestors[0]).to.equal(plugin1);
		expect(plugin3.ancestors[1]).to.equal(plugin2);
		expect(plugin3.children.length).to.equal(1);
		expect(plugin3.children[0]).to.equal(plugin4);
		expect(plugin4.parent).to.equal(plugin3);
		expect(plugin4.ancestors.length).to.equal(3);
		expect(plugin4.ancestors[0]).to.equal(plugin1);
		expect(plugin4.ancestors[1]).to.equal(plugin2);
		expect(plugin4.ancestors[2]).to.equal(plugin3);
		expect(plugin4.children.length).to.equal(0);
		done();
	});

});

