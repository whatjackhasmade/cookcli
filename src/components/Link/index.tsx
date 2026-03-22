import {
	Link as HeroLink,
	type LinkProps as HeroLinkProps,
} from "@heroui/link";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";

interface LinkProps extends HeroLinkProps {
	children: React.ReactNode;
	next: NextLinkProps;
}

export function Link({ children, ...props }: LinkProps) {
	const { next, ...rest } = props;

	return (
		<NextLink {...next} passHref>
			<HeroLink {...rest}>{children}</HeroLink>
		</NextLink>
	);
}
