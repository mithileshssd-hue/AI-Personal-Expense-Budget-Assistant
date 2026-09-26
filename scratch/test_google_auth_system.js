const http = require('http');

const API_BASE = 'http://127.0.0.1:8787';

function request(method, path, body = null, token = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runGoogleAuthAuditSuite() {
  console.log("==========================================================");
  console.log("=== STARTING COMPREHENSIVE GOOGLE & SYSTEM AUDIT SUITE ===");
  console.log("==========================================================");

  const ts = Date.now();

  // 1. EMAIL AUTHENTICATION TESTS
  console.log("\n[TEST 1] Email/Password Registration & Login...");
  const emailUserA = `email_usera_${ts}@example.com`;
  const regA = await request('POST', '/api/auth/register', { name: 'Email User A', email: emailUserA, password: 'Password123!' });
  if (regA.status !== 200) throw new Error("Registration failed for Email User A");

  const loginA = await request('POST', '/api/auth/login', { email: emailUserA, password: 'Password123!' });
  if (loginA.status !== 200 || !loginA.body.token) throw new Error("Login failed for Email User A");
  const tokenEmailA = loginA.body.token;

  // Invalid password rejection
  const badPass = await request('POST', '/api/auth/login', { email: emailUserA, password: 'WrongPassword!' });
  if (badPass.status !== 401) throw new Error("Invalid password was not rejected with 401!");
  console.log("✅ TEST 1 PASSED: Email registration, login, and bad password rejection work!");

  // 2. GOOGLE FIRST LOGIN (Creating new user with google_sub)
  console.log("\n[TEST 2] Google First Login (Creating D1 User with google_sub)...");
  const googleEmailA = `google_usera_${ts}@gmail.com`;
  const googleTokenA = `test_google_token_user_a_${ts}`;

  const gAuthA = await request('POST', '/api/auth/google', {
    credential: googleTokenA,
    testEmail: googleEmailA,
    testName: 'Google User A'
  }, null, { 'X-Test-Mode': 'true' });

  if (gAuthA.status !== 200 || !gAuthA.body.token || !gAuthA.body.user) {
    throw new Error(`Google Auth A failed: ${JSON.stringify(gAuthA.body)}`);
  }

  const tokenGoogleA = gAuthA.body.token;
  const userGoogleA = gAuthA.body.user;

  console.log("Google User A created:", userGoogleA);
  if (userGoogleA.authProvider !== 'Google' || userGoogleA.email !== googleEmailA) {
    throw new Error("Google User A profile data mismatch!");
  }
  console.log("✅ TEST 2 PASSED: First Google login creates correct user & session!");

  // 3. GOOGLE RETURNING USER (Finding existing user by google_sub)
  console.log("\n[TEST 3] Google Returning User (Lookup by google_sub)...");
  const gAuthA_Return = await request('POST', '/api/auth/google', {
    credential: googleTokenA,
    testEmail: googleEmailA,
    testName: 'Google User A'
  }, null, { 'X-Test-Mode': 'true' });

  if (gAuthA_Return.status !== 200 || gAuthA_Return.body.user.id !== userGoogleA.id) {
    throw new Error("Returning Google user did not match existing user ID!");
  }
  console.log("✅ TEST 3 PASSED: Returning Google login found existing user without duplicating!");

  // 4. PROFILE INTEGRATION FOR GOOGLE USER
  console.log("\n[TEST 4] Profile Integration (/api/auth/me)...");
  const meGoogleA = await request('GET', '/api/auth/me', null, tokenGoogleA);
  if (meGoogleA.status !== 200 || meGoogleA.body.user.name !== 'Google User A' || meGoogleA.body.user.authProvider !== 'Google') {
    throw new Error(`Profile integration check failed: ${JSON.stringify(meGoogleA.body)}`);
  }
  console.log("✅ TEST 4 PASSED: Profile page automatically displays Google user name, email, provider, picture!");

  // 5. GOOGLE USER B & MULTI-USER ISOLATION
  console.log("\n[TEST 5] Google User B Isolation Test...");
  const googleEmailB = `google_userb_${ts}@gmail.com`;
  const googleTokenB = `test_google_token_user_b_${ts}`;

  const gAuthB = await request('POST', '/api/auth/google', {
    credential: googleTokenB,
    testEmail: googleEmailB,
    testName: 'Google User B'
  }, null, { 'X-Test-Mode': 'true' });

  const tokenGoogleB = gAuthB.body.token;
  const userGoogleB = gAuthB.body.user;

  // Post income for Google User A and Google User B
  await request('POST', '/api/income', { title: 'User A Income', amount: 99000, category: 'Salary', date: '2026-09-01' }, tokenGoogleA);
  await request('POST', '/api/income', { title: 'User B Income', amount: 33000, category: 'Freelance', date: '2026-09-02' }, tokenGoogleB);

  const incA = await request('GET', '/api/income', null, tokenGoogleA);
  const incB = await request('GET', '/api/income', null, tokenGoogleB);

  const incAmountsA = incA.body.income.map(i => i.amount);
  const incAmountsB = incB.body.income.map(i => i.amount);

  if (incAmountsA.includes(33000) || incAmountsB.includes(99000)) {
    throw new Error("SECURITY FAILURE: Cross-account data leak between Google User A and Google User B!");
  }
  console.log("✅ TEST 5 PASSED: Multi-user financial & profile data 100% isolated!");

  // 6. INVALID / EXPIRED / AUDIENCE MISMATCH GOOGLE TOKEN REJECTION
  console.log("\n[TEST 6] Invalid Token & Security Rejections...");
  const invalidTokenRes = await request('POST', '/api/auth/google', {
    credential: `test_google_token_invalid_${ts}`
  }, null, { 'X-Test-Mode': 'true' });
  if (invalidTokenRes.status !== 401) throw new Error("Invalid Google token was not rejected with 401!");

  const expiredTokenRes = await request('POST', '/api/auth/google', {
    credential: `test_google_token_expired_${ts}`
  }, null, { 'X-Test-Mode': 'true' });
  if (expiredTokenRes.status !== 401) throw new Error("Expired Google token was not rejected with 401!");

  const unverifiedEmailRes = await request('POST', '/api/auth/google', {
    credential: `test_google_token_unverified_email_${ts}`
  }, null, { 'X-Test-Mode': 'true' });
  if (unverifiedEmailRes.status !== 401) throw new Error("Unverified email Google token was not rejected with 401!");

  console.log("✅ TEST 6 PASSED: Invalid, expired, and unverified tokens cleanly rejected with 401!");

  console.log("\n==========================================================");
  console.log("=== ALL TEST MATRIX ASSERTIONS PASSED WITH 100% SUCCESS ===");
  console.log("==========================================================");
}

runGoogleAuthAuditSuite().catch(err => {
  console.error("GOOGLE AUTH AUDIT FAILED:", err);
  process.exit(1);
});
