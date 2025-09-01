import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "warn", // Change from error to warning
      "@next/next/no-img-element": "warn", // Change from error to warning
      "react-hooks/exhaustive-deps": "warn", // Change from error to warning
    },
  },
];

export default eslintConfig;
