import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Port 5173 : déjà autorisé dans CORS_ORIGINS du backend (.env.example)
export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: {
    // Three.js pèse ~1 Mo non compressé (272 Ko gzip) : normal pour un site 3D, il est chargé en différé
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // Bibliothèques dans des fichiers séparés, mis en cache par le navigateur.
        // (Vite 8 / Rolldown : groupes avec priorité — React d'abord, sinon il finit dans le bloc 3D)
        advancedChunks: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|use-sync-external-store)[\\/]/,
              priority: 30,
            },
            { name: 'vendor-graph', test: /node_modules[\\/]d3-/, priority: 20 },
            {
              // Uniquement les paquets 3D (pas les polices @fontsource, chargées tout de suite)
              name: 'vendor-3d',
              test: /node_modules[\\/](three|three-stdlib|@react-three|zustand|suspend-react|its-fine|react-use-measure|@babel[\\/]runtime|fflate|@monogrid)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
