
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
  esbuild: {
    supported: {
      'top-level-await': true
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: {
        'top-level-await': true
      }
    }
  }
});
