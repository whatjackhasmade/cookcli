import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { chromium } from "playwright";

// Throwaway spike (see docs/ocado-trolley-plan.md, decision 10): records the
// XHR/fetch traffic Ocado's site makes while a Product is added to the
// Trolley by hand, to find out whether there's a usable trolley endpoint we
// could call directly instead of driving the product pages.
const sessionDir = path.join(process.cwd(), ".ocado");
const storageStatePath = path.join(sessionDir, "storageState.json");
const networkLogPath = path.join(sessionDir, "spike-network.json");

interface RecordedRequest {
	method: string;
	url: string;
	status?: number;
	requestHeaders: Record<string, string>;
	postData?: string;
	responseBody?: string;
}

const MAX_BODY_LENGTH = 4000;

async function main() {
	fs.mkdirSync(sessionDir, { recursive: true });

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext(
		fs.existsSync(storageStatePath) ? { storageState: storageStatePath } : {},
	);
	const page = await context.newPage();

	const recorded: RecordedRequest[] = [];

	page.on("response", async (response) => {
		const request = response.request();
		if (!["xhr", "fetch"].includes(request.resourceType())) {
			return;
		}

		const entry: RecordedRequest = {
			method: request.method(),
			url: request.url(),
			status: response.status(),
			// Header names are enough to see how requests authenticate; values
			// are dropped so the log never holds session tokens.
			requestHeaders: Object.fromEntries(
				Object.keys(await request.allHeaders()).map((name) => [name, "…"]),
			),
			postData: request.postData() ?? undefined,
		};

		// Only mutating calls are interesting for the trolley question, and
		// their bodies are what we'd need to reproduce.
		if (request.method() !== "GET") {
			try {
				entry.responseBody = (await response.text()).slice(0, MAX_BODY_LENGTH);
			} catch {
				// Body unavailable (e.g. redirect) - the request itself is still useful.
			}
		}

		recorded.push(entry);
	});

	await page.goto("https://www.ocado.com/");

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	await rl.question(
		[
			"",
			"1. Log in to Ocado in the browser window if you aren't already.",
			"2. Add any Product to your Trolley, then press + once and - once.",
			"3. Press Enter here to save the session and network log.",
			"",
		].join("\n"),
	);
	rl.close();

	await context.storageState({ path: storageStatePath });
	fs.writeFileSync(networkLogPath, JSON.stringify(recorded, null, "\t"));
	console.log(`Saved ${recorded.length} requests to ${networkLogPath}`);

	await browser.close();
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
