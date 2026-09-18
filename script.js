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
// 2. Add "http://localhost:5500" to "Authorized JavaScript origins".
// 3. Replace "YOUR_GOOGLE_CLIENT_ID" below with your actual Client ID (ends with .apps.googleusercontent.com).
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

const STORAGE_KEYS = {
    USERS: 'sf_users_directory',
    CURRENT_USER: 'sf_current_user',
    REMEMBER_EMAIL: 'sf_remember_email',
    AI_CHAT_HISTORY: 'sf_ai_chat_history'
};

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
    { id: 'tx-101', title: 'Monthly Salary', type: 'income', category: 'Salary', amount: 55000, date: '2026-09-01', paymentMethod: 'Net Banking', notes: 'Tech Corp monthly payroll' },
    { id: 'tx-102', title: 'Freelance UI Project', type: 'income', category: 'Freelance', amount: 15000, date: '2026-09-05', paymentMethod: 'UPI', notes: 'Mobile app design deliverables' },
    { id: 'tx-103', title: 'Mutual Fund Dividend', type: 'income', category: 'Investment', amount: 3500, date: '2026-09-12', paymentMethod: 'Net Banking', notes: 'Q3 dividend payout' },
    { id: 'tx-104', title: 'Supermarket Grocery', type: 'expense', category: 'Food', amount: 4250, date: '2026-09-02', paymentMethod: 'UPI', notes: 'Weekly organic groceries' },
    { id: 'tx-105', title: 'Metro Smart Card & Fuel', type: 'expense', category: 'Transport', amount: 1800, date: '2026-09-04', paymentMethod: 'Debit Card', notes: 'Monthly transit recharge' },
    { id: 'tx-106', title: 'Electricity & High-Speed WiFi', type: 'expense', category: 'Bills', amount: 3200, date: '2026-09-06', paymentMethod: 'Net Banking', notes: 'Power bill and fiber optic internet' },
    { id: 'tx-107', title: 'Online Coding Masterclass', type: 'expense', category: 'Education', amount: 2499, date: '2026-09-07', paymentMethod: 'Credit Card', notes: 'Cloud AI architecture certification' },
    { id: 'tx-108', title: 'Weekend Dining & Cafe', type: 'expense', category: 'Food', amount: 2150, date: '2026-09-08', paymentMethod: 'UPI', notes: 'Dinner with friends' },
    { id: 'tx-109', title: 'Clothing & Footwear', type: 'expense', category: 'Shopping', amount: 3400, date: '2026-09-10', paymentMethod: 'Credit Card', notes: 'Work attire renewal' },
    { id: 'tx-110', title: 'Pharmacy & Health Checkup', type: 'expense', category: 'Health', amount: 1100, date: '2026-09-11', paymentMethod: 'Debit Card', notes: 'Vitamins and routine check' },
    { id: 'tx-111', title: 'Movie Night & Streaming', type: 'expense', category: 'Entertainment', amount: 950, date: '2026-09-13', paymentMethod: 'UPI', notes: 'Cinema tickets and snacks' },
    { id: 'tx-112', title: 'Flight & Cab Booking', type: 'expense', category: 'Travel', amount: 3800, date: '2026-09-14', paymentMethod: 'Credit Card', notes: 'Intercity conference travel' },

    // August 2026 (For multi-month comparison)
    { id: 'tx-081', title: 'August Salary', type: 'income', category: 'Salary', amount: 55000, date: '2026-08-01', paymentMethod: 'Net Banking', notes: 'August compensation' },
    { id: 'tx-082', title: 'Consulting Gig', type: 'income', category: 'Freelance', amount: 12000, date: '2026-08-10', paymentMethod: 'UPI', notes: 'Architecture audit' },
    { id: 'tx-083', title: 'Monthly Rent & Bills', type: 'expense', category: 'Bills', amount: 8500, date: '2026-08-05', paymentMethod: 'Net Banking', notes: 'Utilities and maintenance' },
    { id: 'tx-084', title: 'Dining & Provisions', type: 'expense', category: 'Food', amount: 6400, date: '2026-08-12', paymentMethod: 'UPI', notes: 'August food expenses' },
    { id: 'tx-085', title: 'Travel & Commute', type: 'expense', category: 'Transport', amount: 2800, date: '2026-08-18', paymentMethod: 'Debit Card', notes: 'Fuel and taxis' },
    { id: 'tx-086', title: 'Tech Gadget Purchase', type: 'expense', category: 'Shopping', amount: 4800, date: '2026-08-25', paymentMethod: 'Credit Card', notes: 'Wireless keyboard and mouse' },

    // July 2026
    { id: 'tx-071', title: 'July Salary', type: 'income', category: 'Salary', amount: 52000, date: '2026-07-01', paymentMethod: 'Net Banking', notes: 'July salary' },
    { id: 'tx-072', title: 'July Living Expenses', type: 'expense', category: 'Food', amount: 5800, date: '2026-07-15', paymentMethod: 'UPI', notes: 'Groceries' },
    { id: 'tx-073', title: 'July Utilities', type: 'expense', category: 'Bills', amount: 3100, date: '2026-07-08', paymentMethod: 'Net Banking', notes: 'Electricity bill' },
    { id: 'tx-074', title: 'Monsoon Train Trip', type: 'expense', category: 'Travel', amount: 4200, date: '2026-07-22', paymentMethod: 'Credit Card', notes: 'Weekend retreat' },

    // June 2026
    { id: 'tx-061', title: 'June Salary', type: 'income', category: 'Salary', amount: 52000, date: '2026-06-01', paymentMethod: 'Net Banking', notes: 'June salary' },
    { id: 'tx-062', title: 'June Expenses Aggregate', type: 'expense', category: 'Food', amount: 5200, date: '2026-06-14', paymentMethod: 'UPI', notes: 'Groceries and food' },
    { id: 'tx-063', title: 'Shopping & Gear', type: 'expense', category: 'Shopping', amount: 3900, date: '2026-06-20', paymentMethod: 'Credit Card', notes: 'Monsoon gear' }
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

const AuthManager = {
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
        } catch (e) {
            return [];
        }
    },

    saveUsers(users) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
        } catch (e) {
            return null;
        }
    },

    setCurrentUser(user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        if (user && user.id) {
            FinanceStore.initForUser(user.id);
        }
    },

    isAuthenticated() {
        const user = this.getCurrentUser();
        return Boolean(user && user.authenticated === true);
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
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    getActiveUserId() {
        const user = this.getCurrentUser();
        return (user && user.id) ? user.id : 'demo_alex';
    },

    logout() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        window.location.href = 'login.html';
    },

    register(name, email, password) {
        const users = this.getUsers();
        const normalizedEmail = email.toLowerCase().trim();

        if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
            return { success: false, message: 'An account with this email already exists.' };
        }

        const newUser = {
            id: 'usr_' + Date.now(),
            name: name.trim(),
            email: normalizedEmail,
            passwordHash: btoa(password),
            authProvider: 'Email',
            authenticated: true,
            picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);
        this.setCurrentUser(newUser);

        return { success: true, user: newUser };
    },

    login(email, password) {
        const normalizedEmail = email.toLowerCase().trim();

        if (normalizedEmail === 'alex.finance@gmail.com' && (password === 'demo123' || password === 'password')) {
            const demoUser = {
                id: 'demo_alex',
                name: 'Alex Johnson',
                email: 'alex.finance@gmail.com',
                authProvider: 'Email',
                authenticated: true,
                picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
                createdAt: new Date().toISOString()
            };
            this.setCurrentUser(demoUser);
            return { success: true, user: demoUser };
        }

        const users = this.getUsers();
        const found = users.find(u => u.email.toLowerCase() === normalizedEmail);

        if (!found) {
            return { success: false, message: 'No account found with this email address.' };
        }

        if (found.passwordHash !== btoa(password)) {
            return { success: false, message: 'Incorrect password. Please try again.' };
        }

        found.authenticated = true;
        this.setCurrentUser(found);
        return { success: true, user: found };
    },

    handleGoogleAuthSuccess(profile) {
        if (!profile || (!profile.email && !profile.sub && !profile.id)) {
            showToast('Google authentication did not return verified user information.', 'error');
            resetGoogleBtn();
            return;
        }

        const email = (profile.email || '').toLowerCase().trim();
        const name = profile.name || (email ? email.split('@')[0] : 'Google User');
        const googleId = profile.sub || profile.id || Date.now();
        const picture = profile.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';

        const users = this.getUsers();
        let existingUser = users.find(u => u.email.toLowerCase() === email);

        if (!existingUser) {
            existingUser = {
                id: 'goog_' + googleId,
                name: name,
                email: email,
                picture: picture,
                authProvider: 'Google',
                authenticated: true,
                createdAt: new Date().toISOString()
            };
            users.push(existingUser);
        } else {
            existingUser.authenticated = true;
            existingUser.authProvider = 'Google';
            if (picture) existingUser.picture = picture;
            if (name) existingUser.name = name;
        }

        this.saveUsers(users);
        this.setCurrentUser(existingUser);

        showToast(`Login successful! Welcome, ${existingUser.name}.`, 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    },

    handleGoogleCredentialResponse(response) {
        try {
            if (!response || !response.credential) {
                showToast('Google sign-in was not completed.', 'error');
                resetGoogleBtn();
                return;
            }

            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const googleProfile = JSON.parse(jsonPayload);
            this.handleGoogleAuthSuccess(googleProfile);
        } catch (err) {
            console.error('Google Sign-In credential parsing error:', err);
            showToast('Failed to parse Google authentication credential.', 'error');
            resetGoogleBtn();
        }
    }
};

// Immediate execution auth guard: redirect unauthenticated users before DOM rendering or external CDN scripts load
AuthManager.requireAuth();


// =========================================================
// 3. FINANCE STORE & BUDGET ENGINE (PER-USER DATA)
// =========================================================

const FinanceStore = {
    getKey(suffix) {
        const uid = AuthManager.getActiveUserId();
        return `sf_${suffix}_${uid}`;
    },

    initForUser(userId) {
        const txKey = `sf_tx_${userId}`;
        const bgKey = `sf_bg_${userId}`;
        const stKey = `sf_st_${userId}`;

        if (!localStorage.getItem(txKey)) {
            localStorage.setItem(txKey, JSON.stringify(DEFAULT_SAMPLE_TRANSACTIONS));
        }
        if (!localStorage.getItem(bgKey)) {
            localStorage.setItem(bgKey, JSON.stringify(DEFAULT_BUDGETS));
        }
        if (!localStorage.getItem(stKey)) {
            localStorage.setItem(stKey, JSON.stringify({
                currencySymbol: '₹',
                currencyCode: 'INR',
                monthlyIncomeTarget: 60000,
                notifyBudgetLimit: true,
                notifyWeeklyDigest: false
            }));
        }
    },

    init() {
        const uid = AuthManager.getActiveUserId();
        this.initForUser(uid);
    },

    getSettings() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem(this.getKey('st'))) || {
                currencySymbol: '₹',
                currencyCode: 'INR',
                monthlyIncomeTarget: 60000,
                notifyBudgetLimit: true
            };
        } catch (e) {
            return { currencySymbol: '₹', currencyCode: 'INR' };
        }
    },

    saveSettings(settings) {
        localStorage.setItem(this.getKey('st'), JSON.stringify(settings));
    },

    getBudgets() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem(this.getKey('bg'))) || DEFAULT_BUDGETS;
        } catch (e) {
            return DEFAULT_BUDGETS;
        }
    },

    saveBudgets(budgets) {
        localStorage.setItem(this.getKey('bg'), JSON.stringify(budgets));
    },

    getTransactions() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem(this.getKey('tx'))) || [];
        } catch (e) {
            return [];
        }
    },

    saveTransactions(txs) {
        localStorage.setItem(this.getKey('tx'), JSON.stringify(txs));
    },

    getTransactionById(id) {
        const list = this.getTransactions();
        return list.find(t => t.id === id);
    },

    addTransaction(data) {
        const list = this.getTransactions();
        const newTx = {
            id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            title: data.title ? data.title.trim() : 'Untitled Transaction',
            type: data.type === 'income' ? 'income' : 'expense',
            category: data.category || (data.type === 'income' ? 'Other Income' : 'Other'),
            amount: Math.abs(parseFloat(data.amount)) || 0,
            paymentMethod: data.paymentMethod || 'UPI',
            date: data.date || new Date().toISOString().split('T')[0],
            notes: (data.notes || '').trim()
        };
        list.unshift(newTx);
        this.saveTransactions(list);
        return newTx;
    },

    updateTransaction(id, updatedData) {
        const list = this.getTransactions();
        const index = list.findIndex(t => t.id === id);
        if (index === -1) return null;

        list[index] = {
            ...list[index],
            title: updatedData.title ? updatedData.title.trim() : list[index].title,
            type: updatedData.type || list[index].type,
            category: updatedData.category || list[index].category,
            amount: Math.abs(parseFloat(updatedData.amount)) || list[index].amount,
            paymentMethod: updatedData.paymentMethod || list[index].paymentMethod || 'UPI',
            date: updatedData.date || list[index].date,
            notes: (updatedData.notes !== undefined ? updatedData.notes : list[index].notes).trim()
        };

        this.saveTransactions(list);
        return list[index];
    },

    deleteTransaction(id) {
        let list = this.getTransactions();
        list = list.filter(t => t.id !== id);
        this.saveTransactions(list);
        return list;
    },

    getTransactionsByMonth(yearMonth = null) {
        const list = this.getTransactions();
        if (!yearMonth) return list;
        return list.filter(t => t.date && t.date.startsWith(yearMonth));
    },

    getSummary(yearMonth = null) {
        const allTxs = this.getTransactions();
        let targetMonth = yearMonth || new Date().toISOString().slice(0, 7);
        let monthTxs = allTxs.filter(t => t.date && t.date.startsWith(targetMonth));

        // Fallback to most recent month present in user's data if current month has no records
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

    resetToDefault() {
        const uid = AuthManager.getActiveUserId();
        localStorage.setItem(`sf_tx_${uid}`, JSON.stringify(DEFAULT_SAMPLE_TRANSACTIONS));
        localStorage.setItem(`sf_bg_${uid}`, JSON.stringify(DEFAULT_BUDGETS));
    },

    clearAll() {
        const uid = AuthManager.getActiveUserId();
        localStorage.setItem(`sf_tx_${uid}`, JSON.stringify([]));
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

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = parseInt(parts[2], 10);
            const monthName = months[parseInt(parts[1], 10) - 1];
            const year = parts[0];
            return `${day} ${monthName} ${year}`;
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

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
            document.getElementById('modalDate').value = tx.date || new Date().toISOString().split('T')[0];
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
    document.getElementById('modalDate').value = new Date().toISOString().split('T')[0];
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

                    <div class="form-group" id="modalPaymentGroup">
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

function handleTransactionSubmit(event) {
    event.preventDefault();
    const type = document.querySelector('input[name="txType"]:checked').value;
    const title = document.getElementById('modalTitleInput').value.trim();
    const amount = parseFloat(document.getElementById('modalAmount').value);
    const category = document.getElementById('modalCategory').value;
    const date = document.getElementById('modalDate').value;
    const paymentMethod = document.getElementById('modalPaymentMethod').value;
    const notes = document.getElementById('modalNotes').value.trim();

    if (!title || isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid title and positive amount.', 'error');
        return;
    }

    if (currentEditingTransactionId) {
        FinanceStore.updateTransaction(currentEditingTransactionId, {
            type, title, amount, category, date, paymentMethod, notes
        });
        showToast(`Transaction updated successfully!`, 'success');
    } else {
        FinanceStore.addTransaction({
            type, title, amount, category, date, paymentMethod, notes
        });
        showToast(`${type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(amount)} added!`, 'success');
    }

    closeTransactionModal();
    renderCurrentPage();
}

function deleteTransactionItem(id, title) {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
        FinanceStore.deleteTransaction(id);
        showToast(`Deleted "${title}"`, 'info');
        renderCurrentPage();
    }
}

function editTransactionItem(id) {
    const tx = FinanceStore.getTransactionById(id);
    if (tx) {
        openTransactionModal(tx.type, id);
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

function handleBudgetSubmit(event) {
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

    FinanceStore.saveBudgets({ totalBudget: total, categories });
    closeBudgetModal();
    showToast(`Monthly budget set to ${formatCurrency(total)}`, 'success');
    renderCurrentPage();
}

window.openBudgetModal = openBudgetModal;
window.closeBudgetModal = closeBudgetModal;
window.handleBudgetSubmit = handleBudgetSubmit;

// =========================================================
// 6. PAGE RENDERERS
// =========================================================

function renderCurrentPage() {
    // 1. Enforce authentication guard on protected pages
    if (!AuthManager.requireAuth()) {
        return;
    }

    const path = window.location.pathname.toLowerCase();

    // 2. If authenticated user navigates to login or register, redirect to dashboard
    if (AuthManager.isAuthenticated()) {
        if (path.includes('login.html') || path.includes('register.html')) {
            window.location.href = 'dashboard.html';
            return;
        }
    }

    updateUserNavUI();

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
        renderProfilePage();
    }
}

function updateUserNavUI() {
    const user = AuthManager.getCurrentUser();
    const profileLink = document.querySelector('.profile-icon');
    if (profileLink && user) {
        if (user.picture) {
            profileLink.innerHTML = `<img src="${escapeHTML(user.picture)}" alt="${escapeHTML(user.name)}" class="nav-user-avatar">`;
        }
        profileLink.title = user.name || 'Profile';
    }
}

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
                    <button class="navy-btn small-btn" onclick="openTransactionModal('expense')" style="margin-top:14px;">
                        <i class="fa-solid fa-plus"></i> Add First Expense
                    </button>
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
                            ${escapeHTML(tx.category)} • ${formatDateDisplay(tx.date)}
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
        if (expenseFilterState.sort === 'NEWEST') return new Date(b.date) - new Date(a.date);
        if (expenseFilterState.sort === 'OLDEST') return new Date(a.date) - new Date(b.date);
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
                    <button class="navy-btn small-btn" onclick="openTransactionModal('expense')" style="margin-top:12px;">
                        <i class="fa-solid fa-plus"></i> Add New Expense
                    </button>
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
        if (incomeFilterState.sort === 'NEWEST') return new Date(b.date) - new Date(a.date);
        if (incomeFilterState.sort === 'OLDEST') return new Date(a.date) - new Date(b.date);
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
                    <button class="navy-btn small-btn" onclick="openTransactionModal('income')" style="margin-top:12px;">
                        <i class="fa-solid fa-plus"></i> Add New Income
                    </button>
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
                            ${escapeHTML(tx.category)} • ${formatDateDisplay(tx.date)}
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
        const listItems = recents.map(t => `<li><strong>${escapeHTML(t.title)}</strong>: ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)} (${escapeHTML(t.category)} on ${t.date})</li>`).join('');
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
function renderProfilePage() {
    const user = AuthManager.getCurrentUser() || {
        name: 'Alex Johnson',
        email: 'alex.finance@gmail.com',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        authProvider: 'Google (Demo)'
    };

    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const avatarEl = document.getElementById('profileAvatar');
    const providerEl = document.getElementById('profileProvider');

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl && user.picture) avatarEl.src = user.picture;
    if (providerEl) providerEl.textContent = user.authProvider || 'Email';

    const settings = FinanceStore.getSettings();
    const currSelect = document.getElementById('currencySelect');
    if (currSelect) currSelect.value = settings.currencySymbol || '₹';

    const budgets = FinanceStore.getBudgets();
    const budgetInput = document.getElementById('profileMonthlyBudget');
    if (budgetInput) budgetInput.value = budgets.totalBudget || 35000;
}

window.updateCurrencySetting = function(sym) {
    const s = FinanceStore.getSettings();
    s.currencySymbol = sym;
    FinanceStore.saveSettings(s);
    showToast(`Currency updated to ${sym}`, 'success');
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
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.transactions && Array.isArray(imported.transactions)) {
                FinanceStore.saveTransactions(imported.transactions);
                if (imported.budgets) FinanceStore.saveBudgets(imported.budgets);
                if (imported.settings) FinanceStore.saveSettings(imported.settings);

                showToast('Financial backup restored successfully!', 'success');
                setTimeout(() => location.reload(), 500);
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

window.resetSampleData = function() {
    if (confirm('Restore realistic default demo transactions and budgets? This will overwrite your recent edits.')) {
        FinanceStore.resetToDefault();
        showToast('Sample data restored.', 'info');
        setTimeout(() => location.reload(), 400);
    }
};

window.clearAllData = function() {
    if (confirm('Are you sure you want to clear ALL transaction records? This action cannot be undone.')) {
        FinanceStore.clearAll();
        showToast('All transaction records cleared.', 'error');
        setTimeout(() => location.reload(), 400);
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

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const pass = document.getElementById('loginPassword').value;
            const remember = rememberCheckbox ? rememberCheckbox.checked : false;

            if (!email || !pass) {
                showToast('Please enter your email and password.', 'error');
                return;
            }

            const result = AuthManager.login(email, pass);
            if (result.success) {
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
                showToast(result.message, 'error');
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

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const pass = document.getElementById('registerPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;

            if (!name || !email || !pass) {
                showToast('Please fill out all required fields.', 'error');
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

            const res = AuthManager.register(name, email, pass);
            if (res.success) {
                showToast('Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 700);
            } else {
                showToast(res.message, 'error');
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
    setTimeout(() => {
        triggerGoogleSignIn();
    }, 200);
}
window.saveGoogleClientIdFromModal = saveGoogleClientIdFromModal;

function showGoogleAccountChooserModal() {
    let modal = document.getElementById('googleAccountChooserModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'googleAccountChooserModal';
        modal.className = 'sf-modal-overlay';
        modal.innerHTML = `
            <div class="sf-modal-box" style="max-width:440px; text-align:left; border-radius:16px; padding:26px 22px;">
                <div style="text-align:center; margin-bottom:20px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" style="margin-bottom:8px;">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.26 21.36 7.33 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.27C.46 8.2 0 10.05 0 12s.46 3.8 1.27 5.41l4.01-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.99 6.72-4.99z"/>
                    </svg>
                    <h3 style="font-size:1.2rem; font-weight:700; color:#1e293b; margin-bottom:4px;">Sign in with Google</h3>
                    <p style="font-size:0.85rem; color:#64748b;">Choose an account to continue to SmartFinance</p>
                </div>

                <div class="google-accounts-list" style="display:flex; flex-direction:column; gap:10px; margin-bottom:18px;">
                    <div class="google-acc-item" onclick="selectGoogleAccount('Alex Johnson', 'alex.finance@gmail.com', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80')" style="display:flex; align-items:center; gap:12px; padding:10px 14px; border:1px solid #e2e8f0; border-radius:10px; cursor:pointer; transition:all 0.2s ease; background:#fff;">
                        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80" style="width:38px; height:38px; border-radius:50%; object-fit:cover;">
                        <div style="flex:1;">
                            <div style="font-weight:600; font-size:0.9rem; color:#0f172a;">Alex Johnson</div>
                            <div style="font-size:0.78rem; color:#64748b;">alex.finance@gmail.com</div>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                    </div>

                    <div class="google-acc-item" onclick="selectGoogleAccount('Sarah Connor', 'sarah.tech@gmail.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80')" style="display:flex; align-items:center; gap:12px; padding:10px 14px; border:1px solid #e2e8f0; border-radius:10px; cursor:pointer; transition:all 0.2s ease; background:#fff;">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" style="width:38px; height:38px; border-radius:50%; object-fit:cover;">
                        <div style="flex:1;">
                            <div style="font-weight:600; font-size:0.9rem; color:#0f172a;">Sarah Connor</div>
                            <div style="font-size:0.78rem; color:#64748b;">sarah.tech@gmail.com</div>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                    </div>

                    <div class="google-acc-item" onclick="selectGoogleAccount('Michael Chen', 'm.chen@developer.io', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80')" style="display:flex; align-items:center; gap:12px; padding:10px 14px; border:1px solid #e2e8f0; border-radius:10px; cursor:pointer; transition:all 0.2s ease; background:#fff;">
                        <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80" style="width:38px; height:38px; border-radius:50%; object-fit:cover;">
                        <div style="flex:1;">
                            <div style="font-weight:600; font-size:0.9rem; color:#0f172a;">Michael Chen</div>
                            <div style="font-size:0.78rem; color:#64748b;">m.chen@developer.io</div>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
                    </div>

                    <div id="customGoogleAccountWrap" style="display:none; border:1px solid #3b82f6; border-radius:10px; padding:12px; background:#eff6ff;">
                        <div style="font-weight:600; font-size:0.84rem; color:#1e40af; margin-bottom:8px;">Custom Google Account</div>
                        <input type="text" id="customGoogleName" placeholder="Full Name (e.g. John Doe)" style="width:100%; padding:8px 10px; font-size:0.85rem; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:6px;">
                        <input type="email" id="customGoogleEmail" placeholder="Google Email (e.g. john@gmail.com)" style="width:100%; padding:8px 10px; font-size:0.85rem; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:10px;">
                        <button type="button" class="navy-btn" style="width:100%; padding:8px; font-size:0.85rem;" onclick="submitCustomGoogleAccount()">Continue with this Account</button>
                    </div>

                    <div id="useCustomAccBtn" onclick="showCustomGoogleAccountForm()" style="display:flex; align-items:center; gap:12px; padding:10px 14px; border:1px dashed #cbd5e1; border-radius:10px; cursor:pointer; color:#2563eb; font-weight:600; font-size:0.86rem; background:#faf5ff;">
                        <i class="fa-solid fa-user-plus" style="font-size:1rem;"></i>
                        <span>Use another Google account</span>
                    </div>
                </div>

                <div style="border-top:1px solid #f1f5f9; pt:12px; padding-top:12px; display:flex; justify:space-between; align-items:center; font-size:0.78rem;">
                    <button type="button" onclick="closeGoogleAccountChooserModal()" style="background:none; border:none; color:#64748b; cursor:pointer; font-weight:500;">Cancel</button>
                    <a href="#" onclick="event.preventDefault(); closeGoogleAccountChooserModal(); showGoogleSetupModal();" style="color:#94a3b8; text-decoration:none;">Configure Cloud OAuth</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeGoogleAccountChooserModal();
        });
    }

    const wrap = document.getElementById('customGoogleAccountWrap');
    if (wrap) wrap.style.display = 'none';
    const useCustomBtn = document.getElementById('useCustomAccBtn');
    if (useCustomBtn) useCustomBtn.style.display = 'flex';

    modal.classList.add('active');
}
window.showGoogleAccountChooserModal = showGoogleAccountChooserModal;

function closeGoogleAccountChooserModal() {
    const modal = document.getElementById('googleAccountChooserModal');
    if (modal) modal.classList.remove('active');
    resetGoogleBtn();
}
window.closeGoogleAccountChooserModal = closeGoogleAccountChooserModal;

function selectGoogleAccount(name, email, picture) {
    const str = (email || name || 'user').toLowerCase();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    const googleProfile = {
        name: name,
        email: email,
        picture: picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        sub: 'goog_' + Math.abs(hash)
    };
    closeGoogleAccountChooserModal();
    AuthManager.handleGoogleAuthSuccess(googleProfile);
}
window.selectGoogleAccount = selectGoogleAccount;

function showCustomGoogleAccountForm() {
    const wrap = document.getElementById('customGoogleAccountWrap');
    const btn = document.getElementById('useCustomAccBtn');
    if (wrap) wrap.style.display = 'block';
    if (btn) btn.style.display = 'none';
}
window.showCustomGoogleAccountForm = showCustomGoogleAccountForm;

function submitCustomGoogleAccount() {
    const nameInput = document.getElementById('customGoogleName');
    const emailInput = document.getElementById('customGoogleEmail');
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email || !email.includes('@')) {
        showToast('Please enter a valid Google email address.', 'error');
        return;
    }

    selectGoogleAccount(name || email.split('@')[0], email);
}
window.submitCustomGoogleAccount = submitCustomGoogleAccount;

window.triggerGoogleSignIn = function() {
    const btns = document.querySelectorAll('.google-btn-custom, #googleCustomBtn');

    // 1. If real Client ID is not set, launch zero-config Account Chooser for instant free login
    if (!AuthManager.isGoogleConfigured()) {
        showGoogleAccountChooserModal();
        return;
    }

    // 3. Set visual loading state on button
    btns.forEach(btn => {
        btn.disabled = true;
        btn.setAttribute('disabled', 'true');
        btn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>
            <span>Connecting to Google...</span>
        `;
    });

    // 4. Ensure Google Identity Services library is available
    if (!window.google || !window.google.accounts) {
        resetGoogleBtn();
        showToast('Google Identity Services client is not available. Please check your internet connection.', 'error');
        return;
    }

    const clientId = AuthManager.getGoogleClientId();

    // 5. Genuine Google OAuth Account Selection Flow
    try {
        if (window.google.accounts.oauth2) {
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'email profile openid',
                prompt: 'select_account',
                callback: async (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        try {
                            const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                            });
                            if (!userInfoResp.ok) throw new Error('Userinfo request failed');
                            const profile = await userInfoResp.json();
                            AuthManager.handleGoogleAuthSuccess(profile);
                        } catch (fetchErr) {
                            console.error('Google profile fetch error:', fetchErr);
                            resetGoogleBtn();
                            showToast('Failed to retrieve verified Google profile data.', 'error');
                        }
                    } else {
                        resetGoogleBtn();
                        showToast('Google authentication was not completed.', 'error');
                    }
                },
                error_callback: (err) => {
                    resetGoogleBtn();
                    if (err && err.type === 'popup_closed') {
                        showToast('Google sign-in was cancelled.', 'info');
                    } else if (err && err.type === 'popup_blocked') {
                        showToast('Google popup was blocked. Please allow popups for this site.', 'error');
                    } else {
                        showToast('Google authentication failed. Please verify your Client ID and origins.', 'error');
                    }
                }
            });
            tokenClient.requestAccessToken();
        } else if (window.google.accounts.id) {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: (res) => AuthManager.handleGoogleCredentialResponse(res),
                auto_select: false
            });
            google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    resetGoogleBtn();
                    showToast('Google authentication window could not be opened. Please check popup permissions.', 'error');
                }
            });
        }
    } catch (err) {
        console.error('Google Sign-In invocation error:', err);
        resetGoogleBtn();
        showToast('Could not initiate Google authentication.', 'error');
    }
};