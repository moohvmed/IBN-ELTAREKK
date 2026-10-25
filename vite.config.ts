import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const functionsEmulatorUrl = loadEnv(mode, projectRoot, '').VITE_FUNCTIONS_EMULATOR_URL;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': projectRoot,
      },
    },
    server: {
      hmr: true,
      ...(functionsEmulatorUrl
        ? {
            proxy: {
              '/api': {
                target: functionsEmulatorUrl,
                changeOrigin: true,
              },
            },
          }
        : {}),
    },
  };
});
