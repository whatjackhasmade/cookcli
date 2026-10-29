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
		let selected = 0;
		let renderedLines = 0;

		function render() {
			if (renderedLines > 0) {
				process.stdout.write(`\x1b[${renderedLines}A\x1b[J`);
			}
			const lines = options.length
				? options.map((option, i) =>
						i === selected ? `\x1b[36m› ${option}\x1b[0m` : `  ${option}`,
					)
				: ["  No results."];
			lines.push(`\x1b[2m${LEGEND}\x1b[0m`);
			process.stdout.write(`${lines.join("\n")}\n`);
			renderedLines = lines.length;
		}

		function finish(choice: MenuChoice) {
			process.stdin.off("keypress", onKeypress);
			process.stdin.setRawMode(false);
			process.stdin.pause();
			resolve(choice);
		}

		function onKeypress(
			sequence: string | undefined,
			key: { name?: string; ctrl?: boolean } = {},
		) {
			if (key.ctrl && key.name === "c") {
				finish({ action: "quit" });
				return;
			}

			switch (key.name ?? sequence) {
				case "up":
					selected =
						(selected - 1 + options.length) % Math.max(options.length, 1);
					render();
					return;
				case "down":
					selected = (selected + 1) % Math.max(options.length, 1);
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
		}

		readline.emitKeypressEvents(process.stdin);
		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.on("keypress", onKeypress);
		render();
	});
}
