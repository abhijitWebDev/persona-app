# Deploying persona-chat to a VPS

Target: **persona.abhijitmone.com** on Ubuntu 24.04, served by Node (port 8787)
behind nginx with Let's Encrypt HTTPS, kept alive by pm2.

The Express server (`server/index.js`) serves **both** the built React app
(`dist/`) and the `/api` routes, so the whole thing runs as one Node process.

---

## 0. DNS (do this first)

Point an **A record** for `persona` at your VPS so DNS can propagate while you
work:

| Type | Name    | Value           |
|------|---------|-----------------|
| A    | persona | 72.61.224.97    |
| AAAA | persona | 2a02:4780:12:7061::1  (optional, IPv6) |

Verify: `dig +short persona.abhijitmone.com` should return `72.61.224.97`.

---

## 1. Install prerequisites (on the VPS)

```bash
sudo apt update
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
```

## 2. Get the code onto the VPS

Either `git clone` your repo, or copy this folder up with rsync from your
machine:

```bash
rsync -av --exclude node_modules --exclude dist \
  ~/persona-chat/ user@72.61.224.97:/var/www/persona-chat/
```

Then on the VPS:

```bash
cd /var/www/persona-chat
npm ci          # install deps
npm run build   # produce dist/
```

## 3. Configure secrets

Create `.env` in the project root (it is gitignored — never commit it):

```bash
cat > .env <<'EOF'
OPENAI_API_KEY=sk-...your-rotated-key...
OPENAI_MODEL=gpt-4o
PORT=8787
EOF
chmod 600 .env
```

> ⚠️ Rotate your OpenAI key first — the old one was committed to the repo and
> must be considered compromised. Create a new one at
> https://platform.openai.com/api-keys and revoke the old one.

Smoke-test it runs:

```bash
node server/index.js      # should print "running on http://localhost:8787"
# in another shell: curl -s localhost:8787/api/health   -> {"ok":true,...}
# Ctrl-C to stop
```

## 4. Run under pm2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup            # run the command it prints, to start on boot
pm2 logs persona-chat  # tail logs
```

## 5. Nginx reverse proxy

```bash
sudo cp deploy/nginx-persona.conf /etc/nginx/sites-available/persona.abhijitmone.com
sudo ln -s /etc/nginx/sites-available/persona.abhijitmone.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

At this point http://persona.abhijitmone.com should already work.

## 6. HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d persona.abhijitmone.com
```

Certbot edits the nginx config to add TLS + an HTTP→HTTPS redirect, and sets up
auto-renewal. Test renewal: `sudo certbot renew --dry-run`.

## 7. Firewall (if ufw is enabled)

```bash
sudo ufw allow 'Nginx Full'   # opens 80 + 443
sudo ufw allow OpenSSH
```

Do **not** expose port 8787 publicly — nginx proxies to it on localhost.

---

## Updating after a code change

```bash
cd /var/www/persona-chat
git pull            # or rsync again
npm ci
npm run build
pm2 restart persona-chat
```

## Troubleshooting

- **502 Bad Gateway** → Node isn't running: `pm2 status`, `pm2 logs persona-chat`.
- **Chat returns "Failed to generate a response"** → check `.env` key/model and
  `pm2 logs`. The server auto-skips JSON mode for models that don't support it.
- **Cert fails** → DNS not propagated yet (`dig persona.abhijitmone.com`), or
  port 80 blocked by the firewall / provider security group.
