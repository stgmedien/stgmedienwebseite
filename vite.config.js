import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';

// Lokal führt Vite die Funktionen aus /api genauso aus wie später Vercel.
function vercelApiLokal() {
  return {
    name: 'vercel-api-lokal',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''));
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();
        const name = req.url.slice(5).split('?')[0].replace(/[^a-z0-9-]/gi, '');
        try {
          const mod = await server.ssrLoadModule(path.resolve('api', `${name}.js`));
          const handler = mod[req.method];
          if (!handler) { res.statusCode = 405; res.end(); return; }
          const teile = [];
          for await (const t of req) teile.push(t);
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: { 'content-type': req.headers['content-type'] || '' },
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(teile),
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          server.config.logger.error(e.stack || String(e));
          res.statusCode = 500;
          res.end('API-Fehler');
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [vercelApiLokal()],
  build: {
    rollupOptions: {
      input: { start: 'index.html', impressum: 'impressum.html', datenschutz: 'datenschutz.html' },
    },
  },
});
