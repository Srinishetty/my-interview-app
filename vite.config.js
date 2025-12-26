import { defineConfig } from 'vite';
import lwc from 'vite-plugin-lwc';
import path from 'node:path';

const lwcPlugins = lwc();
const lwcPluginsFiltered = Array.isArray(lwcPlugins)
  ? lwcPlugins.filter((p) => p.name !== 'lwc:alias')
  : lwcPlugins;

function windowsSafeHtmlResolver() {
  return {
    name: 'fix-html-imports-windows',
    enforce: 'pre',
    resolveId(source, importer) {
      if (typeof source !== 'string') return null;
      if (!source.endsWith('.html')) return null;

      // Don't treat index.html as an imported LWC template — leave it to Vite
      if (/index\.html$/i.test(source)) return null;

      // If importer is an absolute path, resolve relative to it.
      if (importer && path.isAbsolute(importer)) {
        const dir = path.dirname(importer);
        const resolved = path.join(dir, source);
        return resolved + '?import';
      }

      // Fallback: return source with query so Vite treats it as an import
      return source + '?import';
    },
  };
}

export default defineConfig({
  base: '/my-interview-app/',
  plugins: [windowsSafeHtmlResolver(), ...(Array.isArray(lwcPluginsFiltered) ? lwcPluginsFiltered : [lwcPluginsFiltered])],
  resolve: {
    alias: {
      'lwc': '@lwc/engine-dom'
    },
    dedupe: ['lwc'],
  },
});
