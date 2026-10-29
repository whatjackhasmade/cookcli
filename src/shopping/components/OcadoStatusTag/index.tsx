"use client";

import { usePathname, useRouter } from "next/navigation";
import { type OcadoStatus, serializePantryParam } from "../../ocadoStatus";
import styles from "./index.module.css";

interface OcadoStatusTagProps {
	ingredientKey: string;
	status: OcadoStatus;
	recipesParam: string;
	pantry: string[];
}

// One shopping-list line's Ocado status, plus the toggle that puts a Pantry
// item in (or back out of) the Trolley via the `pantry` URL param.
export function OcadoStatusTag({
	ingredientKey,
	status,
	recipesParam,
	pantry,
}: OcadoStatusTagProps) {
	const router = useRouter();
	const pathname = usePathname();

	function setPantry(enabled: boolean) {
		const next = enabled
			? [...pantry, ingredientKey]
			: pantry.filter((name) => name !== ingredientKey);
		const params = new URLSearchParams({ recipes: recipesParam });
		if (next.length > 0) {
			params.set("pantry", serializePantryParam(next));
		}
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	}

	if (status.kind === "unmapped") {
		return <span className={styles.unmapped}>Not mapped to Ocado</span>;
	}

	if (status.kind === "pantryLeftOut") {
		return (
			<span className={styles.tag}>
				<span>Pantry item · {status.productName}</span>
				<button
					className={styles.toggle}
					type="button"
					onClick={() => setPantry(true)}
				>
					Add to trolley
				</button>
			</span>
		);
	}

	return (
		<span className={styles.tag}>
			<span className={styles.product}>
				{status.productName} × {status.packs}
			</span>
			{status.checkQuantity && (
				<span className={styles.warning}>check quantity</span>
			)}
			{status.pantry && (
				<button
					className={styles.toggle}
					type="button"
					onClick={() => setPantry(false)}
				>
					Leave out
				</button>
			)}
		</span>
	);
}
