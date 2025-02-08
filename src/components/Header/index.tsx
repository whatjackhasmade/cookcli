import React from "react";

import { Navbar, NavbarContent, NavbarItem } from "@heroui/navbar";

import { Link } from "@/components/Link";

const menuItems = [
	{
		label: "All recipes",
		href: "/",
	},
];

export function Header() {
	return (
		<Navbar position="static">
			<NavbarContent className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
				{menuItems.map((item) => (
					<NavbarItem
						key={item.label}
					>
						<Link
							next={{
								href: item.href,
							}}
						>
							{item.label}
						</Link>
					</NavbarItem>
				))}
			</NavbarContent>
		</Navbar>
	);
}
