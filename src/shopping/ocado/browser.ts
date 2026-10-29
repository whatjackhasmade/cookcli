import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const sessionDir = path.join(process.cwd(), ".ocado");
const storageStatePath = path.join(sessionDir, "storageState.json");

export const OCADO_ORIGIN = "https://www.ocado.com";

// Headed on purpose: Ocado's bot protection blocks headless Chromium, and
// login sits behind reCAPTCHA that may need a human (see docs/adr/0001).
// The session is reused between runs so logging in is rare.
export async function openOcado() {
	fs.mkdirSync(sessionDir, { recursive: true });

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext(
		fs.existsSync(storageStatePath) ? { storageState: storageStatePath } : {},
	);
	const page = await context.newPage();

	return {
		browser,
		page,
		saveSession: () => context.storageState({ path: storageStatePath }),
	};
}

// Random gap between actions so a run doesn't hit Ocado at machine speed,
// with an occasional longer pause.
export function pause() {
	const base = 1500 + Math.random() * 3500;
	const ms = Math.random() < 0.1 ? base + 4000 + Math.random() * 6000 : base;
	return new Promise((resolve) => setTimeout(resolve, ms));
}
