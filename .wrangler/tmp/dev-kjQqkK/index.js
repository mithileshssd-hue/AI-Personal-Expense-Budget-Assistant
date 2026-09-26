var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-1saGvJ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// worker/src/index.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};
var BUDGET_CATEGORY_GROUPS = {
  "Essential Needs": ["Food", "Transport", "Bills", "Health"],
  "Savings & Investments": ["Other"],
  "Financial Goals": ["Travel"],
  "Learning & Growth": ["Education"],
  "Lifestyle & Fun": ["Shopping", "Entertainment"]
};
var GROUP_PERCENTAGES = {
  "Essential Needs": 0.5,
  "Savings & Investments": 0.25,
  "Financial Goals": 0.1,
  "Learning & Growth": 0.05,
  "Lifestyle & Fun": 0.1
};
async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const saltHexStr = saltHex || bytesToHex(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hashHex = bytesToHex(new Uint8Array(derivedBits));
  return `${saltHexStr}:${hashHex}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, storedHash) {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const saltHex = parts[0];
  const newHash = await hashPassword(password, saltHex);
  return newHash === storedHash;
}
__name(verifyPassword, "verifyPassword");
function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(bytesToHex, "bytesToHex");
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
__name(hexToBytes, "hexToBytes");
function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}
__name(base64UrlDecode, "base64UrlDecode");
async function generateJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(dataToSign));
  const encodedSig = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  return `${dataToSign}.${encodedSig}`;
}
__name(generateJWT, "generateJWT");
async function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSig] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Uint8Array.from(base64UrlDecode(encodedSig), (c) => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(dataToSign));
    if (!isValid) return null;
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() / 1e3 > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}
__name(errorResponse, "errorResponse");
async function authenticate(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7).trim();
  const secret = env.JWT_SECRET || "smartfinance_super_secret_jwt_key_2026_change_in_production";
  const payload = await verifyJWT(token, secret);
  if (!payload || !payload.sub) return null;
  return payload;
}
__name(authenticate, "authenticate");
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    const secret = env.JWT_SECRET || "smartfinance_super_secret_jwt_key_2026_change_in_production";
    try {
      if (path === "/api/auth/register" && request.method === "POST") {
        const body = await request.json();
        const name = (body.name || "").trim();
        const email = (body.email || "").toLowerCase().trim();
        const password = body.password || "";
        if (!name || !email || !password) {
          return errorResponse("Name, email, and password are required.", 400);
        }
        if (password.length < 6) {
          return errorResponse("Password must be at least 6 characters long.", 400);
        }
        const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
        if (existing) {
          return errorResponse("An account with this email address already exists.", 409);
        }
        const userId2 = "usr_" + Date.now() + "_" + Math.floor(Math.random() * 1e4);
        const passwordHash = await hashPassword(password);
        const picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=173D82&color=fff&size=128`;
        await env.DB.prepare(
          "INSERT INTO users (id, name, email, password_hash, currency, picture, auth_provider) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(userId2, name, email, passwordHash, "\u20B9", picture, "Email").run();
        await seedUserStarterData(env.DB, userId2);
        const createdUserRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId2).first();
        const token = await generateJWT({ sub: userId2, email, exp: Math.floor(Date.now() / 1e3) + 86400 * 30 }, secret);
        const user = {
          id: createdUserRow.id,
          name: createdUserRow.name,
          email: createdUserRow.email,
          currency: createdUserRow.currency || "\u20B9",
          occupation: createdUserRow.occupation || "",
          phone: createdUserRow.phone || "",
          picture: createdUserRow.picture || picture,
          authProvider: createdUserRow.auth_provider || "Email",
          created_at: createdUserRow.created_at
        };
        return jsonResponse({ success: true, token, user });
      }
      if (path === "/api/auth/login" && request.method === "POST") {
        const body = await request.json();
        const email = (body.email || "").toLowerCase().trim();
        const password = body.password || "";
        if (!email || !password) {
          return errorResponse("Invalid email or password. Please check your credentials and try again.", 401);
        }
        const userRow = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        if (!userRow) {
          return errorResponse("Invalid email or password. Please check your credentials and try again.", 401);
        }
        const valid = await verifyPassword(password, userRow.password_hash);
        if (!valid) {
          return errorResponse("Invalid email or password. Please check your credentials and try again.", 401);
        }
        const token = await generateJWT({ sub: userRow.id, email: userRow.email, exp: Math.floor(Date.now() / 1e3) + 86400 * 30 }, secret);
        const user = {
          id: userRow.id,
          name: userRow.name,
          email: userRow.email,
          currency: userRow.currency || "\u20B9",
          occupation: userRow.occupation || "",
          phone: userRow.phone || "",
          picture: userRow.picture || "",
          authProvider: userRow.auth_provider || "Email",
          created_at: userRow.created_at
        };
        return jsonResponse({ success: true, token, user });
      }
      if (path === "/api/auth/google" && request.method === "POST") {
        const body = await request.json();
        const { googleToken, googleProfile } = body;
        if (!googleProfile || !googleProfile.email) {
          return errorResponse("Google profile verification failed. No valid email supplied.", 400);
        }
        const email = googleProfile.email.toLowerCase().trim();
        const name = googleProfile.name || email.split("@")[0];
        const picture = googleProfile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=173D82&color=fff&size=128`;
        let userRow = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        if (!userRow) {
          const userId2 = "usr_g_" + Date.now();
          const dummyPass = await hashPassword(crypto.randomUUID());
          await env.DB.prepare(
            "INSERT INTO users (id, name, email, password_hash, currency, picture, auth_provider) VALUES (?, ?, ?, ?, ?, ?, ?)"
          ).bind(userId2, name, email, dummyPass, "\u20B9", picture, "Google").run();
          await seedUserStarterData(env.DB, userId2);
          userRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId2).first();
        }
        const token = await generateJWT({ sub: userRow.id, email: userRow.email, exp: Math.floor(Date.now() / 1e3) + 86400 * 30 }, secret);
        const user = {
          id: userRow.id,
          name: userRow.name,
          email: userRow.email,
          currency: userRow.currency || "\u20B9",
          occupation: userRow.occupation || "",
          phone: userRow.phone || "",
          picture: userRow.picture || picture,
          authProvider: userRow.auth_provider || "Google",
          created_at: userRow.created_at
        };
        return jsonResponse({ success: true, token, user });
      }
      if (path === "/api/auth/me" && request.method === "GET") {
        const session = await authenticate(request, env);
        if (!session) return errorResponse("Unauthorized access.", 401);
        const userRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(session.sub).first();
        if (!userRow) return errorResponse("User not found.", 401);
        const user = {
          id: userRow.id,
          name: userRow.name,
          email: userRow.email,
          currency: userRow.currency || "\u20B9",
          occupation: userRow.occupation || "",
          phone: userRow.phone || "",
          picture: userRow.picture || "",
          authProvider: userRow.auth_provider || "Email",
          created_at: userRow.created_at
        };
        return jsonResponse({ success: true, user });
      }
      if (path === "/api/auth/profile" && request.method === "PUT") {
        const session = await authenticate(request, env);
        if (!session) return errorResponse("Unauthorized access.", 401);
        const body = await request.json();
        const name = (body.name || "").trim();
        const phone = (body.phone || "").trim();
        const occupation = (body.occupation || "").trim();
        const currency = (body.currency || "\u20B9").trim();
        const picture = body.picture || null;
        if (name) {
          await env.DB.prepare("UPDATE users SET name = ?, phone = ?, occupation = ?, currency = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(name, phone, occupation, currency, session.sub).run();
        }
        if (picture) {
          await env.DB.prepare("UPDATE users SET picture = ? WHERE id = ?").bind(picture, session.sub).run();
        }
        const updatedUser = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(session.sub).first();
        return jsonResponse({
          success: true,
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            currency: updatedUser.currency,
            occupation: updatedUser.occupation,
            phone: updatedUser.phone,
            picture: updatedUser.picture,
            authProvider: updatedUser.auth_provider,
            created_at: updatedUser.created_at
          }
        });
      }
      if (path === "/api/auth/logout" && request.method === "POST") {
        return jsonResponse({ success: true, message: "Logged out successfully." });
      }
      const authSession = await authenticate(request, env);
      if (!authSession) {
        return errorResponse("Unauthorized request. Authentication required.", 401);
      }
      const userId = authSession.sub;
      if (path === "/api/expenses" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC"
        ).bind(userId).all();
        const formatted = (results || []).map((r) => ({
          id: r.id,
          title: r.description || r.category,
          amount: r.amount,
          category: r.category,
          type: "expense",
          paymentMethod: r.payment_method || "UPI",
          date: r.date,
          notes: r.description || ""
        }));
        return jsonResponse({ success: true, expenses: formatted });
      }
      if (path === "/api/expenses" && request.method === "POST") {
        const body = await request.json();
        const amount = Math.abs(parseFloat(body.amount)) || 0;
        const category = body.category || "Other";
        const description = (body.notes || body.title || body.description || "").trim();
        const paymentMethod = body.paymentMethod || "UPI";
        const date = body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        if (amount <= 0) return errorResponse("Expense amount must be greater than zero.", 400);
        const expId = body.id || "exp_" + Date.now() + "_" + Math.floor(Math.random() * 1e3);
        await env.DB.prepare(
          "INSERT INTO expenses (id, user_id, amount, category, description, payment_method, date) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(expId, userId, amount, category, description, paymentMethod, date).run();
        const budgetAlerts = await checkInternalBudgetAlerts(env.DB, userId, date);
        return jsonResponse({
          success: true,
          expense: { id: expId, title: description || category, amount, category, type: "expense", paymentMethod, date, notes: description },
          budgetAlerts
        });
      }
      if (path.startsWith("/api/expenses/") && request.method === "PUT") {
        const expId = path.split("/")[3];
        const body = await request.json();
        const amount = Math.abs(parseFloat(body.amount)) || 0;
        const category = body.category || "Other";
        const description = (body.notes || body.title || body.description || "").trim();
        const paymentMethod = body.paymentMethod || "UPI";
        const date = body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const existing = await env.DB.prepare("SELECT id FROM expenses WHERE id = ? AND user_id = ?").bind(expId, userId).first();
        if (!existing) return errorResponse("Expense not found or unauthorized access.", 404);
        await env.DB.prepare(
          "UPDATE expenses SET amount = ?, category = ?, description = ?, payment_method = ?, date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
        ).bind(amount, category, description, paymentMethod, date, expId, userId).run();
        const budgetAlerts = await checkInternalBudgetAlerts(env.DB, userId, date);
        return jsonResponse({ success: true, budgetAlerts });
      }
      if (path.startsWith("/api/expenses/") && request.method === "DELETE") {
        const expId = path.split("/")[3];
        const res = await env.DB.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?").bind(expId, userId).run();
        if (res.meta.changes === 0) return errorResponse("Expense not found or unauthorized.", 404);
        return jsonResponse({ success: true });
      }
      if (path === "/api/income" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM income WHERE user_id = ? ORDER BY date DESC, created_at DESC"
        ).bind(userId).all();
        const formatted = (results || []).map((r) => ({
          id: r.id,
          title: r.description || r.source,
          amount: r.amount,
          category: r.source,
          type: "income",
          date: r.date,
          notes: r.description || ""
        }));
        return jsonResponse({ success: true, income: formatted });
      }
      if (path === "/api/income" && request.method === "POST") {
        const body = await request.json();
        const amount = Math.abs(parseFloat(body.amount)) || 0;
        const source = body.category || body.source || "Salary";
        const description = (body.notes || body.title || body.description || "").trim();
        const date = body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        if (amount <= 0) return errorResponse("Income amount must be greater than zero.", 400);
        const incId = body.id || "inc_" + Date.now() + "_" + Math.floor(Math.random() * 1e3);
        await env.DB.prepare(
          "INSERT INTO income (id, user_id, amount, source, description, date) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(incId, userId, amount, source, description, date).run();
        return jsonResponse({
          success: true,
          income: { id: incId, title: description || source, amount, category: source, type: "income", date, notes: description }
        });
      }
      if (path.startsWith("/api/income/") && request.method === "PUT") {
        const incId = path.split("/")[3];
        const body = await request.json();
        const amount = Math.abs(parseFloat(body.amount)) || 0;
        const source = body.category || body.source || "Salary";
        const description = (body.notes || body.title || body.description || "").trim();
        const date = body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const existing = await env.DB.prepare("SELECT id FROM income WHERE id = ? AND user_id = ?").bind(incId, userId).first();
        if (!existing) return errorResponse("Income record not found or unauthorized access.", 404);
        await env.DB.prepare(
          "UPDATE income SET amount = ?, source = ?, description = ?, date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
        ).bind(amount, source, description, date, incId, userId).run();
        return jsonResponse({ success: true });
      }
      if (path.startsWith("/api/income/") && request.method === "DELETE") {
        const incId = path.split("/")[3];
        const res = await env.DB.prepare("DELETE FROM income WHERE id = ? AND user_id = ?").bind(incId, userId).run();
        if (res.meta.changes === 0) return errorResponse("Income record not found or unauthorized.", 404);
        return jsonResponse({ success: true });
      }
      if (path === "/api/budgets" && request.method === "GET") {
        const now = /* @__PURE__ */ new Date();
        const m = parseInt(url.searchParams.get("month")) || now.getMonth() + 1;
        const y = parseInt(url.searchParams.get("year")) || now.getFullYear();
        const { results } = await env.DB.prepare(
          "SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ?"
        ).bind(userId, m, y).all();
        const categories = {};
        let totalBudget = 0;
        (results || []).forEach((b) => {
          categories[b.category] = b.amount;
          totalBudget += b.amount;
        });
        return jsonResponse({ success: true, budgets: { totalBudget, month: m, year: y, categories } });
      }
      if (path === "/api/budgets" && request.method === "POST") {
        const body = await request.json();
        const now = /* @__PURE__ */ new Date();
        const m = body.month || now.getMonth() + 1;
        const y = body.year || now.getFullYear();
        const categories = body.categories || {};
        for (const [cat, amt] of Object.entries(categories)) {
          const numAmt = Math.abs(parseFloat(amt)) || 0;
          const bId = `bg_${userId}_${cat}_${m}_${y}`;
          await env.DB.prepare(
            "INSERT INTO budgets (id, user_id, category, amount, month, year) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, category, month, year) DO UPDATE SET amount = excluded.amount, updated_at = CURRENT_TIMESTAMP"
          ).bind(bId, userId, cat, numAmt, m, y).run();
        }
        return jsonResponse({ success: true });
      }
      if (path === "/api/dashboard" && request.method === "GET") {
        const incRes = await env.DB.prepare("SELECT SUM(amount) as total FROM income WHERE user_id = ?").bind(userId).first();
        const expRes = await env.DB.prepare("SELECT SUM(amount) as total FROM expenses WHERE user_id = ?").bind(userId).first();
        const totalIncome = incRes ? incRes.total || 0 : 0;
        const totalExpenses = expRes ? expRes.total || 0 : 0;
        const balance = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((totalIncome - totalExpenses) / totalIncome * 100)) : 0;
        const { results: recentInc } = await env.DB.prepare(
          "SELECT id, source as category, description, amount, date, created_at FROM income WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 20"
        ).bind(userId).all();
        const { results: recentExp } = await env.DB.prepare(
          "SELECT id, category, description, amount, payment_method, date, created_at FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 20"
        ).bind(userId).all();
        const allTx = [
          ...(recentInc || []).map((r) => ({ id: r.id, title: r.description || r.category, category: r.category, amount: r.amount, type: "income", date: r.date, created_at: r.created_at })),
          ...(recentExp || []).map((r) => ({ id: r.id, title: r.description || r.category, category: r.category, amount: r.amount, type: "expense", paymentMethod: r.payment_method, date: r.date, created_at: r.created_at }))
        ];
        allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
        const budgetAlerts = await checkInternalBudgetAlerts(env.DB, userId, (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
        return jsonResponse({
          success: true,
          summary: { balance, totalIncome, totalExpenses, savingsAmount: Math.max(0, balance), savingsRate },
          recentTransactions: allTx.slice(0, 10),
          budgetAlerts
        });
      }
      if (path === "/api/analytics" && request.method === "GET") {
        const { results: expList } = await env.DB.prepare(
          "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category"
        ).bind(userId).all();
        const categoryTotals = {};
        (expList || []).forEach((r) => {
          categoryTotals[r.category] = r.total;
        });
        return jsonResponse({ success: true, categoryTotals });
      }
      if (path === "/api/data/reset" && request.method === "POST") {
        await env.DB.prepare("DELETE FROM expenses WHERE user_id = ?").bind(userId).run();
        await env.DB.prepare("DELETE FROM income WHERE user_id = ?").bind(userId).run();
        await seedUserStarterData(env.DB, userId);
        return jsonResponse({ success: true, message: "Sample data restored successfully." });
      }
      if (path === "/api/data/clear" && request.method === "POST") {
        await env.DB.prepare("DELETE FROM expenses WHERE user_id = ?").bind(userId).run();
        await env.DB.prepare("DELETE FROM income WHERE user_id = ?").bind(userId).run();
        await env.DB.prepare("DELETE FROM budgets WHERE user_id = ?").bind(userId).run();
        return jsonResponse({ success: true, message: "All financial records cleared successfully." });
      }
      if (path === "/api/sync/migrate" && request.method === "POST") {
        const body = await request.json();
        const transactions = body.transactions || [];
        for (const t of transactions) {
          if (t.type === "expense") {
            const expId = t.id || "exp_" + Date.now() + "_" + Math.floor(Math.random() * 1e3);
            await env.DB.prepare(
              "INSERT OR IGNORE INTO expenses (id, user_id, amount, category, description, payment_method, date) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).bind(expId, userId, Math.abs(t.amount) || 0, t.category || "Other", t.title || t.notes || "", t.paymentMethod || "UPI", t.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]).run();
          } else if (t.type === "income") {
            const incId = t.id || "inc_" + Date.now() + "_" + Math.floor(Math.random() * 1e3);
            await env.DB.prepare(
              "INSERT OR IGNORE INTO income (id, user_id, amount, source, description, date) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(incId, userId, Math.abs(t.amount) || 0, t.category || "Salary", t.title || t.notes || "", t.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]).run();
          }
        }
        return jsonResponse({ success: true, message: "Migration imported successfully." });
      }
      return errorResponse("Endpoint not found.", 404);
    } catch (err) {
      console.error("Worker API Internal Error:", err);
      return errorResponse("Unable to connect to the server. Please try again.", 500);
    }
  }
};
async function seedUserStarterData(db, userId) {
  try {
    const defaultIncome = [
      { id: `inc_s1_${userId}`, amount: 55e3, source: "Salary", description: "Tech Corp monthly payroll", date: "2026-09-01" },
      { id: `inc_s2_${userId}`, amount: 15e3, source: "Freelance", description: "Mobile app design deliverables", date: "2026-09-05" },
      { id: `inc_s3_${userId}`, amount: 3500, source: "Investment", description: "Q3 dividend payout", date: "2026-09-12" }
    ];
    const defaultExpenses = [
      { id: `exp_s1_${userId}`, amount: 4250, category: "Food", description: "Weekly organic groceries", payment_method: "UPI", date: "2026-09-02" },
      { id: `exp_s2_${userId}`, amount: 1800, category: "Transport", description: "Monthly transit recharge", payment_method: "Debit Card", date: "2026-09-04" },
      { id: `exp_s3_${userId}`, amount: 3200, category: "Bills", description: "Power bill and fiber optic internet", payment_method: "Net Banking", date: "2026-09-06" },
      { id: `exp_s4_${userId}`, amount: 2499, category: "Education", description: "Cloud AI certification", payment_method: "Credit Card", date: "2026-09-07" },
      { id: `exp_s5_${userId}`, amount: 2150, category: "Food", description: "Dinner with friends", payment_method: "UPI", date: "2026-09-08" },
      { id: `exp_s6_${userId}`, amount: 3400, category: "Shopping", description: "Work attire renewal", payment_method: "Credit Card", date: "2026-09-10" },
      { id: `exp_s7_${userId}`, amount: 1100, category: "Health", description: "Vitamins and checkup", payment_method: "Debit Card", date: "2026-09-11" },
      { id: `exp_s8_${userId}`, amount: 950, category: "Entertainment", description: "Cinema tickets and snacks", payment_method: "UPI", date: "2026-09-13" },
      { id: `exp_s9_${userId}`, amount: 3800, category: "Travel", description: "Conference travel", payment_method: "Credit Card", date: "2026-09-14" }
    ];
    for (const inc of defaultIncome) {
      await db.prepare("INSERT OR IGNORE INTO income (id, user_id, amount, source, description, date) VALUES (?, ?, ?, ?, ?, ?)").bind(inc.id, userId, inc.amount, inc.source, inc.description, inc.date).run();
    }
    for (const exp of defaultExpenses) {
      await db.prepare("INSERT OR IGNORE INTO expenses (id, user_id, amount, category, description, payment_method, date) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(exp.id, userId, exp.amount, exp.category, exp.description, exp.payment_method, exp.date).run();
    }
  } catch (e) {
    console.warn("Seed starter data error:", e);
  }
}
__name(seedUserStarterData, "seedUserStarterData");
async function checkInternalBudgetAlerts(db, userId, dateStr) {
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const startMonth = `${y}-${m}-01`;
    const endMonth = `${y}-${m}-31`;
    const incRow = await db.prepare(
      "SELECT SUM(amount) as total FROM income WHERE user_id = ? AND date >= ? AND date <= ?"
    ).bind(userId, startMonth, endMonth).first();
    const monthlyIncome = incRow ? incRow.total || 0 : 0;
    if (monthlyIncome <= 0) return [];
    const { results: expRows } = await db.prepare(
      "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? AND date >= ? AND date <= ? GROUP BY category"
    ).bind(userId, startMonth, endMonth).all();
    const catExpenses = {};
    (expRows || []).forEach((r) => {
      catExpenses[r.category] = r.total;
    });
    const alerts = [];
    for (const [groupName, categories] of Object.entries(BUDGET_CATEGORY_GROUPS)) {
      const limit = monthlyIncome * GROUP_PERCENTAGES[groupName];
      let actualSpending = 0;
      categories.forEach((cat) => {
        actualSpending += catExpenses[cat] || 0;
      });
      if (actualSpending > limit) {
        const overAmt = Math.round(actualSpending - limit);
        alerts.push(`${groupName} budget exceeded by \u20B9${overAmt.toLocaleString()}.`);
      }
    }
    return alerts;
  } catch (e) {
    return [];
  }
}
__name(checkInternalBudgetAlerts, "checkInternalBudgetAlerts");

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-1saGvJ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-1saGvJ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
