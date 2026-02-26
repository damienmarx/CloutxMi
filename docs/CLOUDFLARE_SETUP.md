# Cloudflare Configuration Guide for CloutScape

To ensure the best security and performance for **cloutscape.org**, please configure your Cloudflare dashboard as follows:

## 1. SSL/TLS Settings
- **SSL/TLS Mode:** Set to **Full (Strict)**.
  - This ensures end-to-end encryption between Cloudflare and the UpCloud server.
  - Certbot has been configured on the server to handle the origin certificate.

## 2. DNS Records
- **A Record:** `cloutscape.org` -> `85.9.198.163` (Proxied: **On**)
- **A Record:** `www.cloutscape.org` -> `85.9.198.163` (Proxied: **On**)

## 3. Security & Optimization
- **Always Use HTTPS:** Enabled
- **Automatic HTTPS Rewrites:** Enabled
- **Brotli Compression:** Enabled
- **Web Application Firewall (WAF):** Ensure default rules are active to protect against common attacks.

## 4. Repository Alignment
The repository includes a `scripts/deploy-upcloud.sh` that automatically configures Nginx to work behind the Cloudflare proxy by correctly handling headers like `X-Forwarded-For` and `X-Forwarded-Proto`.
