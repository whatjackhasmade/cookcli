import type { Page } from "playwright";
import { OCADO_ORIGIN } from "./browser";

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

const STATE_GLOBAL = "__INITIAL_STATE__";

// Search results are server-rendered into `window.__INITIAL_STATE__` rather
// than fetched from an API, so they're read from there. "featured" groups
// are adverts and are skipped.
export async function searchProducts(
	page: Page,
	term: string,
	limit = 8,
): Promise<OcadoSearchResult[]> {
	await page.goto(`${OCADO_ORIGIN}/search?q=${encodeURIComponent(term)}`);
	// The first response can be an AWS WAF interstitial that reloads into
	// the real page, so wait for the state script rather than for "load".
	// The app may clear the global once hydrated, so the script is re-run
	// against a stand-in `window` to read the state as it was rendered.
	const stateHandle = await page.waitForFunction(
		(marker) => {
			const script = Array.from(document.scripts).find(({ text }) =>
				text.includes(marker),
			);
			if (!script) {
				return null;
			}
			const stateWindow: Record<string, unknown> = {};
			new Function("window", script.text)(stateWindow);
			return stateWindow[marker];
		},
		STATE_GLOBAL,
		{ timeout: 30_000 },
	);
	const { groups, entities } = await stateHandle.evaluate((state) => {
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
	await stateHandle.dispose();

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
