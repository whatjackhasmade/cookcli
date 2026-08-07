"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

export default function ErrorComponent({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		/* eslint-disable no-console */
		console.error(error);
	}, [error]);

	return (
		<div className={styles.wrapper}>
			<h2 className={styles.title}>Something went wrong!</h2>
			<button
				className={styles.button}
				onClick={
					// Attempt to recover by trying to re-render the segment
					() => reset()
				}
				type="button"
			>
				Try again
			</button>
		</div>
	);
}
