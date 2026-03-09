import js from '@eslint/js';
import globals from 'globals';
// Plugins optional for now; enable later if needed
// import reactHooks from 'eslint-plugin-react-hooks';
// import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// ESLint v9 flat config
export default [
    // Ignore build output and third-party libs
    { ignores: ['dist', 'public/webviewer-lib/**'] },

    // Base recommended configs
    js.configs.recommended,
    ...tseslint.configs.recommended,
    // reactHooks.configs['recommended-latest'],
    // reactRefresh.configs.vite,

    // Project-specific settings
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
    },
];
