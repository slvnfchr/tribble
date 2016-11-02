
'use strict';

/**
 * Component class
 */

class Component {

	constructor(handler) {
		this.handler = handler;
		this.type = null;
		this.priority = null;
		this.mediatypes = { input: null, output: null };
		this.extensions = { input: null, output: null };
		this.parent = null;
		this.parents = [];
		this.children = [];
		let _type; // eslint-disable-line no-underscore-dangle
		Object.defineProperty(this, 'type', {
			enumerable: true,
			get: function get() {
				return _type;
			},
			set: function get(type) {
				this.priority = Object.keys(Component.types).map(key => Component.types[key]).indexOf(type);
				_type = type;
			},
		});
		Object.defineProperty(this, 'ancestors', {
			enumerable: true,
			get: function get() {
				return this.parent ? this.parent.ancestors.concat([this.parent]) : [];
			},
		});
		Object.defineProperty(this, 'root', {
			enumerable: true,
			get: function get() {
				const ancestors = this.ancestors;
				return ancestors.length > 0 ? ancestors[0] : this;
			},
		});
	}

}

Component.types = {
	PREPROCESSOR: 'preprocessor', // ex: SASS, Coffeescript
	TRANSFORM: 'transform', // any transformation plugin, order independant
	POSTPROCESSOR: 'postprocessor', // ex: postCSS
	AGGREGATOR: 'aggregator', // ex: templating engine
	BUNDLER: 'bundler', // ex: r.js
	MINIFIER: 'minifier', // ex: closure compiler
	PACKAGER: 'packager', // ex: zip compression, electron
};

module.exports = Component;
