import { defineConfig } from 'vitest/config';
import path from 'path';

// Avoid importing Vite plugins to prevent type/version mismatches in Vitest context.
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', 'node_modules_old'],
        coverage: {
            reporter: ['text', 'html'],
        },
    },
});
