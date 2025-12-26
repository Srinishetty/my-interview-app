import { defineConfig } from 'vite';
import lwc from 'vite-plugin-lwc';

export default defineConfig({
  base: '/my-interview-app/',
  plugins: [lwc()],
  resolve: {
    alias: {
      lwc: '@lwc/engine-dom',
    },
  },
});
