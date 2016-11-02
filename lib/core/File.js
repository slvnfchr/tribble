
'use strict';

/**
 * File class based on Tribble core IP class
 */

const path = require('path');

const extensions = { // mediatype/extensions mapping
	'application/javascript': ['js', 'jsm'],
	'application/json': ['json', 'map'],
	'text/css': ['css'],
	'text/html': ['html', 'htm', 'shtml'],
	'text/jade': ['jade'],
	'text/jsx': ['jsx'],
	'text/less': ['less'],
	'text/markdown': ['md'],
	'text/x-typescript': ['ts'],
	'text/x-sass': ['sass'],
	'text/x-scss': ['scss'],
};

const mediatypes = {}; // extensions/mediatype mapping
Object.keys(extensions).forEach((mediatype) => {
	extensions[mediatype].forEach((extension) => {
		const ext = {};
		ext[extension] = mediatype;
		Object.assign(mediatypes, ext);
	});
});

class File {

	constructor(properties) {
		if (properties === undefined || !properties.fullPath) throw new Error('A fullPath property should be specified to instantiate a File object');
		Object.assign(this, properties);
		this.base = this.base || null;
		this.name = path.basename(this.fullPath);
		this.path = this.base ? this.fullPath.replace(this.base, '') : null;
		this.extension = path.extname(this.fullPath).substring(1);
		this.mediatype = mediatypes[this.extension];
		this.contents = null;
	}

	static create(properties) {
		const instance = new File(properties);
		return instance;
	}

}

File.mediatypes = mediatypes;
File.extensions = extensions;

module.exports = File;
