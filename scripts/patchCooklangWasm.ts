import fs from "node:fs";
import path from "node:path";

// @cooklang/cooklang ships wasm-bindgen's "bundler" target, which loads its
// wasm binary via `import * as wasm from "./cooklang_wasm_bg.wasm"`. Turbopack
// can only bundle that through a runtime helper that resolves the chunk's
// path dynamically, and that dynamic resolve() falls back to an overly broad
// file match (see the "[turbopack-wasm]/node/loadWasm.ts ... matches N files"
// build warning) which sweeps nearly all of node_modules into any route that
// imports the parser. Replacing the import with a manual, statically-pathed
// WebAssembly.instantiate avoids that bundler-level wasm handling entirely, so
// Turbopack never needs the broad-match fallback in the first place.
const target = path.join(
	process.cwd(),
	"node_modules/@cooklang/cooklang/pkg/cooklang_wasm.js",
);

const marker = "manual WebAssembly.instantiate";
const original = fs.readFileSync(target, "utf8");

// postinstall can re-run against an already-patched file (e.g. a cached
// node_modules on an incremental install), so applying the patch must be a
// no-op the second time rather than an error.
if (original.includes(marker)) {
	console.log("patchCooklangWasm: already patched, skipping");
	process.exit(0);
}

const expected = 'import * as wasm from "./cooklang_wasm_bg.wasm";';
if (!original.startsWith(expected)) {
	throw new Error(
		`patchCooklangWasm: ${target} no longer starts with the expected wasm import. ` +
			"The @cooklang/cooklang version may have changed its wasm loading — review this patch.",
	);
}

const patched = `// Patched by scripts/patchCooklangWasm.ts — manual WebAssembly.instantiate
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as bg from "./cooklang_wasm_bg.js";

export * from "./cooklang_wasm_bg.js";

const wasmPath = join(
	dirname(fileURLToPath(import.meta.url)),
	"cooklang_wasm_bg.wasm",
);
const wasmModule = new WebAssembly.Module(readFileSync(wasmPath));
const wasmInstance = new WebAssembly.Instance(wasmModule, {
	"./cooklang_wasm_bg.js": bg,
});

bg.__wbg_set_wasm(wasmInstance.exports);
`;

fs.writeFileSync(target, patched);
console.log(
	"patchCooklangWasm: replaced bundler-style wasm import with a manual WebAssembly.instantiate",
);
