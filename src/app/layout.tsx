import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { fontSans } from "@/config/fonts";
import styles from "./layout.module.css";

export const metadata: Metadata = {
	title: {
		default: "Cookbook",
		template: `%s - ${"Cookbook"}`,
	},
	description: "All the recipes you need to cook",
	icons: {
		icon: "/favicon.ico",
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head />
			<body
				className={`${styles.body} ${fontSans.variable}`}
				style={{
					paddingBottom: "25rem",
					paddingTop: "3rem",
				}}
			>
				<div className={styles.page}>
					<Header />
					<main className={styles.main}>{children}</main>
				</div>
			</body>
		</html>
	);
}
