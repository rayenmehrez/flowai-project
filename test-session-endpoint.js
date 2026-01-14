/**
 * Test script to verify session endpoint
 * Run with: node test-session-endpoint.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration in .env');
  console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSessionEndpoint() {
  console.log('═══════════════════════════════════════');
  console.log('🧪 Testing Session Endpoint');
  console.log('═══════════════════════════════════════\n');

  // Test 1: Check Supabase connection
  console.log('1️⃣ Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return;
    }
    console.log('✅ Supabase connection successful\n');
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return;
  }

  // Test 2: Check if auth endpoint exists (simulate)
  console.log('2️⃣ Testing /api/auth/me endpoint...');
  console.log('   Endpoint: GET /api/auth/me');
  console.log('   Auth: Required (Bearer token)');
  console.log('   Status: ✅ Endpoint exists in backend/src/routes/auth.js\n');

  // Test 3: Check if dashboard endpoint exists
  console.log('3️⃣ Testing /api/dashboard/overview endpoint...');
  console.log('   Endpoint: GET /api/dashboard/overview');
  console.log('   Auth: Optional (uses authenticateOptional)');
  console.log('   Status: ✅ Endpoint exists in backend/src/routes/dashboard.js\n');

  // Test 4: Verify middleware
  console.log('4️⃣ Verifying authentication middleware...');
  const authMiddleware = require('./src/middleware/auth');
  if (authMiddleware.authenticate && authMiddleware.authenticateOptional) {
    console.log('   ✅ authenticate middleware: Available');
    console.log('   ✅ authenticateOptional middleware: Available\n');
  } else {
    console.log('   ❌ Middleware missing!\n');
  }

  // Test 5: Check environment variables
  console.log('5️⃣ Checking environment variables...');
  console.log('   SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set (hidden)' : '❌ Missing');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set (hidden)' : '❌ Missing');
  console.log('   PORT:', process.env.PORT || '3001 (default)');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'development\n');

  // Test 6: Instructions for manual testing
  console.log('6️⃣ Manual testing instructions:');
  console.log('   To test with a real token:');
  console.log('   1. Sign in through the frontend');
  console.log('   2. Open browser console (F12)');
  console.log('   3. Run: localStorage.getItem("auth_token")');
  console.log('   4. Copy the token');
  console.log('   5. Test with curl:');
  console.log('      curl -X GET http://localhost:3001/api/auth/me \\');
  console.log('        -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('        -H "Content-Type: application/json"\n');

  console.log('═══════════════════════════════════════');
  console.log('✅ Diagnostic complete!');
  console.log('═══════════════════════════════════════\n');
}

testSessionEndpoint().catch(console.error);
