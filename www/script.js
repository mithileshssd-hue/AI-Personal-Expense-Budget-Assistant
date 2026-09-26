/**
 * SmartFinance - AI Personal Expense & Budget Assistant
 * Complete Core State Engine, Authentication, Data Isolation,
 * Dynamic Budgeting, Interactive Analytics, and Conversational AI
 */

// =========================================================
// 1. DATA MODELS & CONSTANTS
// =========================================================

// =========================================================
// GOOGLE OAUTH CONFIGURATION
// =========================================================
// To enable Google Sign-In with your own Google Cloud project:
// 1. Create an OAuth 2.0 Client ID (Web Application) at https://console.cloud.google.com/apis/credentials
// 2. Add both "http://localhost:5500" and "http://127.0.0.1:5500" to "Authorized JavaScript origins".
// 3. Replace GOOGLE_CLIENT_ID below with your actual Client ID (ends with .apps.googleusercontent.com).
const GOOGLE_CLIENT_ID = "39431135647-i9jnuuh2k6b25c4u07bvvoi1rc79v52f.apps.googleusercontent.com";

const STORAGE_KEYS = {
    USERS: 'sf_users_directory',
    CURRENT_USER: 'sf_current_user',
    REMEMBER_EMAIL: 'sf_remember_email',
    AI_CHAT_HISTORY: 'sf_ai_chat_history'
};

function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
}
window.isValidEmail = isValidEmail;

function generateAvatarSVG(name = 'User', email = '', size = 120) {
    const cleanName = (name || '').trim();
    let initials = 'U';
    if (cleanName) {
        const parts = cleanName.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts.length === 1) {
            initials = parts[0].substring(0, 2).toUpperCase();
        }
    }

    const hash = (email || name || '').toLowerCase().split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const colorPairs = [
        ['#4f46e5', '#3b82f6'],
        ['#0d9488', '#10b981'],
        ['#d97706', '#f59e0b'],
        ['#e11d48', '#f43f5e'],
        ['#7c3aed', '#a855f7'],
        ['#0284c7', '#06b6d4'],
        ['#15803d', '#22c55e'],
        ['#0f172a', '#334155']
    ];
    const pair = colorPairs[Math.abs(hash) % colorPairs.length];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
        <defs>
            <linearGradient id="avatarGrad_${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${pair[0]}" />
                <stop offset="100%" stop-color="${pair[1]}" />
            </linearGradient>
        </defs>
        <rect width="100" height="100" rx="50" fill="url(#avatarGrad_${Math.abs(hash)})" />
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="38" letter-spacing="1">${initials}</text>
    </svg>`;

    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
window.generateAvatarSVG = generateAvatarSVG;

function getAvatarForUser(user) {
    if (!user) return generateAvatarSVG('User', '');
    if (user.picture && typeof user.picture === 'string' && user.picture.trim().length > 0) {
        return user.picture;
    }
    return generateAvatarSVG(user.name || user.email || 'User', user.email || '');
}
window.getAvatarForUser = getAvatarForUser;

const PRESET_AVATARS = [
    { id: 'initials', name: 'Auto Initials', type: 'dynamic' },
    { id: 'av1', name: 'Executive Male', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80' },
    { id: 'av2', name: 'Creative Female', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80' },
    { id: 'av3', name: 'Tech Specialist', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80' },
    { id: 'av4', name: 'Professional Analyst', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80' },
    { id: 'av5', name: 'Developer Specialist', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80' },
    { id: 'av6', name: 'Minimalist 3D Avatar', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80' }
];
window.PRESET_AVATARS = PRESET_AVATARS;

const EXPENSE_CATEGORIES = [
    'Food', 'Transport', 'Shopping', 'Education',
    'Entertainment', 'Bills', 'Health', 'Travel', 'Other'
];

const INCOME_SOURCES = [
    'Salary', 'Freelance', 'Scholarship', 'Business',
    'Allowance', 'Investment', 'Other'
];

const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking'];

const CATEGORY_ICONS = {
    // Expenses
    'Food': { icon: 'fa-utensils', color: '#f59e0b', bg: '#fef3c7' },
    'Transport': { icon: 'fa-car', color: '#3b82f6', bg: '#dbeafe' },
    'Shopping': { icon: 'fa-bag-shopping', color: '#ec4899', bg: '#fce7f3' },
    'Education': { icon: 'fa-graduation-cap', color: '#8b5cf6', bg: '#ede9fe' },
    'Entertainment': { icon: 'fa-film', color: '#6366f1', bg: '#e0e7ff' },
    'Bills': { icon: 'fa-bolt', color: '#ef4444', bg: '#fee2e2' },
    'Health': { icon: 'fa-heart-pulse', color: '#10b981', bg: '#d1fae5' },
    'Travel': { icon: 'fa-plane', color: '#06b6d4', bg: '#cffafe' },
    'Other': { icon: 'fa-tags', color: '#64748b', bg: '#f1f5f9' },
    'Other Expense': { icon: 'fa-tags', color: '#64748b', bg: '#f1f5f9' },

    // Income
    'Salary': { icon: 'fa-briefcase', color: '#15803d', bg: '#dcfce7' },
    'Freelance': { icon: 'fa-laptop-code', color: '#0284c7', bg: '#e0f2fe' },
    'Scholarship': { icon: 'fa-award', color: '#0d9488', bg: '#ccfbf1' },
    'Business': { icon: 'fa-chart-pie', color: '#7c3aed', bg: '#ede9fe' },
    'Allowance': { icon: 'fa-hand-holding-dollar', color: '#ca8a04', bg: '#fef08a' },
    'Investment': { icon: 'fa-arrow-trend-up', color: '#059669', bg: '#d1fae5' },
    'Investments': { icon: 'fa-arrow-trend-up', color: '#059669', bg: '#d1fae5' },
    'Other Income': { icon: 'fa-money-bill-wave', color: '#059669', bg: '#d1fae5' }
};

// Default Realistic Seed Transactions (with multi-month spread for charts)
const DEFAULT_SAMPLE_TRANSACTIONS = [
    // Current Month (September 2026)
    { id: 'tx-101', title: 'Monthly Salary', type: 'income', category: 'Salary', amount: 55000, date: '2026-09-01', time: '09:00', paymentMethod: 'Net Banking', notes: 'Tech Corp monthly payroll' },
    { id: 'tx-102', title: 'Freelance UI Project', type: 'income', category: 'Freelance', amount: 15000, date: '2026-09-05', time: '14:30', paymentMethod: 'UPI', notes: 'Mobile app design deliverables' },
    { id: 'tx-103', title: 'Mutual Fund Dividend', type: 'income', category: 'Investment', amount: 3500, date: '2026-09-12', time: '11:15', paymentMethod: 'Net Banking', notes: 'Q3 dividend payout' },
    { id: 'tx-104', title: 'Supermarket Grocery', type: 'expense', category: 'Food', amount: 4250, date: '2026-09-02', time: '13:15', paymentMethod: 'UPI', notes: 'Weekly organic groceries' },
    { id: 'tx-105', title: 'Metro Smart Card & Fuel', type: 'expense', category: 'Transport', amount: 1800, date: '2026-09-04', time: '08:20', paymentMethod: 'Debit Card', notes: 'Monthly transit recharge' },
    { id: 'tx-106', title: 'Electricity & High-Speed WiFi', type: 'expense', category: 'Bills', amount: 3200, date: '2026-09-06', time: '18:30', paymentMethod: 'Net Banking', notes: 'Power bill and fiber optic internet' },
    { id: 'tx-107', title: 'Online Coding Masterclass', type: 'expense', category: 'Education', amount: 2499, date: '2026-09-07', time: '10:00', paymentMethod: 'Credit Card', notes: 'Cloud AI architecture certification' },
    { id: 'tx-108', title: 'Weekend Dining & Cafe', type: 'expense', category: 'Food', amount: 2150, date: '2026-09-08', time: '20:45', paymentMethod: 'UPI', notes: 'Dinner with friends' },
    { id: 'tx-109', title: 'Clothing & Footwear', type: 'expense', category: 'Shopping', amount: 3400, date: '2026-09-10', time: '16:00', paymentMethod: 'Credit Card', notes: 'Work attire renewal' },
    { id: 'tx-110', title: 'Pharmacy & Health Checkup', type: 'expense', category: 'Health', amount: 1100, date: '2026-09-11', time: '17:30', paymentMethod: 'Debit Card', notes: 'Vitamins and routine check' },
    { id: 'tx-111', title: 'Movie Night & Streaming', type: 'expense', category: 'Entertainment', amount: 950, date: '2026-09-13', time: '21:00', paymentMethod: 'UPI', notes: 'Cinema tickets and snacks' },
    { id: 'tx-112', title: 'Flight & Cab Booking', type: 'expense', category: 'Travel', amount: 3800, date: '2026-09-14', time: '07:30', paymentMethod: 'Credit Card', notes: 'Intercity conference travel' },

    // August 2026 (For multi-month comparison)
    { id: 'tx-081', title: 'August Salary', type: 'income', category: 'Salary', amount: 55000, date: '2026-08-01', time: '09:00', paymentMethod: 'Net Banking', notes: 'August compensation' },
    { id: 'tx-082', title: 'Consulting Gig', type: 'income', category: 'Freelance', amount: 12000, date: '2026-08-10', time: '15:00', paymentMethod: 'UPI', notes: 'Architecture audit' },
    { id: 'tx-083', title: 'Monthly Rent & Bills', type: 'expense', category: 'Bills', amount: 8500, date: '2026-08-05', time: '10:30', paymentMethod: 'Net Banking', notes: 'Utilities and maintenance' },
    { id: 'tx-084', title: 'Dining & Provisions', type: 'expense', category: 'Food', amount: 6400, date: '2026-08-12', time: '19:15', paymentMethod: 'UPI', notes: 'August food expenses' },
    { id: 'tx-085', title: 'Travel & Commute', type: 'expense', category: 'Transport', amount: 2800, date: '2026-08-18', time: '09:15', paymentMethod: 'Debit Card', notes: 'Fuel and taxis' },
    { id: 'tx-086', title: 'Tech Gadget Purchase', type: 'expense', category: 'Shopping', amount: 4800, date: '2026-08-25', time: '14:00', paymentMethod: 'Credit Card', notes: 'Wireless keyboard and mouse' },

    // July 2026
    { id: 'tx-071', title: 'July Salary', type: 'income', category: 'Salary', amount: 52000, date: '2026-07-01', time: '09:00', paymentMethod: 'Net Banking', notes: 'July salary' },
    { id: 'tx-072', title: 'July Living Expenses', type: 'expense', category: 'Food', amount: 5800, date: '2026-07-15', time: '12:00', paymentMethod: 'UPI', notes: 'Groceries' },
    { id: 'tx-073', title: 'July Utilities', type: 'expense', category: 'Bills', amount: 3100, date: '2026-07-08', time: '17:00', paymentMethod: 'Net Banking', notes: 'Electricity bill' },
    { id: 'tx-074', title: 'Monsoon Train Trip', type: 'expense', category: 'Travel', amount: 4200, date: '2026-07-22', time: '06:30', paymentMethod: 'Credit Card', notes: 'Weekend retreat' },

    // June 2026
    { id: 'tx-061', title: 'June Salary', type: 'income', category: 'Salary', amount: 52000, date: '2026-06-01', time: '09:00', paymentMethod: 'Net Banking', notes: 'June salary' },
    { id: 'tx-062', title: 'June Expenses Aggregate', type: 'expense', category: 'Food', amount: 5200, date: '2026-06-14', time: '13:00', paymentMethod: 'UPI', notes: 'Groceries and food' },
    { id: 'tx-063', title: 'Shopping & Gear', type: 'expense', category: 'Shopping', amount: 3900, date: '2026-06-20', time: '16:30', paymentMethod: 'Credit Card', notes: 'Monsoon gear' }
];

const DEFAULT_BUDGETS = {
    totalBudget: 35000,
    categories: {
        'Food': 8000,
        'Transport': 4000,
        'Shopping': 5000,
        'Education': 3500,
        'Entertainment': 3000,
        'Bills': 5000,
        'Health': 3000,
        'Travel': 5000,
        'Other': 2000
    }
};

// =========================================================
// 2. AUTHENTICATION & USER ISOLATION
// =========================================================

// =========================================================
// API REQUEST HELPER & WORKER INTERACTION
// =========================================================

const PRODUCTION_API_URL = 'https://smartfinance-backend.workers.dev';

const isCapacitorNative = Boolean(
    window.Capacitor || 
    (typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && window.location.port === '')
);

const API_BASE_URL = window.API_BASE_URL || (
    isCapacitorNative
        ? PRODUCTION_API_URL
        : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? (window.location.port === '8787' ? '' : 'http://127.0.0.1:8787')
            : PRODUCTION_API_URL)
);

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('sf_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    let targetUrl = `${API_BASE_URL}${endpoint}`;
    try {
        let response = await fetch(targetUrl, {
            ...options,
            headers
        });

        const contentType = response.headers.get('content-type') || '';
        let data = {};
        if (contentType.includes('application/json')) {
            data = await response.json();
        }

        if (!response.ok) {
            const errorMsg = data.error || (response.status === 401 ? 'Invalid email or password. Please check your credentials and try again.' : 'Unable to connect to the server. Please try again.');
            return { ok: false, status: response.status, error: errorMsg, data };
        }

        return { ok: true, status: response.status, data };
    } catch (err) {
        // Fallback to production worker API if local dev server port 8787 is offline
        if (API_BASE_URL !== PRODUCTION_API_URL) {
            try {
                const prodResponse = await fetch(`${PRODUCTION_API_URL}${endpoint}`, {
                    ...options,
                    headers
                });
                const contentType = prodResponse.headers.get('content-type') || '';
                let data = {};
                if (contentType.includes('application/json')) {
                    data = await prodResponse.json();
                }
                if (!prodResponse.ok) {
                    const errorMsg = data.error || (prodResponse.status === 401 ? 'Invalid email or password. Please check your credentials and try again.' : 'Unable to connect to the server. Please try again.');
                    return { ok: false, status: prodResponse.status, error: errorMsg, data };
                }
                return { ok: true, status: prodResponse.status, data };
            } catch (prodErr) {}
        }
        console.error('API Request Network Error:', err);
        return { ok: false, status: 0, error: 'Unable to connect to the server. Please try again.' };
    }
}

window.handleAvatarError = function(imgEl) {
    if (!imgEl) return;
    imgEl.onerror = null;
    const user = AuthManager.getCurrentUser();
    imgEl.src = generateAvatarSVG(user ? user.name : 'User', user ? user.email : '');
};

// =========================================================
// 2. AUTHENTICATION & USER ISOLATION
// =========================================================

const AuthManager = {
    getUsers() {
        const user = this.getCurrentUser();
        return user ? [user] : [];
    },

    saveUsers(users) {
        // User account records are persisted in Cloudflare D1 via Worker API
    },

    getGoogleClientId() {
        const saved = localStorage.getItem('sf_google_client_id');
        if (saved && saved.trim() && saved !== 'YOUR_GOOGLE_CLIENT_ID') {
            return saved.trim();
        }
        return GOOGLE_CLIENT_ID;
    },

    isGoogleConfigured() {
        const cid = this.getGoogleClientId();
        return Boolean(cid && cid !== 'YOUR_GOOGLE_CLIENT_ID' && cid.includes('.apps.googleusercontent.com'));
    },

    getToken() {
        return localStorage.getItem('sf_token');
    },

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
        } catch (e) {
            return null;
        }
    },

    setCurrentUser(user, token) {
        if (token) {
            localStorage.setItem('sf_token', token);
        }
        if (user) {
            user.authenticated = true;
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
    },

    clearSession() {
        localStorage.removeItem('sf_token');
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    updateUserProfile(updatedUser) {
        if (!updatedUser) return;
        this.setCurrentUser(updatedUser);
    },

    isAuthenticated() {
        const token = this.getToken();
        const user = this.getCurrentUser();
        return Boolean(token && user && user.id && user.authenticated === true);
    },

    requireAuth() {
        const path = window.location.pathname.toLowerCase();
        const protectedPages = [
            'dashboard',
            'expenses',
            'income',
            'analytics',
            'ai-assistant',
            'profile'
        ];
        const isProtected = protectedPages.some(page => path.includes(page));
        if (isProtected && !this.isAuthenticated()) {
            this.clearSession();
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    getActiveUserId() {
        const user = this.getCurrentUser();
        return (user && user.id) ? user.id : null;
    },

    async checkAuthSession() {
        const token = this.getToken();
        const cachedUser = this.getCurrentUser();

        if (!token) {
            if (cachedUser && cachedUser.id && cachedUser.authenticated === true) {
                return cachedUser;
            }
            this.clearSession();
            this.requireAuth();
            return null;
        }

        const res = await apiRequest('/api/auth/me', { method: 'GET' });
        if (res.ok && res.data && res.data.success && res.data.user) {
            const updatedUser = {
                ...cachedUser,
                ...res.data.user,
                authenticated: true
            };
            this.setCurrentUser(updatedUser, token);
            return updatedUser;
        } else if (res.status === 401) {
            this.clearSession();
            this.requireAuth();
            return null;
        } else {
            if (cachedUser && cachedUser.id) {
                return cachedUser;
            }
            return null;
        }
    },

    logout() {
        this.clearSession();
        window.location.href = 'login.html';
    },

    switchUserAccount(email) {
        showToast('Please sign in with password to switch account.', 'info');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    },

    async register(name, email, password) {
        const normalizedEmail = (email || '').toLowerCase().trim();
        const cleanName = (name || '').trim();

        if (!cleanName) {
            return { success: false, message: 'Please enter your full name.' };
        }

        if (!isValidEmail(normalizedEmail)) {
            return { success: false, message: 'Please enter a valid email address (e.g. user@gmail.com).' };
        }

        if (!password || password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters long.' };
        }

        const res = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name: cleanName, email: normalizedEmail, password })
        });

        if (res.ok && res.data && res.data.success) {
            this.setCurrentUser(res.data.user, res.data.token);
            return { success: true, user: res.data.user };
        } else {
            this.clearSession();
            const msg = (res.status === 0)
                ? 'Unable to connect to the server. Please try again.'
                : (res.error || 'Registration failed. Please try again.');
            return { success: false, message: msg };
        }
    },

    async login(email, password) {
        const normalizedEmail = (email || '').toLowerCase().trim();

        if (!isValidEmail(normalizedEmail)) {
            return { success: false, message: 'Invalid email or password. Please check your credentials and try again.' };
        }

        if (!password) {
            return { success: false, message: 'Invalid email or password. Please check your credentials and try again.' };
        }

        const res = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: normalizedEmail, password })
        });

        if (res.ok && res.data && res.data.success) {
            this.setCurrentUser(res.data.user, res.data.token);
            return { success: true, user: res.data.user };
        } else {
            this.clearSession();
            const msg = (res.status === 0)
                ? 'Unable to connect to the server. Please try again.'
                : 'Invalid email or password. Please check your credentials and try again.';
            return { success: false, message: msg };
        }
    },

    async handleGoogleAuthSuccess(credential) {
        if (!credential) {
            showToast('Google sign-in was not completed.', 'info');
            resetGoogleBtn();
            return;
        }

        const cid = this.getGoogleClientId();
        const payload = { clientId: cid, credential };

        const res = await apiRequest('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res.ok && res.data && res.data.success) {
            this.setCurrentUser(res.data.user, res.data.token);
            showToast(`Login successful! Welcome, ${res.data.user.name}.`, 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            this.clearSession();
            const msg = (res.status === 0)
                ? 'Unable to connect to the server. Please try again.'
                : (res.data && res.data.error) || 'Google sign-in could not be completed. Please try again.';
            showToast(msg, 'error');
            resetGoogleBtn();
        }
    },

    handleGoogleCredentialResponse(response) {
        if (!response || !response.credential) {
            resetGoogleBtn();
            return;
        }
        this.handleGoogleAuthSuccess(response.credential);
    }
};

// Immediate execution auth guard: redirect unauthenticated users before DOM rendering or external CDN scripts load
AuthManager.requireAuth();


// =========================================================
// 3. FINANCE STORE & BUDGET ENGINE (PER-USER DATA)
// =========================================================

const FinanceStore = {
    expenses: [],
    income: [],
    budgets: { totalBudget: 35000, categories: {} },
    settings: { currencySymbol: '₹', currencyCode: 'INR', monthlyIncomeTarget: 60000, notifyBudgetLimit: true },
    isLoaded: false,

    async loadAll() {
        try {
            const [expRes, incRes, bgRes] = await Promise.all([
                apiRequest('/api/expenses', { method: 'GET' }),
                apiRequest('/api/income', { method: 'GET' }),
                apiRequest('/api/budgets', { method: 'GET' })
            ]);

            if (expRes.ok && expRes.data && expRes.data.expenses) {
                this.expenses = expRes.data.expenses;
            } else if (!expRes.ok) {
                showToast(expRes.error || 'Failed to fetch expenses from server.', 'error');
            }

            if (incRes.ok && incRes.data && incRes.data.income) {
                this.income = incRes.data.income;
            } else if (!incRes.ok) {
                showToast(incRes.error || 'Failed to fetch income from server.', 'error');
            }

            if (bgRes.ok && bgRes.data && bgRes.data.budgets) {
                this.budgets = bgRes.data.budgets;
            } else if (!bgRes.ok) {
                showToast(bgRes.error || 'Failed to fetch budgets from server.', 'error');
            }

            this.isLoaded = true;
        } catch (e) {
            console.error('Error loading financial data from API:', e);
            showToast('Unable to connect to financial server. Please try again.', 'error');
        }
    },

    init() {
        // Primary financial database is Cloudflare Worker + D1
    },

    getSettings() {
        try {
            const saved = localStorage.getItem('sf_ui_settings');
            if (saved) return { ...this.settings, ...JSON.parse(saved) };
        } catch (e) {}
        return this.settings;
    },

    saveSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        try {
            localStorage.setItem('sf_ui_settings', JSON.stringify(this.settings));
        } catch (e) {}
    },

    getBudgets() {
        return this.budgets || { totalBudget: 35000, categories: {} };
    },

    async saveBudgets(budgetData) {
        const res = await apiRequest('/api/budgets', {
            method: 'POST',
            body: JSON.stringify(budgetData)
        });

        if (res.ok && res.data && res.data.success) {
            this.budgets = {
                totalBudget: budgetData.totalBudget,
                categories: budgetData.categories || {}
            };
            return { success: true };
        } else {
            showToast(res.error || 'Failed to save budgets to server.', 'error');
            return { success: false, error: res.error };
        }
    },

    getTransactions() {
        const all = [...(this.expenses || []), ...(this.income || [])];
        all.sort((a, b) => getTransactionTimestamp(b) - getTransactionTimestamp(a));
        return all;
    },

    getTransactionById(id) {
        return this.getTransactions().find(t => t.id === id);
    },

    async addExpense(data) {
        const res = await apiRequest('/api/expenses', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (res.ok && res.data && res.data.success) {
            if (res.data.expense) {
                this.expenses.unshift(res.data.expense);
            } else {
                await this.loadAll();
            }
            return { success: true, expense: res.data.expense, budgetAlerts: res.data.budgetAlerts };
        } else {
            showToast(res.error || 'Failed to add expense.', 'error');
            return { success: false, error: res.error };
        }
    },

    async updateExpense(id, data) {
        const res = await apiRequest(`/api/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (res.ok && res.data && res.data.success) {
            const index = this.expenses.findIndex(e => e.id === id);
            if (index !== -1) {
                this.expenses[index] = {
                    ...this.expenses[index],
                    title: data.title || data.notes || this.expenses[index].title,
                    amount: data.amount,
                    category: data.category,
                    date: data.date,
                    time: data.time || this.expenses[index].time || '',
                    paymentMethod: data.paymentMethod,
                    notes: data.notes || ''
                };
            } else {
                await this.loadAll();
            }
            return { success: true, budgetAlerts: res.data.budgetAlerts };
        } else {
            showToast(res.error || 'Failed to update expense.', 'error');
            return { success: false, error: res.error };
        }
    },

    async deleteExpense(id) {
        const res = await apiRequest(`/api/expenses/${id}`, {
            method: 'DELETE'
        });

        if (res.ok && res.data && res.data.success) {
            this.expenses = this.expenses.filter(e => e.id !== id);
            return { success: true };
        } else {
            showToast(res.error || 'Failed to delete expense.', 'error');
            return { success: false, error: res.error };
        }
    },

    async addIncome(data) {
        const res = await apiRequest('/api/income', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (res.ok && res.data && res.data.success) {
            if (res.data.income) {
                this.income.unshift(res.data.income);
            } else {
                await this.loadAll();
            }
            return { success: true, income: res.data.income };
        } else {
            showToast(res.error || 'Failed to add income.', 'error');
            return { success: false, error: res.error };
        }
    },

    async updateIncome(id, data) {
        const res = await apiRequest(`/api/income/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (res.ok && res.data && res.data.success) {
            const index = this.income.findIndex(i => i.id === id);
            if (index !== -1) {
                this.income[index] = {
                    ...this.income[index],
                    title: data.title || data.notes || this.income[index].title,
                    amount: data.amount,
                    category: data.category || data.source,
                    date: data.date,
                    time: data.time || this.income[index].time || '',
                    notes: data.notes || ''
                };
            } else {
                await this.loadAll();
            }
            return { success: true };
        } else {
            showToast(res.error || 'Failed to update income.', 'error');
            return { success: false, error: res.error };
        }
    },

    async deleteIncome(id) {
        const res = await apiRequest(`/api/income/${id}`, {
            method: 'DELETE'
        });

        if (res.ok && res.data && res.data.success) {
            this.income = this.income.filter(i => i.id !== id);
            return { success: true };
        } else {
            showToast(res.error || 'Failed to delete income.', 'error');
            return { success: false, error: res.error };
        }
    },

    getSummary(yearMonth = null) {
        const allTxs = this.getTransactions();
        let targetMonth = yearMonth || new Date().toISOString().slice(0, 7);
        let monthTxs = allTxs.filter(t => t.date && t.date.startsWith(targetMonth));

        if (monthTxs.length === 0 && !yearMonth && allTxs.length > 0) {
            const availableMonths = [...new Set(allTxs.map(t => t.date ? t.date.slice(0, 7) : null).filter(Boolean))].sort();
            if (availableMonths.length > 0) {
                targetMonth = availableMonths[availableMonths.length - 1];
                monthTxs = allTxs.filter(t => t.date && t.date.startsWith(targetMonth));
            }
        }

        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryMap = {};

        monthTxs.forEach(tx => {
            const amt = Math.abs(parseFloat(tx.amount)) || 0;
            if (tx.type === 'income') {
                totalIncome += amt;
            } else {
                totalExpenses += amt;
                categoryMap[tx.category] = (categoryMap[tx.category] || 0) + amt;
            }
        });

        let allTimeIncome = 0;
        let allTimeExpenses = 0;
        allTxs.forEach(tx => {
            const amt = Math.abs(parseFloat(tx.amount)) || 0;
            if (tx.type === 'income') allTimeIncome += amt;
            else allTimeExpenses += amt;
        });

        const balance = totalIncome - totalExpenses;
        const savingsAmount = Math.max(0, balance);
        const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

        const budgets = this.getBudgets();
        const totalBudget = budgets.totalBudget || 35000;
        const remainingBudget = totalBudget - totalExpenses;
        const budgetUsedPct = totalBudget > 0 ? ((totalExpenses / totalBudget) * 100).toFixed(1) : 0;

        let budgetStatus = 'normal';
        if (budgetUsedPct >= 90) budgetStatus = 'critical';
        else if (budgetUsedPct >= 70) budgetStatus = 'warning';

        return {
            targetMonth,
            totalIncome,
            totalExpenses,
            balance,
            savingsAmount,
            savingsRate,
            allTimeIncome,
            allTimeExpenses,
            totalBudget,
            remainingBudget,
            budgetUsedPct,
            budgetStatus,
            categoryMap,
            monthCount: monthTxs.length,
            allCount: allTxs.length,
            incomeCount: monthTxs.filter(t => t.type === 'income').length,
            expenseCount: monthTxs.filter(t => t.type === 'expense').length
        };
    },

    async resetToDefault() {
        const res = await apiRequest('/api/data/reset', { method: 'POST' });
        if (res.ok && res.data && res.data.success) {
            await this.loadAll();
            showToast('Sample data restored on server.', 'info');
            return { success: true };
        } else {
            showToast(res.error || 'Failed to reset sample data.', 'error');
            return { success: false, error: res.error };
        }
    },

    async clearAll() {
        const res = await apiRequest('/api/data/clear', { method: 'POST' });
        if (res.ok && res.data && res.data.success) {
            this.expenses = [];
            this.income = [];
            this.budgets = { totalBudget: 35000, categories: {} };
            showToast('All financial records cleared from server.', 'info');
            return { success: true };
        } else {
            showToast(res.error || 'Failed to clear financial data.', 'error');
            return { success: false, error: res.error };
        }
    }
};

// =========================================================
// 4. UI TOAST & FORMATTING UTILITIES
// =========================================================

function showToast(message, type = 'info') {
    let container = document.getElementById('sf-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sf-toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}
window.showToast = showToast;

function formatCurrency(amount) {
    const settings = FinanceStore.getSettings();
    const sym = settings.currencySymbol || '₹';
    const num = Math.round(Number(amount) || 0);
    const absStr = Math.abs(num).toLocaleString('en-IN');
    return num < 0 ? `-${sym}${absStr}` : `${sym}${absStr}`;
}
window.formatCurrency = formatCurrency;

function getCurrentLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
window.getCurrentLocalDate = getCurrentLocalDate;

function getCurrentLocalTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
window.getCurrentLocalTime = getCurrentLocalTime;

function getTransactionTimestamp(tx) {
    if (!tx || !tx.date) return 0;
    const dateStr = tx.date;
    const timeStr = (tx.time && tx.time.trim()) ? tx.time.trim() : '00:00';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const timeParts = timeStr.split(':');
        const hours = parseInt(timeParts[0] || '0', 10);
        const minutes = parseInt(timeParts[1] || '0', 10);
        return new Date(year, month, day, hours, minutes).getTime();
    }
    return new Date(`${dateStr}T${timeStr}`).getTime() || 0;
}
window.getTransactionTimestamp = getTransactionTimestamp;

function formatDateDisplay(dateStr, timeStr) {
    if (!dateStr) return '';
    let formattedDate = dateStr;
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = parseInt(parts[2], 10);
            const monthName = months[parseInt(parts[1], 10) - 1];
            const year = parts[0];
            formattedDate = `${day} ${monthName} ${year}`;
        }
    } catch (e) {}

    if (!timeStr || !timeStr.trim()) {
        return formattedDate;
    }

    try {
        const timeParts = timeStr.trim().split(':');
        let hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1] || '0', 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            if (hours === 0) hours = 12;
            const hoursStr = String(hours).padStart(2, '0');
            const minutesStr = String(minutes).padStart(2, '0');
            return `${formattedDate} • ${hoursStr}:${minutesStr} ${ampm}`;
        }
    } catch (e) {}

    return formattedDate;
}
window.formatDateDisplay = formatDateDisplay;

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.togglePasswordVisibility = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        }
    }
};

window.checkPasswordStrength = function(password) {
    let score = 0;
    if (!password) return 'none';
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return 'weak';
    if (score === 2) return 'fair';
    if (score <= 4) return 'good';
    return 'strong';
};

window.toggleMobileSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    let backdrop = document.getElementById('sfSidebarBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sfSidebarBackdrop';
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', () => {
            sidebar.classList.remove('open');
            backdrop.classList.remove('active');
        });
    }

    const isOpen = sidebar.classList.toggle('open');
    if (isOpen) {
        backdrop.classList.add('active');
    } else {
        backdrop.classList.remove('active');
    }
};

// =========================================================
// 5. UNIFIED MODAL SYSTEM (Add & Edit Transactions & Budgets)
// =========================================================

let currentEditingTransactionId = null;

function openTransactionModal(type = 'expense', existingId = null) {
    let modal = document.getElementById('transactionModal');
    if (!modal) {
        createTransactionModal();
        modal = document.getElementById('transactionModal');
    }

    currentEditingTransactionId = existingId;
    const modalTitle = document.getElementById('modalTitle');
    const submitBtnText = document.getElementById('modalSubmitText');
    const typeIncomeRadio = document.getElementById('modalTypeIncome');
    const typeExpenseRadio = document.getElementById('modalTypeExpense');
    const paymentMethodGroup = document.getElementById('modalPaymentGroup');

    if (existingId) {
        const tx = FinanceStore.getTransactionById(existingId);
        if (tx) {
            modalTitle.textContent = `Edit ${tx.type === 'income' ? 'Income' : 'Expense'}`;
            if (submitBtnText) submitBtnText.textContent = 'Save Changes';

            if (tx.type === 'income') {
                typeIncomeRadio.checked = true;
                if (paymentMethodGroup) paymentMethodGroup.style.display = 'none';
            } else {
                typeExpenseRadio.checked = true;
                if (paymentMethodGroup) paymentMethodGroup.style.display = 'block';
            }

            updateCategoryOptions(tx.type);
            document.getElementById('modalTitleInput').value = tx.title || '';
            document.getElementById('modalAmount').value = tx.amount || '';
            document.getElementById('modalCategory').value = tx.category || '';
            document.getElementById('modalDate').value = tx.date || getCurrentLocalDate();
            document.getElementById('modalTime').value = (tx.time && tx.time.trim()) ? tx.time.trim() : '00:00';
            document.getElementById('modalPaymentMethod').value = tx.paymentMethod || 'UPI';
            document.getElementById('modalNotes').value = tx.notes || '';

            modal.classList.add('active');
            return;
        }
    }

    if (type === 'income') {
        typeIncomeRadio.checked = true;
        modalTitle.textContent = 'Add New Income';
        if (paymentMethodGroup) paymentMethodGroup.style.display = 'none';
    } else {
        typeExpenseRadio.checked = true;
        modalTitle.textContent = 'Add New Expense';
        if (paymentMethodGroup) paymentMethodGroup.style.display = 'block';
    }

    if (submitBtnText) submitBtnText.textContent = 'Save Transaction';
    updateCategoryOptions(type);
    document.getElementById('modalTitleInput').value = '';
    document.getElementById('modalAmount').value = '';
    document.getElementById('modalDate').value = getCurrentLocalDate();
    document.getElementById('modalTime').value = getCurrentLocalTime();
    document.getElementById('modalPaymentMethod').value = 'UPI';
    document.getElementById('modalNotes').value = '';

    modal.classList.add('active');
}

function closeTransactionModal() {
    const modal = document.getElementById('transactionModal');
    if (modal) modal.classList.remove('active');
    currentEditingTransactionId = null;
}

function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('modalCategory');
    const paymentMethodGroup = document.getElementById('modalPaymentGroup');
    if (!categorySelect) return;

    if (paymentMethodGroup) {
        paymentMethodGroup.style.display = type === 'income' ? 'none' : 'block';
    }

    categorySelect.innerHTML = '';
    const cats = type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES;
    cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });
}

function createTransactionModal() {
    const modal = document.createElement('div');
    modal.id = 'transactionModal';
    modal.className = 'sf-modal-overlay';
    modal.innerHTML = `
        <div class="sf-modal-box">
            <div class="sf-modal-header">
                <div class="sf-modal-title-wrap">
                    <i class="fa-solid fa-receipt modal-icon"></i>
                    <h3 id="modalTitle">Add Transaction</h3>
                </div>
                <button type="button" class="close-modal-btn" onclick="closeTransactionModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form id="sfTransactionForm" onsubmit="handleTransactionSubmit(event)">
                <div class="form-group">
                    <label>Transaction Type</label>
                    <div class="type-selector-pills">
                        <label class="pill-option">
                            <input type="radio" name="txType" id="modalTypeExpense" value="expense" checked onchange="updateCategoryOptions('expense')">
                            <span><i class="fa-solid fa-arrow-up"></i> Expense</span>
                        </label>
                        <label class="pill-option">
                            <input type="radio" name="txType" id="modalTypeIncome" value="income" onchange="updateCategoryOptions('income')">
                            <span><i class="fa-solid fa-arrow-down"></i> Income</span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label for="modalTitleInput">Description / Payee</label>
                    <div class="input-box">
                        <i class="fa-solid fa-tag"></i>
                        <input type="text" id="modalTitleInput" placeholder="e.g. Grocery store, Salary payout" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="modalAmount">Amount (${FinanceStore.getSettings().currencySymbol})</label>
                        <div class="input-box">
                            <i class="fa-solid fa-coins"></i>
                            <input type="number" id="modalAmount" step="any" min="0.01" placeholder="0.00" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="modalCategory">Category / Source</label>
                        <div class="input-box">
                            <i class="fa-solid fa-layer-group"></i>
                            <select id="modalCategory" required></select>
                        </div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="modalDate">Date</label>
                        <div class="input-box">
                            <i class="fa-solid fa-calendar"></i>
                            <input type="date" id="modalDate" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="modalTime">Time</label>
                        <div class="input-box">
                            <i class="fa-solid fa-clock"></i>
                            <input type="time" id="modalTime" required>
                        </div>
                    </div>
                </div>

                <div class="form-row" id="modalPaymentGroup">
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label for="modalPaymentMethod">Payment Method</label>
                        <div class="input-box">
                            <i class="fa-solid fa-credit-card"></i>
                            <select id="modalPaymentMethod">
                                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Debit Card">Debit Card</option>
                                <option value="Cash">Cash</option>
                                <option value="Net Banking">Net Banking</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="modalNotes">Optional Notes</label>
                    <div class="input-box">
                        <i class="fa-solid fa-note-sticky"></i>
                        <input type="text" id="modalNotes" placeholder="Additional details or tag...">
                    </div>
                </div>

                <div class="sf-modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeTransactionModal()">Cancel</button>
                    <button type="submit" class="navy-btn" id="modalSubmitBtn">
                        <i class="fa-solid fa-check"></i> <span id="modalSubmitText">Save Transaction</span>
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeTransactionModal();
    });
}

async function handleTransactionSubmit(event) {
    event.preventDefault();
    const type = document.querySelector('input[name="txType"]:checked').value;
    const title = document.getElementById('modalTitleInput').value.trim();
    const amount = parseFloat(document.getElementById('modalAmount').value);
    const category = document.getElementById('modalCategory').value;
    const date = document.getElementById('modalDate').value;
    const time = document.getElementById('modalTime').value;
    const paymentMethod = document.getElementById('modalPaymentMethod').value;
    const notes = document.getElementById('modalNotes').value.trim();

    if (!title || isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid title and positive amount.', 'error');
        return;
    }

    const submitBtn = document.getElementById('modalSubmitBtn');
    if (submitBtn) submitBtn.disabled = true;

    try {
        let res;
        if (currentEditingTransactionId) {
            if (type === 'income') {
                res = await FinanceStore.updateIncome(currentEditingTransactionId, {
                    title, amount, category, source: category, date, time, notes
                });
            } else {
                res = await FinanceStore.updateExpense(currentEditingTransactionId, {
                    title, amount, category, date, time, paymentMethod, notes
                });
            }
            if (res && res.success) {
                showToast(`Transaction updated successfully!`, 'success');
            }
        } else {
            if (type === 'income') {
                res = await FinanceStore.addIncome({
                    title, amount, category, source: category, date, time, notes
                });
            } else {
                res = await FinanceStore.addExpense({
                    title, amount, category, date, time, paymentMethod, notes
                });
            }
            if (res && res.success) {
                showToast(`${type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(amount)} added!`, 'success');
                if (res.budgetAlerts && res.budgetAlerts.length > 0) {
                    res.budgetAlerts.forEach(alertMsg => showToast(alertMsg, 'warning'));
                }
            }
        }

        if (res && res.success) {
            closeTransactionModal();
            renderCurrentPage();
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function deleteTransactionItem(id, title) {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
        const tx = FinanceStore.getTransactionById(id);
        const isIncome = (tx && tx.type === 'income') || (id && (String(id).startsWith('inc') || String(id).includes('inc_')));
        let res;
        if (isIncome) {
            res = await FinanceStore.deleteIncome(id);
        } else {
            res = await FinanceStore.deleteExpense(id);
        }

        if (res && res.success) {
            showToast(`Deleted "${title}"`, 'info');
            renderCurrentPage();
        }
    }
}

function editTransactionItem(id) {
    const tx = FinanceStore.getTransactionById(id);
    if (tx) {
        openTransactionModal(tx.type, id);
    } else {
        const isIncome = id && (String(id).startsWith('inc') || String(id).includes('inc_'));
        openTransactionModal(isIncome ? 'income' : 'expense', id);
    }
}

window.openTransactionModal = openTransactionModal;
window.closeTransactionModal = closeTransactionModal;
window.handleTransactionSubmit = handleTransactionSubmit;
window.editTransactionItem = editTransactionItem;
window.deleteTransactionItem = deleteTransactionItem;

window.showIncomeMessage = function() {
    openTransactionModal('income');
};

window.showExpenseMessage = function() {
    openTransactionModal('expense');
};

window.editTransaction = function(id) {
    editTransactionItem(id);
};

window.deleteTransaction = function(id, title) {
    deleteTransactionItem(id, title);
};

// Budget Setting Modal
function openBudgetModal() {
    let modal = document.getElementById('budgetModal');
    if (!modal) {
        createBudgetModal();
        modal = document.getElementById('budgetModal');
    }

    const budgets = FinanceStore.getBudgets();
    document.getElementById('modalTotalBudgetInput').value = budgets.totalBudget || 35000;

    EXPENSE_CATEGORIES.forEach(cat => {
        const input = document.getElementById(`modalCatBudget_${cat}`);
        if (input) {
            input.value = (budgets.categories && budgets.categories[cat]) || 0;
        }
    });

    modal.classList.add('active');
}

function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (modal) modal.classList.remove('active');
}

function createBudgetModal() {
    const modal = document.createElement('div');
    modal.id = 'budgetModal';
    modal.className = 'sf-modal-overlay';
    const sym = FinanceStore.getSettings().currencySymbol || '₹';

    let catInputsHTML = EXPENSE_CATEGORIES.map(cat => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
            <label style="font-size:0.85rem; font-weight:600; color:#334155; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid ${(CATEGORY_ICONS[cat] && CATEGORY_ICONS[cat].icon) || 'fa-tag'}" style="color:var(--navy); width:16px;"></i>
                ${cat}
            </label>
            <div style="display:flex; align-items:center; gap:4px; max-width:140px;">
                <span style="color:#64748b; font-size:0.85rem;">${sym}</span>
                <input type="number" id="modalCatBudget_${cat}" min="0" step="100" style="padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; width:100%; font-size:0.85rem;" placeholder="0">
            </div>
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="sf-modal-box" style="max-width: 540px; max-height: 90vh; overflow-y: auto;">
            <div class="sf-modal-header">
                <div class="sf-modal-title-wrap">
                    <i class="fa-solid fa-bullseye modal-icon"></i>
                    <h3>Monthly Budget Settings</h3>
                </div>
                <button type="button" class="close-modal-btn" onclick="closeBudgetModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form id="sfBudgetForm" onsubmit="handleBudgetSubmit(event)">
                <div class="form-group" style="background:#f8fafc; padding:16px; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:20px;">
                    <label style="font-weight:700; color:var(--navy); font-size:0.95rem;">Total Monthly Budget Ceiling</label>
                    <p style="font-size:0.8rem; color:#64748b; margin-bottom:10px;">Set the total maximum amount you plan to spend across all categories this month.</p>
                    <div class="input-box">
                        <i class="fa-solid fa-wallet"></i>
                        <input type="number" id="modalTotalBudgetInput" min="1000" step="500" required>
                    </div>
                </div>

                <div class="form-group">
                    <label style="font-weight:700; color:#1e293b; font-size:0.9rem; margin-bottom:8px; display:block;">Category-wise Budgets (Optional Targets)</label>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        ${catInputsHTML}
                    </div>
                </div>

                <div class="sf-modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeBudgetModal()">Cancel</button>
                    <button type="submit" class="navy-btn">
                        <i class="fa-solid fa-check"></i> Save Budgets
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeBudgetModal();
    });
}

async function handleBudgetSubmit(event) {
    event.preventDefault();
    const total = parseFloat(document.getElementById('modalTotalBudgetInput').value);
    if (isNaN(total) || total <= 0) {
        showToast('Please enter a valid total budget limit.', 'error');
        return;
    }

    const categories = {};
    EXPENSE_CATEGORIES.forEach(cat => {
        const input = document.getElementById(`modalCatBudget_${cat}`);
        if (input) {
            categories[cat] = Math.max(0, parseFloat(input.value) || 0);
        }
    });

    const res = await FinanceStore.saveBudgets({ totalBudget: total, categories });
    if (res && res.success) {
        closeBudgetModal();
        showToast(`Monthly budget set to ${formatCurrency(total)}`, 'success');
        renderCurrentPage();
    }
}

window.openBudgetModal = openBudgetModal;
window.closeBudgetModal = closeBudgetModal;
window.handleBudgetSubmit = handleBudgetSubmit;

// =========================================================
// 6. PAGE RENDERERS
// =========================================================

async function renderCurrentPage() {
    const path = window.location.pathname.toLowerCase();
    const protectedPages = ['dashboard', 'expenses', 'income', 'analytics', 'ai-assistant', 'profile'];
    const isProtected = protectedPages.some(page => path.includes(page));

    let currentUser = null;

    if (isProtected) {
        currentUser = await AuthManager.checkAuthSession();
        if (!currentUser) {
            return;
        }
        await FinanceStore.loadAll();
    } else if (AuthManager.isAuthenticated()) {
        if (path.includes('login.html') || path.includes('register.html')) {
            window.location.href = 'dashboard.html';
            return;
        }
        currentUser = AuthManager.getCurrentUser();
    }

    updateUserNavUI(currentUser);

    if (path.includes('dashboard.html')) {
        renderDashboard();
    } else if (path.includes('income.html')) {
        renderIncomePage();
    } else if (path.includes('expenses.html')) {
        renderExpensesPage();
    } else if (path.includes('analytics.html')) {
        renderAnalyticsPage();
    } else if (path.includes('ai-assistant.html')) {
        renderAIAssistantPage();
    } else if (path.includes('profile.html')) {
        renderProfilePage(currentUser);
    }
}

function updateUserNavUI(activeUser) {
    const user = activeUser || AuthManager.getCurrentUser();
    const profileLink = document.querySelector('.topbar-user-pill, .profile-icon');
    if (!profileLink) return;

    if (!user) {
        profileLink.style.display = 'none';
        return;
    }
    profileLink.style.display = 'inline-flex';

    const displayName = user.name || user.email || 'User';
    const displayEmail = user.email || '';
    const userAvatar = getAvatarForUser(user);

    profileLink.className = 'topbar-user-pill';
    profileLink.setAttribute('href', 'javascript:void(0)');
    profileLink.onclick = (e) => {
        e.stopPropagation();
        toggleUserDropdown();
    };

    let avatarImg = profileLink.querySelector('.nav-user-avatar');
    let userNameSpan = profileLink.querySelector('.nav-user-name');

    if (avatarImg && userNameSpan) {
        avatarImg.src = userAvatar;
        avatarImg.alt = displayName;
        userNameSpan.textContent = displayName;
    } else {
        profileLink.innerHTML = `
            <img src="${escapeHTML(userAvatar)}" alt="${escapeHTML(displayName)}" class="nav-user-avatar" onerror="this.onerror=null; this.src=generateAvatarSVG('${escapeHTML(displayName)}', '${escapeHTML(displayEmail)}');">
            <div class="nav-user-meta">
                <span class="nav-user-name">${escapeHTML(displayName)}</span>
            </div>
            <i class="fa-solid fa-chevron-down nav-user-arrow"></i>
        `;
    }

    let menu = document.getElementById('topbarUserDropdown');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'topbarUserDropdown';
        menu.className = 'topbar-user-dropdown';
        document.body.appendChild(menu);

        document.addEventListener('click', (e) => {
            if (menu.classList.contains('active') && !menu.contains(e.target) && !profileLink.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    }

    const allUsers = AuthManager.getUsers();
    const otherUsers = allUsers.filter(u => u.email.toLowerCase() !== (user.email || '').toLowerCase());

    menu.innerHTML = `
        <div class="dropdown-header">
            <img src="${escapeHTML(userAvatar)}" alt="Avatar" class="dropdown-avatar" onerror="this.onerror=null; this.src=generateAvatarSVG('${escapeHTML(user.name)}', '${escapeHTML(user.email)}');">
            <div>
                <div class="dropdown-name">${escapeHTML(user.name)}</div>
                <div class="dropdown-email">${escapeHTML(user.email)}</div>
                <span class="dropdown-auth-badge"><i class="fa-solid fa-shield-halved"></i> ${escapeHTML(user.authProvider || 'Email Verified')}</span>
            </div>
        </div>
        <div class="dropdown-divider"></div>
        <a href="profile.html" class="dropdown-item">
            <i class="fa-solid fa-sliders"></i> Profile & Settings
        </a>
        ${otherUsers.length > 0 ? `
            <div class="dropdown-section-title">Switch Account</div>
            ${otherUsers.map(u => `
                <a href="javascript:void(0)" onclick="AuthManager.switchUserAccount('${escapeHTML(u.email)}')" class="dropdown-item switch-item">
                    <img src="${escapeHTML(getAvatarForUser(u))}" class="mini-avatar">
                    <div style="overflow:hidden; text-overflow:ellipsis;">
                        <div style="font-weight:600; font-size:0.84rem; color:var(--navy);">${escapeHTML(u.name)}</div>
                        <div style="font-size:0.75rem; color:var(--text-light);">${escapeHTML(u.email)}</div>
                    </div>
                </a>
            `).join('')}
        ` : ''}
        <div class="dropdown-divider"></div>
        <a href="javascript:void(0)" onclick="AuthManager.logout()" class="dropdown-item logout-item">
            <i class="fa-solid fa-right-from-bracket"></i> Sign Out
        </a>
    `;
}

function toggleUserDropdown() {
    const menu = document.getElementById('topbarUserDropdown');
    if (menu) menu.classList.toggle('active');
}
window.toggleUserDropdown = toggleUserDropdown;

// ---------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------
function renderDashboard() {
    const summary = FinanceStore.getSummary();
    const transactions = FinanceStore.getTransactions();
    const budgets = FinanceStore.getBudgets();

    // Summary Cards
    const balanceEl = document.querySelector('.balance-card h2');
    const incomeEl = document.querySelector('.income-icon + div h2, .summary-card:nth-child(2) h2');
    const expenseEl = document.querySelector('.expense-icon + div h2, .summary-card:nth-child(3) h2');
    const savingsEl = document.querySelector('.saving-icon + div h2, .summary-card:nth-child(4) h2');
    const savingsSmall = document.querySelector('.saving-icon + div small, .summary-card:nth-child(4) small');

    if (balanceEl) balanceEl.textContent = formatCurrency(summary.balance);
    if (incomeEl) incomeEl.textContent = formatCurrency(summary.totalIncome);
    if (expenseEl) expenseEl.textContent = formatCurrency(summary.totalExpenses);
    if (savingsEl) savingsEl.textContent = formatCurrency(summary.savingsAmount);
    if (savingsSmall) savingsSmall.textContent = `${summary.savingsRate}% of income saved`;

    // Render Budget Progress Widget
    let budgetSection = document.getElementById('dashboardBudgetSection');
    if (!budgetSection) {
        const quickActions = document.querySelector('.quick-actions');
        if (quickActions) {
            budgetSection = document.createElement('div');
            budgetSection.id = 'dashboardBudgetSection';
            quickActions.parentNode.insertBefore(budgetSection, quickActions);
        }
    }

    if (budgetSection) {
        const pct = Math.min(100, Math.round(summary.budgetUsedPct));
        let pillClass = summary.budgetStatus;
        let pillText = 'Healthy';
        let pillIcon = 'fa-circle-check';

        if (summary.budgetStatus === 'critical') {
            pillText = pct >= 100 ? 'Budget Exceeded!' : 'Critical (>90%)';
            pillIcon = 'fa-triangle-exclamation';
        } else if (summary.budgetStatus === 'warning') {
            pillText = 'Warning (70-90%)';
            pillIcon = 'fa-circle-exclamation';
        }

        budgetSection.innerHTML = `
            <div class="budget-progress-section">
                <div class="budget-header-row">
                    <h3>
                        <i class="fa-solid fa-bullseye"></i>
                        Monthly Budget Progress
                    </h3>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span class="budget-status-pill ${pillClass}">
                            <i class="fa-solid ${pillIcon}"></i> ${pillText}
                        </span>
                        <button type="button" class="cancel-btn small-btn" onclick="openBudgetModal()" style="padding:6px 12px; font-size:0.8rem;">
                            <i class="fa-solid fa-sliders"></i> Adjust
                        </button>
                    </div>
                </div>

                <div class="progress-track">
                    <div class="progress-fill ${summary.budgetStatus}" style="width: ${pct}%;"></div>
                </div>

                <div class="budget-meta-row">
                    <div>
                        Spent: <strong>${formatCurrency(summary.totalExpenses)}</strong> of <strong>${formatCurrency(summary.totalBudget)}</strong>
                    </div>
                    <div>
                        Remaining: <strong style="color: ${summary.remainingBudget < 0 ? '#dc2626' : 'var(--navy)'}">${formatCurrency(summary.remainingBudget)}</strong> (${pct}% used)
                    </div>
                </div>
            </div>
        `;
    }

    // Spending by Category Bars (Top 4 Categories)
    let categorySection = document.getElementById('dashboardCategorySection');
    if (!categorySection) {
        const transCard = document.querySelector('.content-card');
        if (transCard) {
            categorySection = document.createElement('div');
            categorySection.id = 'dashboardCategorySection';
            categorySection.className = 'content-card';
            transCard.parentNode.insertBefore(categorySection, transCard);
        }
    }

    if (categorySection) {
        const sortedCats = Object.entries(summary.categoryMap).sort((a, b) => b[1] - a[1]);
        let catBarsHTML = '';

        if (sortedCats.length === 0) {
            catBarsHTML = `<p style="color:#64748b; font-size:0.88rem; text-align:center; padding:15px 0;">No expense categories recorded this month.</p>`;
        } else {
            catBarsHTML = `<div class="category-bars-list">` + sortedCats.slice(0, 4).map(([cat, amt]) => {
                const catBudget = (budgets.categories && budgets.categories[cat]) || 0;
                const catInfo = CATEGORY_ICONS[cat] || { icon: 'fa-tags', color: '#173d82' };
                const pctOfTotal = summary.totalExpenses > 0 ? Math.round((amt / summary.totalExpenses) * 100) : 0;
                const pctOfBudget = catBudget > 0 ? Math.min(100, Math.round((amt / catBudget) * 100)) : pctOfTotal;

                return `
                    <div class="category-bar-item">
                        <div class="cat-bar-header">
                            <span class="cat-name">
                                <i class="fa-solid ${catInfo.icon}" style="color:${catInfo.color}; width:16px;"></i>
                                ${cat}
                                ${catBudget > 0 ? `<small style="color:#64748b; font-weight:normal;">(Target: ${formatCurrency(catBudget)})</small>` : ''}
                            </span>
                            <span class="cat-amount">${formatCurrency(amt)} <small style="color:#64748b; font-weight:normal;">(${pctOfTotal}%)</small></span>
                        </div>
                        <div class="cat-progress-track">
                            <div class="cat-progress-fill" style="width: ${pctOfBudget}%; background: ${catInfo.color};"></div>
                        </div>
                    </div>
                `;
            }).join('') + `</div>`;
        }

        categorySection.innerHTML = `
            <div class="card-heading">
                <div>
                    <h2>Top Spending Categories</h2>
                    <p>Current month allocation and targets</p>
                </div>
                <a href="expenses.html" style="font-size:0.82rem; color:var(--navy); font-weight:600;">View All <i class="fa-solid fa-arrow-right"></i></a>
            </div>
            ${catBarsHTML}
        `;
    }

    // Dynamic Recent Transactions (Top 6)
    const listContainer = document.querySelector('.transaction-list');
    if (listContainer) {
        const recents = transactions.slice(0, 6);
        if (recents.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-wallet"></i>
                    <p>No transactions recorded yet.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = recents.map(tx => {
            const isInc = tx.type === 'income';
            const catInfo = CATEGORY_ICONS[tx.category] || { icon: isInc ? 'fa-arrow-down' : 'fa-receipt', color: isInc ? '#15803d' : '#dc2626' };
            const sign = isInc ? '+' : '-';
            const textClass = isInc ? 'income-text' : 'expense-text';
            const iconClass = isInc ? 'income' : 'expense';

            return `
                <div class="transaction">
                    <div class="transaction-icon ${iconClass}">
                        <i class="fa-solid ${catInfo.icon}"></i>
                    </div>
                    <div class="transaction-info">
                        <strong>${escapeHTML(tx.title)}</strong>
                        <span>
                            ${escapeHTML(tx.category)} • ${formatDateDisplay(tx.date, tx.time)}
                            ${!isInc && tx.paymentMethod ? ` • <span class="payment-badge">${escapeHTML(tx.paymentMethod)}</span>` : ''}
                        </span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <strong class="amount ${textClass}">${sign}${formatCurrency(tx.amount)}</strong>
                        <div class="action-btns">
                            <button class="edit-icon-btn" onclick="editTransactionItem('${tx.id}')" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="delete-icon-btn" onclick="deleteTransactionItem('${tx.id}', '${escapeHTML(tx.title)}')" title="Delete">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ---------------------------------------------------------
// EXPENSES MANAGEMENT PAGE
// ---------------------------------------------------------
let expenseFilterState = {
    search: '',
    category: 'ALL',
    timeframe: 'ALL',
    sort: 'NEWEST'
};

function renderExpensesPage() {
    const summary = FinanceStore.getSummary();
    const allExpenses = FinanceStore.getTransactions().filter(t => t.type === 'expense');

    const totalEl = document.querySelector('.expense-icon + div h2');
    const countEl = document.querySelector('.summary-card:nth-child(2) h2');
    if (totalEl) totalEl.textContent = formatCurrency(summary.totalExpenses);
    if (countEl) countEl.textContent = allExpenses.length.toString();

    let filterContainer = document.getElementById('expenseFilterToolbar');
    if (!filterContainer) {
        const contentCard = document.querySelector('.content-card');
        if (contentCard) {
            filterContainer = document.createElement('div');
            filterContainer.id = 'expenseFilterToolbar';
            filterContainer.className = 'filter-toolbar';
            contentCard.parentNode.insertBefore(filterContainer, contentCard);
        }
    }

    if (filterContainer) {
        filterContainer.innerHTML = `
            <div class="filter-search-wrap">
                <div class="filter-search-box">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="expenseSearchInput" placeholder="Search expenses by title or note..." value="${escapeHTML(expenseFilterState.search)}" oninput="onExpenseSearchChange(this.value)">
                </div>
            </div>

            <div class="filter-controls-wrap">
                <div class="filter-group">
                    <label><i class="fa-solid fa-layer-group"></i> Category:</label>
                    <select class="filter-select" id="expenseCategoryFilter" onchange="onExpenseCategoryChange(this.value)">
                        <option value="ALL">All Categories</option>
                        ${EXPENSE_CATEGORIES.map(c => `<option value="${c}" ${expenseFilterState.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label><i class="fa-solid fa-calendar"></i> Date:</label>
                    <select class="filter-select" id="expenseDateFilter" onchange="onExpenseDateChange(this.value)">
                        <option value="ALL" ${expenseFilterState.timeframe === 'ALL' ? 'selected' : ''}>All Time</option>
                        <option value="THIS_MONTH" ${expenseFilterState.timeframe === 'THIS_MONTH' ? 'selected' : ''}>This Month</option>
                        <option value="LAST_30" ${expenseFilterState.timeframe === 'LAST_30' ? 'selected' : ''}>Last 30 Days</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label><i class="fa-solid fa-arrow-down-short-wide"></i> Sort:</label>
                    <select class="filter-select" id="expenseSortFilter" onchange="onExpenseSortChange(this.value)">
                        <option value="NEWEST" ${expenseFilterState.sort === 'NEWEST' ? 'selected' : ''}>Newest First</option>
                        <option value="OLDEST" ${expenseFilterState.sort === 'OLDEST' ? 'selected' : ''}>Oldest First</option>
                        <option value="HIGHEST" ${expenseFilterState.sort === 'HIGHEST' ? 'selected' : ''}>Highest Amount</option>
                        <option value="LOWEST" ${expenseFilterState.sort === 'LOWEST' ? 'selected' : ''}>Lowest Amount</option>
                    </select>
                </div>
            </div>
        `;
    }

    let filtered = allExpenses.filter(tx => {
        if (expenseFilterState.search) {
            const term = expenseFilterState.search.toLowerCase();
            const matchesTitle = tx.title && tx.title.toLowerCase().includes(term);
            const matchesNotes = tx.notes && tx.notes.toLowerCase().includes(term);
            if (!matchesTitle && !matchesNotes) return false;
        }
        if (expenseFilterState.category !== 'ALL' && tx.category !== expenseFilterState.category) {
            return false;
        }
        if (expenseFilterState.timeframe === 'THIS_MONTH') {
            const currMonth = new Date().toISOString().slice(0, 7);
            if (!tx.date || !tx.date.startsWith(currMonth)) return false;
        } else if (expenseFilterState.timeframe === 'LAST_30') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            if (new Date(tx.date) < cutoff) return false;
        }
        return true;
    });

    filtered.sort((a, b) => {
        if (expenseFilterState.sort === 'NEWEST') return getTransactionTimestamp(b) - getTransactionTimestamp(a);
        if (expenseFilterState.sort === 'OLDEST') return getTransactionTimestamp(a) - getTransactionTimestamp(b);
        if (expenseFilterState.sort === 'HIGHEST') return b.amount - a.amount;
        if (expenseFilterState.sort === 'LOWEST') return a.amount - b.amount;
        return 0;
    });

    const listContainer = document.querySelector('.transaction-list');
    if (listContainer) {
        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-receipt"></i>
                    <p>No expenses match your active filter.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filtered.map(tx => {
            const catInfo = CATEGORY_ICONS[tx.category] || { icon: 'fa-receipt', color: '#dc2626' };
            const paymentPill = tx.paymentMethod ? `<span class="payment-badge ${tx.paymentMethod.toLowerCase().replace(/\s+/g, '')}"><i class="fa-solid fa-credit-card"></i> ${escapeHTML(tx.paymentMethod)}</span>` : '';

            return `
                <div class="transaction">
                    <div class="transaction-icon expense">
                        <i class="fa-solid ${catInfo.icon}"></i>
                    </div>
                    <div class="transaction-info">
                        <strong>${escapeHTML(tx.title)}</strong>
                        <span>
                            ${escapeHTML(tx.category)} • ${formatDateDisplay(tx.date)}
                            ${paymentPill ? ' • ' + paymentPill : ''}
                            ${tx.notes ? ' • ' + escapeHTML(tx.notes) : ''}
                        </span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <strong class="amount expense-text">-${formatCurrency(tx.amount)}</strong>
                        <div class="action-btns">
                            <button class="edit-icon-btn" onclick="editTransactionItem('${tx.id}')" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="delete-icon-btn" onclick="deleteTransactionItem('${tx.id}', '${escapeHTML(tx.title)}')" title="Delete">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

window.onExpenseSearchChange = function(val) {
    expenseFilterState.search = val;
    renderExpensesPage();
};

window.onExpenseCategoryChange = function(val) {
    expenseFilterState.category = val;
    renderExpensesPage();
};

window.onExpenseDateChange = function(val) {
    expenseFilterState.timeframe = val;
    renderExpensesPage();
};

window.onExpenseSortChange = function(val) {
    expenseFilterState.sort = val;
    renderExpensesPage();
};

// ---------------------------------------------------------
// INCOME MANAGEMENT PAGE
// ---------------------------------------------------------
let incomeFilterState = {
    search: '',
    source: 'ALL',
    timeframe: 'ALL',
    sort: 'NEWEST'
};

function renderIncomePage() {
    const summary = FinanceStore.getSummary();
    const allIncome = FinanceStore.getTransactions().filter(t => t.type === 'income');

    const totalEl = document.querySelector('.income-icon + div h2');
    const countEl = document.querySelector('.summary-card:nth-child(2) h2');
    if (totalEl) totalEl.textContent = formatCurrency(summary.totalIncome);
    if (countEl) countEl.textContent = allIncome.length.toString();

    let filterContainer = document.getElementById('incomeFilterToolbar');
    if (!filterContainer) {
        const contentCard = document.querySelector('.content-card');
        if (contentCard) {
            filterContainer = document.createElement('div');
            filterContainer.id = 'incomeFilterToolbar';
            filterContainer.className = 'filter-toolbar';
            contentCard.parentNode.insertBefore(filterContainer, contentCard);
        }
    }

    if (filterContainer) {
        filterContainer.innerHTML = `
            <div class="filter-search-wrap">
                <div class="filter-search-box">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="incomeSearchInput" placeholder="Search income by title or source..." value="${escapeHTML(incomeFilterState.search)}" oninput="onIncomeSearchChange(this.value)">
                </div>
            </div>

            <div class="filter-controls-wrap">
                <div class="filter-group">
                    <label><i class="fa-solid fa-money-bill-wave"></i> Source:</label>
                    <select class="filter-select" id="incomeSourceFilter" onchange="onIncomeSourceChange(this.value)">
                        <option value="ALL">All Sources</option>
                        ${INCOME_SOURCES.map(s => `<option value="${s}" ${incomeFilterState.source === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label><i class="fa-solid fa-calendar"></i> Date:</label>
                    <select class="filter-select" id="incomeDateFilter" onchange="onIncomeDateChange(this.value)">
                        <option value="ALL" ${incomeFilterState.timeframe === 'ALL' ? 'selected' : ''}>All Time</option>
                        <option value="THIS_MONTH" ${incomeFilterState.timeframe === 'THIS_MONTH' ? 'selected' : ''}>This Month</option>
                        <option value="LAST_30" ${incomeFilterState.timeframe === 'LAST_30' ? 'selected' : ''}>Last 30 Days</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label><i class="fa-solid fa-arrow-down-short-wide"></i> Sort:</label>
                    <select class="filter-select" id="incomeSortFilter" onchange="onIncomeSortChange(this.value)">
                        <option value="NEWEST" ${incomeFilterState.sort === 'NEWEST' ? 'selected' : ''}>Newest First</option>
                        <option value="OLDEST" ${incomeFilterState.sort === 'OLDEST' ? 'selected' : ''}>Oldest First</option>
                        <option value="HIGHEST" ${incomeFilterState.sort === 'HIGHEST' ? 'selected' : ''}>Highest Amount</option>
                        <option value="LOWEST" ${incomeFilterState.sort === 'LOWEST' ? 'selected' : ''}>Lowest Amount</option>
                    </select>
                </div>
            </div>
        `;
    }

    let filtered = allIncome.filter(tx => {
        if (incomeFilterState.search) {
            const term = incomeFilterState.search.toLowerCase();
            const matchesTitle = tx.title && tx.title.toLowerCase().includes(term);
            const matchesNotes = tx.notes && tx.notes.toLowerCase().includes(term);
            if (!matchesTitle && !matchesNotes) return false;
        }
        if (incomeFilterState.source !== 'ALL' && tx.category !== incomeFilterState.source) {
            return false;
        }
        if (incomeFilterState.timeframe === 'THIS_MONTH') {
            const currMonth = new Date().toISOString().slice(0, 7);
            if (!tx.date || !tx.date.startsWith(currMonth)) return false;
        } else if (incomeFilterState.timeframe === 'LAST_30') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            if (new Date(tx.date) < cutoff) return false;
        }
        return true;
    });

    filtered.sort((a, b) => {
        if (incomeFilterState.sort === 'NEWEST') return getTransactionTimestamp(b) - getTransactionTimestamp(a);
        if (incomeFilterState.sort === 'OLDEST') return getTransactionTimestamp(a) - getTransactionTimestamp(b);
        if (incomeFilterState.sort === 'HIGHEST') return b.amount - a.amount;
        if (incomeFilterState.sort === 'LOWEST') return a.amount - b.amount;
        return 0;
    });

    const listContainer = document.querySelector('.transaction-list');
    if (listContainer) {
        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-piggy-bank"></i>
                    <p>No income transactions match your active filter.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filtered.map(tx => {
            const catInfo = CATEGORY_ICONS[tx.category] || { icon: 'fa-briefcase', color: '#15803d' };

            return `
                <div class="transaction">
                    <div class="transaction-icon income">
                        <i class="fa-solid ${catInfo.icon}"></i>
                    </div>
                    <div class="transaction-info">
                        <strong>${escapeHTML(tx.title)}</strong>
                        <span>
                            ${escapeHTML(tx.category)} • ${formatDateDisplay(tx.date, tx.time)}
                            ${tx.notes ? ' • ' + escapeHTML(tx.notes) : ''}
                        </span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <strong class="amount income-text">+${formatCurrency(tx.amount)}</strong>
                        <div class="action-btns">
                            <button class="edit-icon-btn" onclick="editTransactionItem('${tx.id}')" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="delete-icon-btn" onclick="deleteTransactionItem('${tx.id}', '${escapeHTML(tx.title)}')" title="Delete">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

window.onIncomeSearchChange = function(val) {
    incomeFilterState.search = val;
    renderIncomePage();
};

window.onIncomeSourceChange = function(val) {
    incomeFilterState.source = val;
    renderIncomePage();
};

window.onIncomeDateChange = function(val) {
    incomeFilterState.timeframe = val;
    renderIncomePage();
};

window.onIncomeSortChange = function(val) {
    incomeFilterState.sort = val;
    renderIncomePage();
};

// ---------------------------------------------------------
// ANALYTICS & INTERACTIVE CHART.JS SUITE
// ---------------------------------------------------------
let analyticsTimeframe = 'THIS_MONTH';
let chartInstances = {};

function setAnalyticsTimeframe(tf) {
    analyticsTimeframe = tf;
    renderAnalyticsPage();
}
window.setAnalyticsTimeframe = setAnalyticsTimeframe;

function renderAnalyticsPage() {
    let summary = FinanceStore.getSummary();
    const allTxs = FinanceStore.getTransactions();

    if (analyticsTimeframe === 'LAST_3M') {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 3);
        const filteredTxs = allTxs.filter(t => t.date && new Date(t.date) >= cutoff);
        let inc = 0, exp = 0;
        const catMap = {};
        filteredTxs.forEach(t => {
            const amt = Math.abs(parseFloat(t.amount)) || 0;
            if (t.type === 'income') inc += amt;
            else {
                exp += amt;
                catMap[t.category] = (catMap[t.category] || 0) + amt;
            }
        });
        const bal = inc - exp;
        const rate = inc > 0 ? ((bal / inc) * 100).toFixed(1) : '0.0';
        summary = {
            ...summary,
            totalIncome: inc,
            totalExpenses: exp,
            balance: bal,
            savingsRate: rate,
            categoryMap: catMap
        };
    } else if (analyticsTimeframe === 'ALL') {
        let inc = 0, exp = 0;
        const catMap = {};
        allTxs.forEach(t => {
            const amt = Math.abs(parseFloat(t.amount)) || 0;
            if (t.type === 'income') inc += amt;
            else {
                exp += amt;
                catMap[t.category] = (catMap[t.category] || 0) + amt;
            }
        });
        const bal = inc - exp;
        const rate = inc > 0 ? ((bal / inc) * 100).toFixed(1) : '0.0';
        summary = {
            ...summary,
            totalIncome: inc,
            totalExpenses: exp,
            balance: bal,
            savingsRate: rate,
            categoryMap: catMap
        };
    }

    const incStat = document.querySelector('.analytics-stat .income-text');
    const expStat = document.querySelector('.analytics-stat .expense-text');
    const balStat = document.querySelectorAll('.analytics-stat strong')[2];
    const savStat = document.querySelector('.analytics-stat .positive');

    if (incStat) incStat.textContent = formatCurrency(summary.totalIncome);
    if (expStat) expStat.textContent = formatCurrency(summary.totalExpenses);
    if (balStat) balStat.textContent = formatCurrency(summary.balance);
    if (savStat) savStat.textContent = `${summary.savingsRate}%`;

    let timeframeBar = document.getElementById('analyticsTimeframeBar');
    if (!timeframeBar) {
        const grid = document.querySelector('.analytics-grid');
        if (grid) {
            timeframeBar = document.createElement('div');
            timeframeBar.id = 'analyticsTimeframeBar';
            timeframeBar.className = 'analytics-timeframe-bar';
            grid.parentNode.insertBefore(timeframeBar, grid);
        }
    }

    if (timeframeBar) {
        timeframeBar.innerHTML = `
            <span style="font-weight:700; font-size:0.85rem; color:var(--navy); margin-right:6px;">
                <i class="fa-solid fa-filter"></i> Timeframe:
            </span>
            <button class="timeframe-pill ${analyticsTimeframe === 'THIS_MONTH' ? 'active' : ''}" onclick="setAnalyticsTimeframe('THIS_MONTH')">Current Month</button>
            <button class="timeframe-pill ${analyticsTimeframe === 'LAST_3M' ? 'active' : ''}" onclick="setAnalyticsTimeframe('LAST_3M')">Last 3 Months</button>
            <button class="timeframe-pill ${analyticsTimeframe === 'ALL' ? 'active' : ''}" onclick="setAnalyticsTimeframe('ALL')">All Time</button>
        `;
    }

    const insightContainer = document.querySelector('.insight-list');
    if (insightContainer) {
        const sortedCats = Object.entries(summary.categoryMap).sort((a, b) => b[1] - a[1]);
        const topCat = sortedCats.length > 0 ? sortedCats[0] : null;

        let insightsHTML = '';

        if (topCat) {
            const pct = summary.totalExpenses > 0 ? ((topCat[1] / summary.totalExpenses) * 100).toFixed(0) : 0;
            insightsHTML += `
                <div class="insight">
                    <i class="fa-solid fa-fire" style="color:#ef4444; background:#fee2e2;"></i>
                    <div>
                        <strong>Primary Outflow: ${escapeHTML(topCat[0])}</strong>
                        <p>You have spent ${formatCurrency(topCat[1])} on ${escapeHTML(topCat[0])} (${pct}% of monthly expenses). Consider setting a weekly budget check on this category.</p>
                    </div>
                </div>
            `;
        }

        if (summary.balance >= 0) {
            insightsHTML += `
                <div class="insight">
                    <i class="fa-solid fa-shield-halved" style="color:#10b981; background:#d1fae5;"></i>
                    <div>
                        <strong>Surplus Ratio: ${summary.savingsRate}%</strong>
                        <p>Your net earnings are in surplus by ${formatCurrency(summary.balance)}. You are easily exceeding the recommended minimum savings rate of 20%.</p>
                    </div>
                </div>
            `;
        } else {
            insightsHTML += `
                <div class="insight">
                    <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444; background:#fee2e2;"></i>
                    <div>
                        <strong>Budget Deficit Alert</strong>
                        <p>Spending is outpacing income by ${formatCurrency(Math.abs(summary.balance))}. Focus on cutting non-essential shopping and entertainment.</p>
                    </div>
                </div>
            `;
        }

        insightsHTML += `
            <div class="insight">
                <i class="fa-solid fa-lightbulb" style="color:#0284c7; background:#e0f2fe;"></i>
                <div>
                    <strong>AI Savings Opportunity</strong>
                    <p>${topCat ? `Optimizing discretionary spend in "${escapeHTML(topCat[0])}" by 15% would save an extra ${formatCurrency(Math.round(topCat[1] * 0.15))} every month.` : 'Track more expenses to generate tailored recommendations.'}</p>
                </div>
            </div>
        `;

        insightContainer.innerHTML = insightsHTML;
    }

    let extraChartsGrid = document.getElementById('analyticsExtraCharts');
    if (!extraChartsGrid) {
        const insightCard = document.querySelector('.insight-card');
        if (insightCard) {
            extraChartsGrid = document.createElement('div');
            extraChartsGrid.id = 'analyticsExtraCharts';
            extraChartsGrid.className = 'chart-grid-full';
            insightCard.parentNode.insertBefore(extraChartsGrid, insightCard);
        }
    }

    if (extraChartsGrid) {
        extraChartsGrid.innerHTML = `
            <div class="content-card">
                <div class="card-heading">
                    <div>
                        <h2>Monthly Spending Comparison</h2>
                        <p>Income vs Expense over past months</p>
                    </div>
                </div>
                <div style="height:280px; position:relative;">
                    <canvas id="monthlyComparisonChart"></canvas>
                </div>
            </div>

            <div class="content-card">
                <div class="card-heading">
                    <div>
                        <h2>Savings Trend</h2>
                        <p>Monthly retained balance trajectory</p>
                    </div>
                </div>
                <div style="height:280px; position:relative;">
                    <canvas id="savingsTrendChart"></canvas>
                </div>
            </div>
        `;
    }

    if (typeof Chart !== 'undefined') {
        renderExpensePieChart(summary);
        renderMonthlyComparisonChart(allTxs);
        renderSavingsTrendChart(allTxs);
    }
}

function renderExpensePieChart(summary) {
    const canvas = document.getElementById('expensePieChart');
    if (!canvas) return;

    if (chartInstances.pie) {
        chartInstances.pie.destroy();
    }

    const catMap = summary.categoryMap;
    const labels = Object.keys(catMap);
    const dataValues = Object.values(catMap);

    const palette = [
        '#078b8b', '#2563eb', '#f59e0b', '#ec4899', '#7c3aed',
        '#ef4444', '#10b981', '#64748b', '#06b6d4', '#84cc16'
    ];

    chartInstances.pie = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['No Expenses Yet'],
            datasets: [{
                data: dataValues.length > 0 ? dataValues : [1],
                backgroundColor: labels.length > 0 ? palette.slice(0, labels.length) : ['#e2e8f0'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 14,
                        usePointStyle: true,
                        font: { family: 'Inter', size: 12, weight: '500' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (labels.length === 0) return ' No expense data';
                            const val = context.raw || 0;
                            const total = dataValues.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${formatCurrency(val)} (${pct}%)`;
                        }
                    }
                }
            },
            cutout: '64%'
        }
    });
}

function renderMonthlyComparisonChart(transactions) {
    const canvas = document.getElementById('monthlyComparisonChart');
    if (!canvas) return;

    if (chartInstances.bar) {
        chartInstances.bar.destroy();
    }

    const monthsMap = {};
    transactions.forEach(t => {
        if (!t.date) return;
        const ym = t.date.slice(0, 7);
        if (!monthsMap[ym]) {
            monthsMap[ym] = { income: 0, expense: 0 };
        }
        const amt = Math.abs(parseFloat(t.amount)) || 0;
        if (t.type === 'income') monthsMap[ym].income += amt;
        else monthsMap[ym].expense += amt;
    });

    const sortedMonths = Object.keys(monthsMap).sort().slice(-5);
    const monthNames = {
        '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
        '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
    };

    const labels = sortedMonths.map(ym => {
        const [y, m] = ym.split('-');
        return `${monthNames[m]} ${y.slice(2)}`;
    });

    const incomeData = sortedMonths.map(ym => monthsMap[ym].income);
    const expenseData = sortedMonths.map(ym => monthsMap[ym].expense);

    chartInstances.bar = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Current'],
            datasets: [
                {
                    label: 'Income',
                    data: incomeData.length > 0 ? incomeData : [0],
                    backgroundColor: '#10b981',
                    borderRadius: 6
                },
                {
                    label: 'Expenses',
                    data: expenseData.length > 0 ? expenseData : [0],
                    backgroundColor: '#ef4444',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: val => (FinanceStore.getSettings().currencySymbol || '₹') + Number(val).toLocaleString('en-IN')
                    }
                }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
                    }
                }
            }
        }
    });
}

function renderSavingsTrendChart(transactions) {
    const canvas = document.getElementById('savingsTrendChart');
    if (!canvas) return;

    if (chartInstances.line) {
        chartInstances.line.destroy();
    }

    const monthsMap = {};
    transactions.forEach(t => {
        if (!t.date) return;
        const ym = t.date.slice(0, 7);
        if (!monthsMap[ym]) {
            monthsMap[ym] = { income: 0, expense: 0 };
        }
        const amt = Math.abs(parseFloat(t.amount)) || 0;
        if (t.type === 'income') monthsMap[ym].income += amt;
        else monthsMap[ym].expense += amt;
    });

    const sortedMonths = Object.keys(monthsMap).sort().slice(-5);
    const monthNames = {
        '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
        '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
    };

    const labels = sortedMonths.map(ym => {
        const [y, m] = ym.split('-');
        return `${monthNames[m]} ${y.slice(2)}`;
    });

    const savingsData = sortedMonths.map(ym => monthsMap[ym].income - monthsMap[ym].expense);

    chartInstances.line = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['Current'],
            datasets: [{
                label: 'Net Savings',
                data: savingsData.length > 0 ? savingsData : [0],
                borderColor: '#173d82',
                backgroundColor: 'rgba(23, 61, 130, 0.08)',
                fill: true,
                tension: 0.35,
                borderWidth: 3,
                pointBackgroundColor: '#078b8b',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        callback: val => (FinanceStore.getSettings().currencySymbol || '₹') + Number(val).toLocaleString('en-IN')
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` Net Savings: ${formatCurrency(ctx.raw)}`
                    }
                }
            }
        }
    });
}

// ---------------------------------------------------------
// AI ASSISTANT (CONVERSATIONAL STREAM & INTELLIGENCE)
// ---------------------------------------------------------
let aiChatHistory = [];

function loadAIChatHistory() {
    try {
        const uid = AuthManager.getActiveUserId();
        const saved = localStorage.getItem(`${STORAGE_KEYS.AI_CHAT_HISTORY}_${uid}`);
        if (saved) {
            aiChatHistory = JSON.parse(saved);
        } else {
            aiChatHistory = [
                {
                    sender: 'bot',
                    text: 'Hello! I am your <strong>SmartFinance AI Assistant</strong>. I actively analyze your personal income, expenses, and budget limits to help you save more. Ask me anything about your finances!',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ];
        }
    } catch (e) {
        aiChatHistory = [];
    }
}

function saveAIChatHistory() {
    try {
        const uid = AuthManager.getActiveUserId();
        localStorage.setItem(`${STORAGE_KEYS.AI_CHAT_HISTORY}_${uid}`, JSON.stringify(aiChatHistory));
    } catch (e) {}
}

function renderAIAssistantPage() {
    loadAIChatHistory();
    const summary = FinanceStore.getSummary();
    const sortedCats = Object.entries(summary.categoryMap).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats.length > 0 ? sortedCats[0] : null;

    const cards = document.querySelectorAll('.ai-message');
    if (cards.length >= 3) {
        cards[0].querySelector('h3').textContent = summary.budgetStatus === 'critical' ? '⚠️ Budget Alert: Exceeding Limit' : (summary.balance >= 0 ? '🟢 Financial Health: Strong' : '🔴 Financial Alert: Deficit');
        cards[0].querySelector('p').textContent = summary.balance >= 0
            ? `Your current income (${formatCurrency(summary.totalIncome)}) exceeds your expenses (${formatCurrency(summary.totalExpenses)}). You are retaining ${summary.savingsRate}% of your income as savings.`
            : `You have spent ${formatCurrency(Math.abs(summary.balance))} more than you earned this month. Consider halting non-essential expenses.`;

        if (topCat) {
            cards[1].querySelector('h3').textContent = `Top Expense: ${escapeHTML(topCat[0])}`;
            cards[1].querySelector('p').textContent = `You spent ${formatCurrency(topCat[1])} on ${escapeHTML(topCat[0])} (${summary.totalExpenses > 0 ? ((topCat[1] / summary.totalExpenses) * 100).toFixed(1) : 0}% of all spending). Check if any of these were impulsive purchases.`;
        }

        cards[2].querySelector('h3').textContent = 'Smart Savings Opportunity';
        cards[2].querySelector('p').textContent = `If you trim 10% from your current expenses, you will unlock an extra ${formatCurrency(Math.round(summary.totalExpenses * 0.1))} in savings this month.`;
    }

    renderAIChatStream();
}

function renderAIChatStream() {
    let chatStream = document.getElementById('aiChatStream');
    if (!chatStream) {
        const chatBox = document.querySelector('.ai-chat');
        if (chatBox) {
            chatStream = document.createElement('div');
            chatStream.id = 'aiChatStream';
            chatStream.className = 'ai-chat-stream';
            const chatInputWrap = document.querySelector('.chat-input');
            if (chatInputWrap) {
                chatBox.insertBefore(chatStream, chatInputWrap);
            }
        }
    }

    if (chatStream) {
        chatStream.innerHTML = aiChatHistory.map(msg => {
            const isBot = msg.sender === 'bot';
            return `
                <div class="chat-message-row ${isBot ? 'bot-row' : 'user-row'}">
                    <div class="chat-avatar ${isBot ? 'bot-avatar' : 'user-avatar-bubble'}">
                        <i class="fa-solid ${isBot ? 'fa-robot' : 'fa-user'}"></i>
                    </div>
                    <div class="chat-bubble">
                        <div>${msg.text}</div>
                        <span class="chat-timestamp">${escapeHTML(msg.time)}</span>
                    </div>
                </div>
            `;
        }).join('');

        chatStream.scrollTop = chatStream.scrollHeight;
    }
}

window.askAI = function(presetPrompt = null) {
    const input = document.getElementById('question');
    const question = (presetPrompt || (input ? input.value : '')).trim();

    if (!question) {
        showToast('Please type a question or select a prompt pill.', 'error');
        return;
    }

    if (input) input.value = '';

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    aiChatHistory.push({
        sender: 'user',
        text: escapeHTML(question),
        time: timeNow
    });
    saveAIChatHistory();
    renderAIChatStream();

    let answerEl = document.getElementById('aiAnswer');
    if (answerEl) {
        answerEl.innerHTML = `
            <div class="ai-typing">
                <i class="fa-solid fa-robot fa-spin" style="color:var(--navy);"></i>
                <span>Analyzing your financial activity and calculating insights...</span>
            </div>
        `;
    }

    setTimeout(() => {
        const responseText = generateIntelligentAIResponse(question);
        aiChatHistory.push({
            sender: 'bot',
            text: responseText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        saveAIChatHistory();
        renderAIChatStream();

        if (answerEl) answerEl.innerHTML = '';
    }, 550);
};

function clearAIChat() {
    aiChatHistory = [
        {
            sender: 'bot',
            text: 'Chat history cleared. How can I help you analyze your budget or expenses today?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ];
    saveAIChatHistory();
    renderAIChatStream();
    showToast('AI conversation reset.', 'info');
}
window.clearAIChat = clearAIChat;

function generateIntelligentAIResponse(query) {
    const q = query.toLowerCase();
    const summary = FinanceStore.getSummary();
    const txs = FinanceStore.getTransactions();
    const budgets = FinanceStore.getBudgets();
    const sortedCats = Object.entries(summary.categoryMap).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats.length > 0 ? sortedCats[0] : null;

    if (q.includes('how much did i spend') || q.includes('total spend') || q.includes('monthly spending') || q.includes('my spending')) {
        return `You have spent a total of <strong>${formatCurrency(summary.totalExpenses)}</strong> this month across <strong>${summary.expenseCount}</strong> transactions.
                <br>Your set monthly budget is <strong>${formatCurrency(summary.totalBudget)}</strong>, meaning you have <strong>${formatCurrency(summary.remainingBudget)}</strong> remaining (${summary.budgetUsedPct}% used).`;
    }

    if (q.includes('biggest') || q.includes('highest') || q.includes('where am i spending') || q.includes('most money')) {
        if (!topCat) return `You don't have any logged expenses this month yet. Start tracking to see category analytics!`;
        const pct = summary.totalExpenses > 0 ? ((topCat[1] / summary.totalExpenses) * 100).toFixed(1) : 0;
        return `Your biggest spending category is <strong>${escapeHTML(topCat[0])}</strong> at <strong>${formatCurrency(topCat[1])}</strong>, which makes up <strong>${pct}%</strong> of your total spending this month.`;
    }

    if (q.includes('save') || q.includes('saving') || q.includes('how much did i save')) {
        return `You have saved <strong>${formatCurrency(summary.savingsAmount)}</strong> this month, giving you a healthy savings rate of <strong>${summary.savingsRate}%</strong> of your total income (${formatCurrency(summary.totalIncome)}).
                <br><br>💡 <strong>Rule of Thumb:</strong> Financial advisors recommend aiming for at least 20% savings. ${summary.savingsRate >= 20 ? '🎉 You are exceeding this milestone!' : 'Try reducing discretionary categories like Shopping or Entertainment to hit 20%.'}`;
    }

    if (q.includes('budget') || q.includes('over my budget') || q.includes('limit') || q.includes('am i over')) {
        if (summary.totalExpenses > summary.totalBudget) {
            const over = summary.totalExpenses - summary.totalBudget;
            return `⚠️ <strong>Yes, you have exceeded your monthly budget by ${formatCurrency(over)}.</strong>
                    <br>Total budget: ${formatCurrency(summary.totalBudget)} | Actual spend: ${formatCurrency(summary.totalExpenses)}. We recommend pausing all non-essential purchases for the rest of the month.`;
        } else {
            return `🟢 <strong>You are within your budget!</strong>
                    <br>You have used <strong>${summary.budgetUsedPct}%</strong> of your monthly budget (${formatCurrency(summary.totalExpenses)} of ${formatCurrency(summary.totalBudget)}). You still have <strong>${formatCurrency(summary.remainingBudget)}</strong> safe to spend.`;
        }
    }

    if (q.includes('income') || q.includes('salary') || q.includes('earn') || q.includes('received')) {
        return `You have recorded a total income of <strong>${formatCurrency(summary.totalIncome)}</strong> this month across <strong>${summary.incomeCount}</strong> entries.`;
    }

    if (q.includes('recent') || q.includes('transactions') || q.includes('last expenses')) {
        const recents = txs.slice(0, 4);
        if (recents.length === 0) return `No recent transactions found. Click "+ Add Expense" to begin logging!`;
        const listItems = recents.map(t => `<li><strong>${escapeHTML(t.title)}</strong>: ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)} (${escapeHTML(t.category)} on ${formatDateDisplay(t.date, t.time)})</li>`).join('');
        return `Here are your most recent recorded transactions:
                <ul style="margin: 8px 0 8px 18px; line-height: 1.7;">${listItems}</ul>`;
    }

    if (q.includes('summary') || q.includes('overview') || q.includes('status') || q.includes('health') || q.includes('financial status')) {
        return `📊 <strong>Personal Financial Summary (${summary.targetMonth}):</strong>
                <ul style="margin: 8px 0 8px 18px; line-height: 1.8;">
                    <li><strong>Total Inflow (Income):</strong> ${formatCurrency(summary.totalIncome)}</li>
                    <li><strong>Total Outflow (Expenses):</strong> ${formatCurrency(summary.totalExpenses)}</li>
                    <li><strong>Net Balance:</strong> ${formatCurrency(summary.balance)}</li>
                    <li><strong>Savings Rate:</strong> ${summary.savingsRate}%</li>
                    <li><strong>Budget Usage:</strong> ${summary.budgetUsedPct}% (${formatCurrency(summary.remainingBudget)} remaining)</li>
                    <li><strong>Health Score:</strong> ${summary.balance >= 0 ? '🟢 Excellent Surplus' : '🔴 Attention Required'}</li>
                </ul>`;
    }

    for (const cat of EXPENSE_CATEGORIES) {
        if (q.includes(cat.toLowerCase())) {
            const spent = summary.categoryMap[cat] || 0;
            const target = (budgets.categories && budgets.categories[cat]) || 0;
            return `You have spent <strong>${formatCurrency(spent)}</strong> on <strong>${cat}</strong> this month.
                    ${target > 0 ? `<br>Your set budget for ${cat} is ${formatCurrency(target)} (${Math.round((spent / target) * 100)}% utilized).` : ''}`;
        }
    }

    if (q.includes('how to save') || q.includes('reduce') || q.includes('cut') || q.includes('advice') || q.includes('tips')) {
        return `💡 <strong>3 High-Impact Steps to Optimize Your Budget:</strong>
                <ol style="margin: 8px 0 8px 18px; line-height: 1.8;">
                    <li><strong>Target your top category:</strong> ${topCat ? `Cutting 15% on ${topCat[0]} could instantly save you ${formatCurrency(Math.round(topCat[1] * 0.15))}.` : 'Analyze high-ticket transactions.'}</li>
                    <li><strong>Follow the 50/30/20 Rule:</strong> 50% for needs, 30% for wants, and 20% for savings/investments.</li>
                    <li><strong>Track daily:</strong> Recording transactions immediately prevents unintentional overspending.</li>
                </ol>`;
    }

    return `Based on your live records, you have logged <strong>${txs.length} transactions</strong> with an active balance of <strong>${formatCurrency(summary.balance)}</strong>.
            ${topCat ? `<br>Your largest spending category right now is <strong>${topCat[0]}</strong> (${formatCurrency(topCat[1])}).` : ''}
            <br>Feel free to ask questions like: <em>"Where am I spending the most?"</em> or <em>"How much did I save?"</em>`;
}

// ---------------------------------------------------------
// PROFILE & SETTINGS
// ---------------------------------------------------------
async function renderProfilePage(authUser) {
    let user = authUser || AuthManager.getCurrentUser() || await AuthManager.checkAuthSession();
    if (!user || !user.id) {
        window.location.replace('login.html');
        return;
    }

    const displayEmail = (user && user.email) ? user.email : '';
    const displayName = (user && user.name && user.name.trim()) ? user.name.trim() : (displayEmail ? displayEmail.split('@')[0] : 'User');
    const displayProvider = (user && (user.authProvider || user.auth_provider)) ? (user.authProvider || user.auth_provider) : 'Email';
    const displayId = (user && user.id) ? user.id : '';
    const userAvatar = getAvatarForUser(user);
    const displayOccupation = (user && user.occupation) ? user.occupation : 'Not specified';

    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const avatarEl = document.getElementById('profileAvatar');
    const providerEl = document.getElementById('profileProvider');
    const memberSinceEl = document.getElementById('profileMemberSince');
    const accountIdEl = document.getElementById('profileAccountId');

    const viewNameEl = document.getElementById('viewFullName');
    const viewEmailEl = document.getElementById('viewEmail');
    const viewOccEl = document.getElementById('viewOccupation');
    const viewIncomeEl = document.getElementById('viewIncomeTarget');

    const editNameInput = document.getElementById('editFullName');
    const editEmailInput = document.getElementById('editEmail');
    const editOccInput = document.getElementById('editOccupation');
    const editIncomeInput = document.getElementById('editIncomeTarget');

    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = displayEmail || 'No email registered';
    if (avatarEl) {
        avatarEl.alt = displayName;
        avatarEl.src = userAvatar;
        avatarEl.onerror = function() {
            this.onerror = null;
            this.src = generateAvatarSVG(displayName, displayEmail);
        };
    }
    if (providerEl) providerEl.textContent = displayProvider;
    if (accountIdEl) accountIdEl.textContent = displayId;
    if (memberSinceEl) {
        const rawDate = user.created_at || user.createdAt;
        if (rawDate) {
            const createdDate = new Date(rawDate);
            if (!isNaN(createdDate.getTime())) {
                memberSinceEl.textContent = createdDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            } else {
                memberSinceEl.textContent = rawDate;
            }
        } else {
            memberSinceEl.textContent = 'Recently';
        }
    }

    const settings = FinanceStore.getSettings();
    const transactions = FinanceStore.getTransactions();
    const currSelect = document.getElementById('currencySelect');
    const activeCurrency = user.currency || settings.currencySymbol || '₹';
    const targetIncome = settings.monthlyIncomeTarget || 60000;

    // View Mode Values
    if (viewNameEl) viewNameEl.textContent = displayName;
    if (viewEmailEl) viewEmailEl.textContent = displayEmail || 'No email registered';
    if (viewOccEl) viewOccEl.textContent = displayOccupation;
    if (viewIncomeEl) viewIncomeEl.textContent = `${activeCurrency}${targetIncome.toLocaleString()}`;

    // Edit Mode Input Values
    if (editNameInput) editNameInput.value = user.name || displayName;
    if (editEmailInput) editEmailInput.value = displayEmail;
    if (editOccInput) editOccInput.value = user.occupation || '';
    if (currSelect) currSelect.value = activeCurrency;
    if (editIncomeInput) editIncomeInput.value = targetIncome;

    const statIncome = document.getElementById('statIncomeTarget');
    const statCurrency = document.getElementById('statCurrency');
    const statTxCount = document.getElementById('statTxCount');
    const statSecurity = document.getElementById('statSecurity');

    if (statIncome) statIncome.textContent = `${activeCurrency}${targetIncome.toLocaleString()}`;
    if (statCurrency) statCurrency.textContent = `${activeCurrency} (${settings.currencyCode || 'INR'})`;
    if (statTxCount) statTxCount.textContent = `${transactions.length} Records`;
    if (statSecurity) statSecurity.textContent = 'Active & Isolated';

    const budgetAlertCb = document.getElementById('prefBudgetAlert');
    const weeklyCb = document.getElementById('prefWeeklyDigest');
    if (budgetAlertCb) budgetAlertCb.checked = settings.notifyBudgetLimit !== false;
    if (weeklyCb) weeklyCb.checked = !!settings.notifyWeeklyDigest;

    // Ensure default View Mode on page render
    window.cancelProfileEditMode();
    renderSavedAccountsList();
}

window.enableProfileEditMode = function() {
    const viewSec = document.getElementById('profileViewSection');
    const editSec = document.getElementById('profileEditSection');
    const toggleBtn = document.getElementById('toggleEditProfileBtn');

    if (viewSec) viewSec.style.display = 'none';
    if (editSec) editSec.style.display = 'block';
    if (toggleBtn) toggleBtn.style.display = 'none';

    const currentUser = AuthManager.getCurrentUser();
    if (currentUser) {
        const editNameInput = document.getElementById('editFullName');
        const editEmailInput = document.getElementById('editEmail');
        const editOccInput = document.getElementById('editOccupation');
        const editIncomeInput = document.getElementById('editIncomeTarget');
        const settings = FinanceStore.getSettings();

        if (editNameInput) editNameInput.value = currentUser.name || '';
        if (editEmailInput) editEmailInput.value = currentUser.email || '';
        if (editOccInput) editOccInput.value = currentUser.occupation || '';
        if (editIncomeInput) editIncomeInput.value = settings.monthlyIncomeTarget || 60000;
    }
};

window.cancelProfileEditMode = function() {
    const viewSec = document.getElementById('profileViewSection');
    const editSec = document.getElementById('profileEditSection');
    const toggleBtn = document.getElementById('toggleEditProfileBtn');

    if (viewSec) viewSec.style.display = 'block';
    if (editSec) editSec.style.display = 'none';
    if (toggleBtn) toggleBtn.style.display = 'inline-flex';
};

function renderSavedAccountsList() {
    const container = document.getElementById('savedAccountsContainer');
    if (!container) return;

    const users = AuthManager.getUsers();
    const currentUser = AuthManager.getCurrentUser() || {};

    if (!users || users.length === 0) {
        container.innerHTML = `
            <div style="padding:15px; text-align:center; color:var(--text-light); font-size:0.9rem;">
                No additional saved accounts registered on this device.
            </div>
        `;
        return;
    }

    container.innerHTML = users.map(u => {
        const isActive = u.email.toLowerCase() === (currentUser.email || '').toLowerCase();
        const avatar = getAvatarForUser(u);
        return `
            <div class="saved-account-card ${isActive ? 'active-account' : ''}">
                <div class="account-left">
                    <img src="${escapeHTML(avatar)}" alt="${escapeHTML(u.name)}" class="account-avatar" onerror="this.onerror=null; this.src=generateAvatarSVG('${escapeHTML(u.name)}', '${escapeHTML(u.email)}');">
                    <div class="account-info">
                        <div class="account-name">
                            ${escapeHTML(u.name)}
                            ${isActive ? '<span class="active-badge"><i class="fa-solid fa-circle-check"></i> Active Session</span>' : ''}
                        </div>
                        <div class="account-email">${escapeHTML(u.email)}</div>
                    </div>
                </div>
                <div class="account-actions">
                    ${!isActive ? `
                        <button type="button" class="navy-btn small-btn" onclick="AuthManager.switchUserAccount('${escapeHTML(u.email)}')">
                            <i class="fa-solid fa-arrow-right-to-bracket"></i> Switch
                        </button>
                    ` : `
                        <span class="current-session-label"><i class="fa-solid fa-user-check"></i> Current Account</span>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

window.saveProfileDetails = async function(e) {
    if (e) e.preventDefault();
    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) return;

    const saveBtn = document.getElementById('saveProfileBtn');
    const editNameInput = document.getElementById('editFullName');
    const editEmailInput = document.getElementById('editEmail');
    const editOccInput = document.getElementById('editOccupation');
    const editIncomeInput = document.getElementById('editIncomeTarget');
    const currSelect = document.getElementById('currencySelect');

    const newName = editNameInput ? editNameInput.value.trim() : (currentUser.name || '');
    const newEmail = editEmailInput ? editEmailInput.value.trim().toLowerCase() : (currentUser.email || '');
    const newOccupation = editOccInput ? editOccInput.value.trim() : (currentUser.occupation || '');
    const newCurrency = currSelect ? currSelect.value : (currentUser.currency || '₹');
    const newIncome = editIncomeInput ? (parseFloat(editIncomeInput.value) || 60000) : 60000;

    if (!newName) {
        showToast('Please enter your full name.', 'error');
        return;
    }

    if (!isValidEmail(newEmail)) {
        showToast('Please enter a valid email address (e.g. user@gmail.com).', 'error');
        return;
    }

    // Double Save Prevention & Loading State
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const payload = {
        name: newName,
        email: newEmail,
        occupation: newOccupation,
        currency: newCurrency
    };

    try {
        const res = await apiRequest('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (res.ok && res.data && res.data.success && res.data.user) {
            AuthManager.setCurrentUser(res.data.user, res.data.token);
            const s = FinanceStore.getSettings();
            s.monthlyIncomeTarget = newIncome;
            s.currencySymbol = res.data.user.currency || '₹';
            FinanceStore.saveSettings(s);

            renderProfilePage(res.data.user);
            updateUserNavUI(res.data.user);
            window.cancelProfileEditMode();
            showToast('Profile updated successfully.', 'success');
        } else {
            showToast(res.error || 'Unable to save profile. Please try again.', 'error');
        }
    } catch (err) {
        showToast('Unable to save profile. Please try again.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save';
        }
    }
};

window.saveNotificationPrefs = function() {
    const s = FinanceStore.getSettings();
    const budgetCb = document.getElementById('prefBudgetAlert');
    const weeklyCb = document.getElementById('prefWeeklyDigest');
    if (budgetCb) s.notifyBudgetLimit = budgetCb.checked;
    if (weeklyCb) s.notifyWeeklyDigest = weeklyCb.checked;
    FinanceStore.saveSettings(s);
    showToast('Notification preferences saved.', 'info');
};

window.openAvatarModal = function() {
    let modal = document.getElementById('avatarPickerModal');
    if (!modal) {
        createAvatarModal();
        modal = document.getElementById('avatarPickerModal');
    }
    modal.classList.add('active');
};

window.closeAvatarModal = function() {
    const modal = document.getElementById('avatarPickerModal');
    if (modal) modal.classList.remove('active');
};

function createAvatarModal() {
    const modal = document.createElement('div');
    modal.id = 'avatarPickerModal';
    modal.className = 'modal-backdrop';

    const user = AuthManager.getCurrentUser();
    if (!user) return;
    const dynamicInitialsUrl = generateAvatarSVG(user.name, user.email);

    modal.innerHTML = `
        <div class="modal-card avatar-modal-card">
            <div class="modal-header">
                <h3><i class="fa-solid fa-image"></i> Select Profile Avatar</h3>
                <button type="button" class="close-btn" onclick="closeAvatarModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <p style="font-size:0.88rem; color:var(--text-light); margin-bottom:16px;">
                    Choose an avatar style or upload a custom profile picture for <strong>${escapeHTML(user.email)}</strong>.
                </p>

                <div class="avatar-presets-grid">
                    <div class="avatar-option-card" onclick="selectAvatarPreset('${escapeHTML(dynamicInitialsUrl)}')">
                        <img src="${escapeHTML(dynamicInitialsUrl)}" alt="Dynamic Initials">
                        <span>Dynamic Initials</span>
                    </div>
                    ${PRESET_AVATARS.filter(p => p.url).map(p => `
                        <div class="avatar-option-card" onclick="selectAvatarPreset('${escapeHTML(p.url)}')">
                            <img src="${escapeHTML(p.url)}" alt="${escapeHTML(p.name)}">
                            <span>${escapeHTML(p.name)}</span>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top:20px; border-top:1px solid #e2e8f0; padding-top:16px;">
                    <label style="font-weight:600; font-size:0.88rem; display:block; margin-bottom:8px;">Custom Image URL or File Upload</label>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="customAvatarInput" placeholder="https://example.com/my-photo.jpg" style="flex:1; padding:8px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.88rem;">
                        <button type="button" class="navy-btn small-btn" onclick="saveCustomAvatarUrl()">Apply URL</button>
                    </div>
                    <div style="margin-top:10px; display:flex; align-items:center; gap:10px;">
                        <label class="cancel-btn small-btn" style="cursor:pointer; font-size:0.82rem; display:inline-flex; align-items:center; gap:6px;">
                            <i class="fa-solid fa-upload"></i> Upload Image File
                            <input type="file" accept="image/*" onchange="handleAvatarFileUpload(event)" style="display:none;">
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAvatarModal();
    });
}

window.selectAvatarPreset = async function(url) {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    let targetUrl = url;
    if (url && url.startsWith('data:image')) {
        targetUrl = generateAvatarSVG(user.name, user.email);
    }

    const res = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ picture: targetUrl })
    });

    if (res.ok && res.data && res.data.success && res.data.user) {
        AuthManager.setCurrentUser(res.data.user, res.data.token);
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) avatarEl.src = res.data.user.picture || targetUrl;
        updateUserNavUI(res.data.user);
        renderProfilePage(res.data.user);
        showToast('Profile avatar updated!', 'success');
        closeAvatarModal();
    } else {
        showToast(res.error || 'Failed to update avatar.', 'error');
    }
};

window.saveCustomAvatarUrl = function() {
    const input = document.getElementById('customAvatarInput');
    const url = input ? input.value.trim() : '';
    if (!url) {
        showToast('Please enter a valid image URL.', 'error');
        return;
    }
    selectAvatarPreset(url);
};

window.handleAvatarFileUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showToast('Please select an image smaller than 2MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
        selectAvatarPreset(evt.target.result);
    };
    reader.readAsDataURL(file);
};

window.updateCurrencySetting = function(sym) {
    const s = FinanceStore.getSettings();
    s.currencySymbol = sym;
    FinanceStore.saveSettings(s);
    showToast(`Currency updated to ${sym}`, 'success');
};

window.exportProfilePDF = function() {
    const user = AuthManager.getCurrentUser();
    if (!user || !user.email) {
        showToast('Please sign in to export your profile PDF.', 'error');
        return;
    }

    const name = (user.name && user.name.trim()) ? user.name.trim() : user.email.split('@')[0];
    const email = user.email;
    const provider = user.authProvider || user.auth_provider || 'Email';
    const currency = user.currency || '₹';
    const occupation = user.occupation || 'Not specified';

    const txs = FinanceStore.getTransactions() || [];
    const inc = FinanceStore.getIncome() || [];
    const exp = FinanceStore.getExpenses() || [];
    const bg = FinanceStore.getBudgets() || { totalBudget: 0, categories: {} };

    const totalInc = inc.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const totalExp = exp.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const netBal = totalInc - totalExp;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('Please allow popups to export the PDF report.', 'error');
        return;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>SmartFinance Profile & Financial Report - ${escapeHTML(name)}</title>
        <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #173d82; padding-bottom: 15px; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 800; color: #173d82; letter-spacing: -0.5px; }
            .title { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .section { margin-bottom: 28px; }
            .section-title { font-size: 15px; font-weight: 700; color: #173d82; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .info-box { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .info-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-val { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
            th { background: #f1f5f9; color: #173d82; font-weight: 700; font-size: 11px; text-transform: uppercase; }
            tr:nth-child(even) { background: #f8fafc; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">SmartFinance</div>
            <div class="title">Personal Account & Financial Report</div>
        </div>

        <div class="section">
            <div class="section-title">Account Profile Information</div>
            <div class="grid">
                <div class="info-box">
                    <div class="info-label">Full Name</div>
                    <div class="info-val">${escapeHTML(name)}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Email Address</div>
                    <div class="info-val">${escapeHTML(email)}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Authentication Method</div>
                    <div class="info-val">${escapeHTML(provider)}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Active Currency</div>
                    <div class="info-val">${escapeHTML(currency)}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Occupation / Role</div>
                    <div class="info-val">${escapeHTML(occupation)}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Report Export Date</div>
                    <div class="info-val">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Financial Summary</div>
            <div class="grid">
                <div class="info-box">
                    <div class="info-label">Total Income Logged</div>
                    <div class="info-val" style="color:#16a34a;">${currency}${totalInc.toLocaleString()}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Total Expenses Logged</div>
                    <div class="info-val" style="color:#dc2626;">${currency}${totalExp.toLocaleString()}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Net Financial Balance</div>
                    <div class="info-val">${currency}${netBal.toLocaleString()}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Monthly Target Budget</div>
                    <div class="info-val">${currency}${(bg.totalBudget || 0).toLocaleString()}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Recent Transactions (${txs.length} Total Records)</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Title / Category</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${txs.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:15px;">No transaction records logged.</td></tr>' : 
                    txs.slice(0, 20).map(t => `
                        <tr>
                            <td>${escapeHTML(formatDateDisplay(t.date, t.time))}</td>
                            <td style="text-transform:capitalize; font-weight:600;">${escapeHTML(t.type || 'expense')}</td>
                            <td>${escapeHTML(t.title || t.category || '')} <span style="color:#64748b; font-size:11px;">(${escapeHTML(t.category || '')})</span></td>
                            <td style="font-weight:700; color:${t.type === 'income' ? '#16a34a' : '#dc2626'};">${t.type === 'income' ? '+' : '-'}${currency}${(parseFloat(t.amount)||0).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            Generated securely for authenticated account: ${escapeHTML(email)}
        </div>

        <script>
            window.onload = function() {
                window.print();
            };
        </script>
    </body>
    </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast('Profile PDF export report generated.', 'success');
};

window.exportFinancialData = function() {
    const data = {
        user: AuthManager.getCurrentUser(),
        transactions: FinanceStore.getTransactions(),
        budgets: FinanceStore.getBudgets(),
        settings: FinanceStore.getSettings(),
        exportedAt: new Date().toISOString(),
        version: 'SmartFinance 2.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartFinance_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Financial records exported successfully!', 'success');
};

window.importFinancialData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.transactions && Array.isArray(imported.transactions)) {
                const res = await apiRequest('/api/sync/migrate', {
                    method: 'POST',
                    body: JSON.stringify({ transactions: imported.transactions })
                });

                if (imported.budgets) {
                    await FinanceStore.saveBudgets(imported.budgets);
                }

                if (res.ok) {
                    showToast('Financial backup restored successfully!', 'success');
                    await FinanceStore.loadAll();
                    renderCurrentPage();
                } else {
                    showToast(res.error || 'Failed to import backup.', 'error');
                }
            } else {
                showToast('Invalid backup file format.', 'error');
            }
        } catch (err) {
            showToast('Error parsing JSON backup file.', 'error');
        }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
};

window.resetSampleData = async function() {
    if (confirm('Restore realistic default demo transactions and budgets? This will overwrite your recent edits.')) {
        const res = await FinanceStore.resetToDefault();
        if (res && res.success) {
            renderCurrentPage();
        }
    }
};

window.clearAllData = async function() {
    if (confirm('Are you sure you want to clear ALL transaction records? This action cannot be undone.')) {
        const res = await FinanceStore.clearAll();
        if (res && res.success) {
            renderCurrentPage();
        }
    }
};

// =========================================================
// 7. INITIALIZATION ON DOM LOAD
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    if (!AuthManager.requireAuth()) return;
    FinanceStore.init();

    // Responsive Mobile Toggle Setup
    const topbar = document.querySelector('.topbar');
    if (topbar && !document.querySelector('.mobile-nav-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-nav-toggle';
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        toggleBtn.onclick = window.toggleMobileSidebar;
        topbar.prepend(toggleBtn);
    }

    // Login Form Setup
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const savedEmail = localStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
        const emailInput = document.getElementById('loginEmail');
        const rememberCheckbox = document.querySelector('.remember input[type="checkbox"]');
        if (savedEmail && emailInput) {
            emailInput.value = savedEmail;
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const pass = document.getElementById('loginPassword').value;
            const remember = rememberCheckbox ? rememberCheckbox.checked : false;

            if (!email || !pass) {
                showToast('Please enter your email and password.', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showToast('Please enter a valid email address (e.g. user@gmail.com).', 'error');
                return;
            }

            const result = await AuthManager.login(email, pass);
            if (result && result.success) {
                if (remember) {
                    localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, email);
                } else {
                    localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
                }

                showToast(`Welcome back, ${result.user.name}!`, 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 600);
            } else {
                showToast(result.message || 'Invalid email or password. Please check your credentials and try again.', 'error');
            }
        });
    }

    // Register Form Setup
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const passInput = document.getElementById('registerPassword');
        const meterWrap = document.getElementById('passwordMeterWrap');

        if (passInput && meterWrap) {
            passInput.addEventListener('input', () => {
                const strength = checkPasswordStrength(passInput.value);
                meterWrap.className = `password-meter-wrap strength-${strength}`;
                const label = meterWrap.querySelector('.password-meter-label');
                if (label) {
                    label.textContent = strength === 'none' ? 'Password strength' : `Strength: ${strength.toUpperCase()}`;
                }
            });
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const pass = document.getElementById('registerPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;

            if (!name || !email || !pass) {
                showToast('Please fill out all required fields.', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showToast('Please enter a valid email address (e.g. user@gmail.com).', 'error');
                return;
            }

            if (pass.length < 6) {
                showToast('Password must be at least 6 characters.', 'error');
                return;
            }

            if (pass !== confirmPass) {
                showToast('Passwords do not match.', 'error');
                return;
            }

            const res = await AuthManager.register(name, email, pass);
            if (res && res.success) {
                showToast('Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 700);
            } else {
                showToast(res.message || 'Registration failed. Please try again.', 'error');
            }
        });
    }

    setupGoogleSignIn();
    renderCurrentPage();
});

let googleInitRetries = 0;

function resetGoogleBtn() {
    const btns = document.querySelectorAll('.google-btn-custom, #googleCustomBtn');
    btns.forEach(btn => {
        btn.disabled = false;
        btn.removeAttribute('disabled');
        const isRegister = window.location.pathname.includes('register.html');
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.27C.46 8.2 0 10.05 0 12s.46 3.8 1.27 5.41l4.01-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.99 6.72-4.99z"/>
            </svg>
            <span>${isRegister ? 'Sign up with Google' : 'Continue with Google'}</span>
        `;
    });
}
window.resetGoogleBtn = resetGoogleBtn;

function showGoogleSetupModal() {
    let modal = document.getElementById('googleSetupModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'googleSetupModal';
        modal.className = 'sf-modal-overlay';
        modal.innerHTML = `
            <div class="sf-modal-box" style="max-width:500px; text-align:left;">
                <div class="sf-modal-header">
                    <div class="sf-modal-title-wrap">
                        <i class="fa-brands fa-google modal-icon" style="color:#4285f4; background:#e8f0fe;"></i>
                        <h3>Google Sign-In Configuration</h3>
                    </div>
                    <button type="button" class="close-modal-btn" onclick="closeGoogleSetupModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div style="padding:10px 0 20px;">
                    <div style="background:#fffbeb; border:1px solid #fef3c7; border-radius:10px; padding:14px; margin-bottom:18px;">
                        <div style="display:flex; gap:10px; align-items:flex-start;">
                            <i class="fa-solid fa-triangle-exclamation" style="color:#d97706; font-size:1.1rem; margin-top:2px;"></i>
                            <div style="font-size:0.86rem; color:#92400e; line-height:1.5;">
                                <strong>Google OAuth Configuration</strong><br>
                                Enter your Google Cloud OAuth 2.0 Client ID below.
                            </div>
                        </div>
                    </div>

                    <ol style="font-size:0.84rem; color:#334155; margin-left:20px; line-height:1.7; margin-bottom:18px;">
                        <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:#2563eb; text-decoration:underline;">Google Cloud Console &rarr; Credentials</a>.</li>
                        <li>Create an <strong>OAuth 2.0 Client ID</strong> (Application type: <em>Web application</em>).</li>
                        <li>Add <code>http://localhost:5500</code> under <strong>Authorized JavaScript origins</strong>.</li>
                        <li>Paste your Client ID below.</li>
                    </ol>

                    <div class="form-group">
                        <label for="googleClientIdInput" style="font-weight:600; font-size:0.86rem; color:#1e293b; display:block; margin-bottom:6px;">Google OAuth Client ID</label>
                        <div class="input-box">
                            <i class="fa-solid fa-key"></i>
                            <input type="text" id="googleClientIdInput" placeholder="e.g. 123456789-xxx.apps.googleusercontent.com" style="font-size:0.85rem;">
                        </div>
                    </div>
                </div>

                <div class="sf-modal-actions" style="display:flex; justify:flex-end; gap:8px;">
                    <button type="button" class="cancel-btn" onclick="closeGoogleSetupModal()">Cancel</button>
                    <button type="button" class="navy-btn" onclick="saveGoogleClientIdFromModal()">
                        <i class="fa-solid fa-check"></i> Save & Continue
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeGoogleSetupModal();
        });
    }

    const input = document.getElementById('googleClientIdInput');
    const existing = localStorage.getItem('sf_google_client_id') || (GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID' ? GOOGLE_CLIENT_ID : '');
    if (input) input.value = existing;

    modal.classList.add('active');
}
window.showGoogleSetupModal = showGoogleSetupModal;

function closeGoogleSetupModal() {
    const modal = document.getElementById('googleSetupModal');
    if (modal) modal.classList.remove('active');
    resetGoogleBtn();
}
window.closeGoogleSetupModal = closeGoogleSetupModal;

function saveGoogleClientIdFromModal() {
    const input = document.getElementById('googleClientIdInput');
    const val = input ? input.value.trim() : '';

    if (!val) {
        showToast('Please enter a valid Google OAuth Client ID.', 'error');
        return;
    }

    if (!val.includes('.apps.googleusercontent.com')) {
        showToast('Invalid Client ID format. It should end with .apps.googleusercontent.com', 'error');
        return;
    }

    localStorage.setItem('sf_google_client_id', val);
    showToast('Google Client ID saved successfully!', 'success');
    closeGoogleSetupModal();

    setupGoogleSignIn();
    if (typeof window.google === 'undefined') {
        let gsiCheckInterval = setInterval(() => {
            if (typeof window.google !== 'undefined') {
                clearInterval(gsiCheckInterval);
                setupGoogleSignIn();
            }
        }, 300);
        setTimeout(() => clearInterval(gsiCheckInterval), 5000);
    }
    setTimeout(() => {
        triggerGoogleSignIn();
    }, 200);
}
window.saveGoogleClientIdFromModal = saveGoogleClientIdFromModal;

function setupGoogleSignIn() {
    if (!AuthManager.isGoogleConfigured()) {
        const container = document.getElementById('googleSignInDiv');
        if (container) container.style.display = 'none';
        return;
    }
    const clientId = AuthManager.getGoogleClientId();
    if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: (res) => AuthManager.handleGoogleCredentialResponse(res),
                auto_select: false,
                cancel_on_tap_outside: true
            });
            const container = document.getElementById('googleSignInDiv');
            const customBtn = document.getElementById('googleCustomBtn');
            if (container) {
                container.style.display = 'block';
                container.style.position = 'absolute';
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.opacity = '0.0001';
                container.style.zIndex = '5';
                container.style.overflow = 'hidden';
                container.style.pointerEvents = 'auto';

                const isRegister = window.location.pathname.includes('register.html');
                google.accounts.id.renderButton(container, {
                    theme: 'outline',
                    size: 'large',
                    width: 380,
                    text: isRegister ? 'signup_with' : 'continue_with',
                    shape: 'rectangular'
                });

                if (customBtn) {
                    customBtn.style.display = 'flex';
                }
            }
        } catch (err) {
            console.warn('Google GSI initialize warning:', err);
        }
    }
}
window.setupGoogleSignIn = setupGoogleSignIn;

window.triggerGoogleSignIn = function() {
    const btns = document.querySelectorAll('.google-btn-custom, #googleCustomBtn');

    // 1. If Google Client ID is not configured, show clear configuration message
    if (!AuthManager.isGoogleConfigured()) {
        resetGoogleBtn();
        showToast('Google Sign-In is not configured yet. Please configure the Google OAuth Client ID.', 'error');
        showGoogleSetupModal();
        return;
    }

    // 2. Set visual loading state on button
    btns.forEach(btn => {
        btn.disabled = true;
        btn.setAttribute('disabled', 'true');
        btn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>
            <span>Connecting to Google...</span>
        `;
    });

    // 3. Ensure Google Identity Services library is available
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        resetGoogleBtn();
        showToast('Google Identity Services client is loading. Please check connection and try again.', 'error');
        return;
    }

    const clientId = AuthManager.getGoogleClientId();

    try {
        google.accounts.id.initialize({
            client_id: clientId,
            callback: (res) => AuthManager.handleGoogleCredentialResponse(res),
            auto_select: false,
            cancel_on_tap_outside: true
        });

        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
                resetGoogleBtn();
            }
        });
    } catch (err) {
        console.error('Google Sign-In invocation error:', err);
        resetGoogleBtn();
        showToast('Google sign-in could not be completed. Please try again.', 'error');
    }
};

// =========================================================
// SECURE PASSWORD RESET WORKFLOW
// =========================================================

function showForgotPasswordModal() {
    let modal = document.getElementById('forgotPasswordModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'forgotPasswordModal';
        modal.className = 'sf-modal-overlay';
        modal.innerHTML = `
            <div class="sf-modal-box" style="max-width:440px; text-align:left;">
                <div class="sf-modal-header">
                    <div class="sf-modal-title-wrap">
                        <i class="fa-solid fa-key modal-icon" style="color:#2563eb; background:#eff6ff;"></i>
                        <h3 id="fpModalTitle">Reset Password</h3>
                    </div>
                    <button type="button" class="close-modal-btn" onclick="closeForgotPasswordModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div style="padding:15px 0 20px;" id="fpStep1">
                    <p style="font-size:0.86rem; color:#64748b; margin-bottom:14px; line-height:1.5;">
                        Enter your registered email address below. We'll issue a secure password reset token to update your credentials.
                    </p>
                    <div class="form-group">
                        <label for="fpEmailInput" style="font-weight:600; font-size:0.86rem; color:#1e293b; display:block; margin-bottom:6px;">Email Address</label>
                        <div class="input-box">
                            <i class="fa-solid fa-envelope"></i>
                            <input type="email" id="fpEmailInput" placeholder="name@example.com" style="font-size:0.85rem;" required>
                        </div>
                    </div>
                    <div class="sf-modal-actions" style="display:flex; justify:flex-end; gap:8px; margin-top:20px;">
                        <button type="button" class="cancel-btn" onclick="closeForgotPasswordModal()">Cancel</button>
                        <button type="button" class="navy-btn" id="fpRequestBtn" onclick="submitForgotPasswordRequest()">
                            <i class="fa-solid fa-paper-plane"></i> Get Reset Token
                        </button>
                    </div>
                </div>

                <div style="padding:15px 0 20px; display:none;" id="fpStep2">
                    <p style="font-size:0.86rem; color:#64748b; margin-bottom:14px; line-height:1.5;">
                        Enter the reset token and your new password below.
                    </p>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label for="fpTokenInput" style="font-weight:600; font-size:0.86rem; color:#1e293b; display:block; margin-bottom:6px;">Reset Token</label>
                        <div class="input-box">
                            <i class="fa-solid fa-ticket"></i>
                            <input type="text" id="fpTokenInput" placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" style="font-size:0.85rem;" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="fpNewPasswordInput" style="font-weight:600; font-size:0.86rem; color:#1e293b; display:block; margin-bottom:6px;">New Password</label>
                        <div class="input-box">
                            <i class="fa-solid fa-lock"></i>
                            <input type="password" id="fpNewPasswordInput" placeholder="Minimum 6 characters" style="font-size:0.85rem;" required>
                        </div>
                    </div>
                    <div class="sf-modal-actions" style="display:flex; justify:flex-end; gap:8px; margin-top:20px;">
                        <button type="button" class="cancel-btn" onclick="closeForgotPasswordModal()">Cancel</button>
                        <button type="button" class="navy-btn" id="fpResetBtn" onclick="submitResetPasswordRequest()">
                            <i class="fa-solid fa-check-double"></i> Update Password
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeForgotPasswordModal();
        });
    }

    const loginEmail = document.getElementById('loginEmail');
    const fpEmail = document.getElementById('fpEmailInput');
    if (loginEmail && fpEmail && loginEmail.value.trim()) {
        fpEmail.value = loginEmail.value.trim();
    }

    document.getElementById('fpStep1').style.display = 'block';
    document.getElementById('fpStep2').style.display = 'none';
    modal.classList.add('active');
}
window.showForgotPasswordModal = showForgotPasswordModal;

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) modal.classList.remove('active');
}
window.closeForgotPasswordModal = closeForgotPasswordModal;

async function submitForgotPasswordRequest() {
    const emailInput = document.getElementById('fpEmailInput');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email || !isValidEmail(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }

    const btn = document.getElementById('fpRequestBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    }

    const res = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
    });

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Get Reset Token';
    }

    if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Reset token generated.', 'success');
        document.getElementById('fpStep1').style.display = 'none';
        document.getElementById('fpStep2').style.display = 'block';
        if (res.data.resetToken) {
            const tokenInput = document.getElementById('fpTokenInput');
            if (tokenInput) tokenInput.value = res.data.resetToken;
        }
    } else {
        showToast(res.error || 'Failed to request password reset.', 'error');
    }
}
window.submitForgotPasswordRequest = submitForgotPasswordRequest;

async function submitResetPasswordRequest() {
    const tokenInput = document.getElementById('fpTokenInput');
    const passInput = document.getElementById('fpNewPasswordInput');
    const token = tokenInput ? tokenInput.value.trim() : '';
    const newPassword = passInput ? passInput.value : '';

    if (!token) {
        showToast('Please enter your reset token.', 'error');
        return;
    }

    if (!newPassword || newPassword.length < 6) {
        showToast('New password must be at least 6 characters long.', 'error');
        return;
    }

    const btn = document.getElementById('fpResetBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
    }

    const res = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
    });

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Update Password';
    }

    if (res.ok && res.data && res.data.success) {
        showToast('Password updated successfully! Please log in with your new password.', 'success');
        closeForgotPasswordModal();
        const loginPass = document.getElementById('loginPassword');
        if (loginPass) loginPass.value = newPassword;
    } else {
        showToast(res.error || 'Failed to reset password.', 'error');
    }
}
window.submitResetPasswordRequest = submitResetPasswordRequest;