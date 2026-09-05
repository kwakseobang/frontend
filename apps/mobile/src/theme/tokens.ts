/**
 * Phase 1 subset of apps/web/src/styles/tokens.css — only the values the screens built
 * so far actually use, dark theme only.
 *
 * Phase 2 promotes this to packages/core/src/tokens.ts as the single source of truth for
 * both clients (light theme included, shadows split per platform, tokens.css generated
 * from it). Until then, do not add values here that are not already in tokens.css.
 */
export const colors = {
  bg: "#0a0908",
  panel1: "#100e0d",
  border1: "#1c1916",
  border2: "#2e2a24",
  textPrimary: "#f4efe6",
  textSecondary: "#8f8778",
  textMuted: "#5c5549",
  brand: "#96704f",
  onBrand: "#ffffff",
  errorText: "#c07f6e",
  placeholder: "#8a8172",
} as const;

export const fonts = {
  serif: "GowunBatang_400Regular",
  sans: "NotoSansKR_400Regular",
  sansBold: "NotoSansKR_700Bold",
} as const;

export const radius = {
  pill: 999,
  print: 3,
} as const;
