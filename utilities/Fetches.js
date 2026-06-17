import Constants from 'expo-constants';

export const GET = "GET";
export const POST = "POST";
export const PUT = "PUT";
export const PATCH = "PATCH";
export const DELETE = "DELETE";

const objectConstructor = ({}).constructor;
let cookieObject = {};

function createCookieObject() {
	document.cookie.split(";").forEach(tuple => {
		const keyValue = tuple.split("=");
		cookieObject[keyValue[0].trim()] = keyValue[1];
	});
}

// to protect against CSRF attacks
function getCsrfToken() {
	// if (Object.keys(cookieObject).length === 0) {
	// 	createCookieObject();
	// }

	return cookieObject["XSRF-TOKEN"] == null ? null : {
		"X-XSRF-TOKEN": cookieObject["XSRF-TOKEN"]
	};
}

function getAuthToken() {
	return localStorage.getItem("authToken") == null ? null : {
		Authorization: localStorage.getItem("authToken")
	};
}

/**
 * @description catchAll fetch utility. The following are request headers that aren't currently supported:
 * CACHING
 * Cache-Control: holds directives for caching in both requests and responses
 * Clear-Site-Data: clears browsing data (cookies, storage, cache) associated with the requested website
 * Expires: contains the date/time after which the response is considered stale
 * CONDITIONALS
 * If-Match: makes request conditional if requested resource matches the provided list of ETags
 * If-None-Match: if resource doesn't match ETag, then do something else
 * If-Modified-Since: server will only send back the requested resource only if it has been modified after the given date
 * If-Unmodified-Since: server will send back the requested resource only if it hasn't been modified after the given date
 * CONTENT NEGOTIATION
 * Accept-Language: indicates what language client understands. This is automatically set by the browser, although we can explicity indicate it by using the navigator.language / navigator.languages window's object
 * MESSAGE BODY INFORMATION
 * Content-Length: size of the resource in bytes
 * Content-Encoding: to specify compression algorithm (this can improve security, but increases turn-around-time)
 * Content-Language: specify intended language for user
 * Content-Location: indicates alternate location for returned data (can be used as a resource location fallback)
 * REQUEST CONTEXT
 * From: contains user's email address
 * User-Agent: sends information about application, OS, vendor, and/or version of requesting user agent. Don't use for browser detection (https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent)
 * RANGE REQUESTS
 * Range: indicate to server what part of a document client wants
 * If-Range: commonly used to resume a download
 * SECURITY
 * Upgrade-Insecure-Requests: {Boolean} to express a client's request for an encrypted and authenticated response
 * Full list of headers: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
 * @param {String} api // api url
 * @param {String} type // "GET" / "POST" / "PUT" / "DELETE"
 * @param {Object} payload? // optional payload for POST, PUT, and DELETE calls
 * @param {Function} successHandler // callback when query is successful
 * @param {Function} errorHandler callback when query is unsuccessful
 * @param {Function} finallyHandler callback for every case
 * @param {Boolean} readFile? if we're fetching media files
 * @param {String} headerArgs? additional request headers
 */
export default async function request(api, type, payload, successHandler, errorHandler, finallyHandler, readFile, headerArgs, responseType = "blob") {
	let httpReq = {
		method: type,
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			...getCsrfToken(),
			// ...getAuthToken(),
			...headerArgs
		},
		referrerPolicy: "strict-origin-when-cross-origin",
		mode: "cors",	// https://javascript.info/fetch-api
		// always include credentials
		credentials: "include",
		cache: "default",
		redirect: "error"
		// keepalive: true (might need this when improving user experience via analytics)
	};

	if (type !== GET) {
		if (payload && objectConstructor === payload.constructor) {
			httpReq["body"] = JSON.stringify(payload);
		}
		else if (payload instanceof FormData) {
			delete httpReq.headers["Content-Type"];
			httpReq["Content-Type"] = "multipart/form-data";
			httpReq["body"] = payload;
		}
		else if (typeof payload === "string") {
			httpReq["body"] = payload;
		}
	}

	// build base URL from environment variables; port is optional
	// Expo apps can't rely on process.env at runtime; read values from config extra
	const env = Constants.expoConfig?.extra || {};
	let baseUrl = env.API_URL
		? env.API_URL + (env.API_PORT ? `:${env.API_PORT}` : "")
		: "";
	if (!baseUrl) {
		console.warn("Fetches.request: API_URL is not set in expoConfig.extra. Falling back to relative path, which may fail.");
	}
	// ensure we don't double up the path
	api = baseUrl + api;
	if (!readFile) {
		await fetch(api, httpReq)
		.then(response => {
			return response.json();
		})
		.then(data => {
			successHandler && successHandler(data);
		})
		.catch(err => {
			errorHandler && errorHandler(err);
		}).finally(() => {
			finallyHandler && finallyHandler();
		});
	}
	else {
		await fetch(api, httpReq)
		.then(response => {
			return response.body;
		})
		.then(body => {
			const reader = body.getReader();
			return new ReadableStream({
				start(controller) {
					return pump();
					function pump() {
						return reader.read().then(({ done, value }) => {
							// When no more data needs to be consumed, close the stream
							if (done) {
									controller.close();
									return;
							}
							// Enqueue the next data chunk into our target stream
							controller.enqueue(value);
							return pump();
						});
					}
				}
			})
		})
		.then(stream => {
			return new Response(stream);
		})
		.then(response => {
			return response.blob();
		})
		.then(blob => {
			return URL.createObjectURL(blob);
		})
		.then(url => {
			successHandler(url);
		})
		.catch(err => {
			errorHandler && errorHandler(err);
		})
		.finally(() => {
			finallyHandler && finallyHandler();
		});
	}
}

/**
 * @description meant for calling multiple APIs
 * @param {Array} apiArr array of api calls = {
 * 	api: string,	// api url
 * 	type: string,	// "GET" / "POST" / "PUT" / "DELETE"
 * 	payload?: object,	// optional payload for POST, PUT, and DELETE calls
 * }
 * @param {Function} successHandler // callback when query is successful
 * @param {Function} errorHandler callback when query is unsuccessful
 * @param {Function} finallyHandler callback for every case
 */
export async function promiseAll(apiArr, successHandler, errorHandler, finallyHandler) {
	let httpReq = {
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			...getCsrfToken(),
			// ...getAuthToken()
		},
		referrer: window.location.href,	// https://web.dev/referrer-best-practices/
		referrerPolicy: "strict-origin-when-cross-origin",
		mode: "same-origin",	// https://javascript.info/fetch-api
		credentials: "include",
		cache: "default",
		redirect: "error"
		// keepalive: true (might need this when improving user experience via analytics)
	};

	let fetchArr = [];

	apiArr.forEach(apiEl => {
		let newHttpReq = structuredClone(httpReq);
		newHttpReq.method = apiEl.type;
		if (apiEl.type !== GET) {
			const payload = apiEl.payload;

			if (payload && objectConstructor === payload.constructor) {
				newHttpReq["body"] = JSON.stringify(payload);
			}
			else if (payload instanceof FormData) {
				delete newHttpReq.headers["Content-Type"];
				newHttpReq["Content-Type"] = "multipart/form-data";
				newHttpReq["body"] = payload;
			}
			else if (typeof payload === "string") {
				newHttpReq["body"] = payload;
			}
		}
		fetchArr.push(
			fetch(apiEl.api, newHttpReq)
		);
	});

	await Promise.all(fetchArr)
		.then(function (responses) {
			return Promise.all(responses.map(function (response) {
				return response.json();
			}));
		}).then(function (data) {
			successHandler && successHandler(data);
		}).catch(function (error) {
			errorHandler && errorHandler(error);
		}).finally(() => {
			finallyHandler && finallyHandler();
		});
}

/**
 * @description http request to get local(client) data. MDN doc: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
 * @param {String} type "GET" / "POST" / "PUT" / "DELETE"
 * @param {String} filePath local path directory
 * @param {Function} onReadyStateChangeHandler  event handler for onreadystatechange
 */
export async function getLocalData(type, filePath, onReadyStateChangeHandler, responseType, onLoad) {
	let rawFile = new XMLHttpRequest();

	if (responseType) {
		rawFile.responseType = responseType;
	}
	if (onLoad) {
		rawFile.onload = onLoad;
	}

	rawFile.open(type, filePath, true);
	rawFile.onreadystatechange = onReadyStateChangeHandler;
	rawFile.send(null);
}

/**
 * @description
 * @param {String} type // "GET" / "POST" / "PUT" / "DELETE"
 * @param {String} token bearer token to access XAPIs
 * @param {String} url 3rd party url endpoint
 * @param {Object} payload
 * @param {Function} successHandler callback when query is successful
 * @param {Function} errorHandler callback when query is unsuccessful
 * @param {Function} finallyHandler callback for every case
 */
export async function callThirdPartyAPI(type, token, url, dataSpecifier, customHeaders, payload, successHandler, errorHandler, finallyHandler) {
	let httpReq = {
		method: type,
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		}
	};

	if (token != null) {
		httpReq.headers["Authorization"] = `Bearer ${token}`;
	}

	if (customHeaders) {
		for (const [key, value] of Object.entries(customHeaders)) {
			if (key !== "remove") {
				httpReq.headers[key] = value;
			}
			else {
				delete httpReq.headers[value];
			}
		}
	}

	if (type !== GET) {
		if (payload && objectConstructor === payload.constructor) {
			httpReq["body"] = JSON.stringify(payload);
		}
		else if (payload instanceof FormData) {
			delete httpReq.headers["Content-Type"];
			httpReq["Content-Type"] = "multipart/form-data";
			httpReq["body"] = payload;
		}
		else if (typeof payload === "string") {
			httpReq["body"] = payload;
		}
	}

	await fetch(url, httpReq)
		.then(response => {
			return response.json();
		})
		.then(data => {
			if (dataSpecifier != null) {
				data = data[dataSpecifier];
			}
			successHandler && successHandler(data);
		})
		.catch(err => {
			errorHandler && errorHandler(err);
		}).finally(() => {
			finallyHandler && finallyHandler();
		});
}