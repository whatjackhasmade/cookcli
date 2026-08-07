import fs from "node:fs";
import path from "node:path";

// @cooklang/cooklang's wasm loader resolves its chunk path dynamically, which
// Turbopack can't statically analyze. It falls back to an overly broad match
// (see the "[turbopack-wasm]/node/loadWasm.ts ... matches N files" build
// warning) that sweeps devDependencies and other-platform native binaries
// into the file-tracing output for any route importing the parser. Vercel
// packages its serverless function directly from these trace files, so an
// untrimmed trace ships ~350MB of unused tooling per function.
// `outputFileTracingExcludes` is the documented fix for this, but it's
// silently ignored by Turbopack's tracer as of Next.js 16.3.0 — so the
// trace files are pruned directly here, after the build produces them.
const TRACE_FILES = [
	".next/server/app/page.js.nft.json",
	".next/server/app/[slug]/page.js.nft.json",
];

// Bare (unscoped) packages that are pure devDependency tooling.
const EXCLUDED_PACKAGES = [
	"typescript",
	"vitest",
	"vite",
	"tsx",
	"esbuild",
	"rolldown",
	"jiti",
	"caniuse-lite",
	"yaml",
	"esprima",
	"baseline-browser-mapping",
	// next/image optimization is handled by the shared runtime
	// (next-server.js.nft.json already ships its own copy) — sharp here is
	// a duplicate dragged in by the same over-broad match, not a real need
	// of this route's own code.
	"sharp",
];
// Scopes where every sub-package (typically a platform-specific native
// binary) is devDependency tooling or the same next/image duplication above.
const EXCLUDED_SCOPES = [
	"@biomejs",
	"@typescript",
	"@esbuild",
	"@rolldown",
	"@img",
];
const EXCLUDED_PREFIXES = ["lightningcss", "@next/swc-"];

function packageOf(filePath: string): string | undefined {
	const marker = "node_modules/";
	const index = filePath.lastIndexOf(marker);
	if (index === -1) return undefined;

	const segments = filePath.slice(index + marker.length).split("/");
	return segments[0].startsWith("@")
		? `${segments[0]}/${segments[1]}`
		: segments[0];
}

function isExcluded(filePath: string): boolean {
	const pkg = packageOf(filePath);
	if (!pkg) return false;
	const scope = pkg.startsWith("@") ? pkg.split("/")[0] : undefined;

	return (
		EXCLUDED_PACKAGES.includes(pkg) ||
		(scope !== undefined && EXCLUDED_SCOPES.includes(scope)) ||
		EXCLUDED_PREFIXES.some((prefix) => pkg.startsWith(prefix))
	);
}

for (const relativePath of TRACE_FILES) {
	const tracePath = path.join(process.cwd(), relativePath);
	if (!fs.existsSync(tracePath)) continue;

	const trace = JSON.parse(fs.readFileSync(tracePath, "utf8"));
	const keptFiles: string[] = [];
	const keptHashes: string[] = [];

	trace.files.forEach((file: string, index: number) => {
		if (isExcluded(file)) return;
		keptFiles.push(file);
		keptHashes.push(trace.fileHashes[index]);
	});

	const removedCount = trace.files.length - keptFiles.length;
	trace.files = keptFiles;
	trace.fileHashes = keptHashes;

	fs.writeFileSync(tracePath, JSON.stringify(trace));
	console.log(
		`pruneServerTrace: removed ${removedCount} files from ${relativePath}`,
	);
}
