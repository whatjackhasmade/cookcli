import { describe, expect, it } from "vitest";
import { getSiteDescription } from "./index";

describe("getSiteDescription", () => {
	it("returns the fallback for empty content", () => {
		expect(getSiteDescription("")).toBe("A personal cookbook.");
	});

	it("extracts the first paragraph after the title heading", () => {
		const content =
			"# Title\n\nSome description here.\n\n## Next heading\ntext";
		expect(getSiteDescription(content)).toBe("Some description here.");
	});

	it("strips markdown links and inline code", () => {
		const content =
			"# Title\n\nUses [Cooklang](https://cooklang.org/) `.cook` files.";
		expect(getSiteDescription(content)).toBe("Uses Cooklang .cook files.");
	});

	it("collapses a multi-line paragraph into one line", () => {
		const content = "# Title\n\nLine one\nLine two continues.";
		expect(getSiteDescription(content)).toBe("Line one Line two continues.");
	});
});
