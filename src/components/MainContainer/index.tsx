"use client";

import { usePathname } from "next/navigation";
import styles from "./index.module.css";

export function MainContainer({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const isWide = pathname?.startsWith("/shopping");

	return (
		<main className={`${styles.main} ${isWide ? styles.wide : ""}`}>
			{children}
		</main>
	);
}
