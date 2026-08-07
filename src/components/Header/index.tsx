import { Link } from "@/components/Link";

const menuItems = [
	{
		label: "All recipes",
		href: "/",
	},
];

export function Header() {
	return (
		<nav>
			<ul className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
				{menuItems.map((item) => (
					<li key={item.label}>
						<Link
							next={{
								href: item.href,
							}}
						>
							{item.label}
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}
