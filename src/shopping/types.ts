export interface Amount {
	quantity: number;
	unit: string;
}

// One entry in the Product mapping: an Ocado Product, its Pack size, and the
// Ingredient names (matched case-insensitively) it supplies.
export interface OcadoProduct {
	// The number in the product page URL, e.g. 50434011 in
	// /products/garofalo-spaghetti/50434011.
	retailerProductId: string;
	// The UUID the cart API keys Products by (see docs/adr/0001).
	productId: string;
	name: string;
	packSize: Amount;
	ingredients: string[];
	pantry?: boolean;
	// Equivalences for units the Pack size can't be reached from by metric
	// conversion alone, e.g. 1 item = 150g for an onion sold by weight.
	// Usable in either direction.
	conversions?: Array<{ from: Amount; to: Amount }>;
}
