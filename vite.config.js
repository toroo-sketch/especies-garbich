import { defineConfig } from 'vite';

// Si vas a publicar en GitHub Pages en una URL del tipo
// https://tu-usuario.github.io/nombre-del-repo/
// entonces "base" tiene que ser "/nombre-del-repo/" (con las barras).
// Si vas a usar Netlify o Vercel, dejalo en "/".
export default defineConfig({
  base: '/',
});
