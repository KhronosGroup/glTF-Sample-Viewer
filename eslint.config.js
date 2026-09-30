import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: { jsx: true }
            },
            globals: {
                ...globals.browser,
                ...globals.commonjs,
                ...globals.es2015,
                ...globals.node
            }
        }
    },
    {
        // The render loop, WebGL context and physics engine all outlive a single
        // render, so effect dependencies and cleanup have to be correct.
        files: ["src/**/*.jsx"],
        plugins: { react, "react-hooks": reactHooks },
        rules: {
            ...reactHooks.configs.recommended.rules,
            // Without this, no-unused-vars does not see components referenced in JSX.
            "react/jsx-uses-vars": "error"
        }
    },
    {
        rules: {
            indent: "warn",
            "linebreak-style": "warn",
            semi: "warn",
            "no-extra-semi": "warn",
            "no-undef": "warn",
            "no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_"
                }
            ],
            "no-empty": "warn",
            "no-redeclare": "warn",
            "no-prototype-builtins": "warn",
            "no-global-assign": "warn",
            "no-constant-binary-expression": "warn",
            "no-func-assign": "warn",
            "no-useless-escape": "warn",
            "no-useless-catch": "warn",
            "no-constant-condition": "warn",
            "new-cap": "off",
            "no-console": "off"
        }
    },
    {
        ignores: ["/**/dist/*", "**/libs/*", "test-results/*", "playwright-report/*"]
    },
    eslintConfigPrettier
];
