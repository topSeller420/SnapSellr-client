export type SellerListingSettings = {
	id: string;
	createdAt: string;

	auto_generate_title?: boolean;
	auto_generate_description?: boolean;
	auto_generate_details?: boolean;

	auto_include_return_policy?: boolean;
	auto_include_store_name?: boolean;
	auto_include_store_logo?: boolean;

	return_policy_text?: string;
	store_name?: string;
	store_logo_url?: string;
};

export type UpdateSellerListingSettings = {
	auto_generate_title?: boolean;
	auto_generate_description?: boolean;
	auto_generate_details?: boolean;

	auto_include_return_policy?: boolean;
	auto_include_store_name?: boolean;
	auto_include_store_logo?: boolean;

	return_policy_text?: string;
	store_name?: string;
	store_logo_url?: string;
};