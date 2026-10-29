import type { Page } from "playwright";
import { OCADO_ORIGIN } from "./browser";
import { readInitialState } from "./state";

// The Trolley is changed through Ocado's own cart API, called with `fetch`
// from inside the logged-in page so the browser supplies the session
// cookies and WAF token (see docs/adr/0001).
interface CartItem {
	productId: string;
	quantity: number;
}

export interface OcadoSession {
	isLoggedIn: boolean;
	csrfToken: string;
}

export async function readSession(page: Page): Promise<OcadoSession> {
	await page.goto(OCADO_ORIGIN);
	return readInitialState(page, (state) => {
		const { session } = state as {
			session: { isLoggedIn: boolean; csrf: { token: string } };
		};
		return { isLoggedIn: session.isLoggedIn, csrfToken: session.csrf.token };
	});
}

function toQuantities(items: CartItem[]): Map<string, number> {
	return new Map(items.map(({ productId, quantity }) => [productId, quantity]));
}

// Pack counts currently in the Trolley, keyed by the cart API's productId.
export async function getTrolley(page: Page): Promise<Map<string, number>> {
	const items = await page.evaluate(async () => {
		const response = await fetch("/api/cart/v1/carts/active", {
			headers: { accept: "application/json" },
		});
		if (!response.ok) {
			throw new Error(`Reading the Trolley failed: ${response.status}`);
		}
		const cart = (await response.json()) as { items?: CartItem[] };
		return cart.items ?? [];
	});
	return toQuantities(items);
}

// `delta` is a change, not a total: the cart API adds it to whatever is
// already in the Trolley. Returns the Trolley as it is afterwards.
export async function applyQuantity(
	page: Page,
	csrfToken: string,
	productId: string,
	delta: number,
): Promise<Map<string, number>> {
	const items = await page.evaluate(
		async (request) => {
			const response = await fetch(
				"/api/cart/v1/carts/active/apply-quantity?cartProductSorting=CATEGORIES",
				{
					method: "POST",
					headers: {
						accept: "application/json",
						"content-type": "application/json",
						"x-csrf-token": request.csrfToken,
					},
					body: JSON.stringify([
						{ productId: request.productId, quantity: request.delta },
					]),
				},
			);
			if (!response.ok) {
				throw new Error(
					`Changing the Trolley failed: ${response.status} ${await response.text()}`,
				);
			}
			const result = (await response.json()) as {
				basketUpdateResult: { itemGroups: Array<{ items: CartItem[] }> };
			};
			return result.basketUpdateResult.itemGroups.flatMap(
				(group) => group.items,
			);
		},
		{ csrfToken, productId, delta },
	);
	return toQuantities(items);
}

export type EnsureResult =
	| { outcome: "added"; from: number; to: number }
	| { outcome: "already"; quantity: number }
	| { outcome: "failed"; from: number; to: number };

// "Ensure at least N": tops a Product up to `packs`, never reducing what's
// already there, so re-running is safe.
export async function setPackCount(
	page: Page,
	csrfToken: string,
	trolley: Map<string, number>,
	productId: string,
	packs: number,
): Promise<EnsureResult> {
	const current = trolley.get(productId) ?? 0;
	if (current >= packs) {
		return { outcome: "already", quantity: current };
	}

	const after = await applyQuantity(
		page,
		csrfToken,
		productId,
		packs - current,
	);
	const quantity = after.get(productId) ?? 0;
	for (const [id, count] of after) {
		trolley.set(id, count);
	}

	// Ocado accepts the request but leaves the quantity short when a Product
	// is unavailable or capped, so the result is checked, not assumed.
	return quantity >= packs
		? { outcome: "added", from: current, to: quantity }
		: { outcome: "failed", from: current, to: quantity };
}
