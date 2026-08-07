import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	outputFileTracingIncludes: {
		"/[slug]": ["./src/recipes/**/*.cook"],
	},
};

export default nextConfig;
