
'use strict';

/**
 * Component class
 */

let _getPhaseByType; // eslint-disable-line no-underscore-dangle

class Component {

	constructor(handler) {
		this.handler = handler;
		this.type = null;
		this.priority = null;
		this.phase = null;
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
				this.phase = _getPhaseByType(type); // eslint-disable-line no-underscore-dangle
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
	IMPORTER: 'importer', // ex: data importer from a remote API
	LINTER: 'linter', // ex: data importer from remote API
	PREPROCESSOR: 'preprocessor', // ex: SASS, Coffeescript, templating engine
	TRANSFORM: 'transform', // any transformation plugin, order independant
	POSTPROCESSOR: 'postprocessor', // ex: postCSS
	INDEXER: 'indexer', // ex: indexing of processed files before bundling
	BUNDLER: 'bundler', // ex: r.js
	MINIFIER: 'minifier', // ex: Closure, Uglify
	PACKAGER: 'packager', // ex: zip compression, Electron
	DEPLOYER: 'deployer', // ex: AWS deployment, git push
};

Component.phases = {
	PROCESSING: 'processing',
	INDEXING: 'indexing',
	OPTIMIZATION: 'optimization',
	DEPLOYMENT: 'deployment',
};

const _map = {}; // eslint-disable-line no-underscore-dangle
_map[Component.phases.PROCESSING] = [Component.types.PREPROCESSOR, Component.types.TRANSFORM, Component.types.POSTPROCESSOR];
_map[Component.phases.INDEXING] = [Component.types.INDEXER];
_map[Component.phases.OPTIMIZATION] = [Component.types.BUNDLER, Component.types.MINIFIER];
_map[Component.phases.DEPLOYMENT] = [Component.types.PACKAGER, Component.types.DEPLOYER];

_getPhaseByType = (type) => { // eslint-disable-line no-underscore-dangle
	let phase;
	Object.keys(_map).forEach(key => {
		if (_map[key].indexOf(type) !== -1) phase = key;
	});
	return phase;
};

Component.priorities = Object.keys(Component.types).map(type => Component.types[type]);


module.exports = Component;
