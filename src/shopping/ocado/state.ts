import type { Page } from "playwright";

const STATE_GLOBAL = "__INITIAL_STATE__";

// Ocado server-renders its app state into a `window.__INITIAL_STATE__`
// script. The first response can be an AWS WAF interstitial that reloads
// into the real page, so this waits for that script rather than for "load".
// The app may clear the global once hydrated, so the script is re-run
// against a stand-in `window` to read the state as it was rendered.
export async function readInitialState<T>(
	page: Page,
	select: (state: unknown) => T,
): Promise<T> {
	const handle = await page.waitForFunction(
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

	try {
		return await handle.evaluate(select);
	} finally {
		await handle.dispose();
	}
}
