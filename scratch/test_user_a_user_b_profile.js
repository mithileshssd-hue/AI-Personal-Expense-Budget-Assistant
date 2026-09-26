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

async function runUserAUserBProfileTest() {
  console.log("=== STARTING USER A / USER B PROFILE PERSISTENCE & ISOLATION TEST ===");

  const emailA = `usera@test.com`;
  const nameA = `User A`;
  const passwordA = `Password123!`;

  const emailB = `userb@test.com`;
  const nameB = `User B`;
  const passwordB = `Password123!`;

  // Register User A if not exists
  console.log("1. Registering/Logging in User A...");
  await request('POST', '/api/auth/register', { name: nameA, email: emailA, password: passwordA });
  const loginA = await request('POST', '/api/auth/login', { email: emailA, password: passwordA });
  const tokenA = loginA.body.token;

  // Verify User A profile
  console.log("2. Verifying User A Profile from GET /api/auth/me...");
  const meA = await request('GET', '/api/auth/me', null, tokenA);
  console.log("User A Profile:", meA.body.user);
  if (meA.body.user.email !== emailA) throw new Error(`User A email mismatch! Expected ${emailA}, got ${meA.body.user.email}`);

  // Edit User A name to User A Updated
  console.log("3. Editing User A name to 'User A Updated'...");
  const editA = await request('PUT', '/api/auth/profile', { name: 'User A Updated', occupation: 'Engineer' }, tokenA);
  console.log("User A edit status:", editA.status, editA.body.user);
  if (editA.status !== 200 || editA.body.user.name !== 'User A Updated') {
    throw new Error("Failed to update User A profile");
  }

  // Register / Login User B
  console.log("\n4. Registering/Logging in User B...");
  await request('POST', '/api/auth/register', { name: nameB, email: emailB, password: passwordB });
  const loginB = await request('POST', '/api/auth/login', { email: emailB, password: passwordB });
  const tokenB = loginB.body.token;

  // Verify User B profile
  console.log("5. Verifying User B Profile from GET /api/auth/me...");
  const meB = await request('GET', '/api/auth/me', null, tokenB);
  console.log("User B Profile:", meB.body.user);

  // Assert User B MUST NOT see User A's data
  if (meB.body.user.name.includes('User A') || meB.body.user.email === emailA || meB.body.user.id === meA.body.user.id) {
    throw new Error("SECURITY FAILURE: User B can see User A's profile data!");
  }
  console.log("✅ User B profile isolation verified! User B does NOT see User A data.");

  // Edit User B profile
  console.log("6. Editing User B profile to 'User B Updated'...");
  const editB = await request('PUT', '/api/auth/profile', { name: 'User B Updated', occupation: 'Designer' }, tokenB);
  console.log("User B edit status:", editB.status, editB.body.user);

  // Re-verify User A upon fresh login
  console.log("\n7. Re-authenticating as User A...");
  const reLoginA = await request('POST', '/api/auth/login', { email: emailA, password: passwordA });
  const reMeA = await request('GET', '/api/auth/me', null, reLoginA.body.token);
  console.log("User A Profile after re-login:", reMeA.body.user);

  if (reMeA.body.user.name !== 'User A Updated') {
    throw new Error("D1 Persistence failure: User A Updated name was not preserved!");
  }
  if (reMeA.body.user.name.includes('User B') || reMeA.body.user.email === emailB) {
    throw new Error("SECURITY FAILURE: User A re-login returned User B data!");
  }

  console.log("\n=== USER A / USER B PROFILE PERSISTENCE & ISOLATION PASSED 100% ===");
}

runUserAUserBProfileTest().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
