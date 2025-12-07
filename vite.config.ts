import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@contexts': path.resolve(__dirname, './src/contexts'),
            '@config': path.resolve(__dirname, './src/config'),
            '@themes': path.resolve(__dirname, './src/themes'),
            '@locales': path.resolve(__dirname, './src/locales'),
            '@types': path.resolve(__dirname, './src/types'),
        },
    },
    worker: {
        format: 'es',
    },
    optimizeDeps: {
        exclude: ['pyodide'],
    },
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
});
