// ===== PERSONAL FINANCE DASHBOARD - MAIN SCRIPT (FIXED) =====

'use strict';

// ===== CONSTANTS & CONFIGURATION =====
const CONFIG = {
    DEFAULTS: {
        CURRENCY: 'USD',
        THEME: 'light',
        ITEMS_PER_PAGE: 10
    },
    CATEGORIES: {
        income: [
            { value: 'salary', label: '💼 Salary', icon: '💼' },
            { value: 'freelance', label: '💻 Freelance', icon: '💻' },
            { value: 'investment', label: '📈 Investment', icon: '📈' },
            { value: 'bonus', label: '🎁 Bonus', icon: '🎁' },
            { value: 'gift', label: '🎀 Gift', icon: '🎀' },
            { value: 'other', label: '💰 Other Income', icon: '💰' }
        ],
        expense: [
            { value: 'food', label: '🍕 Food & Dining', icon: '🍕' },
            { value: 'transport', label: '🚗 Transportation', icon: '🚗' },
            { value: 'shopping', label: '🛒 Shopping', icon: '🛒' },
            { value: 'bills', label: '📋 Bills & Utilities', icon: '📋' },
            { value: 'entertainment', label: '🎬 Entertainment', icon: '🎬' },
            { value: 'health', label: '🏥 Healthcare', icon: '🏥' },
            { value: 'education', label: '📚 Education', icon: '📚' },
            { value: 'travel', label: '✈️ Travel', icon: '✈️' },
            { value: 'fitness', label: '💪 Fitness', icon: '💪' },
            { value: 'other', label: '📦 Other Expense', icon: '📦' }
        ]
    },
    CURRENCIES: {
        USD: { symbol: '$', name: 'US Dollar' },
        EUR: { symbol: '€', name: 'Euro' },
        GBP: { symbol: '£', name: 'British Pound' },
        JPY: { symbol: '¥', name: 'Japanese Yen' },
        INR: { symbol: '₹', name: 'Indian Rupee' }
    },
    MIN_CANVAS_SIZE: 100 // Minimum canvas size for chart rendering
};

// ===== APPLICATION STATE =====
class FinanceApp {
    constructor() {
        this.state = {
            transactions: [],
            goals: [],
            settings: { ...CONFIG.DEFAULTS },
            currentTab: 'overview',
            filters: {
                search: '',
                category: '',
                type: '',
                dateRange: ''
            },
            pagination: {
                currentPage: 1,
                itemsPerPage: CONFIG.DEFAULTS.ITEMS_PER_PAGE
            }
        };
        
        this.charts = {};
        this.observers = new Map();
        
        this.init();
    }

    // ===== INITIALIZATION =====
    async init() {
        try {
            await this.loadData();
            this.initializeElements();
            this.bindEvents();
            this.applyTheme();
            this.updateCurrencyDisplay();
            this.renderDashboard();
            this.hideLoadingScreen();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to load application', 'error');
        }
    }

    initializeElements() {
        // Cache DOM elements
        this.elements = {
            // Navigation
            sidebar: document.getElementById('sidebar'),
            mobileMenuToggle: document.getElementById('mobileMenuToggle'),
            sidebarCollapseBtn: document.getElementById('sidebarCollapseBtn'),
            navLinks: document.querySelectorAll('.nav-link'),
            
            // Theme
            themeToggle: document.getElementById('themeToggle'),
            themeSelect: document.getElementById('themeSelect'),
            themeIcon: document.getElementById('themeIcon'),
            
            // Header
            pageTitle: document.getElementById('pageTitle'),
            pageSubtitle: document.getElementById('pageSubtitle'),
            
            // Tabs
            tabContents: document.querySelectorAll('.tab-content'),
            
            // Stats
            totalBalance: document.getElementById('totalBalance'),
            monthlyIncome: document.getElementById('monthlyIncome'),
            monthlyExpenses: document.getElementById('monthlyExpenses'),
            savingsRate: document.getElementById('savingsRate'),
            balanceChange: document.getElementById('balanceChange'),
            incomeChange: document.getElementById('incomeChange'),
            expenseChange: document.getElementById('expenseChange'),
            savingsChange: document.getElementById('savingsChange'),
            
            // Charts
            spendingChart: document.getElementById('spendingChart'),
            categoryChart: document.getElementById('categoryChart'),
            incomeExpenseChart: document.getElementById('incomeExpenseChart'),
            
            // Transactions
            addTransactionBtn: document.getElementById('addTransactionBtn'),
            addFirstTransaction: document.getElementById('addFirstTransaction'),
            recentTransactions: document.getElementById('recentTransactions'),
            allTransactions: document.getElementById('allTransactions'),
            transactionCount: document.getElementById('transactionCount'),
            searchTransactions: document.getElementById('searchTransactions'),
            categoryFilter: document.getElementById('categoryFilter'),
            typeFilter: document.getElementById('typeFilter'),
            dateFilter: document.getElementById('dateFilter'),
            exportTransactions: document.getElementById('exportTransactions'),
            
            // Goals
            addGoalBtn: document.getElementById('addGoalBtn'),
            addFirstGoal: document.getElementById('addFirstGoal'),
            goalsList: document.getElementById('goalsList'),
            
            // Modals
            transactionModal: document.getElementById('transactionModal'),
            goalModal: document.getElementById('goalModal'),
            confirmModal: document.getElementById('confirmModal'),
            
            // Forms
            transactionForm: document.getElementById('transactionForm'),
            goalForm: document.getElementById('goalForm'),
            
            // Settings
            currencySelect: document.getElementById('currencySelect'),
            exportData: document.getElementById('exportData'),
            importData: document.getElementById('importData'),
            clearAllData: document.getElementById('clearAllData'),
            
            // Toast container
            toastContainer: document.getElementById('toastContainer')
        };
    }

    bindEvents() {
        // Navigation Events
        this.elements.mobileMenuToggle?.addEventListener('click', () => this.toggleMobileMenu());
        this.elements.sidebarCollapseBtn?.addEventListener('click', () => this.toggleSidebar());
        
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleTabSwitch(e));
        });

        // Theme Events
        this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());
        this.elements.themeSelect?.addEventListener('change', (e) => this.setTheme(e.target.value));

        // Transaction Events
        this.elements.addTransactionBtn?.addEventListener('click', () => this.openTransactionModal());
        this.elements.addFirstTransaction?.addEventListener('click', () => this.openTransactionModal());
        this.elements.transactionForm?.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        
        // Search and Filter Events
        this.elements.searchTransactions?.addEventListener('input', debounce((e) => this.handleSearch(e), 300));
        this.elements.categoryFilter?.addEventListener('change', (e) => this.handleFilter('category', e.target.value));
        this.elements.typeFilter?.addEventListener('change', (e) => this.handleFilter('type', e.target.value));
        this.elements.dateFilter?.addEventListener('change', (e) => this.handleFilter('dateRange', e.target.value));
        
        // Goal Events
        this.elements.addGoalBtn?.addEventListener('click', () => this.openGoalModal());
        this.elements.addFirstGoal?.addEventListener('click', () => this.openGoalModal());
        this.elements.goalForm?.addEventListener('submit', (e) => this.handleGoalSubmit(e));
        
        // Settings Events
        this.elements.currencySelect?.addEventListener('change', (e) => this.updateCurrency(e.target.value));
        this.elements.exportData?.addEventListener('click', () => this.exportAllData());
        this.elements.importData?.addEventListener('change', (e) => this.importData(e));
        this.elements.clearAllData?.addEventListener('click', () => this.confirmClearData());
        this.elements.exportTransactions?.addEventListener('click', () => this.exportTransactions());
        
        // Modal Events
        this.bindModalEvents();
        
        // Dynamic form events
        document.getElementById('transactionType')?.addEventListener('change', (e) => this.updateCategoryOptions(e.target.value));
        
        // Analytics timeframe change
        document.getElementById('analyticsTimeframe')?.addEventListener('change', () => this.renderAnalyticsCharts());
        
        // Window Events
        window.addEventListener('resize', debounce(() => this.handleResize(), 250));
        
        // Keyboard Events
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    bindModalEvents() {
        // Transaction Modal
        document.getElementById('closeTransactionModal')?.addEventListener('click', () => this.closeModal('transactionModal'));
        document.getElementById('cancelTransaction')?.addEventListener('click', () => this.closeModal('transactionModal'));
        
        // Goal Modal
        document.getElementById('closeGoalModal')?.addEventListener('click', () => this.closeModal('goalModal'));
        document.getElementById('cancelGoal')?.addEventListener('click', () => this.closeModal('goalModal'));
        
        // Confirm Modal
        document.getElementById('closeConfirmModal')?.addEventListener('click', () => this.closeModal('confirmModal'));
        document.getElementById('confirmCancel')?.addEventListener('click', () => this.closeModal('confirmModal'));
        
        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(overlay.id);
                }
            });
        });
    }

    // ===== DATA MANAGEMENT (IN-MEMORY ONLY) =====
    async loadData() {
        try {
            // Initialize with demo data since we can't use localStorage
            this.addDemoData();
            
            // Validate and clean data
            this.validateTransactions();
            this.validateGoals();
            
            // Ensure settings always has valid currency
            if (!this.state.settings.currency || !CONFIG.CURRENCIES[this.state.settings.currency]) {
                this.state.settings.currency = CONFIG.DEFAULTS.CURRENCY;
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showToast('Failed to load saved data', 'error');
        }
    }

    saveData() {
        // In-memory storage only - data persists during session
        console.log('Data saved to memory:', {
            transactions: this.state.transactions.length,
            goals: this.state.goals.length
        });
    }

    validateTransactions() {
        this.state.transactions = this.state.transactions.filter(transaction => {
            return transaction && 
                   typeof transaction.id === 'string' &&
                   typeof transaction.amount === 'number' &&
                   ['income', 'expense'].includes(transaction.type) &&
                   transaction.date;
        });
    }

    validateGoals() {
        this.state.goals = this.state.goals.filter(goal => {
            return goal &&
                   typeof goal.id === 'string' &&
                   typeof goal.targetAmount === 'number' &&
                   goal.title;
        });
    }

    // ===== NAVIGATION & UI =====
    toggleMobileMenu() {
        this.elements.sidebar?.classList.toggle('open');
        this.elements.mobileMenuToggle?.classList.toggle('active');
    }

    toggleSidebar() {
        this.elements.sidebar?.classList.toggle('collapsed');
    }

    handleTabSwitch(e) {
        e.preventDefault();
        const tabName = e.target.getAttribute('data-tab');
        if (tabName) {
            this.switchTab(tabName);
        }
    }

    switchTab(tabName) {
        // Update active nav link
        this.elements.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-tab') === tabName) {
                link.classList.add('active');
            }
        });

        // Update active tab content
        this.elements.tabContents.forEach(tab => {
            tab.classList.remove('active');
            if (tab.id === tabName) {
                tab.classList.add('active');
            }
        });

        // Update page title and subtitle
        this.updatePageTitle(tabName);
        
        // Update state
        this.state.currentTab = tabName;
        
        // Render tab-specific content
        this.renderTabContent(tabName);
        
        // Close mobile menu
        this.elements.sidebar?.classList.remove('open');
        this.elements.mobileMenuToggle?.classList.remove('active');
    }

    updatePageTitle(tabName) {
        const titles = {
            overview: { title: 'Dashboard Overview', subtitle: 'Track your financial health and progress' },
            transactions: { title: 'Transactions', subtitle: 'Manage your income and expenses' },
            analytics: { title: 'Analytics', subtitle: 'Analyze your spending patterns' },
            goals: { title: 'Financial Goals', subtitle: 'Track progress toward your objectives' },
            settings: { title: 'Settings', subtitle: 'Customize your experience' }
        };
        
        const { title, subtitle } = titles[tabName] || titles.overview;
        if (this.elements.pageTitle) this.elements.pageTitle.textContent = title;
        if (this.elements.pageSubtitle) this.elements.pageSubtitle.textContent = subtitle;
    }

    // ===== THEME MANAGEMENT =====
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.state.settings.theme = theme;
        
        // Update theme icon
        if (this.elements.themeIcon) {
            this.elements.themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
        
        // Update theme select
        if (this.elements.themeSelect) {
            this.elements.themeSelect.value = theme;
        }
    }

    applyTheme() {
        this.setTheme(this.state.settings.theme);
    }

    // ===== CURRENCY MANAGEMENT (FIXED) =====
    updateCurrency(currency) {
        // Validate currency code
        if (!currency || !CONFIG.CURRENCIES[currency]) {
            currency = CONFIG.DEFAULTS.CURRENCY;
        }
        
        this.state.settings.currency = currency;
        this.updateCurrencyDisplay();
        this.renderDashboard();
    }

    updateCurrencyDisplay() {
        const currency = this.state.settings.currency || CONFIG.DEFAULTS.CURRENCY;
        const symbol = CONFIG.CURRENCIES[currency]?.symbol || '$';
        
        // Update currency symbols in forms
        document.querySelectorAll('.currency-symbol').forEach(el => {
            el.textContent = symbol;
        });
        
        // Update currency select
        if (this.elements.currencySelect) {
            this.elements.currencySelect.value = currency;
        }
    }

    formatCurrency(amount) {
        // Ensure amount is a valid number
        const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
        
        // Get currency with fallback
        const currency = this.state.settings.currency || CONFIG.DEFAULTS.CURRENCY;
        
        // Validate currency exists in our config
        if (!CONFIG.CURRENCIES[currency]) {
            console.warn(`Invalid currency: ${currency}, falling back to ${CONFIG.DEFAULTS.CURRENCY}`);
            this.state.settings.currency = CONFIG.DEFAULTS.CURRENCY;
        }
        
        const validCurrency = CONFIG.CURRENCIES[this.state.settings.currency] ? this.state.settings.currency : CONFIG.DEFAULTS.CURRENCY;
        const symbol = CONFIG.CURRENCIES[validCurrency]?.symbol || '$';
        
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: validCurrency,
                currencyDisplay: 'symbol'
            }).format(validAmount).replace(/[A-Z]{3}/, symbol);
        } catch (error) {
            console.error('Currency formatting error:', error);
            // Fallback to simple formatting
            return `${symbol}${validAmount.toFixed(2)}`;
        }
    }

    // ===== TRANSACTION MANAGEMENT =====
    openTransactionModal(transaction = null) {
        const modal = this.elements.transactionModal;
        const form = this.elements.transactionForm;
        const title = document.getElementById('transactionModalTitle');
        
        if (!modal || !form) return;
        
        if (transaction) {
            // Edit mode
            title.textContent = 'Edit Transaction';
            this.populateTransactionForm(transaction);
            form.setAttribute('data-edit-id', transaction.id);
        } else {
            // Add mode
            title.textContent = 'Add Transaction';
            form.reset();
            form.removeAttribute('data-edit-id');
            
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('transactionDate');
            if (dateInput) dateInput.value = today;
        }
        
        this.showModal('transactionModal');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = form.querySelector('input, select');
            firstInput?.focus();
        }, 100);
    }

    populateTransactionForm(transaction) {
        const form = this.elements.transactionForm;
        if (!form) return;
        
        const elements = {
            transactionType: document.getElementById('transactionType'),
            transactionAmount: document.getElementById('transactionAmount'),
            transactionCategory: document.getElementById('transactionCategory'),
            transactionDescription: document.getElementById('transactionDescription'),
            transactionDate: document.getElementById('transactionDate')
        };
        
        if (elements.transactionType) elements.transactionType.value = transaction.type;
        if (elements.transactionAmount) elements.transactionAmount.value = transaction.amount;
        if (elements.transactionDescription) elements.transactionDescription.value = transaction.description || '';
        if (elements.transactionDate) elements.transactionDate.value = transaction.date;
        
        // Update category options and set value
        this.updateCategoryOptions(transaction.type);
        setTimeout(() => {
            if (elements.transactionCategory) elements.transactionCategory.value = transaction.category;
        }, 10);
    }

    updateCategoryOptions(type) {
        const categorySelect = document.getElementById('transactionCategory');
        if (!categorySelect || !type) return;
        
        const categories = CONFIG.CATEGORIES[type] || [];
        
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.label;
            categorySelect.appendChild(option);
        });
    }

    async handleTransactionSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Show loading state
        if (submitBtn) submitBtn.disabled = true;
        
        try {
            const transaction = {
                id: form.getAttribute('data-edit-id') || this.generateId(),
                type: document.getElementById('transactionType')?.value,
                amount: parseFloat(document.getElementById('transactionAmount')?.value),
                category: document.getElementById('transactionCategory')?.value,
                description: document.getElementById('transactionDescription')?.value || '',
                date: document.getElementById('transactionDate')?.value,
                createdAt: new Date().toISOString()
            };
            
            // Validate transaction
            const validation = this.validateTransaction(transaction);
            if (!validation.valid) {
                this.showValidationErrors(validation.errors);
                return;
            }
            
            // Save transaction
            const isEdit = !!form.getAttribute('data-edit-id');
            if (isEdit) {
                this.updateTransaction(transaction);
                this.showToast('Transaction updated successfully', 'success');
            } else {
                this.addTransaction(transaction);
                this.showToast('Transaction added successfully', 'success');
            }
            
            // Close modal and refresh data
            this.closeModal('transactionModal');
            this.renderDashboard();
            
        } catch (error) {
            console.error('Failed to save transaction:', error);
            this.showToast('Failed to save transaction', 'error');
        } finally {
            // Reset loading state
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    validateTransaction(transaction) {
        const errors = {};
        
        if (!transaction.type) errors.transactionType = 'Transaction type is required';
        if (!transaction.amount || transaction.amount <= 0) errors.transactionAmount = 'Amount must be greater than 0';
        if (!transaction.category) errors.transactionCategory = 'Category is required';
        if (!transaction.date) errors.transactionDate = 'Date is required';
        
        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }

    showValidationErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(el => {
            el.classList.remove('show');
        });
        
        // Show new errors
        Object.entries(errors).forEach(([field, message]) => {
            const errorElement = document.getElementById(`${field}Error`);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('show');
            }
        });
    }

    addTransaction(transaction) {
        this.state.transactions.unshift(transaction);
        this.saveData();
    }

    updateTransaction(transaction) {
        const index = this.state.transactions.findIndex(t => t.id === transaction.id);
        if (index !== -1) {
            this.state.transactions[index] = transaction;
            this.saveData();
        }
    }

    deleteTransaction(id) {
        this.state.transactions = this.state.transactions.filter(t => t.id !== id);
        this.saveData();
        this.renderDashboard();
        this.showToast('Transaction deleted', 'success');
    }

    // ===== GOAL MANAGEMENT =====
    openGoalModal(goal = null) {
        const modal = this.elements.goalModal;
        const form = this.elements.goalForm;
        const title = document.getElementById('goalModalTitle');
        
        if (!modal || !form) return;
        
        if (goal) {
            // Edit mode
            title.textContent = 'Edit Goal';
            this.populateGoalForm(goal);
            form.setAttribute('data-edit-id', goal.id);
        } else {
            // Add mode
            title.textContent = 'Add Financial Goal';
            form.reset();
            form.removeAttribute('data-edit-id');
        }
        
        this.showModal('goalModal');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = form.querySelector('input');
            firstInput?.focus();
        }, 100);
    }

    populateGoalForm(goal) {
        const elements = {
            goalTitle: document.getElementById('goalTitle'),
            goalTargetAmount: document.getElementById('goalTargetAmount'),
            goalCurrentAmount: document.getElementById('goalCurrentAmount'),
            goalTargetDate: document.getElementById('goalTargetDate'),
            goalDescription: document.getElementById('goalDescription')
        };
        
        if (elements.goalTitle) elements.goalTitle.value = goal.title;
        if (elements.goalTargetAmount) elements.goalTargetAmount.value = goal.targetAmount;
        if (elements.goalCurrentAmount) elements.goalCurrentAmount.value = goal.currentAmount || 0;
        if (elements.goalTargetDate) elements.goalTargetDate.value = goal.targetDate || '';
        if (elements.goalDescription) elements.goalDescription.value = goal.description || '';
    }

    async handleGoalSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Show loading state
        if (submitBtn) submitBtn.disabled = true;
        
        try {
            const goal = {
                id: form.getAttribute('data-edit-id') || this.generateId(),
                title: document.getElementById('goalTitle')?.value.trim(),
                targetAmount: parseFloat(document.getElementById('goalTargetAmount')?.value),
                currentAmount: parseFloat(document.getElementById('goalCurrentAmount')?.value) || 0,
                targetDate: document.getElementById('goalTargetDate')?.value || null,
                description: document.getElementById('goalDescription')?.value.trim() || '',
                createdAt: new Date().toISOString()
            };
            
            // Validate goal
            const validation = this.validateGoal(goal);
            if (!validation.valid) {
                this.showGoalValidationErrors(validation.errors);
                return;
            }
            
            // Save goal
            const isEdit = !!form.getAttribute('data-edit-id');
            if (isEdit) {
                this.updateGoal(goal);
                this.showToast('Goal updated successfully', 'success');
            } else {
                this.addGoal(goal);
                this.showToast('Goal added successfully', 'success');
            }
            
            // Close modal and refresh
            this.closeModal('goalModal');
            this.renderGoals();
            
        } catch (error) {
            console.error('Failed to save goal:', error);
            this.showToast('Failed to save goal', 'error');
        } finally {
            // Reset loading state
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    validateGoal(goal) {
        const errors = {};
        
        if (!goal.title) errors.goalTitle = 'Goal title is required';
        if (!goal.targetAmount || goal.targetAmount <= 0) errors.goalTargetAmount = 'Target amount must be greater than 0';
        if (goal.currentAmount < 0) errors.goalCurrentAmount = 'Current amount cannot be negative';
        if (goal.currentAmount > goal.targetAmount) errors.goalCurrentAmount = 'Current amount cannot exceed target amount';
        
        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }

    showGoalValidationErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('#goalModal .form-error').forEach(el => {
            el.classList.remove('show');
        });
        
        // Show new errors
        Object.entries(errors).forEach(([field, message]) => {
            const errorElement = document.getElementById(`${field}Error`);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('show');
            }
        });
    }

    addGoal(goal) {
        this.state.goals.unshift(goal);
        this.saveData();
    }

    updateGoal(goal) {
        const index = this.state.goals.findIndex(g => g.id === goal.id);
        if (index !== -1) {
            this.state.goals[index] = goal;
            this.saveData();
        }
    }

    deleteGoal(id) {
        this.state.goals = this.state.goals.filter(g => g.id !== id);
        this.saveData();
        this.renderGoals();
        this.showToast('Goal deleted', 'success');
    }

    // ===== FILTERING & SEARCH =====
    handleSearch(e) {
        this.state.filters.search = e.target.value.toLowerCase().trim();
        this.state.pagination.currentPage = 1;
        this.renderTransactions();
    }

    handleFilter(filterType, value) {
        this.state.filters[filterType] = value;
        this.state.pagination.currentPage = 1;
        this.renderTransactions();
    }

    getFilteredTransactions() {
        let filtered = [...this.state.transactions];
        
        // Search filter
        if (this.state.filters.search) {
            filtered = filtered.filter(transaction => 
                transaction.description.toLowerCase().includes(this.state.filters.search) ||
                transaction.category.toLowerCase().includes(this.state.filters.search)
            );
        }
        
        // Category filter
        if (this.state.filters.category) {
            filtered = filtered.filter(transaction => transaction.category === this.state.filters.category);
        }
        
        // Type filter
        if (this.state.filters.type) {
            filtered = filtered.filter(transaction => transaction.type === this.state.filters.type);
        }
        
        // Date filter
        if (this.state.filters.dateRange) {
            const now = new Date();
            let startDate;
            
            switch (this.state.filters.dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = null;
            }
            
            if (startDate) {
                filtered = filtered.filter(transaction => new Date(transaction.date) >= startDate);
            }
        }
        
        return filtered;
    }

    // ===== CALCULATIONS & ANALYTICS =====
    calculateStats() {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        // Current month transactions
        const currentMonthTransactions = this.state.transactions.filter(t => 
            new Date(t.date) >= currentMonth
        );
        
        // Last month transactions
        const lastMonthTransactions = this.state.transactions.filter(t => {
            const date = new Date(t.date);
            return date >= lastMonth && date <= lastMonthEnd;
        });
        
        // Calculate totals
        const currentIncome = currentMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const currentExpenses = currentMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const lastIncome = lastMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const lastExpenses = lastMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Calculate total balance (all time)
        const totalBalance = this.state.transactions.reduce((sum, t) => {
            return sum + (t.type === 'income' ? t.amount : -t.amount);
        }, 0);
        
        // Calculate changes
        const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
        const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;
        const balanceChange = (currentIncome - currentExpenses - (lastIncome - lastExpenses)) / Math.max(Math.abs(lastIncome - lastExpenses), 1) * 100;
        
        // Calculate savings rate
        const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;
        const lastSavingsRate = lastIncome > 0 ? ((lastIncome - lastExpenses) / lastIncome) * 100 : 0;
        const savingsChange = savingsRate - lastSavingsRate;
        
        return {
            totalBalance,
            currentIncome,
            currentExpenses,
            savingsRate,
            incomeChange,
            expenseChange,
            balanceChange,
            savingsChange
        };
    }

    getCategoryStats(timeframe = 'month') {
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(0); // All time
        }
        
        const transactions = this.state.transactions.filter(t => 
            new Date(t.date) >= startDate && t.type === 'expense'
        );
        
        const categoryTotals = {};
        transactions.forEach(transaction => {
            categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
        });
        
        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }

    getIncomeExpenseData(timeframe = 'month') {
        const now = new Date();
        const data = [];
        const periods = timeframe === 'year' ? 12 : timeframe === 'quarter' ? 3 : 6;
        
        for (let i = periods - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            
            const periodTransactions = this.state.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= date && transactionDate <= endDate;
            });
            
            const income = periodTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expenses = periodTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            
            data.push({
                period: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                income,
                expenses
            });
        }
        
        return data;
    }

    // ===== RENDERING =====
    renderDashboard() {
        this.renderStats();
        this.renderRecentTransactions();
        this.renderTransactions();
        this.renderGoals();
        this.renderCharts();
    }

    renderTabContent(tabName) {
        switch (tabName) {
            case 'overview':
                this.renderStats();
                this.renderRecentTransactions();
                this.renderCharts();
                break;
            case 'transactions':
                this.renderTransactions();
                break;
            case 'analytics':
                this.renderAnalyticsCharts();
                this.renderAnalyticsStats();
                break;
            case 'goals':
                this.renderGoals();
                break;
            case 'settings':
                // Settings are mostly static
                break;
        }
    }

    renderStats() {
        const stats = this.calculateStats();
        
        // Update stat values
        if (this.elements.totalBalance) {
            this.elements.totalBalance.textContent = this.formatCurrency(stats.totalBalance);
        }
        if (this.elements.monthlyIncome) {
            this.elements.monthlyIncome.textContent = this.formatCurrency(stats.currentIncome);
        }
        if (this.elements.monthlyExpenses) {
            this.elements.monthlyExpenses.textContent = this.formatCurrency(stats.currentExpenses);
        }
        if (this.elements.savingsRate) {
            this.elements.savingsRate.textContent = `${stats.savingsRate.toFixed(1)}%`;
        }
        
        // Update change indicators
        this.updateChangeIndicator(this.elements.balanceChange, stats.balanceChange);
        this.updateChangeIndicator(this.elements.incomeChange, stats.incomeChange);
        this.updateChangeIndicator(this.elements.expenseChange, stats.expenseChange);
        this.updateChangeIndicator(this.elements.savingsChange, stats.savingsChange);
    }

    updateChangeIndicator(element, change) {
        if (!element) return;
        
        const absChange = Math.abs(change);
        element.textContent = `${change >= 0 ? '+' : ''}${absChange.toFixed(2)}%`;
        
        // Update classes
        element.className = 'stat-change';
        if (change > 0) {
            element.classList.add('positive');
        } else if (change < 0) {
            element.classList.add('negative');
        }
    }

    renderRecentTransactions() {
        const container = this.elements.recentTransactions;
        if (!container) return;
        
        const recent = this.state.transactions.slice(0, 5);
        
        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💳</div>
                    <h4>No transactions yet</h4>
                    <p>Start by adding your first transaction</p>
                    <button class="btn btn-primary" onclick="app.openTransactionModal()">Add Transaction</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recent.map(transaction => this.createTransactionHTML(transaction)).join('');
    }

    renderTransactions() {
        const container = this.elements.allTransactions;
        const counter = this.elements.transactionCount;
        
        if (!container) return;
        
        const filtered = this.getFilteredTransactions();
        const { currentPage, itemsPerPage } = this.state.pagination;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedTransactions = filtered.slice(startIndex, endIndex);
        
        // Update counter
        if (counter) {
            counter.textContent = `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`;
        }
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h4>No transactions found</h4>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
            this.renderPagination(0, currentPage, itemsPerPage);
            return;
        }
        
        container.innerHTML = paginatedTransactions.map(transaction => this.createTransactionHTML(transaction, true)).join('');
        this.renderPagination(filtered.length, currentPage, itemsPerPage);
    }

    createTransactionHTML(transaction, showActions = false) {
        const category = this.getCategoryInfo(transaction.category, transaction.type);
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString();
        const timeAgo = this.getTimeAgo(date);
        
        return `
            <div class="transaction-item ${transaction.type}" role="listitem">
                <div class="transaction-info">
                    <div class="transaction-icon">${category.icon}</div>
                    <div class="transaction-details">
                        <h4>${transaction.description || category.label}</h4>
                        <div class="transaction-meta">
                            <span class="transaction-category">${category.label}</span>
                            <span class="transaction-date">${formattedDate}</span>
                            <span class="transaction-time">${timeAgo}</span>
                        </div>
                    </div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                    </div>
                    ${showActions ? `
                        <div class="transaction-actions">
                            <button class="goal-action-btn" onclick="app.openTransactionModal(${JSON.stringify(transaction).replace(/"/g, '&quot;')})" title="Edit transaction">
                                ✏️
                            </button>
                            <button class="goal-action-btn delete" onclick="app.confirmDeleteTransaction('${transaction.id}')" title="Delete transaction">
                                🗑️
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getCategoryInfo(categoryValue, type) {
        const categories = CONFIG.CATEGORIES[type] || [];
        const category = categories.find(c => c.value === categoryValue);
        return category || { value: categoryValue, label: categoryValue, icon: '📦' };
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    renderGoals() {
        const container = this.elements.goalsList;
        if (!container) return;
        
        if (this.state.goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <h4>No financial goals yet</h4>
                    <p>Set goals to track your financial progress</p>
                    <button class="btn btn-primary" onclick="app.openGoalModal()">Create Your First Goal</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.state.goals.map(goal => this.createGoalHTML(goal)).join('');
    }

    createGoalHTML(goal) {
        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
        const targetDate = goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : null;
        
        return `
            <div class="goal-card" role="listitem">
                <div class="goal-header">
                    <div class="goal-info">
                        <h3 class="goal-title">${goal.title}</h3>
                        <div class="goal-target">
                            Target: ${this.formatCurrency(goal.targetAmount)}
                            ${targetDate ? ` by ${targetDate}` : ''}
                        </div>
                    </div>
                    <div class="goal-actions">
                        <button class="goal-action-btn" onclick="app.openGoalModal(${JSON.stringify(goal).replace(/"/g, '&quot;')})" title="Edit goal">
                            ✏️
                        </button>
                        <button class="goal-action-btn delete" onclick="app.confirmDeleteGoal('${goal.id}')" title="Delete goal">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="goal-progress">
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="goal-progress-text">
                        <span class="goal-current">${this.formatCurrency(goal.currentAmount)}</span>
                        <span class="goal-percentage">${progress.toFixed(1)}%</span>
                    </div>
                </div>
                
                ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
                
                <div class="goal-meta">
                    <span>Remaining: ${this.formatCurrency(remaining)}</span>
                    ${targetDate ? `<span class="goal-date">Due: ${targetDate}</span>` : ''}
                </div>
            </div>
        `;
    }

    renderPagination(totalItems, currentPage, itemsPerPage) {
        const container = document.getElementById('transactionsPagination');
        if (!container || totalItems === 0) {
            if (container) container.innerHTML = '';
            return;
        }
        
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let paginationHTML = `
            <button class="pagination-btn" onclick="app.changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                ← Previous
            </button>
        `;
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="app.changePage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="app.changePage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="app.changePage(${totalPages})">${totalPages}</button>`;
        }
        
        paginationHTML += `
            <button class="pagination-btn" onclick="app.changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                Next →
            </button>
        `;
        
        container.innerHTML = paginationHTML;
    }

    changePage(page) {
        this.state.pagination.currentPage = page;
        this.renderTransactions();
    }

    // ===== CHARTS (FIXED) =====
    renderCharts() {
        this.renderSpendingChart();
        this.renderCategoryChart();
        this.renderIncomeExpenseChart();
    }

    renderAnalyticsCharts() {
        const timeframe = document.getElementById('analyticsTimeframe')?.value || 'month';
        this.renderCategoryChart(timeframe);
        this.renderIncomeExpenseChart(timeframe);
    }

    renderSpendingChart() {
        const canvas = this.elements.spendingChart;
        const placeholder = document.getElementById('spendingChartPlaceholder');
        
        if (!canvas || !placeholder) return;
        
        const data = this.getIncomeExpenseData('month');
        
        if (data.length === 0 || data.every(d => d.income === 0 && d.expenses === 0)) {
            canvas.style.display = 'none';
            placeholder.style.display = 'flex';
            return;
        }
        
        // Check canvas size before rendering
        if (!this.isCanvasSizeValid(canvas)) {
            canvas.style.display = 'none';
            placeholder.style.display = 'flex';
            return;
        }
        
        canvas.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Simple chart implementation
        this.createSimpleLineChart(canvas, data, ['income', 'expenses']);
    }

    renderCategoryChart(timeframe = 'month') {
        const canvas = this.elements.categoryChart;
        const placeholder = document.getElementById('categoryChartPlaceholder');
        
        if (!canvas || !placeholder) return;
        
        const categoryStats = this.getCategoryStats(timeframe);
        
        if (categoryStats.length === 0) {
            canvas.style.display = 'none';
            placeholder.style.display = 'flex';
            return;
        }
        
        // Check canvas size before rendering
        if (!this.isCanvasSizeValid(canvas)) {
            canvas.style.display = 'none';
            placeholder.style.display = 'flex';
            return;
        }
        
        canvas.style.display = 'block';
        placeholder.style.display = 'none';
        
        this.createSimplePieChart(canvas, categoryStats);
    }

    renderIncomeExpenseChart(timeframe = 'month') {
        const canvas = this.elements.incomeExpenseChart;
        const placeholder = document.getElementById('incomeExpenseChartPlaceholder');
        
        if (!canvas || !placeholder) return;
        
        const data = this.getIncomeExpenseData(timeframe);
        
        if (data.length === 0 || data.every(d => d.income === 0 && d.expenses === 0)) {
            canvas.style.display = 'none';
            placeholder.style.display = 'flex';
            return;
        }
        
        // Check canvas size before rendering
        if (!this.isCanvasSizeValid(canvas)) {
            canvas.style.display = 'none';
            placeholder.style.display = 'flex';
            return;
        }
        
        canvas.style.display = 'block';
        placeholder.style.display = 'none';
        
        this.createSimpleBarChart(canvas, data);
    }

    // Canvas size validation helper
    isCanvasSizeValid(canvas) {
        const rect = canvas.getBoundingClientRect();
        return rect.width >= CONFIG.MIN_CANVAS_SIZE && rect.height >= CONFIG.MIN_CANVAS_SIZE;
    }

    createSimpleLineChart(canvas, data, keys) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        // Validate canvas size
        if (!this.isCanvasSizeValid(canvas)) {
            console.warn('Canvas too small for chart rendering');
            return;
        }
        
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        const width = rect.width;
        const height = rect.height;
        const padding = 40;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Calculate max value
        const maxValue = Math.max(...data.flatMap(d => keys.map(k => d[k]))) * 1.1;
        if (maxValue === 0) return;
        
        // Draw grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (height - padding * 2) * (i / 5);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Draw data lines
        const colors = ['#10b981', '#ef4444'];
        keys.forEach((key, keyIndex) => {
            ctx.strokeStyle = colors[keyIndex] || '#6366f1';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            data.forEach((point, index) => {
                const x = padding + (width - padding * 2) * (index / Math.max(data.length - 1, 1));
                const y = height - padding - (height - padding * 2) * (point[key] / maxValue);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = colors[keyIndex] || '#6366f1';
            data.forEach((point, index) => {
                const x = padding + (width - padding * 2) * (index / Math.max(data.length - 1, 1));
                const y = height - padding - (height - padding * 2) * (point[key] / maxValue);
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }

    createSimplePieChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        // Validate canvas size
        if (!this.isCanvasSizeValid(canvas)) {
            console.warn('Canvas too small for pie chart rendering');
            return;
        }
        
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        const width = rect.width;
        const height = rect.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        
        // Validate radius
        if (radius <= 0) {
            console.warn('Pie chart radius too small or negative:', radius);
            return;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        const total = data.reduce((sum, item) => sum + item.amount, 0);
        if (total === 0) return;
        
        let currentAngle = -Math.PI / 2;
        
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
        
        data.slice(0, 7).forEach((item, index) => {
            const sliceAngle = (item.amount / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.fillStyle = colors[index] || '#9ca3af';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            currentAngle += sliceAngle;
        });
    }

    createSimpleBarChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        // Validate canvas size
        if (!this.isCanvasSizeValid(canvas)) {
            console.warn('Canvas too small for bar chart rendering');
            return;
        }
        
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        const width = rect.width;
        const height = rect.height;
        const padding = 40;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        const maxValue = Math.max(...data.flatMap(d => [d.income, d.expenses])) * 1.1;
        if (maxValue === 0) return;
        
        const barWidth = Math.max(10, (width - padding * 2) / (data.length * 2.5));
        
        data.forEach((point, index) => {
            const x = padding + index * (barWidth * 2.5);
            
            // Income bar
            const incomeHeight = (height - padding * 2) * (point.income / maxValue);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(x, height - padding - incomeHeight, barWidth, incomeHeight);
            
            // Expense bar
            const expenseHeight = (height - padding * 2) * (point.expenses / maxValue);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(x + barWidth * 1.2, height - padding - expenseHeight, barWidth, expenseHeight);
        });
    }

    renderAnalyticsStats() {
        const timeframe = document.getElementById('analyticsTimeframe')?.value || 'month';
        const categoryStats = this.getCategoryStats(timeframe);
        const transactions = this.getFilteredTransactionsByTimeframe(timeframe);
        
        // Average daily spend
        const days = this.getDaysInTimeframe(timeframe);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const avgDailySpend = days > 0 ? totalExpenses / days : 0;
        
        // Top category
        const topCategory = categoryStats[0];
        
        // Transaction counts
        const incomeCount = transactions.filter(t => t.type === 'income').length;
        const expenseCount = transactions.filter(t => t.type === 'expense').length;
        
        // Largest transaction
        const largestTransaction = transactions.reduce((max, t) => 
            t.amount > max.amount ? t : max, 
            { amount: 0, description: '', type: '' }
        );
        
        // Update elements
        const elements = {
            avgDailySpend: document.getElementById('avgDailySpend'),
            topCategory: document.getElementById('topCategory'),
            topCategoryAmount: document.getElementById('topCategoryAmount'),
            totalTransactions: document.getElementById('totalTransactions'),
            transactionBreakdown: document.getElementById('transactionBreakdown'),
            largestTransaction: document.getElementById('largestTransaction'),
            largestTransactionDesc: document.getElementById('largestTransactionDesc')
        };
        
        if (elements.avgDailySpend) elements.avgDailySpend.textContent = this.formatCurrency(avgDailySpend);
        if (elements.topCategory) elements.topCategory.textContent = topCategory ? this.getCategoryInfo(topCategory.category, 'expense').label : '-';
        if (elements.topCategoryAmount) elements.topCategoryAmount.textContent = topCategory ? `${this.formatCurrency(topCategory.amount)} spent` : '$0.00 spent';
        if (elements.totalTransactions) elements.totalTransactions.textContent = transactions.length.toString();
        if (elements.transactionBreakdown) elements.transactionBreakdown.textContent = `${incomeCount} income, ${expenseCount} expenses`;
        if (elements.largestTransaction) elements.largestTransaction.textContent = this.formatCurrency(largestTransaction.amount);
        if (elements.largestTransactionDesc) elements.largestTransactionDesc.textContent = largestTransaction.amount > 0 ? largestTransaction.description || 'No description' : 'No transactions';
    }

    getFilteredTransactionsByTimeframe(timeframe) {
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return this.state.transactions;
        }
        
        return this.state.transactions.filter(t => new Date(t.date) >= startDate);
    }

    getDaysInTimeframe(timeframe) {
        const now = new Date();
        switch (timeframe) {
            case 'month':
                return now.getDate();
            case 'quarter':
                return 90;
            case 'year':
                return Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)) + 1;
            default:
                return 1;
        }
    }

    // ===== MODAL MANAGEMENT =====
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            
            // Focus first input
            setTimeout(() => {
                const firstInput = modal.querySelector('input, select, textarea, button');
                firstInput?.focus();
            }, 100);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            
            // Clear form errors
            modal.querySelectorAll('.form-error').forEach(el => {
                el.classList.remove('show');
            });
        }
    }

    // ===== CONFIRMATION DIALOGS =====
    confirmDeleteTransaction(id) {
        this.showConfirmDialog(
            'Delete Transaction',
            'Are you sure you want to delete this transaction? This action cannot be undone.',
            () => this.deleteTransaction(id)
        );
    }

    confirmDeleteGoal(id) {
        this.showConfirmDialog(
            'Delete Goal',
            'Are you sure you want to delete this goal? This action cannot be undone.',
            () => this.deleteGoal(id)
        );
    }

    confirmClearData() {
        this.showConfirmDialog(
            'Clear All Data',
            'Are you sure you want to delete all transactions, goals, and reset settings? This action cannot be undone.',
            () => this.clearAllData()
        );
    }

    showConfirmDialog(title, message, onConfirm) {
        const modal = this.elements.confirmModal;
        const titleElement = document.getElementById('confirmModalTitle');
        const messageElement = document.getElementById('confirmModalMessage');
        const confirmButton = document.getElementById('confirmProceed');
        
        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        
        // Remove existing event listeners and add new one
        const newConfirmButton = confirmButton?.cloneNode(true);
        if (confirmButton && newConfirmButton) {
            confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
            newConfirmButton.addEventListener('click', () => {
                onConfirm();
                this.closeModal('confirmModal');
            });
        }
        
        this.showModal('confirmModal');
    }

    // ===== DATA EXPORT/IMPORT =====
    exportAllData() {
        try {
            const data = {
                transactions: this.state.transactions,
                goals: this.state.goals,
                settings: this.state.settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance-dashboard-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Failed to export data', 'error');
        }
    }

    exportTransactions() {
        try {
            const transactions = this.getFilteredTransactions();
            
            if (transactions.length === 0) {
                this.showToast('No transactions to export', 'warning');
                return;
            }
            
            // Create CSV content
            const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
            const csvContent = [
                headers.join(','),
                ...transactions.map(t => [
                    t.date,
                    t.type,
                    t.category,
                    `"${(t.description || '').replace(/"/g, '""')}"`,
                    t.amount
                ].join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast(`Exported ${transactions.length} transactions`, 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Failed to export transactions', 'error');
        }
    }

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate imported data
            if (!data.transactions || !Array.isArray(data.transactions)) {
                throw new Error('Invalid data format');
            }
            
            // Merge data
            const existingIds = new Set(this.state.transactions.map(t => t.id));
            const newTransactions = data.transactions.filter(t => !existingIds.has(t.id));
            
            this.state.transactions = [...this.state.transactions, ...newTransactions];
            
            if (data.goals && Array.isArray(data.goals)) {
                const existingGoalIds = new Set(this.state.goals.map(g => g.id));
                const newGoals = data.goals.filter(g => !existingGoalIds.has(g.id));
                this.state.goals = [...this.state.goals, ...newGoals];
            }
            
            if (data.settings) {
                this.state.settings = { ...this.state.settings, ...data.settings };
                // Ensure currency is valid after import
                if (!CONFIG.CURRENCIES[this.state.settings.currency]) {
                    this.state.settings.currency = CONFIG.DEFAULTS.CURRENCY;
                }
            }
            
            // Save and refresh
            this.saveData();
            this.applyTheme();
            this.updateCurrencyDisplay();
            this.renderDashboard();
            
            this.showToast(`Imported ${newTransactions.length} transactions`, 'success');
            
        } catch (error) {
            console.error('Import failed:', error);
            this.showToast('Failed to import data. Please check file format.', 'error');
        } finally {
            // Clear file input
            event.target.value = '';
        }
    }

    clearAllData() {
        try {
            // Clear data
            this.state.transactions = [];
            this.state.goals = [];
            this.state.settings = { ...CONFIG.DEFAULTS };
            
            // Reset UI
            this.applyTheme();
            this.updateCurrencyDisplay();
            this.renderDashboard();
            
            this.showToast('All data cleared successfully', 'success');
        } catch (error) {
            console.error('Clear data failed:', error);
            this.showToast('Failed to clear data', 'error');
        }
    }

    // ===== NOTIFICATIONS =====
    showToast(message, type = 'info', duration = 4000) {
        const container = this.elements.toastContainer;
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('removing');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    // ===== KEYBOARD SHORTCUTS =====
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when no modal is open and not typing in inputs
        if (document.querySelector('.modal-overlay.show') || 
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            return;
        }
        
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    this.openTransactionModal();
                    break;
                case 'g':
                    e.preventDefault();
                    this.openGoalModal();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportTransactions();
                    break;
            }
        }
        
        // Tab navigation
        switch (e.key) {
            case '1':
                if (e.altKey) {
                    e.preventDefault();
                    this.switchTab('overview');
                }
                break;
            case '2':
                if (e.altKey) {
                    e.preventDefault();
                    this.switchTab('transactions');
                }
                break;
            case '3':
                if (e.altKey) {
                    e.preventDefault();
                    this.switchTab('analytics');
                }
                break;
            case '4':
                if (e.altKey) {
                    e.preventDefault();
                    this.switchTab('goals');
                }
                break;
            case '5':
                if (e.altKey) {
                    e.preventDefault();
                    this.switchTab('settings');
                }
                break;
            case 'Escape':
                // Close any open modals
                document.querySelectorAll('.modal-overlay.show').forEach(modal => {
                    this.closeModal(modal.id);
                });
                break;
        }
    }

    // ===== RESPONSIVE HANDLING =====
    handleResize() {
        // Redraw charts on resize
        if (this.state.currentTab === 'overview') {
            setTimeout(() => this.renderCharts(), 100);
        } else if (this.state.currentTab === 'analytics') {
            setTimeout(() => this.renderAnalyticsCharts(), 100);
        }
        
        // Close mobile menu on desktop
        if (window.innerWidth > 768) {
            this.elements.sidebar?.classList.remove('open');
            this.elements.mobileMenuToggle?.classList.remove('active');
        }
    }

    // ===== UTILITY FUNCTIONS =====
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => loadingScreen.remove(), 350);
            }, 500);
        }
    }

    // ===== DEMO DATA =====
    addDemoData() {
        const today = new Date();
        const demoTransactions = [
            {
                id: this.generateId(),
                type: 'income',
                amount: 5000,
                category: 'salary',
                description: 'Monthly Salary',
                date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                type: 'expense',
                amount: 1200,
                category: 'bills',
                description: 'Monthly Rent',
                date: new Date(today.getFullYear(), today.getMonth(), 2).toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                type: 'expense',
                amount: 85.50,
                category: 'food',
                description: 'Grocery Shopping',
                date: new Date(today.getFullYear(), today.getMonth(), 3).toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                type: 'expense',
                amount: 45.00,
                category: 'transport',
                description: 'Gas Station',
                date: new Date(today.getFullYear(), today.getMonth(), 4).toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                type: 'income',
                amount: 500,
                category: 'freelance',
                description: 'Freelance Project',
                date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                type: 'expense',
                amount: 25.99,
                category: 'entertainment',
                description: 'Netflix Subscription',
                date: new Date(today.getFullYear(), today.getMonth(), 7).toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                type: 'expense',
                amount: 150.00,
                category: 'health',
                description: 'Doctor Visit',
                date: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                type: 'expense',
                amount: 89.99,
                category: 'shopping',
                description: 'New Shoes',
                date: new Date(today.getFullYear(), today.getMonth(), 12).toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            }
        ];
        
        const demoGoals = [
            {
                id: this.generateId(),
                title: 'Emergency Fund',
                targetAmount: 10000,
                currentAmount: 3500,
                targetDate: new Date(today.getFullYear() + 1, 11, 31).toISOString().split('T')[0],
                description: 'Build an emergency fund to cover 6 months of expenses',
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                title: 'Vacation Fund',
                targetAmount: 2500,
                currentAmount: 800,
                targetDate: new Date(today.getFullYear(), 6, 1).toISOString().split('T')[0],
                description: 'Save for summer vacation trip to Europe',
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                title: 'New Laptop',
                targetAmount: 1200,
                currentAmount: 450,
                targetDate: new Date(today.getFullYear(), today.getMonth() + 3, 1).toISOString().split('T')[0],
                description: 'Upgrade to a new MacBook Pro for work',
                createdAt: new Date().toISOString()
            }
        ];
        
        this.state.transactions = demoTransactions;
        this.state.goals = demoGoals;
        
        console.log('Demo data loaded successfully');
    }
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== EVENT DELEGATION FOR DYNAMIC CONTENT =====
document.addEventListener('click', function(e) {
    // Handle dynamically created buttons
    if (e.target.matches('.tab-switch')) {
        const tab = e.target.getAttribute('data-tab');
        if (tab && window.app) {
            window.app.switchTab(tab);
        }
    }
});

// ===== INITIALIZE APPLICATION =====
let app;

document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new FinanceApp();
        window.app = app; // Make app globally accessible for onclick handlers
        
        console.log('Personal Finance Dashboard initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #b91c1c;
                padding: 2rem;
                border-radius: 0.5rem;
                text-align: center;
                z-index: 10000;
                max-width: 400px;
            ">
                <h3 style="margin: 0 0 1rem 0;">Application Error</h3>
                <p style="margin: 0;">Failed to initialize the Personal Finance Dashboard. Please refresh the page and try again.</p>
                <button onclick="location.reload()" style="
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                ">Reload Page</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
});

// ===== PERFORMANCE MONITORING =====
if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('app-start');
    
    window.addEventListener('load', () => {
        performance.mark('app-loaded');
        performance.measure('app-load-time', 'app-start', 'app-loaded');
        
        const measure = performance.getEntriesByName('app-load-time')[0];
        if (measure) {
            console.log(`App loaded in ${measure.duration.toFixed(2)}ms`);
        }
    });
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    if (window.app) {
        window.app.showToast('An unexpected error occurred', 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (window.app) {
        window.app.showToast('An unexpected error occurred', 'error');
    }
});

// ===== EXPORT FOR MODULE SYSTEMS =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FinanceApp, CONFIG };
}