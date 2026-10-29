import readline from "node:readline";
import readlinePromises from "node:readline/promises";

// Small terminal prompts for the CLIs - no dependency, just raw-mode
// keypresses. Each prompt owns stdin only while it's running, so line
// questions and keypress menus can be mixed freely.

export async function ask(question: string, prefill = ""): Promise<string> {
	const rl = readlinePromises.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	try {
		const answer = rl.question(question);
		rl.write(prefill);
		return (await answer).trim();
	} finally {
		rl.close();
	}
}

// Length of the ANSI escape sequence (colour, cursor) at the start of
// `text`, or 0 if it doesn't start with one.
function escapeLength(text: string): number {
	if (!text.startsWith("\x1b[")) {
		return 0;
	}
	for (let i = 2; i < text.length; i++) {
		if (/[A-Za-z]/.test(text[i])) {
			return i + 1;
		}
	}
	return text.length;
}

// Terminal columns a code point takes: 0 for joiners/variation selectors and
// combining marks, 2 for emoji and East Asian wide characters, else 1.
function codePointWidth(codePoint: number): number {
	if (
		codePoint === 0x200d ||
		(codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
		(codePoint >= 0x0300 && codePoint <= 0x036f)
	) {
		return 0;
	}
	if (
		(codePoint >= 0x1100 && codePoint <= 0x115f) ||
		(codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
		(codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
		(codePoint >= 0xf900 && codePoint <= 0xfaff) ||
		(codePoint >= 0xff00 && codePoint <= 0xff60) ||
		codePoint >= 0x1f000
	) {
		return 2;
	}
	return 1;
}

// Clips a line to `width` columns so it never wraps - the redraw below moves
// the cursor up one row per line, which only works if a line is one row.
function fitToWidth(line: string, width: number): string {
	let out = "";
	let used = 0;
	let rest = line;

	while (rest.length > 0) {
		const escape = escapeLength(rest);
		if (escape > 0) {
			out += rest.slice(0, escape);
			rest = rest.slice(escape);
			continue;
		}
		const char = String.fromCodePoint(rest.codePointAt(0) ?? 0);
		const charWidth = codePointWidth(char.codePointAt(0) ?? 0);
		if (used + charWidth > width - 1 && rest.length > char.length) {
			return `${out}…\x1b[0m`;
		}
		out += char;
		used += charWidth;
		rest = rest.slice(char.length);
	}

	return out;
}

const showCursor = () => process.stdout.write("\x1b[?25h");

// Redraws a block of lines in place: each draw moves back up over the
// previous one and clears it, so the menu stays put instead of scrolling.
function createScreen() {
	let rows = 0;
	process.stdout.write("\x1b[?25l");
	process.once("exit", showCursor);

	return {
		// Rows available for a list, leaving room for the surrounding lines.
		maxRows: (reserved: number) =>
			Math.max(3, (process.stdout.rows ?? 24) - reserved),
		draw(lines: string[]) {
			const width = Math.max(20, process.stdout.columns ?? 80);
			const fitted = lines.map((line) =>
				fitToWidth(line.replaceAll("\n", " "), width),
			);
			const up = rows > 0 ? `\x1b[${rows}A` : "";
			process.stdout.write(`${up}\r\x1b[J${fitted.join("\n")}\n`);
			rows = fitted.length;
		},
		close() {
			showCursor();
			process.off("exit", showCursor);
		},
	};
}

// Keeps the selected row inside a fixed-height window over a long list.
function windowStart(selected: number, total: number, height: number) {
	return Math.min(
		Math.max(0, selected - height + 1),
		Math.max(0, total - height),
	);
}

function optionLine(option: string, isSelected: boolean) {
	return isSelected ? `\x1b[36m› ${option}\x1b[0m` : `  ${option}`;
}

function listenForKeys(
	onKeypress: (
		sequence: string | undefined,
		key: { name?: string; ctrl?: boolean; meta?: boolean },
	) => void,
) {
	const handler = (
		sequence: string | undefined,
		key: { name?: string; ctrl?: boolean; meta?: boolean } = {},
	) => onKeypress(sequence, key);

	readline.emitKeypressEvents(process.stdin);
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on("keypress", handler);

	return () => {
		process.stdin.off("keypress", handler);
		process.stdin.setRawMode(false);
		process.stdin.pause();
	};
}

export type MenuChoice =
	| { action: "pick"; index: number; pantry: boolean }
	| { action: "search" }
	| { action: "skip" }
	| { action: "quit" };

const LEGEND =
	"  ↑/↓ move · enter pick · p pick as Pantry item · s search · n skip · q quit";

// Arrow-key menu over `options`. With no options, only search/skip/quit
// are available.
export function menu(options: string[]): Promise<MenuChoice> {
	return new Promise((resolve) => {
		const screen = createScreen();
		let selected = 0;

		function render() {
			const height = screen.maxRows(2);
			const start = windowStart(selected, options.length, height);
			const lines = options.length
				? options
						.slice(start, start + height)
						.map((option, i) => optionLine(option, start + i === selected))
				: ["  No results."];
			lines.push(`\x1b[2m${LEGEND}\x1b[0m`);
			screen.draw(lines);
		}

		const stopListening = listenForKeys((sequence, key) => {
			if (key.ctrl && key.name === "c") {
				finish({ action: "quit" });
				return;
			}

			const count = Math.max(options.length, 1);
			switch (key.name ?? sequence) {
				case "up":
					selected = (selected - 1 + count) % count;
					render();
					return;
				case "down":
					selected = (selected + 1) % count;
					render();
					return;
				case "return":
				case "p":
					if (options.length > 0) {
						finish({
							action: "pick",
							index: selected,
							pantry: key.name === "p",
						});
					}
					return;
				case "s":
				case "/":
					finish({ action: "search" });
					return;
				case "n":
					finish({ action: "skip" });
					return;
				case "q":
				case "escape":
					finish({ action: "quit" });
			}
		});

		function finish(choice: MenuChoice) {
			stopListening();
			screen.close();
			resolve(choice);
		}

		render();
	});
}

const FILTER_LEGEND = "  type to filter · ↑/↓ move · enter pick · esc quit";
const MULTI_LEGEND =
	"  type to filter · ↑/↓ move · tab select · enter done · esc quit";
const FILTER_VISIBLE = 12;

// Arrow-key menu where typing narrows the options (case-insensitive
// substring). With `multiple`, Tab toggles options and Enter confirms the
// toggled set (or just the highlighted option if none are toggled).
// Resolves indexes into `options`, or null when the user quits.
function runFilterMenu(
	title: string,
	options: string[],
	multiple: boolean,
): Promise<number[] | null> {
	return new Promise((resolve) => {
		const screen = createScreen();
		const chosen = new Set<number>();
		let filter = "";
		let selected = 0;

		function matches() {
			const needle = filter.toLowerCase();
			return options
				.map((option, index) => ({ option, index }))
				.filter(({ option }) => option.toLowerCase().includes(needle));
		}

		function render() {
			const visible = matches();
			const height = Math.min(FILTER_VISIBLE, screen.maxRows(4));
			const start = windowStart(selected, visible.length, height);
			const count =
				multiple && chosen.size > 0 ? `  (${chosen.size} selected)` : "";
			const lines = [`${title} ${filter}\x1b[2m▏${count}\x1b[0m`];
			if (visible.length === 0) {
				lines.push("  No matches.");
			}
			for (const [i, { option, index }] of visible
				.slice(start, start + height)
				.entries()) {
				const mark = multiple
					? chosen.has(index)
						? "\x1b[32m●\x1b[0m "
						: "○ "
					: "";
				lines.push(optionLine(`${mark}${option}`, start + i === selected));
			}
			if (visible.length > height) {
				lines.push(`\x1b[2m  ${visible.length} matches\x1b[0m`);
			}
			lines.push(`\x1b[2m${multiple ? MULTI_LEGEND : FILTER_LEGEND}\x1b[0m`);
			screen.draw(lines);
		}

		const stopListening = listenForKeys((sequence, key) => {
			const count = matches().length;

			if ((key.ctrl && key.name === "c") || key.name === "escape") {
				finish(null);
				return;
			}
			if (key.name === "up") {
				selected = (selected - 1 + count) % Math.max(count, 1);
			} else if (key.name === "down") {
				selected = (selected + 1) % Math.max(count, 1);
			} else if (key.name === "tab" && multiple) {
				const match = matches()[selected];
				if (match) {
					if (chosen.has(match.index)) {
						chosen.delete(match.index);
					} else {
						chosen.add(match.index);
					}
				}
			} else if (key.name === "return") {
				const match = matches()[selected];
				if (chosen.size > 0) {
					finish(Array.from(chosen));
				} else if (match) {
					finish([match.index]);
				}
				return;
			} else if (key.name === "backspace") {
				filter = filter.slice(0, -1);
				selected = 0;
			} else if (
				sequence &&
				sequence.length === 1 &&
				sequence >= " " &&
				!key.ctrl &&
				!key.meta
			) {
				filter += sequence;
				selected = 0;
			}
			render();
		});

		function finish(indexes: number[] | null) {
			stopListening();
			screen.close();
			resolve(indexes);
		}

		render();
	});
}

export async function filterMenu(
	title: string,
	options: string[],
): Promise<number | null> {
	const picked = await runFilterMenu(title, options, false);
	return picked ? picked[0] : null;
}

export function filterMultiMenu(
	title: string,
	options: string[],
): Promise<number[] | null> {
	return runFilterMenu(title, options, true);
}

export type Approval = "add" | "skip" | "addAll";

const APPROVAL_KEYS: Record<string, Approval> = {
	return: "add",
	right: "add",
	y: "add",
	left: "skip",
	backspace: "skip",
	n: "skip",
	a: "addAll",
};

// Single keypress approval, with keys under either hand: Enter / → / y to
// add, ← / Backspace / n to skip, a to add everything left. Ctrl+C exits.
export function approve(question: string): Promise<Approval> {
	return new Promise((resolve) => {
		process.stdout.write(
			`${question} \x1b[2m[enter/→ add · ←/n skip · a add all]\x1b[0m `,
		);

		const stopListening = listenForKeys((sequence, key) => {
			if (key.ctrl && key.name === "c") {
				stopListening();
				process.stdout.write("\n");
				process.exit(130);
			}
			const approval =
				APPROVAL_KEYS[(key.name ?? sequence ?? "").toLowerCase()];
			if (approval) {
				stopListening();
				process.stdout.write(
					`${approval === "skip" ? "skip" : approval === "addAll" ? "add all" : "add"}\n`,
				);
				resolve(approval);
			}
		});
	});
}
