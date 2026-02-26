# CloutScape Sophisticated Deployment System V2

Welcome to the production-grade deployment system for CloutScape, custom-built for your WSL2 environment. This system provides a modular, adaptive, and professional-grade workflow for managing your casino platform.

## 🚀 Quick Start (CloutScape for Dummies)

To begin your guided deployment, run the following command in your terminal:

```bash
source scripts/lib/aliases.sh && cs-guide
```

This will open the **CloutScape Guided UI**, which will walk you through the entire setup process.

## 🛠 Command Reference (The CloutScape CLI)

We have implemented a sophisticated alias system to make development and management effortless. Once initialized, you can use these commands anywhere in your terminal:

| Command | Description |
| :--- | :--- |
| `cs-deploy` | **Master Setup**: Runs the full environment and project deployment. |
| `cs-status` | **Environment Dashboard**: Real-time status of services (MySQL, PM2, Tunnel). |
| `cs-guide` | **Guided UI**: Interactive menu for all deployment tasks. |
| `cs-update` | **Auto-Git**: Fetches latest code, rebuilds, and restarts services. |
| `cs-tunnel-setup` | **Cloudflare Tunnel**: Configures your domain (e.g., `cs-tunnel-setup domain.com`). |
| `cs-start/stop` | **Process Control**: Start or stop the backend application via PM2. |
| `cs-logs` | **Live Logs**: Watch the deployment and application logs in real-time. |
| `cs-help` | **Manual**: Displays this command reference. |

## 🧩 Sophisticated Features

### 1. Adaptive Error Handling
Every script is powered by a custom utility library that provides:
- **Automatic Fallbacks**: If a standard command fails, the system attempts alternative methods.
- **Detailed Logging**: All actions are recorded in `~/cloutscape_setup.log` for debugging.
- **Environment Awareness**: Scripts automatically detect if they are running in WSL2 and adjust service management accordingly.

### 2. Cloudflare Tunnel Integration
Your primary deployment via Cloudflare is now fully automated. The system handles:
- **`cloudflared` installation** and authentication.
- **Dynamic tunnel creation** and DNS routing.
- **PM2 process management** for the tunnel daemon to ensure 100% uptime.

### 3. Modular Architecture
The system is broken down into specialized modules:
- `installer.sh`: Manages Node.js, pnpm, MySQL, and system dependencies.
- `cloudflare.sh`: Handles all tunnel logic.
- `obfuscator.sh`: (Optional) Provides high-level code protection for production builds.
- `config_manager.sh`: Dynamically manages `.env` files and database credentials.

## 📦 How to Enable Aliases Permanently

To ensure these commands are always available when you open your WSL2 terminal, run:

```bash
echo "source $(pwd)/scripts/lib/aliases.sh" >> ~/.bashrc
source ~/.bashrc
```

---
*Developed by your Personal CloutScape Agent*
