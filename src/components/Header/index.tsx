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
		<header className={styles.header}>
			<div className={styles.inner}>
				<Link className={styles.brand} next={{ href: "/" }}>
					Cookbook
				</Link>
				<nav>
					<ul className={styles.list}>
						{menuItems.map((item) => (
							<li key={item.label}>
								<Link
									className={styles.navLink}
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
			</div>
		</header>
	);
}
