# Cloudflare Configuration and Fallback Strategy

This document outlines the Cloudflare setup for the CloutxMi gambling platform, including multiple fallbacks and comprehensive error handling to ensure maximum uptime and reliability.

## 1. Cloudflare Setup Overview

Cloudflare provides a global content delivery network (CDN), DDoS protection, and advanced security features that are critical for a gambling platform. The configuration includes load balancing, automatic failover, and intelligent routing to multiple origin servers.

## 2. Load Balancing Configuration

### Primary and Secondary Origins

The platform is configured with multiple origin servers to distribute traffic and provide redundancy:

```
Primary Origin:   origin-1.cloutxmi.com (us-east-1)
Secondary Origin: origin-2.cloutxmi.com (eu-west-1)
Tertiary Origin:  origin-3.cloutxmi.com (ap-southeast-1)
```

### Load Balancing Rules

Traffic is distributed based on geographic location and server health:

```
Rule 1: If origin-1 is healthy → route 50% of traffic
Rule 2: If origin-2 is healthy → route 30% of traffic
Rule 3: If origin-3 is healthy → route 20% of traffic
Rule 4: If origin-1 fails → failover to origin-2
Rule 5: If origin-2 fails → failover to origin-3
```

## 3. Health Check Configuration

Cloudflare continuously monitors the health of origin servers:

```json
{
  "health_checks": {
    "interval": 30,
    "timeout": 5,
    "retries": 2,
    "path": "/api/health",
    "expected_codes": "200",
    "type": "HTTPS"
  }
}
```

### Health Check Endpoint

The platform exposes a health check endpoint that returns the status of critical services:

```typescript
// /server/_core/healthCheck.ts
export const healthCheckRouter = router({
  check: publicProcedure.query(async () => {
    const dbHealth = await checkDatabaseHealth();
    const cacheHealth = await checkCacheHealth();
    const externalApiHealth = await checkExternalApiHealth();

    const allHealthy = dbHealth && cacheHealth && externalApiHealth;
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      database: dbHealth,
      cache: cacheHealth,
      externalApi: externalApiHealth,
      timestamp: new Date().toISOString(),
    };
  }),
});
```

## 4. Failover Strategy

### Automatic Failover

When a primary origin becomes unhealthy, Cloudflare automatically routes traffic to a healthy secondary origin:

1. **Detection:** Health check fails for 2 consecutive attempts
2. **Notification:** Alert sent to operations team
3. **Failover:** Traffic redirected to secondary origin
4. **Recovery:** Once primary recovers, traffic gradually shifted back

### Manual Failover

Operations team can manually trigger failover through the Cloudflare dashboard or API:

```bash
# Example: Disable origin-1 and route all traffic to origin-2
curl -X PATCH https://api.cloudflare.com/client/v4/zones/{zone_id}/load_balancers/{lb_id} \
  -H "Authorization: Bearer {token}" \
  -d '{"disabled_origins": ["origin-1"]}'
```

## 5. DDoS Protection

Cloudflare's DDoS protection is configured with the following rules:

### Rate Limiting

```json
{
  "rate_limiting_rules": [
    {
      "threshold": 100,
      "period": 10,
      "action": "challenge"
    },
    {
      "threshold": 1000,
      "period": 60,
      "action": "block"
    }
  ]
}
```

### Bot Management

Cloudflare Bot Management identifies and mitigates malicious bot traffic:

```json
{
  "bot_management": {
    "enabled": true,
    "fight_mode": true,
    "super_bot_fight_mode": {
      "definitely_automated": "block",
      "likely_automated": "challenge",
      "verified_bots": "allow"
    }
  }
}
```

## 6. Web Application Firewall (WAF)

The WAF protects against common web vulnerabilities:

### OWASP Top 10 Protection

```json
{
  "waf_rules": [
    {
      "name": "SQL Injection",
      "action": "block"
    },
    {
      "name": "Cross-Site Scripting (XSS)",
      "action": "block"
    },
    {
      "name": "Cross-Site Request Forgery (CSRF)",
      "action": "challenge"
    }
  ]
}
```

### Custom Rules

```json
{
  "custom_rules": [
    {
      "expression": "(cf.bot_management.score < 30) and (cf.threat_score > 50)",
      "action": "block",
      "description": "Block suspicious bot traffic"
    }
  ]
}
```

## 7. Error Handling and Custom Error Pages

### Custom Error Pages

Cloudflare serves custom error pages for various HTTP status codes:

- **502 Bad Gateway:** "We're experiencing technical difficulties. Please try again in a few moments."
- **503 Service Unavailable:** "Our platform is temporarily under maintenance. We'll be back shortly."
- **504 Gateway Timeout:** "The request took too long to process. Please refresh the page."

### Error Page HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>CloutxMi - Service Error</title>
  <style>
    body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; }
    .container { max-width: 600px; margin: 100px auto; text-align: center; }
    .logo { font-size: 48px; margin-bottom: 20px; }
    h1 { color: #d4af37; }
    p { font-size: 16px; line-height: 1.6; }
    .retry-btn { background: #d4af37; color: #000; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">♠ CloutxMi ♠</div>
    <h1>Oops! Something Went Wrong</h1>
    <p>We're experiencing temporary technical difficulties. Our team is working to resolve this issue.</p>
    <button class="retry-btn" onclick="location.reload()">Retry</button>
  </div>
</body>
</html>
```

## 8. Caching Strategy

### Cache Rules

Cloudflare caches static assets and API responses based on the following rules:

```json
{
  "cache_rules": [
    {
      "path": "/api/static/*",
      "cache_ttl": 3600,
      "cache_level": "cache_everything"
    },
    {
      "path": "/api/user/*",
      "cache_ttl": 0,
      "cache_level": "bypass"
    }
  ]
}
```

### Cache Purging

When content is updated, the cache is purged to ensure users receive the latest version:

```typescript
// Purge cache after game update
async function purgeGameCache(gameId: string) {
  await fetch('https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CLOUDFLARE_TOKEN}` },
    body: JSON.stringify({
      files: [`https://cloutxmi.com/api/games/${gameId}`]
    })
  });
}
```

## 9. Monitoring and Alerting

### Real-Time Monitoring

Cloudflare provides real-time analytics and monitoring:

- **Traffic Overview:** View requests, bandwidth, and unique visitors
- **Security Events:** Monitor blocked requests and DDoS attacks
- **Performance Metrics:** Track page load times and cache hit rates
- **Error Rates:** Monitor 4xx and 5xx error trends

### Alert Configuration

```json
{
  "alerts": [
    {
      "type": "high_error_rate",
      "threshold": 5,
      "period": 5,
      "action": "email"
    },
    {
      "type": "ddos_attack",
      "threshold": 10000,
      "period": 1,
      "action": "email_and_sms"
    }
  ]
}
```

## 10. Disaster Recovery Plan

### Recovery Time Objective (RTO)

- **Primary Failure:** < 1 minute (automatic failover)
- **Regional Failure:** < 5 minutes (manual intervention)
- **Complete Outage:** < 30 minutes (backup infrastructure activation)

### Recovery Point Objective (RPO)

- **Database:** < 1 minute (continuous replication)
- **User Sessions:** < 5 minutes (session store replication)
- **Static Assets:** < 1 hour (CDN cache)

### Backup and Restore Procedures

```bash
# Backup database to S3
mysqldump -u root -p cloutxmi | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
aws s3 cp backup_*.sql.gz s3://cloutxmi-backups/

# Restore database from backup
aws s3 cp s3://cloutxmi-backups/backup_20240101_120000.sql.gz .
gunzip backup_20240101_120000.sql.gz
mysql -u root -p cloutxmi < backup_20240101_120000.sql
```

## 11. Implementation Checklist

- [ ] Configure primary, secondary, and tertiary origins
- [ ] Set up health check endpoints on all origins
- [ ] Enable load balancing with failover rules
- [ ] Configure DDoS protection and Bot Management
- [ ] Deploy WAF rules for OWASP Top 10
- [ ] Create custom error pages
- [ ] Set up cache rules and purging
- [ ] Configure monitoring and alerts
- [ ] Document disaster recovery procedures
- [ ] Test failover scenarios
- [ ] Train operations team on Cloudflare management

## 12. Maintenance and Updates

Regular maintenance ensures the platform remains secure and performant:

- **Weekly:** Review security logs and DDoS events
- **Monthly:** Analyze performance metrics and optimize cache rules
- **Quarterly:** Update WAF rules and security policies
- **Annually:** Conduct disaster recovery drills and update procedures
