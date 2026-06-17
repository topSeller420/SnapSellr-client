export type Seller = {
	id: string;
	createdAt: string;

	username: string;
	email: string;

	city?: string;
	state?: string;
	country?: string;

	sellerListingSettings: string;
	sellerPayments: string;
};

export type CreateSeller = {
	username: string;
	email: string;

	city?: string;
	state?: string;
	country?: string;
};

export type UpdateSeller = {
	username?: string;
	email?: string;

	city?: string;
	state?: string;
	country?: string;
};
