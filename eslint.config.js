
import js from "@eslint/js";
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.commonjs,
                ...globals.es2015,
                ...globals.node,
            }
        }
    },
    {
        rules: {
            "indent": "warn",
            "linebreak-style": "warn",
            "semi": "warn",
            "no-extra-semi": "warn",
            "no-undef": "warn",
            "no-unused-vars": "warn",
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
        ignores: ["/**/dist/*", "/**/libs/*"]
    }
];