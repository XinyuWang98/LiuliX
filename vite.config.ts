import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@contexts': path.resolve(__dirname, './src/contexts'),
        },
    },
    optimizeDeps: {
        include: ['react-window'],
        exclude: ['pyodide'],  // 排除Pyodide避免预构建
        esbuildOptions: {
            mainFields: ['module', 'main'],
        },
    },
    build: {
        target: 'esnext',  // 支持现代浏览器特性
        rollupOptions: {
            onwarn(warning, warn) {
                // 忽略 DuckDB Worker 的 sourcemap 警告
                if (
                    warning.code === 'SOURCEMAP_ERROR' &&
                    warning.message.includes('duckdb')
                ) {
                    return;
                }
                warn(warning);
            },
            output: {
                format: 'es',  // Worker 使用 ES 模块格式,支持代码分割
                manualChunks: {
                    // 分离大型库以优化加载
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-duckdb': ['@duckdb/duckdb-wasm'],
                },
            },
        },
        // 增加警告阈值以容纳Pyodide大文件
        chunkSizeWarningLimit: 2000,  // 2MB
    },
    // 支持大文件（Pyodide WASM等）
    assetsInclude: ['**/*.wasm', '**/*.data'],
});
