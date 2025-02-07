import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "@/components/Providers";

import { fontSans } from "@/config/fonts";
import { Header } from "@/components/Header";

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
		<html suppressHydrationWarning lang="en">
			<head />
			<body
				className={clsx(
					"min-h-screen bg-background font-sans antialiased",
					fontSans.variable,
				)}
				style={{
					paddingBottom: "25rem",
					paddingTop: "3rem",
				}}
			>
				<Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
					<div className="relative flex flex-col min-h-screen">
						<Header />
						<main className="block container mx-auto max-w-3xl pt-16 px-6 py-5 flex-grow w-full">
							{children}
						</main>
					</div>
				</Providers>
			</body>
		</html>
	);
}
