'use strict'
// dotenv-expand as bundled inside Vite 8 (vite/dist/node/chunks/node.js), unchanged. BSD-2-Clause, see LICENSE-dotenv-expand.
	function _resolveEscapeSequences(value) {
		return value.replace(/\\\$/g, "$");
	}
	function expandValue(value, processEnv, runningParsed) {
		const env = {
			...runningParsed,
			...processEnv
		};
		const regex = /(?<!\\)\${([^{}]+)}|(?<!\\)\$([A-Za-z_][A-Za-z0-9_]*)/g;
		let result = value;
		let match;
		const seen = /* @__PURE__ */ new Set();
		while ((match = regex.exec(result)) !== null) {
			seen.add(result);
			const [template, bracedExpression, unbracedExpression] = match;
			const expression = bracedExpression || unbracedExpression;
			const opMatch = expression.match(/(:\+|\+|:-|-)/);
			const splitter = opMatch ? opMatch[0] : null;
			const r = expression.split(splitter);
			let defaultValue;
			let value;
			const key = r.shift();
			if ([":+", "+"].includes(splitter)) {
				defaultValue = env[key] ? r.join(splitter) : "";
				value = null;
			} else {
				defaultValue = r.join(splitter);
				value = env[key];
			}
			if (value) {
				if (seen.has(value)) result = result.replace(template, defaultValue);
				else result = result.replace(template, value);
			} else result = result.replace(template, defaultValue);
			if (result === runningParsed[key]) break;
			regex.lastIndex = 0;
		}
		return result;
	}
	function expand(options) {
		let processEnv = process.env;
		if (options && options.processEnv != null) processEnv = options.processEnv;
		for (const key in options.parsed) {
			let value = options.parsed[key];
			if (processEnv[key] && processEnv[key] !== value) value = processEnv[key];
			else value = expandValue(value, processEnv, options.parsed);
			options.parsed[key] = _resolveEscapeSequences(value);
		}
		for (const processKey in options.parsed) processEnv[processKey] = options.parsed[processKey];
		return options;
	}
	module.exports.expand = expand;
