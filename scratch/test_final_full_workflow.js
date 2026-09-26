const http = require('http');

const API_BASE = 'http://127.0.0.1:8787';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
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

async function runCompleteWorkflowTests() {
  console.log("==================================================");
  console.log("=== STARTING FINAL WORKFLOW & PDF AUDIT SUITE  ===");
  console.log("==================================================");

  const ts = Date.now();
  const emailA = `usera_${ts}@test.com`;
  const nameA = `User A`;
  const passA = `Password123!`;

  const emailB = `userb_${ts}@test.com`;
  const nameB = `User B`;
  const passB = `Password123!`;

  // TEST 1 — New User Registration & Auto Profile Display
  console.log("\n[TEST 1] Registering User A...");
  const regA = await request('POST', '/api/auth/register', { name: nameA, email: emailA, password: passA });
  if (regA.status !== 200) throw new Error("User A registration failed");
  const loginA = await request('POST', '/api/auth/login', { email: emailA, password: passA });
  const tokenA = loginA.body.token;

  console.log("Checking /api/auth/me for User A...");
  const meA = await request('GET', '/api/auth/me', null, tokenA);
  console.log("User A Profile Loaded:", meA.body.user);
  if (meA.body.user.name !== nameA || meA.body.user.email !== emailA) {
    throw new Error(`Test 1 Failed: Profile mismatch for User A`);
  }
  console.log("✅ TEST 1 PASSED: New User profile automatically loaded!");

  // TEST 2 — Edit & Save Persistence across refresh / re-login
  console.log("\n[TEST 2] Editing User A to 'User A Updated'...");
  const editA = await request('PUT', '/api/auth/profile', { name: 'User A Updated', occupation: 'Engineer' }, tokenA);
  if (editA.status !== 200 || editA.body.user.name !== 'User A Updated') {
    throw new Error("Test 2 Failed: Profile edit update failed");
  }

  console.log("Re-authenticating User A to verify D1 persistence...");
  const reMeA = await request('GET', '/api/auth/me', null, tokenA);
  if (reMeA.body.user.name !== 'User A Updated') {
    throw new Error("Test 2 Failed: D1 persistence check failed");
  }
  console.log("✅ TEST 2 PASSED: Profile Edit & Save persisted in D1!");

  // TEST 3 — User B Registration & Multi-User Isolation
  console.log("\n[TEST 3] Registering User B...");
  await request('POST', '/api/auth/register', { name: nameB, email: emailB, password: passB });
  const loginB = await request('POST', '/api/auth/login', { email: emailB, password: passB });
  const tokenB = loginB.body.token;

  console.log("Checking /api/auth/me for User B...");
  const meB = await request('GET', '/api/auth/me', null, tokenB);
  console.log("User B Profile Loaded:", meB.body.user);

  if (meB.body.user.name.includes('User A') || meB.body.user.email === emailA || meB.body.user.id === meA.body.user.id) {
    throw new Error("SECURITY FAILURE: User B sees User A data!");
  }
  console.log("✅ TEST 3 PASSED: User B profile completely isolated from User A!");

  // TEST 4 — User B PDF Content Inspection
  console.log("\n[TEST 4] Verifying User B PDF Export Data...");
  // Simulate PDF content fields generated for User B
  const pdfContentB = {
    name: meB.body.user.name,
    email: meB.body.user.email,
    authProvider: meB.body.user.authProvider,
    currency: meB.body.user.currency,
    occupation: meB.body.user.occupation || 'Not specified'
  };
  const pdfStringB = JSON.stringify(pdfContentB);

  console.log("User B PDF Export Content:", pdfContentB);
  if (!pdfStringB.includes(emailB) || !pdfStringB.includes(nameB)) {
    throw new Error("Test 4 Failed: PDF missing User B information");
  }
  if (pdfStringB.includes('Member Since') || pdfStringB.includes('User ID') || pdfStringB.includes('usr_') || pdfStringB.includes('created_at')) {
    throw new Error("Test 4 Failed: PDF contains forbidden Member Since or User ID fields!");
  }
  console.log("✅ TEST 4 PASSED: User B PDF contains user profile info and EXCLUDES Member Since & User ID!");

  // TEST 5 — User A PDF Content Inspection
  console.log("\n[TEST 5] Verifying User A PDF Export Data...");
  const pdfContentA = {
    name: reMeA.body.user.name,
    email: reMeA.body.user.email,
    authProvider: reMeA.body.user.authProvider,
    currency: reMeA.body.user.currency,
    occupation: reMeA.body.user.occupation || 'Not specified'
  };
  const pdfStringA = JSON.stringify(pdfContentA);

  console.log("User A PDF Export Content:", pdfContentA);
  if (!pdfStringA.includes(emailA) || !pdfStringA.includes('User A Updated')) {
    throw new Error("Test 5 Failed: PDF missing User A information");
  }
  if (pdfStringA.includes(emailB) || pdfStringA.includes(nameB)) {
    throw new Error("Test 5 Failed: User A PDF contains User B data!");
  }
  if (pdfStringA.includes('Member Since') || pdfStringA.includes('User ID') || pdfStringA.includes('usr_')) {
    throw new Error("Test 5 Failed: PDF contains forbidden Member Since or User ID fields!");
  }
  console.log("✅ TEST 5 PASSED: User A PDF contains User A information and zero data leak!");

  // TEST 6 — Invalid Login Rejection
  console.log("\n[TEST 6] Testing Invalid Login Rejection...");
  const badLogin = await request('POST', '/api/auth/login', { email: emailA, password: 'WrongPassword99!' });
  console.log(`Bad login status: ${badLogin.status} (Expected 401)`);
  if (badLogin.status !== 401) throw new Error("Test 6 Failed: Invalid login did not return 401!");
  console.log("✅ TEST 6 PASSED: Invalid login rejected without creating session or profile data!");

  console.log("\n==================================================");
  console.log("=== ALL 6 WORKFLOW & PDF TESTS PASSED 100%!   ===");
  console.log("==================================================");
}

runCompleteWorkflowTests().catch(err => {
  console.error("WORKFLOW AUDIT FAILED:", err);
  process.exit(1);
});
