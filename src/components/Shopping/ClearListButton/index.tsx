"use client";

import { usePathname, useRouter } from "next/navigation";
import { SHOPPING_CHECKED_STORAGE_KEY } from "../constants";
import styles from "./index.module.css";

export function ClearListButton() {
	const router = useRouter();
	const pathname = usePathname();

	function handleClear() {
		window.localStorage.removeItem(SHOPPING_CHECKED_STORAGE_KEY);
		router.push(pathname, { scroll: false });
	}

	return (
		<button className={styles.clearButton} type="button" onClick={handleClear}>
			Clear list
		</button>
	);
}
