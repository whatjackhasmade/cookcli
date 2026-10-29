import type { Page } from "playwright";
import { OCADO_ORIGIN } from "./browser";
import { readInitialState } from "./state";

export interface OcadoSearchResult {
	productId: string;
	retailerProductId: string;
	name: string;
	size: string;
	price: string;
	available: boolean;
}

interface ProductEntity {
	productId: string;
	retailerProductId: string;
	name: string;
	available: boolean;
	size?: { value?: string };
	price?: { current?: { amount: string } };
}

interface ProductGroup {
	type: string;
	products: string[];
}

// Search results are server-rendered into the page state rather than
// fetched from an API, so they're read from there. "featured" groups
// are adverts and are skipped.
export async function searchProducts(
	page: Page,
	term: string,
	limit = 8,
): Promise<OcadoSearchResult[]> {
	await page.goto(`${OCADO_ORIGIN}/search?q=${encodeURIComponent(term)}`);
	const { groups, entities } = await readInitialState(page, (state) => {
		const { data } = state as {
			data: {
				search: { catalogue: { data: { productGroups?: unknown[] } } };
				products: { productEntities: Record<string, unknown> };
			};
		};

		return {
			groups: data.search.catalogue.data.productGroups ?? [],
			entities: data.products.productEntities,
		};
	});

	const productIds = new Set(
		(groups as ProductGroup[])
			.filter((group) => group.type !== "featured")
			.flatMap((group) => group.products),
	);

	return Array.from(productIds)
		.map((id) => (entities as Record<string, ProductEntity>)[id])
		.filter((entity) => entity !== undefined)
		.slice(0, limit)
		.map((entity) => ({
			productId: entity.productId,
			retailerProductId: entity.retailerProductId,
			name: entity.name,
			size: entity.size?.value ?? "",
			price: entity.price?.current?.amount ?? "",
			available: entity.available,
		}));
}
