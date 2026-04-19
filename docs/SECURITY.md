# Security Guide - TK88 Gaming Platform

## Security Overview

This document outlines security controls, best practices, and incident response procedures for the TK88 Gaming Platform.

---

## Transport Security

### HTTPS/TLS 1.3 Enforcement

**Configuration:**
```typescript
// Express middleware
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});

// HSTS header
app.use(helmet.hsts({
  maxAge: 31536000,      // 1 year
  includeSubDomains: true,
  preload: true
}));
```

**Verification:**
```bash
# Check SSL certificate
openssl s_client -connect api.tk88.com:443

# Test TLS version
nmap --script ssl-enum-ciphers -p 443 api.tk88.com
```

---

## Authentication & Sessions

### JWT + Server-Side Sessions (Hybrid)

**Why Hybrid?**
- **JWT**: Stateless, scalable across servers
- **Sessions**: Instant revocation capability (security benefit for gaming)

**Implementation:**
```typescript
// Login: Issue JWT + store session in Redis
const token = jwt.sign(
  { userId, sessionId },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
await redis.set(`session:${sessionId}`, JSON.stringify({
  userId,
  ipAddress,
  userAgent,
  createdAt: Date.now()
}), 'EX', 86400); // 24h TTL

// Middleware: Verify JWT + check session still valid
const middleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const session = await redis.get(`session:${decoded.sessionId}`);
  if (!session) return res.status(401).json({ error: 'Session expired' });
  next();
};
```

**Revocation on Breach:**
```typescript
// Immediately delete session on suspicious activity
await redis.del(`session:${sessionId}`);
// Client must re-authenticate
```

### Multi-Factor Authentication (MFA)

**Supported Methods:**
1. **TOTP** (Google Authenticator, Authy)
2. **SMS OTP** (Twilio)
3. **Email OTP** (SES/Sendgrid)

**Implementation:**
```typescript
// Enable MFA
const secret = speakeasy.generateSecret({ name: 'TK88' });
await db.query(
  'UPDATE users SET mfa_secret=$1, mfa_enabled=true WHERE id=$2',
  [secret.base32, userId]
);

// Verify MFA token
const verified = speakeasy.totp.verify({
  secret: user.mfa_secret,
  encoding: 'base32',
  token: req.body.token,
  window: 2 // Allow ±2 time windows
});
```

---

## Authorization & Access Control

### Role-Based Access Control (RBAC)

**Roles:**
- **super_admin**: Full system access
- **admin**: User management, reports, payouts
- **moderator**: User support, dispute resolution
- **support**: Read-only user data
- **user**: Own account access only

**Implementation:**
```typescript
const authorize = (roles: string[]) => async (req, res, next) => {
  const user = await db.query('SELECT role FROM users WHERE id=$1', [req.user.id]);
  if (!roles.includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Usage
router.delete('/users/:id', authorize(['super_admin', 'admin']), deleteUser);
```

**Principle:** Least privilege - users get minimum permissions needed

---

## Data Protection

### Encryption at Rest

**PostgreSQL:**
```sql
-- Never store plaintext passwords, card numbers, SSNs
ALTER TABLE users ADD COLUMN password_hash VARCHAR;  -- Use bcryptjs

-- For highly sensitive data, use encrypted columns
CREATE EXTENSION pgcrypto;
UPDATE users SET
  phone = pgp_sym_encrypt(phone, 'my_key'),
  ssn = pgp_sym_encrypt(ssn, 'my_key')
WHERE id = $1;
```

**Sensitive Fields (Always Encrypted):**
- Passwords (bcryptjs, min 12 rounds)
- Phone numbers
- Social security numbers
- Bank account details (last 4 digits only stored)
- Cryptocurrency wallet addresses

**Redis:**
- Use AWS ElastiCache with encryption at rest
- Enable encryption in transit (TLS)

### PCI DSS Compliance (Payment Cards)

**Never Store Full Card Numbers!**

```typescript
// ❌ WRONG - Never do this
const cardNumber = req.body.cardNumber;
await db.query('INSERT INTO payments (card) VALUES ($1)', [cardNumber]);

// ✅ CORRECT - Use tokenization
const token = await stripe.createToken(cardNumber);
await db.query('INSERT INTO payments (stripe_token) VALUES ($1)', [token]);
```

---

## Input Validation

### Schema Validation (Zod)

```typescript
import { z } from 'zod';

const BetSchema = z.object({
  gameId: z.string().uuid(),
  amount: z.number().min(0.01).max(10000),
  currency: z.enum(['USD', 'EUR', 'VND'])
});

const placeBet = async (req, res) => {
  const validated = BetSchema.parse(req.body);
  // Process validated data only
};
```

**Coverage:**
- All user inputs validated before processing
- No raw request body used in queries
- Type-safe across frontend/backend (shared types)

### SQL Injection Prevention

```typescript
// ❌ WRONG - Vulnerable to SQL injection
const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ CORRECT - Parameterized query
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

**All queries use parameterized statements.**

### XSS Prevention

```typescript
// React automatically escapes JSX
<div>{userInput}</div>  // Safe - automatically escaped

// Sanitize if needed
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userHtml);

// Content Security Policy header
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:']
  }
}));
```

---

## Rate Limiting

### API Rate Limits

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 100,                     // 100 requests per window
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Stricter limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 attempts per 15 minutes
  skipSuccessfulRequests: true  // Don't count successful requests
});

app.post('/login', authLimiter, loginHandler);
```

### Game Action Rate Limiting

```typescript
// Prevent betting spam
const gameActionLimiter = async (userId, action) => {
  const key = `game_action:${userId}:${action}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 1); // Reset every second
  if (count > 10) throw new Error('Too many requests'); // 10 actions/sec
};
```

---

## Fraud Detection

### Risk Indicators

Monitor and flag:
- Multiple failed login attempts → Account lock
- Rapid geographical location changes → Velocity check
- Unusual bet patterns → Amount spike, game frequency
- Multiple accounts same IP → Device fingerprinting
- Rapid withdrawals → Amount limit check

```typescript
const detectFraud = async (userId, transaction) => {
  const riskScore = 0;

  // Check velocity
  const lastTx = await getLastTransaction(userId);
  if (Date.now() - lastTx.time < 1000) {
    riskScore += 20; // Rapid transactions
  }

  // Check amount spike
  const avgBet = await getAverageBet(userId);
  if (transaction.amount > avgBet * 10) {
    riskScore += 15;
  }

  if (riskScore > 50) {
    await flagForReview(userId, riskScore);
    // Stripe Radar also evaluates independently
  }

  return riskScore;
};
```

---

## Audit Logging

### What to Log

**Must Log:**
- All authentication events (login, logout, password change)
- All admin actions (user suspension, payout approval)
- All financial transactions (deposits, withdrawals, bets, payouts)
- All access to sensitive data
- All security events (failed validation, rate limit hits)

```typescript
const auditLog = async (action, actor, target, changes) => {
  await db.query(
    `INSERT INTO audit_logs (action, actor_id, target_id, changes, timestamp)
     VALUES ($1, $2, $3, $4, NOW())`,
    [action, actor, target, JSON.stringify(changes)]
  );
};

// Usage
await auditLog('user_suspended', adminId, userId, { reason: 'duplicate account' });
```

### Audit Log Protection

```sql
-- Immutable audit logs (append-only)
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR NOT NULL,
  actor_id UUID NOT NULL,
  target_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Prevent deletion/updates
CREATE POLICY audit_immutable ON audit_logs
  FOR ALL
  USING (false);
```

---

## Third-Party Security

### Stripe Webhook Verification

```typescript
const verifyStripeSignature = (body, signature, secret) => {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    throw new Error('Invalid webhook signature');
  }
};

// Always verify; never trust webhook data without signature check
```

### Dependency Management

```bash
# Audit dependencies for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Regularly update
npm update

# CI/CD should block on high/critical vulnerabilities
```

---

## Compliance

### GDPR (If applicable)

**User Rights:**
- Right to access their data
- Right to be forgotten (delete account + data)
- Data portability (export data)
- Right to restrict processing

```typescript
// GDPR: Delete user data
const deleteUser = async (userId) => {
  // 1. Anonymize in audit logs
  // 2. Delete PII (name, email, phone, address)
  // 3. Retain financial records for compliance (legally required)
  // 4. Notify user
};
```

### AML/KYC (Anti-Money Laundering / Know Your Customer)

**Required for regulated markets:**
- Collect user identity documents (government ID)
- Verify against sanctions lists (OFAC)
- Monitor for suspicious patterns
- File Suspicious Activity Reports (SARs) if needed

```typescript
const kyc = {
  name: string;
  dateOfBirth: string;
  address: string;
  governmentId: string;  // Encrypted
  verificationStatus: 'pending' | 'approved' | 'rejected';
};

const checkOFAC = async (name) => {
  const response = await fetch('https://api.ofac.treas.gov/search', {
    body: { name }
  });
  return response.matched;
};
```

---

## Incident Response

### Suspected Breach

1. **Immediate**: Revoke all sessions (delete Redis keys)
   ```bash
   redis-cli KEYS "session:*" | xargs redis-cli DEL
   ```

2. **Within 1 hour**: Reset JWT secrets
   ```bash
   # Generate new secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Update environment variable
   # Restart services
   ```

3. **Within 24 hours**: Notify affected users

4. **Investigation**: Review audit logs for unauthorized access

### DoS Attack

```typescript
// AWS WAF / CloudFlare DDoS protection (handled at infrastructure level)

// Backend mitigation:
const rateLimit = rateLimit({
  windowMs: 60000,
  max: 1000,
  // Fail-safe: return 429 Too Many Requests
});
```

---

## Security Checklist

- [ ] TLS 1.3 enabled on all endpoints
- [ ] HTTPS redirect enforced (production)
- [ ] HSTS headers configured
- [ ] CORS whitelist configured
- [ ] CSP headers set
- [ ] Rate limiting active on all endpoints
- [ ] Input validation (Zod) on all user inputs
- [ ] Password hashing (bcryptjs, 12 rounds minimum)
- [ ] Sensitive data encrypted (PII, card data)
- [ ] No secrets in logs
- [ ] No secrets in git history (check with `git log -p`)
- [ ] Audit logging for all sensitive actions
- [ ] MFA enabled for admin accounts
- [ ] Regular dependency audits (`npm audit`)
- [ ] Security headers set (helmet.js)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (CSP, sanitization)
- [ ] CSRF protection if applicable
- [ ] Session management (Redis + JWT hybrid)
- [ ] Error handling doesn't leak sensitive info
- [ ] Database backups encrypted
- [ ] Monitoring/alerting active
- [ ] Incident response plan documented

---

## Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **CWE/SANS**: https://cwe.mitre.org/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework/
- **PCI DSS**: https://www.pcisecuritystandards.org/
- **GDPR**: https://gdpr-info.eu/

---

**Last Updated**: April 2026 | **Maintained by**: Security Team
