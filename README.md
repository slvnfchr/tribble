# Tribble

Boilerplate for static & microservices-based web applications

## Install

```bash
$ npm install tribble --save-dev
```

## Usage

### Code linting

Tribble is packaged with [ESLint](https://github.com/eslint/eslint), the most complete (code and style checking) and configurable/pluggable javascript linter tool, and [Airbnb's ESLint base configuration](https://github.com/airbnb/javascript), including ECMAScript 6+ rules. 

```bash
$ ./node_modules/.bin/tribble lint --source <folder>
```

### Web app preview

Tribble is packaged with [Browsersync](https://www.browsersync.io).
The _serve_ command launch a browsersync server with the built-in static server pointing to `folder` on port `number`.
This command is intend to live preview web app's source file distribution.

```bash
$ ./node_modules/.bin/tribble serve --source <folder> --port <number>
```

### Plugins

Each plugin enable to perform live processing (for the source file distribution through Browsersync middlewares) and building (for the distributed file distribution) of non-standard web technologies.

To install a plugin : 

```bash
$ ./node_modules/.bin/tribble install <plugin>
```
To uninstall a plugin : 

```bash
$ ./node_modules/.bin/tribble uninstall <plugin>
```
Plugins are installed under the current project devDependencies flag.

List of available plugins :
- [sass](https://github.com/slvnfchr/tribble-sass) for [Syntactically Awesome Style Sheets (SASS)](http://sass-lang.com/) files (*.sass or *.scss) through [node-sass](https://github.com/sass/node-sass) module

To develop a plugin, please refer to the [plugin core module](https://github.com/slvnfchr/tribble-plugin) documentation.



