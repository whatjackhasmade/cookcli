import type { Page } from "playwright";
import { OCADO_ORIGIN } from "./browser";
import { type OcadoSession, readSession } from "./trolley";

const LOGIN_TIMEOUT_MS = 5 * 60_000;

// Logs in with OCADO_EMAIL / OCADO_PASSWORD when the saved session has
// expired. Filling the form is best-effort - the login page is behind
// reCAPTCHA and may change - so whatever happens, the user gets a few
// minutes to finish logging in by hand in the open browser.
export async function ensureLoggedIn(page: Page): Promise<OcadoSession> {
	const session = await readSession(page);
	if (session.isLoggedIn) {
		return session;
	}

	await page.goto(`${OCADO_ORIGIN}/login`);

	const email = process.env.OCADO_EMAIL;
	const password = process.env.OCADO_PASSWORD;
	if (email && password) {
		try {
			await page.getByLabel(/email/i).first().fill(email, { timeout: 20_000 });
			await page
				.getByLabel(/password/i)
				.first()
				.fill(password);
			await page.getByRole("button", { name: /^log in$/i }).click();
		} catch {
			// Fall through to the manual wait below.
		}
	}

	console.log("Finish logging in to Ocado in the browser window if needed…");
	await page.waitForURL((url) => url.origin === OCADO_ORIGIN, {
		timeout: LOGIN_TIMEOUT_MS,
	});

	const loggedIn = await readSession(page);
	if (!loggedIn.isLoggedIn) {
		// Never carry on logged out: the cart API would fill a guest Trolley.
		throw new Error("Still not logged in to Ocado - stopping.");
	}
	return loggedIn;
}
