# OWASP Security Implementation

## ✅ Security Measures Implemented

### 1. Input Sanitization

**Location:** `src/middleware/sanitize.js`

All user inputs are sanitized before processing:

- **Strings**: Removed dangerous characters (`<`, `>`, `javascript:`, event handlers)
- **Emails**: Validated format and sanitized
- **URLs**: Validated protocol (only http/https) and format
- **Phone Numbers**: Only digits, +, -, (, ), spaces allowed
- **Search Queries**: Sanitized with length limits (200 chars)
- **UUIDs**: Validated format
- **Integers**: Validated with min/max bounds

**Applied to:**
- Request body (`sanitizeBody` middleware)
- Query parameters (`sanitizeQuery` middleware)
- URL parameters (`sanitizeParams` middleware)

### 2. Rate Limiting

**Location:** `src/server.js`, `src/routes/auth.js`

Multiple rate limiters implemented:

- **General API**: 100 requests per 15 minutes per IP
- **Authentication endpoints** (`/register`, `/login`): 5 requests per 15 minutes per IP
- **Password reset**: 3 requests per hour per IP

**Benefits:**
- Prevents brute force attacks
- Prevents DDoS attacks
- Protects sensitive endpoints

### 3. Environment Variables (No Hardcoded Secrets)

**Location:** All service files

✅ **All API keys use environment variables:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `REDIS_URL`
- `JWT_SECRET`

**Security Check:** `src/middleware/security.js` validates that required env vars are set (development only)

### 4. Parameterized Queries (SQL Injection Prevention)

**Location:** All database queries

✅ **Supabase client uses parameterized queries automatically:**

```javascript
// Safe - Supabase handles parameterization
await supabase
  .from('agents')
  .select('*')
  .eq('user_id', req.user.id) // Parameterized
  .ilike('name', `%${search}%`); // Parameterized
```

**No raw SQL queries** - All queries go through Supabase client which prevents SQL injection.

### 5. Input Validation (Frontend + Backend)

**Location:** `src/routes/*.js`

**Joi validation schemas with strict rules:**

#### Registration (`auth.js`)
- Email: Strict format validation, max 255 chars
- Password: Min 8 chars, must contain uppercase, lowercase, and digit
- Full name: Only letters, spaces, hyphens, apostrophes
- Company name: Alphanumeric + business characters
- Phone: Only digits, +, -, (, ), spaces

#### Agent Creation (`agents.js`)
- Name: Alphanumeric, spaces, hyphens, underscores only
- Description: Max 500 chars
- Personality: Max 1000 chars
- Response delay: Integer 0-10
- Max context messages: Integer 5-50

#### Profile Update (`user.routes.js`)
- Same strict rules as registration
- URL validation for avatar (http/https only)

### 6. Security Headers

**Location:** `src/middleware/security.js`

OWASP-recommended security headers:

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - HTTPS enforcement (production)
- `Content-Security-Policy` - Restricts resource loading
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Restricts browser features

## 📋 Security Checklist

### ✅ Input Sanitization
- [x] All request bodies sanitized
- [x] All query parameters sanitized
- [x] All URL parameters sanitized
- [x] Email validation and sanitization
- [x] URL validation (http/https only)
- [x] Phone number sanitization
- [x] Search query sanitization

### ✅ Rate Limiting
- [x] General API rate limiting (100/15min)
- [x] Authentication rate limiting (5/15min)
- [x] Password reset rate limiting (3/hour)
- [x] Rate limit headers returned

### ✅ No Hardcoded Secrets
- [x] All API keys use environment variables
- [x] Development-time check for missing env vars
- [x] No secrets in code or logs

### ✅ SQL Injection Prevention
- [x] All queries use Supabase client (parameterized)
- [x] No raw SQL queries
- [x] User inputs never directly in queries

### ✅ Input Validation
- [x] Joi schemas for all endpoints
- [x] Strict pattern validation
- [x] Length limits on all inputs
- [x] Type validation (string, number, boolean)
- [x] Enum validation for restricted values

### ✅ Security Headers
- [x] X-Frame-Options
- [x] X-Content-Type-Options
- [x] X-XSS-Protection
- [x] Strict-Transport-Security (production)
- [x] Content-Security-Policy
- [x] Referrer-Policy
- [x] Permissions-Policy

## 🔒 Security Best Practices

### Environment Variables
```bash
# Never commit .env files
# Use .env.example for documentation
# Rotate keys regularly
# Use different keys for dev/staging/production
```

### Rate Limiting
- Authentication endpoints: Very strict (5/15min)
- Password reset: Very strict (3/hour)
- General API: Moderate (100/15min)
- Adjust based on usage patterns

### Input Validation
- Validate on both frontend (UX) and backend (security)
- Use strict patterns (regex)
- Set reasonable length limits
- Reject invalid inputs immediately

### Logging
- Log security events (failed auth, rate limits)
- Don't log sensitive data (passwords, tokens)
- Use structured logging

## 🚨 Security Monitoring

Monitor for:
- Rate limit violations
- Failed authentication attempts
- Invalid input patterns
- Unusual request patterns
- Missing environment variables

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
