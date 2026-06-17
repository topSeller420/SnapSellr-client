 
import request, { DELETE, GET, PATCH, POST } from "../utilities/Fetches";
import { $replace } from "../utilities/Strings";

const BASE = "/sellers";

const CREATE_SELLER_PROFILE = BASE + "/";
const GET_SELLER_PROFILE = BASE + "/${id}";
const UPDATE_SELLER_PROFILE = BASE + "/${id}";
const DELETE_SELLER_PROFILE = BASE + "/${id}";


/**
 * @param {Object} payload = {
 * 	username: String,
 * 	email: String,
 * 	city: String,
 * 	state: String,
 * 	country: String
 * }
 */
export function createSellerProfileAPI(payload, callback) {
	request(CREATE_SELLER_PROFILE, POST, payload, callback);
}

/**
 * @param {Object} pathVariables = {
 * 	id: String
 * }
 */
export function getSellerProfileAPI(pathVariables, callback) {
	const api = $replace(GET_SELLER_PROFILE, pathVariables);
	request(api, GET, null, callback);
}

/**
 * @param {Object} pathVariables = {
 * 	id: String
 * }
 * @param {Object} payload = {
 * 	username: String,
 * 	email: String,
 * 	city: String,
 * 	state: String,
 * 	country: String
 * }
 */
export function updateSellerProfileAPI(pathVariables, payload, callback) {
	const api = $replace(UPDATE_SELLER_PROFILE, pathVariables);
	request(api, PATCH, payload, callback);
}

/**
 * @param {Object} pathVariables = {
 * 	id: String
 * }
 */
export function deleteSellerProfileAPI(pathVariables, callback) {
	const api = $replace(DELETE_SELLER_PROFILE, pathVariables);
	request(api, DELETE, null, callback);
}
