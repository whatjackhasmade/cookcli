import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import type { ReactNode } from "react";

interface LinkProps {
	children: ReactNode;
	next: NextLinkProps;
}

export function Link({ children, next }: LinkProps) {
	return <NextLink {...next}>{children}</NextLink>;
}
