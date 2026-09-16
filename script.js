/**
 * SmartFinance - Core Application State & Storage Engine
 * Handles Authentication, Google Sign-In, Transactions, Analytics, and AI Insights
 */

// =========================================================
// 1. DATA STORAGE & CONSTANTS
// =========================================================

const STORAGE_KEYS = {
    USER: 'sf_current_user',
    TRANSACTIONS: 'sf_transactions',
    SETTINGS: 'sf_user_settings'
};

// Initial Seed Data if storage is empty
const INITIAL_TRANSACTIONS = [
    { id: 'tx-1', title: 'Monthly Salary', type: 'income', category: 'Salary', amount: 50000, date: '2026-09-01', notes: 'Primary job payout' },
    { id: 'tx-2', title: 'Freelance Design', type: 'income', category: 'Freelance', amount: 10000, date: '2026-09-05', notes: 'UI design client project' },
    { id: 'tx-3', title: 'Grocery Shopping', type: 'expense', category: 'Food', amount: 3250, date: '2026-09-02', notes: 'Supermarket weekly essentials' },
    { id: 'tx-4', title: 'Clothing Purchase', type: 'expense', category: 'Shopping', amount: 2800, date: '2026-09-04', notes: 'Autumn clothes' },
    { id: 'tx-5', title: 'Flight & Taxi Booking', type: 'expense', category: 'Travel', amount: 4500, date: '2026-09-06', notes: 'Weekend trip' },
    { id: 'tx-6', title: 'Online Course Subscription', type: 'expense', category: 'Education', amount: 2600, date: '2026-09-07', notes: 'Full-stack development course' },
    { id: 'tx-7', title: 'Electricity & Internet', type: 'expense', category: 'Bills', amount: 4000, date: '2026-09-08', notes: 'Monthly utility bills' }
];

const CATEGORY_ICONS = {
    // Expense Categories
    'Food': { icon: 'fa-cart-shopping', color: '#f59e0b', bg: '#fef3c7' },
    'Shopping': { icon: 'fa-shirt', color: '#ec4899', bg: '#fce7f3' },
    'Travel': { icon: 'fa-plane', color: '#3b82f6', bg: '#dbeafe' },
    'Education': { icon: 'fa-book', color: '#8b5cf6', bg: '#ede9fe' },
    'Bills': { icon: 'fa-bolt', color: '#ef4444', bg: '#fee2e2' },
    'Health': { icon: 'fa-heart-pulse', color: '#10b981', bg: '#d1fae5' },
    'Entertainment': { icon: 'fa-film', color: '#6366f1', bg: '#e0e7ff' },
    'Other Expense': { icon: 'fa-tags', color: '#64748b', bg: '#f1f5f9' },

    // Income Categories
    'Salary': { icon: 'fa-briefcase', color: '#15803d', bg: '#dcfce7' },
    'Freelance': { icon: 'fa-laptop-code', color: '#0284c7', bg: '#e0f2fe' },
    'Investments': { icon: 'fa-chart-line', color: '#7c3aed', bg: '#ede9fe' },
    'Scholarship': { icon: 'fa-graduation-cap', color: '#0d9488', bg: '#ccfbf1' },
    'Other Income': { icon: 'fa-money-bill-wave', color: '#059669', bg: '#d1fae5' }
};

// =========================================================
// 2. FINANCE STORE API
// =========================================================

const FinanceStore = {
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
                currencySymbol: '₹',
                currencyCode: 'INR',
                monthlyBudgetLimit: 30000
            }));
        }
    },

    getSettings() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || { currencySymbol: '₹', currencyCode: 'INR' };
        } catch (e) {
            return { currencySymbol: '₹', currencyCode: 'INR' };
        }
    },

    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },

    getTransactions() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
        } catch (e) {
            return [];
        }
    },

    saveTransactions(txs) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    },

    addTransaction(tx) {
        const list = this.getTransactions();
        const newTx = {
            id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            title: tx.title || 'Untitled Transaction',
            type: tx.type === 'income' ? 'income' : 'expense',
            category: tx.category || (tx.type === 'income' ? 'Other Income' : 'Other Expense'),
            amount: parseFloat(tx.amount) || 0,
            date: tx.date || new Date().toISOString().split('T')[0],
            notes: tx.notes || ''
        };
        list.unshift(newTx);
        this.saveTransactions(list);
        return newTx;
    },

    deleteTransaction(id) {
        let list = this.getTransactions();
        list = list.filter(t => t.id !== id);
        this.saveTransactions(list);
        return list;
    },

    getSummary() {
        const list = this.getTransactions();
        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryMap = {};

        list.forEach(tx => {
            const amt = parseFloat(tx.amount) || 0;
            if (tx.type === 'income') {
                totalIncome += amt;
            } else {
                totalExpenses += amt;
                categoryMap[tx.category] = (categoryMap[tx.category] || 0) + amt;
            }
        });

        const balance = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

        return {
            totalIncome,
            totalExpenses,
            balance,
            savingsRate,
            categoryMap,
            transactionCount: list.length,
            incomeCount: list.filter(t => t.type === 'income').length,
            expenseCount: list.filter(t => t.type === 'expense').length
        };
    },

    resetToDefault() {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    },

    clearAll() {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    }
};

// =========================================================
// 3. AUTHENTICATION & GOOGLE SIGN-IN
// =========================================================

const AuthManager = {
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
        } catch (e) {
            return null;
        }
    },

    setCurrentUser(user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    },

    logout() {
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = 'index.html';
    },

    // Handles Google OAuth JWT response or Demo Google Login
    handleGoogleCredentialResponse(response) {
        try {
            let userData = null;
            if (response && response.credential) {
                // Decode Google JWT Token (base64 payload)
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const googleProfile = JSON.parse(jsonPayload);
                userData = {
                    name: googleProfile.name || 'Google User',
                    email: googleProfile.email || 'user@gmail.com',
                    picture: googleProfile.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                    authProvider: 'Google'
                };
            } else {
                // Fallback demo user
                userData = {
                    name: 'Alex Johnson',
                    email: 'alex.finance@gmail.com',
                    picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                    authProvider: 'Google'
                };
            }

            this.setCurrentUser(userData);
            showToast(`Welcome back, ${userData.name}!`, 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        } catch (err) {
            console.error('Google Sign-in processing error:', err);
            this.loginDemoUser();
        }
    },

    loginDemoUser() {
        const demoUser = {
            name: 'Alex Johnson',
            email: 'alex.finance@gmail.com',
            picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            authProvider: 'Google'
        };
        this.setCurrentUser(demoUser);
        showToast('Signed in via Google account!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 600);
    }
};

// =========================================================
// 4. UI TOAST NOTIFICATIONS
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
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// Format Currency
function formatCurrency(amount) {
    const settings = FinanceStore.getSettings();
    const sym = settings.currencySymbol || '₹';
    return `${sym}${Number(amount).toLocaleString('en-IN')}`;
}

// =========================================================
// 5. MODAL SYSTEM (Add Income & Expense)
// =========================================================

function openTransactionModal(type = 'expense') {
    let modal = document.getElementById('transactionModal');
    if (!modal) {
        createTransactionModal();
        modal = document.getElementById('transactionModal');
    }

    const modalTitle = document.getElementById('modalTitle');
    const typeIncomeRadio = document.getElementById('modalTypeIncome');
    const typeExpenseRadio = document.getElementById('modalTypeExpense');

    if (type === 'income') {
        typeIncomeRadio.checked = true;
        modalTitle.textContent = 'Add New Income';
    } else {
        typeExpenseRadio.checked = true;
        modalTitle.textContent = 'Add New Expense';
    }

    updateCategoryOptions(type);
    document.getElementById('modalDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalTitleInput').value = '';
    document.getElementById('modalAmount').value = '';
    document.getElementById('modalNotes').value = '';

    modal.classList.add('active');
}

function closeTransactionModal() {
    const modal = document.getElementById('transactionModal');
    if (modal) modal.classList.remove('active');
}

function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('modalCategory');
    if (!categorySelect) return;

    categorySelect.innerHTML = '';
    const expenseCats = ['Food', 'Shopping', 'Travel', 'Education', 'Bills', 'Health', 'Entertainment', 'Other Expense'];
    const incomeCats = ['Salary', 'Freelance', 'Investments', 'Scholarship', 'Other Income'];

    const cats = type === 'income' ? incomeCats : expenseCats;
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
                        <label for="modalCategory">Category</label>
                        <div class="input-box">
                            <i class="fa-solid fa-layer-group"></i>
                            <select id="modalCategory" required></select>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="modalDate">Date</label>
                    <div class="input-box">
                        <i class="fa-solid fa-calendar"></i>
                        <input type="date" id="modalDate" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="modalNotes">Optional Notes</label>
                    <div class="input-box">
                        <i class="fa-solid fa-note-sticky"></i>
                        <input type="text" id="modalNotes" placeholder="Additional details...">
                    </div>
                </div>

                <div class="sf-modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeTransactionModal()">Cancel</button>
                    <button type="submit" class="navy-btn" id="modalSubmitBtn">
                        <i class="fa-solid fa-check"></i> Save Transaction
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
    const notes = document.getElementById('modalNotes').value.trim();

    if (!title || isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid title and amount.', 'error');
        return;
    }

    FinanceStore.addTransaction({
        type,
        title,
        amount,
        category,
        date,
        notes
    });

    closeTransactionModal();
    showToast(`${type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(amount)} added!`, 'success');

    renderCurrentPage();
}

function deleteTransactionItem(id, title) {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
        FinanceStore.deleteTransaction(id);
        showToast(`Deleted "${title}"`, 'info');
        renderCurrentPage();
    }
}

// Global hooks for Add buttons
window.showIncomeMessage = function() {
    openTransactionModal('income');
};

window.showExpenseMessage = function() {
    openTransactionModal('expense');
};

// =========================================================
// 6. PAGE-SPECIFIC RENDERERS
// =========================================================

function renderCurrentPage() {
    const path = window.location.pathname.toLowerCase();

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
            profileLink.innerHTML = `<img src="${user.picture}" alt="${user.name}" class="nav-user-avatar">`;
        }
        profileLink.title = user.name || 'Profile';
    }
}

// --- Dashboard Page ---
function renderDashboard() {
    const summary = FinanceStore.getSummary();
    const transactions = FinanceStore.getTransactions();

    // Summary Cards
    const balanceEl = document.querySelector('.balance-card h2');
    const incomeEl = document.querySelector('.income-icon + div h2, .summary-card:nth-child(2) h2');
    const expenseEl = document.querySelector('.expense-icon + div h2, .summary-card:nth-child(3) h2');
    const savingsEl = document.querySelector('.saving-icon + div h2, .summary-card:nth-child(4) h2');
    const savingsSmall = document.querySelector('.saving-icon + div small, .summary-card:nth-child(4) small');

    if (balanceEl) balanceEl.textContent = formatCurrency(summary.balance);
    if (incomeEl) incomeEl.textContent = formatCurrency(summary.totalIncome);
    if (expenseEl) expenseEl.textContent = formatCurrency(summary.totalExpenses);
    if (savingsEl) savingsEl.textContent = formatCurrency(Math.max(0, summary.balance));
    if (savingsSmall) savingsSmall.textContent = `${summary.savingsRate}% of income`;

    // Render Recent Transactions (Top 5)
    const listContainer = document.querySelector('.transaction-list');
    if (listContainer) {
        const recents = transactions.slice(0, 5);
        if (recents.length === 0) {
            listContainer.innerHTML = `<div class="empty-state"><i class="fa-solid fa-wallet"></i><p>No transactions recorded yet.</p></div>`;
            return;
        }

        listContainer.innerHTML = recents.map(tx => {
            const isInc = tx.type === 'income';
            const catInfo = CATEGORY_ICONS[tx.category] || { icon: isInc ? 'fa-arrow-down' : 'fa-receipt' };
            const sign = isInc ? '+' : '-';
            const textClass = isInc ? 'income-text' : 'expense-text';
            const iconClass = isInc ? 'income' : 'expense';

            return `
                <div class="transaction">
                    <div class="transaction-icon ${iconClass}">
                        <i class="fa-solid ${catInfo.icon}"></i>
                    </div>
                    <div class="transaction-info">
                        <strong>${tx.title}</strong>
                        <span>${tx.category} • ${tx.date}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <strong class="amount ${textClass}">${sign}${formatCurrency(tx.amount)}</strong>
                        <button class="delete-icon-btn" onclick="deleteTransactionItem('${tx.id}', '${tx.title.replace(/'/g, "\\'")}')" title="Delete">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// --- Income Page ---
function renderIncomePage() {
    const summary = FinanceStore.getSummary();
    const transactions = FinanceStore.getTransactions().filter(t => t.type === 'income');

    const totalEl = document.querySelector('.income-icon + div h2');
    const countEl = document.querySelector('.summary-card:nth-child(2) h2');
    if (totalEl) totalEl.textContent = formatCurrency(summary.totalIncome);
    if (countEl) countEl.textContent = transactions.length.toString();

    const listContainer = document.querySelector('.transaction-list');
    if (listContainer) {
        if (transactions.length === 0) {
            listContainer.innerHTML = `<div class="empty-state"><i class="fa-solid fa-piggy-bank"></i><p>No income transactions yet. Click "+ Add Income" above!</p></div>`;
            return;
        }

        listContainer.innerHTML = transactions.map(tx => {
            const catInfo = CATEGORY_ICONS[tx.category] || { icon: 'fa-briefcase' };
            return `
                <div class="transaction">
                    <div class="transaction-icon income">
                        <i class="fa-solid ${catInfo.icon}"></i>
                    </div>
                    <div class="transaction-info">
                        <strong>${tx.title}</strong>
                        <span>${tx.category} • ${tx.date} ${tx.notes ? '• ' + tx.notes : ''}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <strong class="amount income-text">+${formatCurrency(tx.amount)}</strong>
                        <button class="delete-icon-btn" onclick="deleteTransactionItem('${tx.id}', '${tx.title.replace(/'/g, "\\'")}')" title="Delete">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// --- Expenses Page ---
function renderExpensesPage() {
    const summary = FinanceStore.getSummary();
    const transactions = FinanceStore.getTransactions().filter(t => t.type === 'expense');

    const totalEl = document.querySelector('.expense-icon + div h2');
    const countEl = document.querySelector('.summary-card:nth-child(2) h2');
    if (totalEl) totalEl.textContent = formatCurrency(summary.totalExpenses);
    if (countEl) countEl.textContent = transactions.length.toString();

    const listContainer = document.querySelector('.transaction-list');
    if (listContainer) {
        if (transactions.length === 0) {
            listContainer.innerHTML = `<div class="empty-state"><i class="fa-solid fa-receipt"></i><p>No expenses tracked yet. Click "+ Add Expense" above!</p></div>`;
            return;
        }

        listContainer.innerHTML = transactions.map(tx => {
            const catInfo = CATEGORY_ICONS[tx.category] || { icon: 'fa-receipt' };
            return `
                <div class="transaction">
                    <div class="transaction-icon expense">
                        <i class="fa-solid ${catInfo.icon}"></i>
                    </div>
                    <div class="transaction-info">
                        <strong>${tx.title}</strong>
                        <span>${tx.category} • ${tx.date} ${tx.notes ? '• ' + tx.notes : ''}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <strong class="amount expense-text">-${formatCurrency(tx.amount)}</strong>
                        <button class="delete-icon-btn" onclick="deleteTransactionItem('${tx.id}', '${tx.title.replace(/'/g, "\\'")}')" title="Delete">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// --- Analytics Page ---
let activeChartInstance = null;

function renderAnalyticsPage() {
    const summary = FinanceStore.getSummary();

    // Summary numbers
    const incStat = document.querySelector('.analytics-stat .income-text');
    const expStat = document.querySelector('.analytics-stat .expense-text');
    const balStat = document.querySelectorAll('.analytics-stat strong')[2];
    const savStat = document.querySelector('.analytics-stat .positive');

    if (incStat) incStat.textContent = formatCurrency(summary.totalIncome);
    if (expStat) expStat.textContent = formatCurrency(summary.totalExpenses);
    if (balStat) balStat.textContent = formatCurrency(summary.balance);
    if (savStat) savStat.textContent = `${summary.savingsRate}%`;

    // Render Dynamic Insights
    const insightContainer = document.querySelector('.insight-list');
    if (insightContainer) {
        const sortedCats = Object.entries(summary.categoryMap).sort((a, b) => b[1] - a[1]);
        const topCat = sortedCats.length > 0 ? sortedCats[0] : null;

        let insightsHTML = '';

        if (topCat) {
            insightsHTML += `
                <div class="insight">
                    <i class="fa-solid fa-fire" style="color:#ef4444; background:#fee2e2;"></i>
                    <div>
                        <strong>Highest Spending: ${topCat[0]}</strong>
                        <p>You spent ${formatCurrency(topCat[1])} on ${topCat[0]}, accounting for ${summary.totalExpenses > 0 ? ((topCat[1] / summary.totalExpenses) * 100).toFixed(0) : 0}% of your total expenses.</p>
                    </div>
                </div>
            `;
        }

        if (summary.balance >= 0) {
            insightsHTML += `
                <div class="insight">
                    <i class="fa-solid fa-shield-halved" style="color:#10b981; background:#d1fae5;"></i>
                    <div>
                        <strong>Positive Cash Flow (${summary.savingsRate}% Saved)</strong>
                        <p>Your income exceeds expenses by ${formatCurrency(summary.balance)}. You have a strong savings foundation this month.</p>
                    </div>
                </div>
            `;
        } else {
            insightsHTML += `
                <div class="insight">
                    <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444; background:#fee2e2;"></i>
                    <div>
                        <strong>Budget Deficit Alert</strong>
                        <p>Expenses exceed your income by ${formatCurrency(Math.abs(summary.balance))}. Consider pausing non-essential purchases.</p>
                    </div>
                </div>
            `;
        }

        insightsHTML += `
            <div class="insight">
                <i class="fa-solid fa-lightbulb" style="color:#0284c7; background:#e0f2fe;"></i>
                <div>
                    <strong>AI Recommendation</strong>
                    <p>${topCat ? `Setting a monthly ceiling on "${topCat[0]}" could help you save an extra ${formatCurrency(Math.round(topCat[1] * 0.15))} each month.` : 'Add expenses to unlock customized financial tips.'}</p>
                </div>
            </div>
        `;

        insightContainer.innerHTML = insightsHTML;
    }

    // Dynamic Chart.js Render
    const chartCanvas = document.getElementById('expensePieChart');
    if (chartCanvas && typeof Chart !== 'undefined') {
        const catMap = summary.categoryMap;
        const labels = Object.keys(catMap);
        const dataValues = Object.values(catMap);

        const palette = [
            '#078b8b', '#2563eb', '#f59e0b', '#ec4899', '#7c3aed',
            '#ef4444', '#10b981', '#64748b', '#06b6d4', '#84cc16'
        ];

        if (activeChartInstance) {
            activeChartInstance.destroy();
        }

        activeChartInstance = new Chart(chartCanvas, {
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
                            padding: 16,
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
                cutout: '62%'
            }
        });
    }
}

// --- AI Assistant Page ---
function renderAIAssistantPage() {
    const summary = FinanceStore.getSummary();
    const sortedCats = Object.entries(summary.categoryMap).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats.length > 0 ? sortedCats[0] : null;

    // Update preset recommendation cards based on actual live data
    const cards = document.querySelectorAll('.ai-message');
    if (cards.length >= 3) {
        // Card 1: Budget Recommendation
        cards[0].querySelector('h3').textContent = summary.balance >= 0 ? 'Budget Health: Healthy' : 'Budget Warning: Deficit';
        cards[0].querySelector('p').textContent = summary.balance >= 0
            ? `Your current income (${formatCurrency(summary.totalIncome)}) exceeds your expenses (${formatCurrency(summary.totalExpenses)}). You are retaining ${summary.savingsRate}% of what you earn.`
            : `You have spent ${formatCurrency(Math.abs(summary.balance))} more than your earnings this month. We recommend cutting back on discretionary categories immediately.`;

        // Card 2: Highest Category Alert
        if (topCat) {
            cards[1].querySelector('h3').textContent = `Top Expense: ${topCat[0]}`;
            cards[1].querySelector('p').textContent = `You have allocated ${formatCurrency(topCat[1])} to ${topCat[0]} (${summary.totalExpenses > 0 ? ((topCat[1] / summary.totalExpenses) * 100).toFixed(1) : 0}% of all spending). Check if any of these were impulsive purchases.`;
        }

        // Card 3: Savings Target
        cards[2].querySelector('h3').textContent = 'Smart Savings Opportunity';
        cards[2].querySelector('p').textContent = `If you trim 10% from your current expenses, you will unlock an extra ${formatCurrency(Math.round(summary.totalExpenses * 0.1))} in savings by next month.`;
    }
}

// Interactive AI Engine with contextual knowledge of actual finances
window.askAI = function(presetPrompt = null) {
    const input = document.getElementById('question');
    const answer = document.getElementById('aiAnswer');
    if (!answer) return;

    let question = presetPrompt || (input ? input.value.trim() : '');
    if (presetPrompt && input) {
        input.value = presetPrompt;
    }

    if (!question) {
        answer.innerHTML = `<span style="color:#ef4444;"><i class="fa-solid fa-circle-exclamation"></i> Please enter a financial question.</span>`;
        return;
    }

    // Show dynamic thinking state
    answer.innerHTML = `
        <div class="ai-typing">
            <i class="fa-solid fa-robot fa-spin" style="color:var(--navy);"></i>
            <span>Analyzing your income, expenses, and savings pattern...</span>
        </div>
    `;

    setTimeout(() => {
        const response = generateAIResponse(question);
        answer.innerHTML = `
            <div class="ai-response-box">
                <div class="ai-res-header">
                    <i class="fa-solid fa-sparkles"></i>
                    <strong>SmartFinance AI</strong>
                </div>
                <div class="ai-res-body">${response}</div>
            </div>
        `;
    }, 450);
};

function generateAIResponse(query) {
    const q = query.toLowerCase();
    const summary = FinanceStore.getSummary();
    const txs = FinanceStore.getTransactions();
    const sortedCats = Object.entries(summary.categoryMap).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats[0];

    // Check specific topics
    if (q.includes('save') || q.includes('saving')) {
        return `Your current savings rate is <strong>${summary.savingsRate}%</strong> (${formatCurrency(Math.max(0, summary.balance))} saved).
                <br><br>💡 <strong>Actionable Tip:</strong> The classic 50/30/20 rule recommends keeping essential needs at 50%, wants at 30%, and savings at 20%. ${summary.savingsRate >= 20 ? 'You are exceeding the standard 20% target!' : 'Try lowering non-essential categories to reach 20%.'}`;
    }

    if (q.includes('highest') || q.includes('most') || q.includes('biggest') || q.includes('where')) {
        if (!topCat) return `You don't have any logged expenses yet. Add some to get insights!`;
        return `Your biggest spending category is <strong>${topCat[0]}</strong> at <strong>${formatCurrency(topCat[1])}</strong>, which constitutes <strong>${summary.totalExpenses > 0 ? ((topCat[1] / summary.totalExpenses) * 100).toFixed(1) : 0}%</strong> of all your expenses this month.`;
    }

    if (q.includes('balance') || q.includes('how much') || q.includes('status') || q.includes('overview')) {
        return `Here is your instant financial summary:
                <ul style="margin: 8px 0 8px 20px; line-height: 1.8;">
                    <li><strong>Total Income:</strong> ${formatCurrency(summary.totalIncome)}</li>
                    <li><strong>Total Expenses:</strong> ${formatCurrency(summary.totalExpenses)}</li>
                    <li><strong>Available Balance:</strong> ${formatCurrency(summary.balance)}</li>
                    <li><strong>Health Score:</strong> ${summary.balance > 0 ? '🟢 Surplus' : '🔴 Deficit'}</li>
                </ul>`;
    }

    if (q.includes('food') || q.includes('grocery') || q.includes('groceries')) {
        const foodSpent = summary.categoryMap['Food'] || 0;
        return `You have spent <strong>${formatCurrency(foodSpent)}</strong> on Food. ${foodSpent > summary.totalExpenses * 0.3 ? '⚠️ Food accounts for over 30% of your expenses—meal planning could save you ~15%.' : 'This is well within a balanced dietary budget.'}`;
    }

    if (q.includes('travel') || q.includes('flight') || q.includes('cab')) {
        const travelSpent = summary.categoryMap['Travel'] || 0;
        return `Your travel & transit expenditure is <strong>${formatCurrency(travelSpent)}</strong> across your recorded transactions.`;
    }

    if (q.includes('budget') || q.includes('limit')) {
        return `Based on your monthly income of <strong>${formatCurrency(summary.totalIncome)}</strong>, a prudent spending budget is <strong>${formatCurrency(summary.totalIncome * 0.7)}</strong>. Right now, your actual spending is at <strong>${formatCurrency(summary.totalExpenses)}</strong>.`;
    }

    return `Based on your recent transactions, you have recorded <strong>${txs.length} entries</strong> with an active balance of <strong>${formatCurrency(summary.balance)}</strong>.
            ${topCat ? `Focusing on reducing <strong>${topCat[0]}</strong> will give you the quickest boost in available savings.` : 'Start adding your daily expenses to unlock granular predictive suggestions!'}`;
}

// --- Profile Page ---
function renderProfilePage() {
    const user = AuthManager.getCurrentUser() || {
        name: 'Alex Johnson',
        email: 'alex.finance@gmail.com',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        authProvider: 'Google'
    };

    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const avatarEl = document.getElementById('profileAvatar');
    const providerEl = document.getElementById('profileProvider');

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl && user.picture) avatarEl.src = user.picture;
    if (providerEl) providerEl.textContent = user.authProvider || 'Email/Password';

    const settings = FinanceStore.getSettings();
    const currSelect = document.getElementById('currencySelect');
    if (currSelect) currSelect.value = settings.currencySymbol;
}

// =========================================================
// 7. INITIALIZATION ON DOM CONTENT LOADED
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    FinanceStore.init();

    // Login Form Setup
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const pass = document.getElementById('loginPassword').value.trim();

            if (!email || !pass) {
                showToast('Please enter both email and password.', 'error');
                return;
            }

            AuthManager.setCurrentUser({
                name: email.split('@')[0],
                email: email,
                picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                authProvider: 'Email'
            });

            showToast('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 700);
        });
    }

    // Register Form Setup
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const pass = document.getElementById('registerPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;

            if (!name || !email || !pass) {
                showToast('Please fill in all fields.', 'error');
                return;
            }
            if (pass !== confirmPass) {
                showToast('Passwords do not match.', 'error');
                return;
            }

            AuthManager.setCurrentUser({
                name: name,
                email: email,
                picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                authProvider: 'Email'
            });

            showToast('Account created successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 700);
        });
    }

    // Setup Google Sign In button if on auth page
    setupGoogleSignIn();

    // Render current active page data
    renderCurrentPage();
});

const GOOGLE_CLIENT_ID = '39431135647-i9jnuuh2k6b25c4u07bvvoi1rc79v52f.apps.googleusercontent.com';

// Setup Google Identity Services Client
function setupGoogleSignIn() {
    const isFileProtocol = window.location.protocol === 'file:';
    const googleBtnDiv = document.getElementById('googleSignInDiv');
    const customBtns = document.querySelectorAll('.google-btn-custom, #googleCustomBtn');

    // If opened directly as a file (file://), Google OAuth strictly rejects requests with Error 400 invalid_request.
    // In this mode, keep the custom button active and provide an instant demo login or local server guide.
    if (isFileProtocol) {
        if (googleBtnDiv) googleBtnDiv.style.display = 'none';
        customBtns.forEach(btn => btn.style.display = 'flex');
        return;
    }

    const customClientId = localStorage.getItem('sf_google_client_id') || GOOGLE_CLIENT_ID;

    if (window.google && window.google.accounts) {
        try {
            google.accounts.id.initialize({
                client_id: customClientId,
                callback: (res) => AuthManager.handleGoogleCredentialResponse(res),
                auto_select: false,
                cancel_on_tap_outside: true
            });

            if (googleBtnDiv) {
                googleBtnDiv.innerHTML = '';
                googleBtnDiv.style.display = 'block';
                google.accounts.id.renderButton(googleBtnDiv, {
                    theme: 'outline',
                    size: 'large',
                    width: '360',
                    text: 'continue_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                });

                // Hide custom button(s) once GSI renders
                customBtns.forEach(btn => btn.style.display = 'none');
                const wrap = googleBtnDiv.closest('.google-auth-wrap');
                if (wrap) {
                    wrap.classList.add('has-gsi');
                    const customBtn = wrap.querySelector('.google-btn-custom');
                    if (customBtn) customBtn.style.display = 'none';
                }
            }
        } catch (e) {
            console.log('Google Identity initialized:', e);
        }
    } else {
        // Wait briefly for GSI script to load
        setTimeout(setupGoogleSignIn, 300);
    }
}


// User-triggered real Google Sign-In prompt or direct login
window.triggerGoogleSignIn = function() {
    const isFileProtocol = window.location.protocol === 'file:';

    // On file://, silently sign in with demo Google user — no modal, no error
    if (isFileProtocol) {
        AuthManager.loginDemoUser();
        return;
    }

    const activeClientId = localStorage.getItem('sf_google_client_id') || GOOGLE_CLIENT_ID;

    if (window.google && window.google.accounts) {
        google.accounts.id.initialize({
            client_id: activeClientId,
            callback: (res) => AuthManager.handleGoogleCredentialResponse(res),
            auto_select: false,
            cancel_on_tap_outside: true
        });

        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                console.log('GSI Prompt suppressed, falling back or direct button click');
            }
        });
    } else {
        // GSI not loaded yet — fallback to demo login
        AuthManager.loginDemoUser();
    }
};


// Friendly modal for file:// protocol or quick login
function showFileProtocolNoticeModal() {
    let modal = document.getElementById('googleAuthHelpModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'googleAuthHelpModal';
        modal.className = 'sf-modal-overlay';
        modal.innerHTML = `
            <div class="sf-modal-box" style="max-width: 480px; text-align: left;">
                <div class="sf-modal-header" style="border-bottom: none; margin-bottom: 12px; padding-bottom: 0;">
                    <div class="sf-modal-title-wrap">
                        <div class="modal-icon" style="background: #fee2e2; color: #dc2626;">
                            <i class="fa-brands fa-google"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 1.15rem; margin: 0;">Google Sign-In on Local Files</h3>
                            <span style="font-size: 0.8rem; color: #64748b;">OAuth 2.0 Security Policy</span>
                        </div>
                    </div>
                    <button type="button" class="close-modal-btn" onclick="closeGoogleAuthHelpModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 0.86rem; color: #991b1b; line-height: 1.5;">
                    <i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i>
                    Google blocks OAuth sign-ins directly from <code>file:///</code> paths with <strong>Error 400: invalid_request</strong>.
                </div>

                <p style="font-size: 0.88rem; color: #475569; line-height: 1.5; margin-bottom: 18px;">
                    To test the full app right now, you have two quick options:
                </p>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button type="button" class="navy-btn" style="width: 100%; justify-content: center; gap: 8px;" onclick="quickDemoLogin()">
                        <i class="fa-solid fa-bolt"></i>
                        Instant Sign-In with Demo Google User
                    </button>

                    <button type="button" class="cancel-btn" style="width: 100%; text-align: center; border: 1px solid #cbd5e1; background: #f8fafc;" onclick="showServerInstructions()">
                        <i class="fa-solid fa-server" style="margin-right: 6px;"></i>
                        How to run with a Web Server (Localhost)
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    modal.classList.add('active');
}

window.closeGoogleAuthHelpModal = function() {
    const modal = document.getElementById('googleAuthHelpModal');
    if (modal) modal.classList.remove('active');
};

window.quickDemoLogin = function() {
    closeGoogleAuthHelpModal();
    const demoUser = {
        name: 'Alex Johnson',
        email: 'alex.finance@gmail.com',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        authProvider: 'Google (Demo)'
    };
    AuthManager.setCurrentUser(demoUser);
    showToast('Signed in successfully!', 'success');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 600);
};

window.showServerInstructions = function() {
    alert(
        "To enable real Google OAuth:\n\n" +
        "1. In the project folder, double-click 'start_server.bat' (or run 'python -m http.server 5500' in terminal).\n\n" +
        "2. Open http://localhost:5500 in your browser instead of file:///\n\n" +
        "Google OAuth only authorizes http://localhost or registered domains."
    );
};