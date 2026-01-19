#!/bin/bash
# Delete auth-related files (safe - keeps UI)

rm -f app/api/auth/session/route.ts
rm -rf app/auth/
rm -f app/login/page.tsx
rm -f app/signup/page.tsx
rm -f app/dashboard/layout.tsx
rm -f app/profile/layout.tsx
rm -f components/register-page.tsx
rm -f components/FeatureGate.tsx
rm -f components/PermissionGate.tsx
rm -f components/RoleGate.tsx
rm -f lib/auth-context.tsx
rm -f lib/supabase.ts
rm -f hooks/userPermissions.ts
rm -f proxy.ts

echo "✅ Auth files deleted! UI preserved!"
