import { Link } from "@/components/Link";
import styles from "./index.module.css";

const menuItems = [
	{
		label: "All recipes",
		href: "/",
	},
];

export function Header() {
	return (
		<nav>
			<ul className={styles.list}>
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
