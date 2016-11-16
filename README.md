# Tribble

Boilerplate for static & microservices-based web applications.  
It aims to provide some sort of [Asset Pipeline](http://guides.rubyonrails.org/asset_pipeline.html) for static and Node.js based projects. 

## Install

```bash
$ npm install tribble --save-dev
```

## Usage

### Configuration

Runtime configuration can be set through a _.tribblerc_ file with the following keys :
- source : source files distribution relative to project root
- target : production-ready files distribution relative to project root

### Code linting

Tribble is packaged with [ESLint](https://github.com/eslint/eslint) and [Airbnb's ESLint base configuration](https://github.com/airbnb/javascript), including ECMAScript 6+ rules. 
The _source_ parameter can be used to override the default _source_ parameter specified in the _.tribblerc_ runtime configuration file.

```bash
$ ./node_modules/.bin/tribble lint [--source <folder>]
```

### Web app preview

Tribble is packaged with [Browsersync](https://www.browsersync.io).
The _serve_ command launch a browsersync server with the built-in static server pointing to `folder` on port `number`.
This command is intend to live preview web app's source file distribution and executed only preprocessor to aggregator plugins.
The _source_ and _port_ parameters can be used to override the corresponding parameters specified in the _.tribblerc_ runtime configuration file.

```bash
$ ./node_modules/.bin/tribble serve [--source <folder>] [--port <number>]
```
### Build

The _build_ command executed all installed plugins (from preprocessor to packager) on the source files distribution `folder` and processed/aggregated assets are copied to the production-ready files distribution `target`.
The _source_ and _target_ parameters can be used to override the corresponding parameters specified in the _.tribblerc_ runtime configuration file.

```bash
$ ./node_modules/.bin/tribble build [--source <folder>] [--target <folder>]
```

### Plugins

Each plugin is designed to perform live processing (for the source files distribution through Browsersync middlewares) and/or build (for the production-ready files distribution).

#### Public plugins

Public plugins are provided for the most common processing tasks.

Current available public plugins are :
- _[sass](https://github.com/slvnfchr/tribble-sass)_ for [Syntactically Awesome Style Sheets (SASS)](http://sass-lang.com/) files (*.sass or *.scss) through [node-sass](https://github.com/sass/node-sass) module

To install a public plugin : 

```bash
$ ./node_modules/.bin/tribble install <plugin>
```
To uninstall a public plugin : 

```bash
$ ./node_modules/.bin/tribble uninstall <plugin>
```

Public plugins are installed under the current project devDependencies flag.

#### Private plugins

You can also define private/local plugins like the public ones.  
To do so, create a _tribble.json_ file for one (or several) plugin(s) with the following structure (inspired by [Swagger specification](http://swagger.io/specification/#operationObject)) :

```javascript
{
	"path/to/module1": {
		"tags": ["preprocessor"], // plugin main caracteristics
		"consumes": ["mediatype1", "mediatype2", ...],
		"produces": ["mediatype1", ...]
	},
	"path/to/module2": {
		...
	}
}
```

Plugin characteristics (defined as tags) are used to order plugins and build tasks pipelines.  
They can have the following values :
- _preprocessor_ (ex: [SASS](http://sass-lang.com/), [Coffeescript](http://coffeescript.org/))
- _transform_ (ex: any transformation plugin)
- _postprocessor_ (ex: [postCSS](http://postcss.org/))
- _aggregator_ (ex: templating engine)
- _bundler_ (ex: [r.js](http://requirejs.org/docs/optimization.html))
- _minifier_ (ex: [Closure](https://github.com/google/closure-compiler-js))
- _packager_ (ex: zip compression, [Electron](http://electron.atom.io/))

Each plugin module is defined as follow :

```javascript
module.exports = (input, ouput) => {
	const data = input.read();
	... // any synchronous/asynchronous transformation to data object
	ouput.send(data);
};

```
Please check the [sass](https://github.com/slvnfchr/tribble-sass) plugin for implementation example.

