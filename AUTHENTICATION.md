# Authentication System Documentation

## Overview

The FlowAI backend uses **JWT token verification only**. Authentication (signup/login) is handled directly by Supabase on the frontend. The backend's role is limited to:

1. **Token Verification**: Validating JWT tokens from Supabase for protected routes
2. **User Profile Management**: Creating and updating user profiles after authentication

## Authentication Flow

```
Frontend → Supabase Auth (signup/login) → JWT Token
    ↓
Frontend → Backend API (with JWT in Authorization header)
    ↓
Backend → Verify JWT with Supabase → Allow/Deny Request
```

## Backend Endpoints

### Public Endpoints (No Authentication Required)

- `POST /api/auth/register` - Register new user (creates user in Supabase)
- `POST /api/auth/login` - Login user (authenticates with Supabase)
- `POST /api/auth/forgot-password` - Send password reset email
- `GET /api/auth/session` - Get current session (reads token from cookie/header)

### Protected Endpoints (Authentication Required)

All other endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/agents` - List user's agents
- `POST /api/agents` - Create new agent
- ... (all other protected routes)

## Middleware

### `authenticate` (Required)

Located in `src/middleware/auth.js`:

- Extracts JWT token from `Authorization: Bearer <token>` header
- Verifies token with Supabase using `supabase.auth.getUser(token)`
- Attaches user data to `req.user` if valid
- Returns 401 if token is missing or invalid

### `authenticateOptional` (Optional)

- Same as `authenticate` but doesn't return 401 if token is missing
- Useful for routes that can work with or without authentication
- Sets `req.user = null` if no valid token

## Token Sources

The backend accepts tokens from:

1. **Authorization Header** (primary method):
   ```
   Authorization: Bearer <jwt-token>
   ```

2. **Cookie** (for `/api/auth/session` endpoint):
   ```
   Cookie: auth-token=<jwt-token>
   ```

## OAuth Providers

**OAuth is NOT handled by the backend.**

- OAuth providers (Google, GitHub, etc.) are configured in Supabase Dashboard
- Frontend handles OAuth flow directly with Supabase
- After OAuth, Supabase returns a JWT token
- Backend verifies the JWT token (same as email/password flow)

## Environment Variables

Required in `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

## Security Notes

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to frontend
2. **Service role key** is only used in backend for admin operations
3. **Anon key** can be used in frontend (RLS policies protect data)
4. **JWT tokens** are stateless and verified on each request
5. **No session storage** - tokens are validated with Supabase each time

## Migration from OAuth Backend Routes

Previously, the backend had OAuth routes (`/api/auth/google`, `/api/auth/google/callback`). These have been removed because:

- OAuth is handled entirely by Supabase
- Backend doesn't need to manage OAuth flows
- Simpler architecture: Frontend → Supabase → JWT → Backend

If you need OAuth:
1. Configure provider in Supabase Dashboard → Authentication → Providers
2. Frontend calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Supabase handles the OAuth flow
4. Frontend receives JWT token
5. Frontend sends JWT to backend in `Authorization` header
6. Backend verifies JWT (same as email/password)
