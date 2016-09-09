
/**
 * Linting command
 */

const CLIEngine = require('eslint').CLIEngine;

module.exports = function lint(options) {
	if (options.source === undefined) throw new Error('No source folder to lint');
	const sources = Array.isArray(options.source) ? options.source : [options.source];
	const cli = new CLIEngine({
		useEslintrc: true,
	});
	const report = cli.executeOnFiles(sources);
	const formatter = cli.getFormatter();
	console.log(formatter(report.results)); // eslint-disable-line no-console
};
