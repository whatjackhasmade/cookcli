function cleanMarkdown(text: string): string {
	return text
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/`([^`]+)`/g, "$1")
		.replace(/\s+/g, " ")
		.trim();
}

// Pulls the meta description straight from README.md's intro paragraph
// (the prose right after the H1) so it stays in sync with the doc instead
// of drifting as a separately maintained string.
export function getSiteDescription(
	readmeContent: string,
	fallback = "A personal cookbook.",
): string {
	const paragraphs = readmeContent.split(/\n\s*\n/);
	const description = paragraphs.find(
		(paragraph, index) => index > 0 && !paragraph.trim().startsWith("#"),
	);

	return description ? cleanMarkdown(description) : fallback;
}
