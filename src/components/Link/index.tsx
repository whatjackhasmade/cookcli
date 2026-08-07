import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import type { ReactNode } from "react";

interface LinkProps {
	children: ReactNode;
	className?: string;
	next: NextLinkProps;
}

export function Link({ children, className, next }: LinkProps) {
	return (
		<NextLink className={className} {...next}>
			{children}
		</NextLink>
	);
}
