# CloutScape / Degens Den - Complete Setup Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Admin Dashboard Access](#admin-dashboard-access)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

---

## Project Overview

**CloutScape / Degens Den** is a professional-grade online casino platform featuring:

- **Multi-Currency Support**: USD, CAD, and OSRS Gold (Mils)
- **Secure Authentication**: Login, Register, Password Recovery
- **Game Suite**: Slots 3D, Keno, Crash, Blackjack, Roulette, Dice, Poker
- **Admin Dashboard**: User management, wallet controls, game configuration
- **Real-Time Chat**: Live player interaction and rain system
- **VIP System**: Tiered rewards and benefits
- **Provably Fair Gaming**: Transparent game logic and RNG

---

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm/pnpm**: v8.0.0 or higher
- **MySQL/MariaDB**: v8.0 or higher (or compatible database)
- **Git**: v2.30.0 or higher

### Required Software
```bash
# Install Node.js (if not already installed)
# Visit: https://nodejs.org/

# Install pnpm globally
npm install -g pnpm

# Install Git (if not already installed)
# Visit: https://git-scm.com/
```

### System Packages (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  python3 \
  git \
  curl \
  wget \
  mysql-server \
  mysql-client
```

---

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/No6love9/CloutScape.git
cd CloutScape
```

### 2. Install Dependencies
```bash
# Install all dependencies
pnpm install

# Or using npm
npm install
```

### 3. Setup Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env  # or use your preferred editor
```

### 4. Generate Security Keys
```bash
# Generate JWT Secret (min 32 characters)
openssl rand -base64 32

# Generate Encryption Key (min 32 characters)
openssl rand -base64 32

# Update these values in your .env file
```

---

## Environment Configuration

### Critical Environment Variables

```env
# Application
NODE_ENV=development
APP_NAME=CloutScape
PORT=3000
HOST=localhost

# Database
DATABASE_URL=mysql://username:password@localhost:3306/cloutscape
DB_MAX_CONNECTIONS=10

# Security (IMPORTANT: Generate new keys!)
JWT_SECRET=your-very-long-random-secret-key-min-32-chars
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data-32-chars
BCRYPT_ROUNDS=10
SESSION_SECRET=your-session-secret-key

# Cookies (Set to true in production with HTTPS)
COOKIE_SECURE=false
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=strict

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Currency Exchange (Configurable)
# 1 USD = 1,000,000 OSRS GP (default)
# 1 USD = 1.36 CAD (default)

# OAuth (Optional - Update with your provider)
VITE_OAUTH_PORTAL_URL=https://your-oauth-provider.com/oauth
OAUTH_SERVER_URL=https://your-oauth-provider.com/oauth
```

### Optional Environment Variables

```env
# Email Configuration
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
ENABLE_METRICS=false

# Feature Flags
EMAIL_VERIFICATION_REQUIRED=false
TWO_FACTOR_AUTH_ENABLED=false
MAINTENANCE_MODE=false

# Game Configuration
GAME_MIN_BET=0.01
GAME_MAX_BET=10000
GAME_HOUSE_EDGE=0.02
```

---

## Database Setup

### 1. Create Database
```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE cloutscape;
CREATE USER 'cloutscape_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON cloutscape.* TO 'cloutscape_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Run Database Migrations
```bash
# Using Drizzle ORM
pnpm run db:migrate

# Or push schema to database
pnpm run db:push
```

### 3. Seed Initial Data (Optional)
```bash
pnpm run db:seed
```

---

## Running the Application

### Development Mode

```bash
# Start development server with hot reload
pnpm run dev

# The application will be available at:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Production Build

```bash
# Build the application
pnpm run build

# Start production server
pnpm run start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t cloutscape:latest .

# Run Docker container
docker run -p 3000:3000 -p 3001:3001 \
  --env-file .env \
  cloutscape:latest
```

---

## Admin Dashboard Access

### 1. Create Admin User
```bash
# Connect to database
mysql -u cloutscape_user -p cloutscape

# Update user role to admin
UPDATE users SET role = 'admin' WHERE username = 'your_username';
EXIT;
```

### 2. Access Admin Dashboard
1. Login to your account at `http://localhost:3000`
2. Navigate to `/admin` route
3. You should see the Admin Dashboard with tabs for:
   - User Management
   - Wallet Management
   - Game Configuration
   - Transactions
   - Security Settings

### Admin Features
- **User Management**: View, mute, edit, delete users
- **Wallet Management**: Adjust user balances, record transactions
- **Game Configuration**: Configure game settings (placeholder)
- **Transactions**: View and filter all platform transactions
- **Security**: Manage security settings (placeholder)

---

## Deployment

### Railway Deployment

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Create new project
railway init

# 4. Set environment variables
railway variables set DATABASE_URL=mysql://...
railway variables set JWT_SECRET=...
railway variables set ENCRYPTION_KEY=...

# 5. Deploy
railway up
```

### AWS EC2 Deployment

```bash
# 1. Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 2. Install dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm mysql-server git

# 3. Clone repository
git clone https://github.com/No6love9/CloutScape.git
cd CloutScape

# 4. Install project dependencies
npm install -g pnpm
pnpm install

# 5. Setup environment
cp .env.example .env
nano .env  # Configure your environment

# 6. Setup database
mysql -u root -p < database/schema.sql

# 7. Build and run
pnpm run build
pnpm run start
```

### Vercel Deployment (Frontend Only)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod

# 3. Configure environment variables in Vercel dashboard
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:**
- Ensure MySQL is running: `sudo systemctl start mysql`
- Check DATABASE_URL in .env file
- Verify database credentials

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### 3. JWT Secret Not Set
```
Error: JWT_SECRET is required
```
**Solution:**
- Generate a new JWT secret: `openssl rand -base64 32`
- Add to .env file: `JWT_SECRET=<generated-secret>`

#### 4. Build Fails
```
Error: Module not found
```
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 5. Admin Dashboard Not Accessible
```
Error: Unauthorized access
```
**Solution:**
- Ensure your user has `role = 'admin'` in database
- Clear browser cookies and re-login
- Check JWT_SECRET matches between frontend and backend

---

## Security Considerations

### 1. Production Security Checklist

- [ ] Change all default credentials
- [ ] Set `COOKIE_SECURE=true` (requires HTTPS)
- [ ] Enable HTTPS/SSL certificate
- [ ] Set strong JWT_SECRET and ENCRYPTION_KEY
- [ ] Configure CORS_ORIGINS to your domain only
- [ ] Enable rate limiting
- [ ] Setup firewall rules
- [ ] Enable 2FA for admin accounts
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity

### 2. Database Security

```bash
# Create backup
mysqldump -u cloutscape_user -p cloutscape > backup.sql

# Restore from backup
mysql -u cloutscape_user -p cloutscape < backup.sql

# Enable SSL for database connections
# Update DATABASE_URL with ssl=true parameter
```

### 3. API Security

- All sensitive endpoints require authentication
- Rate limiting prevents brute-force attacks
- CORS prevents unauthorized cross-origin requests
- CSRF tokens protect against cross-site attacks
- Input validation on all endpoints
- SQL injection prevention via ORM

### 4. User Data Protection

- Passwords hashed with bcrypt (10+ rounds)
- Sensitive data encrypted at rest
- SSL/TLS for data in transit
- Session cookies HttpOnly and Secure flags
- Regular security audits recommended

---

## Support & Resources

### Documentation
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### Community Support
- GitHub Issues: https://github.com/No6love9/CloutScape/issues
- Email: support@cloutscape.org

---

## Legal Disclaimer

**IMPORTANT**: CloutScape / Degens Den is NOT affiliated with Jagex Ltd. or RuneScape. Users acknowledge that trading OSRS gold may violate Jagex's Terms of Service and accounts may be subject to suspension or ban. See [Legal & Compliance](./client/src/pages/LegalCompliance.tsx) for full details.

---

## Version History

- **v1.0.0** (2026-02-22): Initial release with core features
  - Multi-currency support (USD, CAD, OSRS GP)
  - Complete game suite
  - Admin dashboard
  - Legal compliance pages
  - Secure authentication

---

**Last Updated**: February 22, 2026
**Maintained By**: CloutScape Development Team
