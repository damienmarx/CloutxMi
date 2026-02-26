# 🔒 Security & Infrastructure Guide

## Environment Variables (.env.local)

Create a `.env.local` file in the root directory with the following secure variables:

```env
# Database
DATABASE_URL=mysql://username:password@host:3306/cloutscape

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
SESSION_SECRET=your-super-secret-session-key-min-32-chars-long

# Crypto & Payments
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
COINBASE_API_KEY=xxxxx
COINBASE_WEBHOOK_SECRET=xxxxx

# OSRS Mule Trading
OSRS_MULE_ACCOUNTS=mule1:password1,mule2:password2,mule3:password3
OSRS_WEBHOOK_SECRET=xxxxx

# Email & Notifications
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@cloutscape.dev

# Security
CORS_ORIGINS=https://cloutscape.org,https://www.cloutscape.org
NODE_ENV=production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Admin
ADMIN_EMAIL=admin@cloutscape.dev
ADMIN_PHONE=+1-xxx-xxx-xxxx
```

## 🔐 Security Checklist

### Backend Security
- [ ] All passwords hashed with PBKDF2 (100,000 iterations)
- [ ] HTTPS/TLS enabled on all endpoints
- [ ] CORS configured to specific origins only
- [ ] Rate limiting enabled (100 requests per 15 minutes)
- [ ] SQL injection prevention via parameterized queries
- [ ] CSRF tokens on all state-changing operations
- [ ] Input validation on all endpoints
- [ ] Output encoding to prevent XSS
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)

### Database Security
- [ ] MySQL user has minimal required permissions
- [ ] Database connections use SSL/TLS
- [ ] Regular backups scheduled (daily)
- [ ] Backups encrypted and stored securely
- [ ] Database logs monitored for suspicious activity
- [ ] Sensitive data encrypted at rest

### Crypto & Wallet Security
- [ ] Private keys never stored in code or logs
- [ ] Cryptocurrency wallets use hardware security modules (HSM)
- [ ] Multi-signature wallets for large balances
- [ ] Cold storage for 95% of funds
- [ ] Hot wallet monitored for suspicious activity
- [ ] Withdrawal limits enforced
- [ ] 2FA required for withdrawals over $1,000

### Infrastructure Security
- [ ] Firewall configured to allow only necessary ports
- [ ] SSH access restricted to specific IPs
- [ ] SSH keys rotated every 90 days
- [ ] DDoS protection enabled (Cloudflare)
- [ ] WAF (Web Application Firewall) enabled
- [ ] Intrusion detection system (IDS) monitoring
- [ ] Regular security audits scheduled

### API Security
- [ ] API keys rotated every 30 days
- [ ] API endpoints require authentication
- [ ] API rate limiting enforced
- [ ] API responses don't leak sensitive information
- [ ] API versioning implemented
- [ ] Deprecated API endpoints removed

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] SSL certificates installed and valid
- [ ] Backups created and tested
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

### Deployment
- [ ] Code reviewed by at least 2 developers
- [ ] All tests passing (100% coverage)
- [ ] No console errors or warnings
- [ ] Performance benchmarks met
- [ ] Monitoring and alerting configured
- [ ] Rollback plan prepared

### Post-Deployment
- [ ] Monitor error logs for 24 hours
- [ ] Monitor performance metrics
- [ ] User feedback monitored
- [ ] Security logs reviewed
- [ ] Database integrity verified

---

## 🛡️ Incident Response Plan

### Security Breach
1. **Immediate**: Take affected systems offline
2. **Investigation**: Determine scope and impact
3. **Notification**: Notify affected users within 24 hours
4. **Remediation**: Fix vulnerability and patch systems
5. **Recovery**: Restore systems from backups
6. **Review**: Post-incident analysis and improvements

### DDoS Attack
1. **Detection**: Automated alerts trigger
2. **Mitigation**: Enable DDoS protection (Cloudflare)
3. **Monitoring**: Track attack patterns
4. **Communication**: Notify users of service status
5. **Analysis**: Review logs after attack ends

### Data Loss
1. **Detection**: Automated backup verification alerts
2. **Recovery**: Restore from most recent backup
3. **Verification**: Verify data integrity
4. **Communication**: Notify users of recovery
5. **Prevention**: Review backup procedures

---

## 📊 Monitoring & Logging

### Metrics to Monitor
- Request latency (target: <200ms)
- Error rate (target: <0.1%)
- Database query time (target: <100ms)
- CPU usage (alert if >80%)
- Memory usage (alert if >85%)
- Disk usage (alert if >90%)
- Network bandwidth (alert if >80%)

### Logs to Review
- Authentication attempts (failed logins)
- API errors and exceptions
- Database errors
- Security events (suspicious activity)
- User reports and complaints

### Alerting
- Email alerts for critical errors
- SMS alerts for security incidents
- Slack notifications for performance issues
- PagerDuty for on-call escalation

---

## 🔄 Backup & Disaster Recovery

### Backup Strategy
- **Frequency**: Daily full backups, hourly incremental backups
- **Retention**: 30 days of daily backups, 12 months of weekly backups
- **Location**: Geographically distributed (3 locations minimum)
- **Encryption**: AES-256 encryption for all backups
- **Testing**: Weekly restore tests from backups

### Recovery Time Objectives (RTO)
- Critical systems: 1 hour
- Important systems: 4 hours
- Non-critical systems: 24 hours

### Recovery Point Objectives (RPO)
- Critical data: 1 hour
- Important data: 4 hours
- Non-critical data: 24 hours

---

## 🔑 Access Control

### Role-Based Access Control (RBAC)
- **Admin**: Full system access
- **Moderator**: User management, dispute resolution
- **Support**: View user data, process withdrawals
- **Analyst**: View logs and reports
- **User**: Personal account access only

### Authentication
- Multi-factor authentication (MFA) required for admins
- Password minimum 12 characters with complexity
- Session timeout after 30 minutes of inactivity
- IP whitelist for admin accounts

### Audit Trail
- All admin actions logged
- User login/logout logged
- Sensitive data access logged
- Financial transactions logged
- Logs retained for 2 years

---

## 📋 Compliance

### Regulatory Compliance
- GDPR compliance for EU users
- CCPA compliance for California users
- AML/KYC procedures implemented
- Responsible gambling requirements met
- Age verification enforced

### Regular Audits
- Security audit: Quarterly
- Compliance audit: Annually
- Penetration testing: Annually
- Code review: Every deployment

---

## 📞 Security Contact

For security issues, please email: **security@cloutscape.dev**

**Do not disclose security vulnerabilities publicly.**

---

**Last Updated**: February 18, 2026
**Version**: 1.0
