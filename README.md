# Blog

React + Vite client, Node/Express server, Supabase (Postgres).

```
client/   React + Vite frontend (port 5173)
server/   Express API (port 3001)
deploy/   nginx config for the droplet
```

## Run locally
```bash
cd server && cp .env.example .env && npm install && npm run dev
cd client && cp .env.example .env && npm install && npm run dev
```
Vite proxies `/api` to the server. Endpoints: `GET /api/posts`, `GET /api/posts/:id`, `GET /health`.

## Supabase
1. Create a project, then run `server/schema/schema.sql` in the SQL editor.
2. Put `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env`.
3. Replace mock data in `server/src/routes/posts.js` using `server/src/lib/supabase.js`.

## Deploy backend to a DigitalOcean droplet
1. Install Node 20+, nginx, and PM2 (`npm i -g pm2`) on the droplet.
2. Copy `server/` over (git clone or rsync), create `.env`, run `npm ci --omit=dev`.
3. `pm2 start ecosystem.config.cjs && pm2 save && pm2 startup`.
4. Configure nginx using `deploy/nginx.conf`, add HTTPS with certbot, and open ports 80/443 (`ufw allow 'Nginx Full'`).
5. Set `CORS_ORIGIN` to your deployed frontend URL and `VITE_API_URL` in the client build to the API URL.
