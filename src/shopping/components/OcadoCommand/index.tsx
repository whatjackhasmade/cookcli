"use client";

import { useState } from "react";
import styles from "./index.module.css";

interface OcadoCommandProps {
	command: string;
}

// Playwright and the Ocado login can only run locally (the site is deployed
// on Vercel), so the page hands over a command to run rather than a button.
export function OcadoCommand({ command }: OcadoCommandProps) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(command);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard blocked - the command is still selectable on screen.
		}
	}

	return (
		<div className={styles.command}>
			<code className={styles.code}>{command}</code>
			<button className={styles.copy} type="button" onClick={copy}>
				{copied ? "Copied" : "Copy"}
			</button>
		</div>
	);
}
