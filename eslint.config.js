import eslint from "@eslint/js";
import prettierFixConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/** @type {(config: import('eslint').Linter.Config[]) => any} */
export function extendBaseConfig(config) {
    return [
        eslint.configs.recommended,
        ...tseslint.configs.recommended,
        {
            rules: {
                "no-unused-vars": "off",
                "no-case-declarations": "off",
                "no-empty-pattern": "off",
                "@typescript-eslint/no-explicit-any": "off"
            }
        },
        ...config
    ];
}

// this must be adapted to the actual usage of specific frameworks
const usesFrameworkX = {
    packages: []
};

/** @type {import('eslint').Linter.Config[]} */
const frameworkXConfigs = []; // e.g. reactConfigs

/** @type {(usage: {apps?: string[], packages?: string[]}) => string[]} */
function dirs(usage) {
    // resolves to:
    // ["packages/api", "packages/auth", ...]
    let _dirs = [];
    const scopes = Object.keys(usage);
    for (const scope of scopes) {
        // @ts-expect-error scope is a key of usage
        for (const name of usage[scope]) {
            _dirs.push(`${scope}/${name}`);
        }
    }
    return _dirs;
}

/** @type {(usage: {apps?: string[], packages?: string[]}) => string[]} */
function files(usage) {
    // resolves to:
    // ["packages/api/**/*.{js,jsx,ts,tsx}", "packages/auth/**/*.{js,jsx,ts,tsx}", ...]
    const _dirs = dirs(usage);
    return _dirs.map((dir) => `${dir}/**/*.{js,jsx,ts,tsx}`);
}

/** @type {import('eslint').Linter.Config[]} */
export default [
    // reactConfig for all paths that use React
    ...[...extendBaseConfig([])].map((config) => ({
        ...config
    })),
    // config for more specific frameworks: The configs need to be adapted for that
    ...[...frameworkXConfigs].map((config) => ({
        ...config,
        files: files(usesFrameworkX),
        settings: {}
    })),
    // to change some rules for specific projects:
    {
        //files: files({ packages: [] }),
        rules: {
            "no-unused-vars": "off"
        }
    },
    prettierFixConfig
];
