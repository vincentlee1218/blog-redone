# Deployment guide

How this app runs in production, why each piece exists, and how to ship changes.

## 1. Architecture

```
Browser
  │
  ├──► Vercel (static React/Vite build)            https://<app>.vercel.app
  │
  └──► https://blog-api.<DROPLET_IP_DASHED>.sslip.io
          │
          ▼
       DigitalOcean droplet
          nginx :80/:443  (TLS termination, reverse proxy)
              │
              ▼
          Node/Express :3001  (kept alive by PM2)
              │  outbound HTTPS
              ▼
          Supabase (Postgres)
```

| Piece | Job | Why we need it |
|---|---|---|
| **Vercel** | Builds and hosts `client/` as static files on a CDN | Free, auto-deploys on every git push, no server to maintain |
| **Droplet** | A Linux VM that runs `server/` | Vercel only hosts the frontend here. Our Express API needs a long-running process somewhere |
| **PM2** | Process manager for Node | Restarts the server if it crashes and starts it on reboot. Without it, closing your SSH session kills the server |
| **nginx** | Reverse proxy in front of Node | Handles HTTPS and forwards requests to port 3001, so Node stays private and never touches certificates |
| **Certbot / Let's Encrypt** | Issues and auto-renews a free TLS certificate | Vercel serves over HTTPS, and browsers block an HTTPS page from calling a plain `http://` API ("mixed content") |
| **sslip.io hostname** | Free DNS name that resolves to the droplet's IP | Let's Encrypt won't issue certificates for bare IPs, only hostnames. We have no domain, so sslip.io gives us one |
| **Supabase** | Hosted Postgres | Our database. The server talks to it over the internet |
| **CORS** | Server-side allow-list of frontend origins | Browsers block cross-origin requests unless the API explicitly allows the page's origin |

Config files in this repo: `server/ecosystem.config.cjs` (PM2), `deploy/nginx.conf` (nginx template), `server/.env.example` and `client/.env.example` (env vars).

---

## 2. Environment variables

There are three places where config lives. Mixing them up is the most common source of bugs.

### Droplet: `server/.env` (never committed)

| Variable | Purpose |
|---|---|
| `PORT` | Port Express listens on. `3001` (nginx proxies to it) |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins, e.g. `https://<app>.vercel.app` |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` (Supabase → Project Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key for Supabase (same page). **Bypasses row-level security. Never put it in the client or in Vercel** |
| `JWT_SECRET` | Signs login tokens. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |

Node only reads `.env` at startup, so after editing it run `pm2 restart blog-server --update-env`.

### Vercel: Project → Settings → Environment Variables

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://blog-api.<DROPLET_IP_DASHED>.sslip.io` (no trailing slash, no `/api`) |

Vite replaces `import.meta.env.VITE_*` with literal values **at build time**. Changing the variable does nothing until you redeploy. Anything prefixed `VITE_` is public in the browser bundle, so never put secrets in it.

In local dev `VITE_API_URL` is empty and `vite.config.js` proxies `/api` to `localhost:3001`. That's why you never see CORS errors locally, and why production needs explicit CORS.

---

## 3. One-time setup

### 3.1 Supabase
1. Create a project.
2. Run the SQL in `server/schema/` in the SQL editor (the base `schema.sql`, then any numbered schema files in order).
3. Copy the project URL and the `service_role` key into the droplet's `.env`.

The server checks the connection on startup. `pm2 logs blog-server` should show `✅ Supabase connected successfully`. You can also hit `GET /db`.

Why no firewall changes are needed: the server calls Supabase over outbound HTTPS, and DigitalOcean allows outbound traffic by default.

### 3.2 Droplet: install tooling

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
sudo npm i -g pm2
```

### 3.3 Droplet: get the code and configure it

```bash
git clone <repo-url> && cd blog-redone/server
npm ci --omit=dev          # exact versions from package-lock.json, no dev deps
cp .env.example .env && nano .env
```

### 3.4 Droplet: run the server with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save                   # remember the process list
pm2 startup                # prints a command; run it so PM2 launches on boot
pm2 status
pm2 logs blog-server
```

At this point the API works on `http://localhost:3001` but only from the droplet itself.

### 3.5 Pick a hostname (no domain needed)

Let's Encrypt only issues certificates for hostnames. [sslip.io](https://sslip.io) resolves any name containing an IP back to that IP, so no signup or DNS records are needed.

```bash
curl -4 ifconfig.me        # e.g. 157.245.133.105
```

Replace dots with dashes and add a prefix: `blog-api.157-245-133-105.sslip.io`.
Verify: `dig +short blog-api.157-245-133-105.sslip.io` prints the IP.

> **Use a unique prefix.** The droplet also hosts another app whose nginx site already used the bare `157-245-133-105.sslip.io`. Two nginx server blocks with the same `server_name` conflict and one silently wins, so requests went to the wrong app. Any prefix works because sslip.io resolves them all to the same IP.

### 3.6 nginx: reverse proxy

nginx listens on the public ports and forwards requests to Node. It matches the incoming `Host` header against `server_name` to decide which site handles a request, which is how several apps share one droplet.

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/blog-api
sudo nano /etc/nginx/sites-available/blog-api     # set server_name to your hostname
sudo ln -s /etc/nginx/sites-available/blog-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx      # always test the config before reloading
```

What the config does:
- `listen 80` / `server_name` selects requests for our hostname.
- `proxy_pass http://127.0.0.1:3001` forwards them to Express. Port 3001 is never exposed publicly.
- `X-Forwarded-*` and `Host` headers pass the original client info through, since Node would otherwise only see nginx as the caller.

Don't delete `sites-enabled/default` or other apps' configs if they share the droplet. Check with `ls /etc/nginx/sites-enabled/`.

### 3.7 Firewall

```bash
sudo ufw allow OpenSSH            # first! otherwise enabling ufw locks you out
sudo ufw allow 'Nginx Full'       # 80 (HTTP) and 443 (HTTPS)
sudo ufw enable
```

If a DigitalOcean Cloud Firewall is attached to the droplet, it must also allow inbound 80 and 443. Let's Encrypt needs port 80 reachable from the internet to verify you control the hostname.

### 3.8 HTTPS with Certbot

```bash
sudo certbot --nginx -d blog-api.157-245-133-105.sslip.io
```

What happens: Let's Encrypt gives certbot a challenge, certbot temporarily serves it through nginx on port 80, Let's Encrypt fetches it to prove the hostname points at this server, and then issues the certificate. Certbot rewrites the nginx config to add a `listen 443 ssl` block with the certificate and (if you choose) a redirect from HTTP to HTTPS. A systemd timer renews it automatically before the 90-day expiry. Check with `sudo certbot renew --dry-run`.

Test: `curl https://blog-api.157-245-133-105.sslip.io/health` → `{"ok":true}`.

Pitfalls we hit:
- **"no valid A records found"**: the hostname was wrong (a placeholder IP, or a name garbled by editing a shell-history line). Type the hostname fresh and check it with `dig` first.
- **"existing certificate... renew or reinstall?"**: the name was already issued. Reinstall (option 1) is enough; renewing needlessly counts against Let's Encrypt rate limits.
- Timeouts mean ports 80/443 are blocked (ufw or the DO Cloud Firewall).

### 3.9 CORS

Browsers enforce the same-origin policy: a page on `https://<app>.vercel.app` may not read responses from `https://blog-api...sslip.io` unless the API says so via an `Access-Control-Allow-Origin` header. `server/src/index.js` does this with the `cors` package, allowing the origins in `CORS_ORIGIN`:

```js
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')
app.use(cors({ origin: origins }))
```

In `server/.env`:
```
CORS_ORIGIN=https://<app>.vercel.app
```
Rules:
- Must match the page's origin exactly: scheme + host, **no trailing slash**, no path.
- Add every origin that needs access, comma-separated (custom domain, preview URLs).
- CORS is enforced by the browser, so `curl` works even when CORS is misconfigured. Test in the browser.
- Restart to apply: `pm2 restart blog-server --update-env`.

### 3.10 Vercel

1. Import the GitHub repo in Vercel. Set **Root Directory** to `client` and use the Vite framework preset (build `npm run build`, output `dist`).
2. Add `VITE_API_URL` (see section 2).
3. Deploy. From then on every push to the production branch auto-deploys.

---

## 4. Shipping changes

### Backend (`server/`)

```bash
ssh <user>@<droplet>
cd ~/blog-redone && git pull
cd server
npm ci --omit=dev          # only needed if package.json / lock changed
pm2 restart blog-server --update-env
pm2 logs blog-server       # confirm it came back up and Supabase connected
```

- Code change → `pm2 restart blog-server`
- `.env` change → `pm2 restart blog-server --update-env`
- nginx config change → `sudo nginx -t && sudo systemctl reload nginx`

### Frontend (`client/`)

Push to git and Vercel builds and deploys automatically. If you only changed a Vercel env var, use **Deployments → ⋯ → Redeploy**, because the value is baked in at build time.

### Database changes

Add a new numbered SQL file under `server/schema/` and run it in the Supabase SQL editor. Do this **before** deploying server code that depends on it.

### Order for changes that touch both sides

Database first, then server, then client. Keep the API backwards compatible long enough for the old client to keep working while Vercel builds.

---

## 5. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Browser: "blocked by CORS policy" | `CORS_ORIGIN` doesn't exactly match the page origin, or the server wasn't restarted with `--update-env` |
| Browser: "mixed content" | `VITE_API_URL` starts with `http://` or is the raw IP. It must be the `https://` hostname |
| Requests hit the Vercel domain and 404 | `VITE_API_URL` was empty at build time. Set it and redeploy |
| 502 Bad Gateway | Node isn't running. `pm2 status`, `pm2 logs blog-server` |
| Wrong app answers on our hostname | Duplicate `server_name`. `sudo nginx -t` warns about conflicts. Use a unique hostname |
| 500s on API calls | `pm2 logs blog-server`. Usually a wrong Supabase URL/key or a missing schema migration |
| Server up but can't reach Supabase | Check `GET /db`; verify `SUPABASE_URL` and the service role key |
| Cert expired | `sudo certbot renew` and check `systemctl list-timers \| grep certbot` |

Useful commands:
```bash
pm2 status / pm2 logs blog-server / pm2 restart blog-server
sudo nginx -t && sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log
sudo ufw status
curl -i https://<hostname>/health
```

## 6. Security notes

- `SUPABASE_SERVICE_ROLE_KEY` and `JWT_SECRET` live only in the droplet's `.env` (git-ignored). Rotate them if they leak.
- Only ports 22, 80, and 443 are open. Node (3001) is reachable only through nginx.
- The sslip.io hostname is tied to the droplet's IP. If the droplet is recreated with a new IP, redo the hostname, nginx `server_name`, certbot, and `VITE_API_URL` steps. A real domain removes that coupling.
