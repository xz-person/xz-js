import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import xz from 'vite-plugin-xz';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), xz()],
});
