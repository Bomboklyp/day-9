import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  { ignores: [".verification/**", "coverage/**", "playwright-report/**", "test-results/**"] },
  { rules: { "no-empty": ["error", { allowEmptyCatch: true }] } },
);
