import fs from "node:fs";
import path from "node:path";

interface GetCookFilesArgs {
	dir?: string;
	fileList?: string[];
}

const recipesPath = `${process.cwd()}/src/recipes`;

export async function getCookFiles({
	dir = recipesPath,
	fileList = [],
}: GetCookFilesArgs = {}): Promise<string[]> {
	const files = await fs.promises.readdir(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = await fs.promises.stat(filePath);

		if (stat.isDirectory()) {
			await getCookFiles({
				dir: filePath,
				fileList,
			});
		} else if (file.endsWith(".cook")) {
			fileList.push(filePath);
		}
	}

	return fileList;
}
