export type SellerPayments = {
	id: string;
	createdAt: string;

	points: number;
	subscriptionStatus: string;
	subscriptionType?: string;
	subscriptionExpiry?: string;
};

export type UpdateSellerPayments = {
	points?: number;
	subscriptionStatus: string;
	subscriptionType?: string;
	subscriptionExpiry?: string;
};