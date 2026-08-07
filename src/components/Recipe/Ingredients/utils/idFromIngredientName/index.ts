export function idFromIngredientName(name: string, quantity: number | string, units: string): string {
  return ['ingredient', name, quantity, units].filter(Boolean).map((part) => `${part}`.trim().replace(/\s+/g, "-").toLowerCase()).join("-");
}