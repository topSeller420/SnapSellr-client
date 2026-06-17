export type Listing = {
	id: string;
	createdAt: string;

	sellerId: string;

	status: "draft" | "active" | "sold";
	imageUrls?: string[];

	title?: string;
	description?: string;
	details?: Record<string, any>;
	quantity: number;

	costOfGood?: number;
	listPrice?: number;
	platformFees?: number;
	profit?: number;

	storageLocation?: string;
	SKU?: string;
	relistSchedule?: string;

	pricingStrategy?: "competitive" | "profit" | "balanced";
};

export type CreateListing = {
	sellerId: string;

	status: "draft" | "active" | "sold";
	imageUrls?: string[];

	title?: string;
	description?: string;
	details?: Record<string, any>;
	quantity: number;

	costOfGood?: number;
	listPrice?: number;
	platformFees?: number;
	profit?: number;

	storageLocation?: string;
	SKU?: string;
	relistSchedule?: string;

	pricingStrategy?: "competitive" | "profit" | "balanced";
};

export type UpdateListing = {
	status?: "draft" | "active" | "sold";
	imageUrls?: string[];

	title?: string;
	description?: string;
	details?: Record<string, any>;
	quantity?: number;

	costOfGood?: number;
	listPrice?: number;
	platformFees?: number;
	profit?: number;

	storageLocation?: string;
	SKU?: string;
	relistSchedule?: string;

	pricingStrategy?: string;
};