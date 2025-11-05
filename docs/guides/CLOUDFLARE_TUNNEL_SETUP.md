# Cloudflare Tunnel Setup for PromptStash Development

## Overview

This guide explains how to set up Cloudflare Tunnel to enable access to your local development server at `https://promptstash.tootie.tv` with WebSocket support for Next.js HMR.

## Prerequisites

- Cloudflare account with domain `tootie.tv` configured
- Local development servers running:
  - Next.js web app on `http://localhost:3100`
  - Express API on `http://localhost:3300`

## Installation

### Ubuntu/Debian

```bash
# Download and install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Alternative: Snap

```bash
sudo snap install cloudflared
```

### Verify Installation

```bash
cloudflared --version
```

## Setup Steps

### 1. Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This will open a browser window. Select the `tootie.tv` domain to authorize.

### 2. Create a Tunnel

```bash
cloudflared tunnel create promptstash-dev
```

**Save the Tunnel ID** displayed in the output. You'll need it for the config file.

### 3. Create Configuration File

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/jmagar/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  # Route promptstash.tootie.tv to Next.js dev server
  - hostname: promptstash.tootie.tv
    service: http://localhost:3100
    originRequest:
      # Enable WebSocket support for Next.js HMR
      noTLSVerify: true
      http2Origin: true
      connectTimeout: 30s
      # CRITICAL: Enable WebSocket upgrades
      upgradeWebSocket: true
      # Keep connections alive for long-lived WebSockets
      keepAliveConnections: 10
      keepAliveTimeout: 90s

  # Catch-all rule (required by Cloudflare)
  - service: http_status:404
```

**Replace `<YOUR-TUNNEL-ID>` with the actual tunnel ID from step 2.**

### 4. Configure DNS

```bash
cloudflared tunnel route dns promptstash-dev promptstash.tootie.tv
```

This creates a CNAME record in Cloudflare DNS pointing to your tunnel.

### 5. Start the Tunnel

#### Option A: Run in Foreground (for testing)

```bash
cloudflared tunnel run promptstash-dev
```

#### Option B: Install as System Service (recommended)

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### 6. Verify Status

```bash
sudo systemctl status cloudflared
```

Or check logs:

```bash
sudo journalctl -u cloudflared -f
```

## Testing WebSocket Connections

### 1. Check Tunnel Status

Visit: https://promptstash.tootie.tv

You should see your Next.js app.

### 2. Test WebSocket in Browser Console

Open browser DevTools → Console:

```javascript
const ws = new WebSocket("wss://promptstash.tootie.tv/_next/webpack-hmr");
ws.onopen = () => console.log("WebSocket connected!");
ws.onerror = (err) => console.error("WebSocket error:", err);
```

If successful, you'll see `WebSocket connected!`.

### 3. Verify HMR

Make a change to any React component and save. The page should hot-reload without a full refresh.

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause:** Tunnel is not running or not configured correctly.

**Solution:**

```bash
# Check if tunnel is running
sudo systemctl status cloudflared

# Restart the tunnel
sudo systemctl restart cloudflared

# Check logs for errors
sudo journalctl -u cloudflared -n 50
```

### Issue: WebSocket Connection Failed

**Cause:** `upgradeWebSocket: true` not set in config.

**Solution:**

1. Edit `~/.cloudflared/config.yml`
2. Add `upgradeWebSocket: true` under `originRequest`
3. Restart cloudflared: `sudo systemctl restart cloudflared`

### Issue: Tunnel Not Found

**Cause:** Tunnel credentials file not found.

**Solution:**

```bash
# List all tunnels
cloudflared tunnel list

# Delete and recreate tunnel
cloudflared tunnel delete promptstash-dev
cloudflared tunnel create promptstash-dev
```

### Issue: DNS Not Resolving

**Cause:** CNAME record not created.

**Solution:**

```bash
# Re-add DNS route
cloudflared tunnel route dns promptstash-dev promptstash.tootie.tv

# Or manually add CNAME in Cloudflare dashboard:
# Name: promptstash
# Target: <TUNNEL-ID>.cfargotunnel.com
```

## Advanced Configuration

### Multiple Services (Optional)

If you want to expose the API separately:

```yaml
ingress:
  # Web app
  - hostname: promptstash.tootie.tv
    service: http://localhost:3100
    originRequest:
      upgradeWebSocket: true

  # API (optional - if you want separate subdomain)
  - hostname: api.promptstash.tootie.tv
    service: http://localhost:3300
    originRequest:
      connectTimeout: 30s

  # Catch-all
  - service: http_status:404
```

### Custom Headers

Add custom headers for debugging:

```yaml
ingress:
  - hostname: promptstash.tootie.tv
    service: http://localhost:3100
    originRequest:
      upgradeWebSocket: true
      httpHostHeader: localhost:3100
      originServerName: localhost
```

## Stopping the Tunnel

### Temporary Stop

```bash
sudo systemctl stop cloudflared
```

### Permanent Removal

```bash
# Stop and disable service
sudo systemctl stop cloudflared
sudo systemctl disable cloudflared

# Uninstall service
sudo cloudflared service uninstall

# Delete tunnel
cloudflared tunnel delete promptstash-dev

# Remove DNS route (manual - via Cloudflare dashboard)
```

## Environment Variables

Make sure your `.env.local` files are configured for the tunnel domain:

**`apps/web/.env.local`:**

```env
BETTER_AUTH_URL=https://promptstash.tootie.tv
NEXT_PUBLIC_BASE_URL=https://promptstash.tootie.tv
NEXT_PUBLIC_API_URL=https://promptstash.tootie.tv/api
```

**`apps/api/.env`:**

```env
ALLOWED_ORIGINS=http://localhost:3100,https://promptstash.tootie.tv
BETTER_AUTH_URL=https://promptstash.tootie.tv
```

## Security Notes

⚠️ **Development Only**: This configuration uses `noTLSVerify: true` which disables SSL verification between Cloudflare and your local server. This is acceptable for development but should NOT be used in production.

✅ **Benefits**:

- Free SSL/TLS certificates
- DDoS protection
- Global CDN
- WebSocket support
- No need to expose ports on router

## Next Steps

After setting up the tunnel:

1. ✅ Verify WebSocket HMR works
2. ✅ Test file creation (should work after CSRF fix)
3. ✅ Configure tunnel to auto-start on boot
4. 📖 Read Cloudflare Tunnel docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

## Useful Commands

```bash
# List all tunnels
cloudflared tunnel list

# Show tunnel info
cloudflared tunnel info promptstash-dev

# Run with verbose logging
cloudflared tunnel --loglevel debug run promptstash-dev

# Check configuration
cloudflared tunnel ingress validate

# Test ingress rules
cloudflared tunnel ingress rule https://promptstash.tootie.tv
```
