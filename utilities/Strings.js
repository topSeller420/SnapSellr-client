/**
 * @param {String} string string to truncate
 * @param {Number} length length of string to truncate, which includes ellipses
 */
export function truncateString(words, length) {
	return words.length > length ? words.substring(0, length - 3) + "..." : words;
}

/**
 * @param {String} str string to camelize. ex submithandler -> submitHandler
 */
export function camelize(str) {
	return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
		return index === 0 ? word.toLowerCase() : word.toUpperCase();
	}).replace(/\s+/g, '');
}

/**
 * @description replaces strings encased in ${string} with provided value, like the following
 * const samp = /username/availability/${nameAds1}?pathVariable=${name2342}
 * const obj = {
 * 	nameAds1: "text1",
 * 	name2342: "text2"
 * }
 * replace(samp, obj) => /username/availability/text1?pathVariable=text2
 * @param {String} text string to be substitute
 * @param {Object} replacement object to replace with text keys
 */
export function $replace(text, replacement) {
	return text.replace(/\$\{([^\s:}]*)(?::([^\s:}]+))?\}/g, (match, key, format) => {
		let value = replacement[key];

		if (value === null) {
			console.error(`Missing key: ${key}`);
		}

		if (value instanceof FormData) {
			return value;
		}
		else {
			return String(value);
		}
	});
}

/**
 * @description 
 * @param {*} api 
 * @param {*} pathVariables 
 * @param {*} defaultOptionalValues 
 */
export function fillOptionalArgs(pathVariables, defaultOptionalValues) {
	const argKeys = Object.keys(pathVariables);

	Object.keys(defaultOptionalValues).forEach(key => {
		!argKeys.includes(key) && (pathVariables[key] = defaultOptionalValues[key]);
	});

	return pathVariables;
}