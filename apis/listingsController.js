 
import request, { DELETE, GET, PATCH, POST } from "../utilities/Fetches";
import { $replace } from "../utilities/Strings";

const BASE = "/listings";

const GET_LISTING_BY_ID = BASE + "/${id}";
const GET_LISTING_BY_SELLER_ID = BASE + "/${sellerId}";
const CREATE_LISTING = BASE + "/";
const UPDATE_LISTING = BASE + "/${id}";
const DELETE_LISTING = BASE + "/${id}";

/**
 * @param {Object} pathVariables = {
 *  id: String
 * }
 */
export function getListingByIdAPI(pathVariables, callback) {
	const api = $replace(GET_LISTING_BY_ID, pathVariables);
	request(api, GET, null, callback);
}

/**
 * @param {Object} pathVariables = {
 *  sellerId: String
 * }
 */
export function getListingBySellerIdAPI(pathVariables, callback) {
	const api = $replace(GET_LISTING_BY_SELLER_ID, pathVariables);
	request(api, GET, null, callback);
}

/**
 * @param {Object} payload = {
 *  sellerId: String,
 * 
 * 	status: String,
 *  imageURLs: [String],
 * 
 * 	title: String,
 * 	description: String,
 * 	details: String,
 *  quantity: Number,
 * 
 *  costOfGood: Number,
 *  listPrice: Number,
 *  platformFees: Number,
 *  profit: Number,
 * 
 *  storageLocation: String,
 *  SKU: String,
 *  relistSchedule: String
 * }
 */
export function createListingAPI(payload, callback) {
	request(CREATE_LISTING, POST, payload, callback);
}

/**
 * @param {Object} pathVariables = {
 *  id: String
 * }
 * @param {Object} payload = {
 *  sellerId: String,
 * 
 * 	status: String,
 *  imageURLs: [String],
 * 
 * 	title: String,
 * 	description: String,
 * 	details: String,
 *  quantity: Number,
 * 
 *  costOfGood: Number,
 *  listPrice: Number,
 *  platformFees: Number,
 *  profit: Number,
 * 
 *  storageLocation: String,
 *  SKU: String,
 *  relistSchedule: String
 * }
 */
export function updateListingAPI(pathVariables, payload, callback) {
	const api = $replace(UPDATE_LISTING, pathVariables);
	request(api, PATCH, payload, callback);
}

/**
 * @param {Object} pathVariables = {
 *  id: String
 * }
 */
export function deleteListingAPI(pathVariables, callback) {
	const api = $replace(DELETE_LISTING, pathVariables);
	request(api, DELETE, null, callback);
}