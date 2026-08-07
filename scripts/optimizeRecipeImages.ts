import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const RECIPES_DIR = path.join(process.cwd(), "src/recipes");
const CACHE_PATH = path.join(process.cwd(), "scripts/.recipe-image-cache.json");

// Cover component renders inside a `max-width: 48rem` column with 1.5rem
// side padding (~720px content width) at a fixed 300px height.
const TARGET_WIDTH = 720;
const TARGET_HEIGHT = 300;
const JPEG_QUALITY = 80;

interface CacheEntry {
	sourceHash: string;
	width: number;
	height: number;
	quality: number;
}

type Cache = Record<string, CacheEntry>;

function loadCache(): Cache {
	if (!fs.existsSync(CACHE_PATH)) {
		return {};
	}
	return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
}

function saveCache(cache: Cache) {
	fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, "\t")}\n`);
}

function hashFile(filePath: string): string {
	return crypto
		.createHash("sha1")
		.update(fs.readFileSync(filePath))
		.digest("hex");
}

function findSourceImages(): string[] {
	const categories = fs.readdirSync(RECIPES_DIR);

	return categories.flatMap((category) => {
		const categoryPath = path.join(RECIPES_DIR, category);
		if (!fs.statSync(categoryPath).isDirectory()) {
			return [];
		}

		return fs
			.readdirSync(categoryPath)
			.filter(
				(file) => file.endsWith(".jpg") && !file.endsWith(".minified.jpg"),
			)
			.map((file) => path.join(category, file));
	});
}

function minifiedPathFor(relativeSourcePath: string): string {
	return path.join(
		RECIPES_DIR,
		relativeSourcePath.replace(/\.jpg$/, ".minified.jpg"),
	);
}

async function optimizeImage(relativePath: string, cache: Cache) {
	const sourcePath = path.join(RECIPES_DIR, relativePath);
	const outputPath = minifiedPathFor(relativePath);
	const sourceHash = hashFile(sourcePath);

	const cached = cache[relativePath];
	const upToDate =
		cached?.sourceHash === sourceHash &&
		cached.width === TARGET_WIDTH &&
		cached.height === TARGET_HEIGHT &&
		cached.quality === JPEG_QUALITY &&
		fs.existsSync(outputPath);

	if (upToDate) {
		return { relativePath, skipped: true, before: 0, after: 0 };
	}

	const before = fs.statSync(sourcePath).size;

	await sharp(sourcePath)
		.rotate()
		.resize(TARGET_WIDTH, TARGET_HEIGHT, {
			fit: "cover",
			withoutEnlargement: true,
		})
		.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
		.toFile(outputPath);

	const after = fs.statSync(outputPath).size;

	cache[relativePath] = {
		sourceHash,
		width: TARGET_WIDTH,
		height: TARGET_HEIGHT,
		quality: JPEG_QUALITY,
	};

	return { relativePath, skipped: false, before, after };
}

function removeOrphanedOutputs(sources: string[]) {
	const categories = fs.readdirSync(RECIPES_DIR);

	for (const category of categories) {
		const categoryPath = path.join(RECIPES_DIR, category);
		if (!fs.statSync(categoryPath).isDirectory()) {
			continue;
		}

		for (const file of fs.readdirSync(categoryPath)) {
			if (!file.endsWith(".minified.jpg")) {
				continue;
			}

			const relativeSource = path
				.join(category, file)
				.replace(/\.minified\.jpg$/, ".jpg");

			if (!sources.includes(relativeSource)) {
				fs.unlinkSync(path.join(categoryPath, file));
			}
		}
	}
}

(async () => {
	const cache = loadCache();
	const sources = findSourceImages();

	for (const key of Object.keys(cache)) {
		if (!sources.includes(key)) {
			delete cache[key];
		}
	}

	removeOrphanedOutputs(sources);

	const results = await Promise.all(
		sources.map((relativePath) => optimizeImage(relativePath, cache)),
	);

	saveCache(cache);

	const processed = results.filter((result) => !result.skipped);
	const savedBytes = processed.reduce(
		(sum, result) => sum + (result.before - result.after),
		0,
	);

	console.log(
		`optimizeRecipeImages: processed ${processed.length}, skipped ${
			results.length - processed.length
		} (up to date)${
			processed.length > 0 ? `, saved ${(savedBytes / 1024).toFixed(0)}KB` : ""
		}`,
	);
})();
