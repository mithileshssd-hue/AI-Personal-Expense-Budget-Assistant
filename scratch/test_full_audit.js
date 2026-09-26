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

async function runAudit() {
  console.log("=== STARTING FULL SYSTEM AUDIT TEST SUITE ===");
  const ts = Date.now();

  // 1. AUTHENTICATION TESTS
  console.log("\n--- 1. AUTHENTICATION AUDIT ---");
  const emailA = `audit_usera_${ts}@example.com`;
  const emailB = `audit_userb_${ts}@example.com`;
  const passwordA = `SecurePass123!`;
  const passwordB = `SecurePass456!`;

  // Register User A
  console.log("Testing Registration (User A)...");
  const regA = await request('POST', '/api/auth/register', { name: 'User A Audit', email: emailA, password: passwordA });
  console.log(`Registration status: ${regA.status}, Success: ${regA.body.success}`);
  if (regA.status !== 200) throw new Error("User A registration failed");

  // Duplicate Email Test
  console.log("Testing Duplicate Email rejection...");
  const dup = await request('POST', '/api/auth/register', { name: 'User A Dup', email: emailA, password: passwordA });
  console.log(`Duplicate registration status: ${dup.status} (Expected 409)`);
  if (dup.status !== 409) throw new Error("Duplicate email check failed!");

  // Invalid Email Test
  console.log("Testing Invalid Email rejection...");
  const invEmail = await request('POST', '/api/auth/register', { name: 'Invalid User', email: 'notanemail', password: passwordA });
  console.log(`Invalid email status: ${invEmail.status} (Expected 400)`);
  if (invEmail.status !== 400) throw new Error("Invalid email check failed!");

  // Weak Password Test
  console.log("Testing Weak Password rejection...");
  const weakPass = await request('POST', '/api/auth/register', { name: 'Weak Pass User', email: `weak_${ts}@example.com`, password: '123' });
  console.log(`Weak password status: ${weakPass.status} (Expected 400)`);
  if (weakPass.status !== 400) throw new Error("Weak password check failed!");

  // Login Wrong Password Test
  console.log("Testing Login with Wrong Password...");
  const wrongPass = await request('POST', '/api/auth/login', { email: emailA, password: 'WrongPassword99!' });
  console.log(`Wrong password status: ${wrongPass.status} (Expected 401)`);
  if (wrongPass.status !== 401) throw new Error("Wrong password check failed!");

  // Login Correct Test
  console.log("Testing Login with Correct Credentials...");
  const loginA = await request('POST', '/api/auth/login', { email: emailA, password: passwordA });
  console.log(`Login status: ${loginA.status}, Token received: ${!!loginA.body.token}`);
  if (loginA.status !== 200 || !loginA.body.token) throw new Error("Valid login failed");
  const tokenA = loginA.body.token;

  // Invalid Token Protection Test
  console.log("Testing Protected Route with Invalid Token...");
  const invToken = await request('GET', '/api/expenses', null, 'invalid_token_123');
  console.log(`Invalid token status: ${invToken.status} (Expected 401)`);
  if (invToken.status !== 401) throw new Error("Protected route invalid token check failed!");

  // 2. PROFILE AUDIT
  console.log("\n--- 2. PROFILE AUDIT ---");
  const profileGet = await request('GET', '/api/auth/me', null, tokenA);
  console.log("Profile retrieved:", profileGet.body.user);
  if (!profileGet.body.user.name || profileGet.body.user.name === 'User Name') {
    throw new Error("Invalid profile name returned!");
  }

  console.log("Updating Profile Details (Occupation, Phone, Currency)...");
  const profileUpdate = await request('PUT', '/api/auth/profile', {
    name: 'User A Updated',
    occupation: 'Financial Analyst',
    phone: '+1 555-0199',
    currency: 'INR'
  }, tokenA);
  console.log("Profile update status:", profileUpdate.status, profileUpdate.body);
  if (profileUpdate.status !== 200 || profileUpdate.body.user.occupation !== 'Financial Analyst') {
    throw new Error("Profile update to D1 failed!");
  }

  // 3. REGISTER USER B & TWO-USER FINANCIAL ISOLATION TEST
  console.log("\n--- 3. TWO-USER FINANCIAL DATA & ISOLATION AUDIT ---");
  const regB = await request('POST', '/api/auth/register', { name: 'User B Audit', email: emailB, password: passwordB });
  const loginB = await request('POST', '/api/auth/login', { email: emailB, password: passwordB });
  const tokenB = loginB.body.token;

  console.log("Creating Financial Records for User A (Income: ₹50,000, Expense: ₹10,000)...");
  const incA = await request('POST', '/api/income', { title: 'User A Monthly Salary', amount: 50000, category: 'Salary', date: '2026-09-01' }, tokenA);
  const expA = await request('POST', '/api/expenses', { title: 'User A Rent Expense', amount: 10000, category: 'Bills', date: '2026-09-05' }, tokenA);

  console.log("Creating Financial Records for User B (Income: ₹80,000, Expense: ₹5,000)...");
  const incB = await request('POST', '/api/income', { title: 'User B Freelance Income', amount: 80000, category: 'Freelance', date: '2026-09-02' }, tokenB);
  const expB = await request('POST', '/api/expenses', { title: 'User B Groceries', amount: 5000, category: 'Food', date: '2026-09-06' }, tokenB);

  console.log("Fetching User A Financial Data...");
  const listIncA = await request('GET', '/api/income', null, tokenA);
  const listExpA = await request('GET', '/api/expenses', null, tokenA);

  console.log("Fetching User B Financial Data...");
  const listIncB = await request('GET', '/api/income', null, tokenB);
  const listExpB = await request('GET', '/api/expenses', null, tokenB);

  console.log(`User A Income Total: ₹${listIncA.body.income.reduce((s, i) => s + i.amount, 0)} (Expected 50000)`);
  console.log(`User A Expense Total: ₹${listExpA.body.expenses.reduce((s, e) => s + e.amount, 0)} (Expected 10000)`);
  console.log(`User B Income Total: ₹${listIncB.body.income.reduce((s, i) => s + i.amount, 0)} (Expected 80000)`);
  console.log(`User B Expense Total: ₹${listExpB.body.expenses.reduce((s, e) => s + e.amount, 0)} (Expected 5000)`);

  // Verify Zero Data Leak
  const userAHasBData = listIncA.body.income.some(i => i.amount === 80000) || listExpA.body.expenses.some(e => e.amount === 5000);
  const userBHasAData = listIncB.body.income.some(i => i.amount === 50000) || listExpB.body.expenses.some(e => e.amount === 10000);

  if (userAHasBData || userBHasAData) {
    throw new Error("SECURITY FAILURE: Multi-user data leak detected!");
  }
  console.log("✅ MULTI-USER DATA ISOLATION VERIFIED PERFECTLY! Zero data leak.");

  // 4. BUDGETS AUDIT
  console.log("\n--- 4. BUDGETS CRUD & ALERTS AUDIT ---");
  const budgetAdd = await request('POST', '/api/budgets', { categories: { Bills: 12000 }, totalBudget: 40000 }, tokenA);
  console.log("Budget created status:", budgetAdd.status, budgetAdd.body);
  if (budgetAdd.status !== 200) throw new Error("Budget creation failed");

  const budgetList = await request('GET', '/api/budgets', null, tokenA);
  console.log("Budgets retrieved for User A:", budgetList.body.budgets);
  if (budgetList.body.budgets.totalBudget !== 40000 || budgetList.body.budgets.categories.Bills !== 12000) {
    throw new Error("Budget retrieval mismatch!");
  }

  console.log("\n=== ALL AUDIT & ISOLATION TESTS PASSED 100% SUCCESSFUL ===");
}

runAudit().catch(err => {
  console.error("AUDIT FAILED:", err);
  process.exit(1);
});
