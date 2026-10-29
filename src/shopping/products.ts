// The Product mapping. Written by `npm run ocado:map` - safe to hand-edit
// (e.g. to add `conversions`), but the helper rewrites the whole array, so
// comments inside it aren't preserved.
import type { OcadoProduct } from "./types";

export const ocadoProducts: OcadoProduct[] = [
	{
		retailerProductId: "316753011",
		productId: "0650f4dd-c41e-45cb-a1cf-23cbcfcd5c2f",
		name: "Schwartz Ground Black Pepper Jar",
		packSize: {
			quantity: 33,
			unit: "g",
		},
		ingredients: ["black pepper"],
	},
	{
		retailerProductId: "619494011",
		productId: "ea9bc188-1bdc-4bd3-9df1-36ac3ef2cc99",
		name: "Bold Bean Co Queen Chickpeas",
		packSize: {
			quantity: 570,
			unit: "g",
		},
		ingredients: ["chickpeas"],
	},
	{
		retailerProductId: "334107011",
		productId: "a68ff8b4-ff1a-4e10-ae75-51e5d7f64116",
		name: "Coconut Merchant Raw Organic Extra Virgin Coconut Oil",
		packSize: {
			quantity: 300,
			unit: "ml",
		},
		ingredients: ["coconut oil"],
	},
	{
		retailerProductId: "614012011",
		productId: "21995c6e-137b-41b2-97af-46ca78ad4e2b",
		name: "Prymat Bay Leaves",
		packSize: {
			quantity: 6,
			unit: "g",
		},
		ingredients: ["bay leaf"],
	},
	{
		retailerProductId: "556966011",
		productId: "43465084-0db5-485f-9e53-1f87445740eb",
		name: "Ocado British Unsalted Butter",
		packSize: {
			quantity: 250,
			unit: "g",
		},
		ingredients: ["butter"],
	},
	{
		retailerProductId: "647378011",
		productId: "af054600-08ff-4205-b17a-ac576f057161",
		name: "Fudco Cashew Nuts",
		packSize: {
			quantity: 500,
			unit: "g",
		},
		ingredients: ["cashew nuts"],
	},
	{
		retailerProductId: "505534011",
		productId: "2db639ca-5c46-434a-b191-eb473d6f9697",
		name: "Cook With M&S Cinnamon Sticks",
		packSize: {
			quantity: 12,
			unit: "g",
		},
		ingredients: ["cinnamon stick"],
	},
	{
		retailerProductId: "82803011",
		productId: "3a3e4858-b692-4fcf-b75b-88e79bafaf14",
		name: "Ocado Coriander",
		packSize: {
			quantity: 30,
			unit: "g",
		},
		ingredients: ["coriander leaves"],
	},
	{
		retailerProductId: "363266011",
		productId: "ef329ab6-9b02-4cce-8ea6-47d6164e3bec",
		name: "Ocado Ground Coriander",
		packSize: {
			quantity: 36,
			unit: "g",
		},
		ingredients: ["coriander powder"],
	},
	{
		retailerProductId: "596410011",
		productId: "330ccf1d-cb1a-40d9-b032-714e8f1d066f",
		name: "Tom Parker Creamery Free Range British Double Cream",
		packSize: {
			quantity: 250,
			unit: "ml",
		},
		ingredients: ["cream"],
	},
];
