"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/components/Icons";
import styles from "./index.module.css";

export interface SearchableRecipe {
	title: string;
	href: string;
}

interface SearchProps {
	recipes: SearchableRecipe[];
}

const FOCUSABLE_SELECTOR =
	'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])';

export function Search({ recipes }: SearchProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const previouslyFocusedRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (isOpen && event.key === "Escape") {
				setIsOpen(false);
				return;
			}

			if (isOpen && event.key === "Tab") {
				const container = modalRef.current;
				if (!container) return;

				const focusable = Array.from(
					container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
				);
				if (focusable.length === 0) return;

				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				const active = document.activeElement;

				// Keep focus cycling within the modal - without this, Tab would
				// walk into the recipe list sitting behind the overlay.
				if (event.shiftKey ? active === first : active === last) {
					event.preventDefault();
					(event.shiftKey ? last : first).focus();
				} else if (!container.contains(active)) {
					event.preventDefault();
					first.focus();
				}

				return;
			}

			const target = event.target;
			const isTyping =
				target instanceof HTMLElement &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable);

			if (
				!isOpen &&
				!isTyping &&
				event.key.toLowerCase() === "f" &&
				!event.metaKey &&
				!event.ctrlKey &&
				!event.altKey
			) {
				event.preventDefault();
				setIsOpen(true);
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [isOpen]);

	useEffect(() => {
		if (isOpen) {
			previouslyFocusedRef.current = document.activeElement as HTMLElement;
			inputRef.current?.focus();
		} else {
			setQuery("");
			previouslyFocusedRef.current?.focus();
		}
	}, [isOpen]);

	if (!isOpen) {
		return null;
	}

	const trimmedQuery = query.trim().toLowerCase();
	const results = trimmedQuery
		? recipes.filter((recipe) =>
				recipe.title.toLowerCase().includes(trimmedQuery),
			)
		: [];

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: click-outside-to-dismiss backdrop; keyboard users close via Escape (handled in the keydown listener above)
		<div
			className={styles.overlay}
			onClick={(event) => {
				if (event.target === event.currentTarget) {
					setIsOpen(false);
				}
			}}
			role="presentation"
		>
			<div
				aria-label="Search recipes"
				aria-modal="true"
				className={styles.modal}
				ref={modalRef}
				role="dialog"
			>
				<div className={styles.inputRow}>
					<SearchIcon className={styles.icon} />
					<input
						className={styles.input}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search recipes..."
						ref={inputRef}
						type="text"
						value={query}
					/>
				</div>
				{trimmedQuery && (
					<ul className={styles.results}>
						{results.length === 0 ? (
							<li className={styles.empty}>No recipes found</li>
						) : (
							results.map((recipe) => (
								<li key={recipe.href}>
									<Link
										className={styles.resultLink}
										href={recipe.href}
										onClick={() => setIsOpen(false)}
									>
										{recipe.title}
									</Link>
								</li>
							))
						)}
					</ul>
				)}
			</div>
		</div>
	);
}
