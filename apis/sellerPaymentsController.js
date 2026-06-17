 
import request, { GET, PATCH } from "../utilities/Fetches";
import { $replace } from "../utilities/Strings";

const BASE = "/seller-payments";

const GET_PAYMENT = BASE + "/${id}";
const UPDATE_PAYMENT = BASE + "/${id}";


/**
 * @param {Object} pathVariables = {
 *  id: String
 * }
 */
export function getPaymentAPI(pathVariables, callback) {
	const api = $replace(GET_PAYMENT, pathVariables);
	request(api, GET, null, callback);
}

/**
 * @param {Object} pathVariables = {
 *  id: String
 * }
 * @param {Object} payload = {
 *  points: Number,
 *  subscriptionStatus: String,
 *  subscriptionType: String,
 *  subscriptionExpiry: String
 * }
 */
export function updatePaymentAPI(pathVariables, payload, callback) {
	const api = $replace(UPDATE_PAYMENT, pathVariables);
	request(api, PATCH, payload, callback);
}