// State management
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let categories = [];
let selectedIcon = '💰'; // Default icon

// DOM Elements
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const loginForm = document.getElementById('loginForm');
const categoryModal = document.getElementById('categoryModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (token && currentUser) {
    showApp();
    initializeYearFilters();
    loadCategories();
    loadTransactions();
    loadSummary();
    
    // Update quick stats after initial load
    setTimeout(() => {
      updateQuickStats();
    }, 1000);
  } else {
    showAuth();
  }

  setupEventListeners();
});

function setupEventListeners() {
  // Forms
  document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
  document.getElementById('transactionForm').addEventListener('submit', handleAddTransaction);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // Report filters only (transaction filters handled by DataTables)
  document.getElementById('reportMonth').addEventListener('change', loadReport);
  document.getElementById('reportYear').addEventListener('change', loadReport);

  // Category management
  document.getElementById('manageCategoriesBtn').addEventListener('click', openCategoryModal);
  document.getElementById('closeCategoryModal').addEventListener('click', closeCategoryModal);
  document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
  document.getElementById('type').addEventListener('change', updateCategoryOptions);
  
  // Icon picker
  setupIconPicker();
  
  // Close modal on outside click
  categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) {
      closeCategoryModal();
    }
  });

  // Setup tab switching
  setupTabSwitching();

  // Setup currency input masking
  setupCurrencyMask();
  
  // Setup export button
  setupExportButton();
  
  // Initialize edit modal
  initializeEditModal();

  // Set default date
  document.getElementById('date').valueAsDate = new Date();
}

// Auth functions
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMsg = 'Login gagal';
      try {
        const data = JSON.parse(text);
        errorMsg = data.error || errorMsg;
      } catch (e) {
        console.error('Response:', text);
      }
      Toast.error(errorMsg);
      return;
    }

    const data = await response.json();
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));

    showApp();
    loadCategories();
    loadTransactions();
    loadSummary();
  } catch (error) {
    console.error('Login error:', error);
    Toast.error('Error: ' + error.message);
  }
}


function handleLogout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showAuth();
}

// Transaction functions
async function handleAddTransaction(e) {
  e.preventDefault();
  
  const amountInput = document.getElementById('amount').value;
  const amount = parseCurrencyInput(amountInput);
  
  if (amount <= 0) {
    Toast.warning('Jumlah harus lebih dari 0');
    return;
  }
  
  const transaction = {
    type: document.getElementById('type').value,
    amount: amount,
    category_id: document.getElementById('category').value,
    description: document.getElementById('description').value,
    date: document.getElementById('date').value
  };

  try {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(transaction)
    });

    if (!response.ok) {
      const data = await response.json();
      Toast.error(data.error || 'Gagal menambah transaksi');
      return;
    }

    e.target.reset();
    document.getElementById('amount').value = 'Rp 0';
    document.getElementById('date').valueAsDate = new Date();
    loadTransactions();
    loadSummary();
    Toast.success('Transaksi berhasil ditambahkan!');
  } catch (error) {
    Toast.error('Error: ' + error.message);
  }
}

async function loadTransactions() {
  // Load all transactions without server-side filtering
  // Client-side filtering will be handled by DataTables
  let url = `${API_URL}/transactions`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      console.error('Failed to load transactions:', response.status);
      displayTransactions([]);
      return;
    }

    const transactions = await response.json();
    displayTransactions(transactions);
  } catch (error) {
    console.error('Error loading transactions:', error);
    displayTransactions([]);
  }
}

async function loadSummary() {
  try {
    const totalIncome = document.getElementById('totalIncome');
    const totalExpense = document.getElementById('totalExpense');
    const balance = document.getElementById('balance');
    
    if (!totalIncome || !totalExpense || !balance) return;
    
    // Get current month and year for default filter
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const startDate = `${currentYear}-${currentMonth}-01`;
    const lastDay = new Date(currentYear, new Date().getMonth() + 1, 0).getDate();
    const endDate = `${currentYear}-${currentMonth}-${String(lastDay).padStart(2, '0')}`;
    
    const response = await fetch(`${API_URL}/transactions/summary?startDate=${startDate}&endDate=${endDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      console.error('Failed to load summary:', response.status);
      return;
    }

    const summary = await response.json();
    totalIncome.textContent = formatCurrency(summary.total_income);
    totalExpense.textContent = formatCurrency(summary.total_expense);
    balance.textContent = formatCurrency(summary.balance);
  } catch (error) {
    console.error('Error loading summary:', error);
  }
}

async function deleteTransaction(id) {
  const confirmed = await Confirm.delete('Transaksi yang dihapus tidak dapat dikembalikan.');
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      Toast.error('Gagal menghapus transaksi');
      return;
    }

    loadTransactions();
    loadSummary();
    Toast.success('Transaksi berhasil dihapus!');
  } catch (error) {
    Toast.error('Error: ' + error.message);
  }
}

// Display functions
let transactionsTable;
let allTransactionsData = [];

function displayTransactions(transactions) {
  console.log('displayTransactions called with:', transactions);
  console.log('Number of transactions:', transactions.length);
  
  // Store all transactions data for filtering
  allTransactionsData = transactions;
  console.log('allTransactionsData updated:', allTransactionsData.length, 'transactions');
  
  // Destroy existing DataTable if it exists
  if (transactionsTable) {
    transactionsTable.destroy();
  }
  
  // Prepare data for DataTables
  const tableData = transactions.map(t => [
    formatDate(t.transaction_date),
    `<span class="badge ${t.type === 'income' ? 'bg-success' : 'bg-danger'}">
      ${t.type === 'income' ? '📈 Masuk' : '📉 Keluar'}
    </span>`,
    `🏷️ ${t.category_name || 'Kategori Tidak Diketahui'}`,
    t.description || '-',
    `<span class="fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}">
      ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
    </span>`,
    `<div class="action-buttons">
      <button class="btn btn-sm btn-outline-primary" onclick="editTransaction(${t.id})" title="Edit">
        ✏️
      </button>
      <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${t.id})" title="Hapus">
        🗑️
      </button>
    </div>`
  ]);
  
  // Initialize DataTable
  transactionsTable = $('#transactionsTable').DataTable({
    data: tableData,
    scrollX: true,
    pageLength: 10,
    lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
    order: [[0, 'desc']], // Sort by date descending
    language: {
      "decimal": "",
      "emptyTable": "Belum ada transaksi",
      "info": "Menampilkan _START_ sampai _END_ dari _TOTAL_ transaksi",
      "infoEmpty": "Menampilkan 0 sampai 0 dari 0 transaksi",
      "infoFiltered": "(difilter dari _MAX_ total transaksi)",
      "infoPostFix": "",
      "thousands": ".",
      "lengthMenu": "Tampilkan _MENU_ transaksi",
      "loadingRecords": "Loading...",
      "processing": "Processing...",
      "search": "🔍 Cari:",
      "zeroRecords": "Tidak ada transaksi yang cocok",
      "paginate": {
        "first": "Pertama",
        "last": "Terakhir",
        "next": "Selanjutnya",
        "previous": "Sebelumnya"
      },
      "aria": {
        "sortAscending": ": aktifkan untuk mengurutkan kolom naik",
        "sortDescending": ": aktifkan untuk mengurutkan kolom turun"
      }
    },
    columnDefs: [
      {
        targets: [1, 4, 5], // Type, Amount, Action columns
        orderable: false
      },
      {
        targets: [5], // Action column
        searchable: false
      }
    ],
    dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
         '<"row"<"col-sm-12"tr>>' +
         '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
    drawCallback: function() {
      // Add some styling after each draw
      $('.dataTables_filter input').addClass('search-input');
      $('.dataTables_length select').addClass('filter-select');
    }
  });
  
  // Setup custom filters after DataTable is initialized
  setupCustomFilters();
  
  // Update quick stats after data is loaded
  setTimeout(() => {
    updateQuickStats();
  }, 500);
}

function updateQuickStats() {
  console.log('updateQuickStats called');
  console.log('allTransactionsData:', allTransactionsData);
  
  if (!allTransactionsData || allTransactionsData.length === 0) {
    console.log('No transaction data available');
    document.getElementById('quickStats').style.display = 'none';
    return;
  }

  // Get filtered data
  const filterType = document.getElementById('filterType').value;
  const filterMonth = document.getElementById('filterMonth').value;
  const filterYear = document.getElementById('filterYear').value;
  
  console.log('Filters:', { filterType, filterMonth, filterYear });
  
  let filteredData = allTransactionsData;
  
  if (filterType || filterMonth || filterYear) {
    filteredData = allTransactionsData.filter(t => {
      // Filter by type
      if (filterType && t.type !== filterType) {
        return false;
      }
      
      // Filter by month/year
      if (filterMonth || filterYear) {
        const transactionDate = new Date(t.transaction_date);
        const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
        const transactionYear = transactionDate.getFullYear().toString();
        
        if (filterMonth && transactionMonth !== filterMonth) {
          return false;
        }
        
        if (filterYear && transactionYear !== filterYear) {
          return false;
        }
      }
      
      return true;
    });
  }

  console.log('Filtered data:', filteredData);

  // Calculate stats
  const totalIncome = filteredData
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const totalExpense = filteredData
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const balance = totalIncome - totalExpense;
  const totalCount = filteredData.length;

  console.log('Calculated stats:', { totalIncome, totalExpense, balance, totalCount });

  // Update display
  document.getElementById('statsIncome').textContent = formatCurrency(totalIncome);
  document.getElementById('statsExpense').textContent = formatCurrency(totalExpense);
  document.getElementById('statsBalance').textContent = formatCurrency(balance);
  document.getElementById('statsCount').textContent = totalCount;
  
  // Show stats
  document.getElementById('quickStats').style.display = 'block';
}

function setupCustomFilters() {
  // Remove existing custom filter if any
  if ($.fn.dataTable.ext.search.length > 0) {
    $.fn.dataTable.ext.search.pop();
  }
  
  // Custom filter function for DataTables
  $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    if (settings.nTable.id !== 'transactionsTable') {
      return true;
    }
    
    const filterType = $('#filterType').val();
    const filterMonth = $('#filterMonth').val();
    const filterYear = $('#filterYear').val();
    
    // Get original transaction data
    const transaction = allTransactionsData[dataIndex];
    if (!transaction) return true;
    
    // Filter by type
    if (filterType && transaction.type !== filterType) {
      return false;
    }
    
    // Filter by month/year
    if (filterMonth || filterYear) {
      const transactionDate = new Date(transaction.transaction_date);
      const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
      const transactionYear = transactionDate.getFullYear().toString();
      
      if (filterMonth && transactionMonth !== filterMonth) {
        return false;
      }
      
      if (filterYear && transactionYear !== filterYear) {
        return false;
      }
    }
    
    return true;
  });
  
  // Add event listeners to filter controls
  $('#filterType, #filterMonth, #filterYear').off('change.customFilter').on('change.customFilter', function() {
    if (transactionsTable) {
      transactionsTable.draw();
      updateQuickStats();
    }
  });
}

function showApp() {
  authSection.style.display = 'none';
  appSection.style.display = 'block';
  document.getElementById('username').textContent = currentUser.username;
  
  // Initialize amount input with default value
  setTimeout(() => {
    const amountInput = document.getElementById('amount');
    if (amountInput && amountInput.value === '') {
      amountInput.value = 'Rp 0';
    }
  }, 100);
}

function showAuth() {
  authSection.style.display = 'block';
  appSection.style.display = 'none';
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}


// Category functions
async function loadCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      console.error('Failed to load categories');
      return;
    }

    categories = await response.json();
    updateCategoryOptions();
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

function updateCategoryOptions() {
  const typeSelect = document.getElementById('type');
  const categorySelect = document.getElementById('category');
  
  if (!typeSelect || !categorySelect) return;
  
  const selectedType = typeSelect.value;

  // Filter categories by type
  const filteredCategories = categories.filter(c => c.type === selectedType);

  // Update select options
  categorySelect.innerHTML = '<option value="">Pilih Kategori</option>';
  filteredCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
}

function openCategoryModal() {
  categoryModal.classList.add('active');
  displayCategories();
}

function closeCategoryModal() {
  categoryModal.classList.remove('active');
  document.getElementById('addCategoryForm').reset();
}

function displayCategories() {
  const incomeList = document.getElementById('incomeCategoriesList');
  const expenseList = document.getElementById('expenseCategoriesList');

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Display income categories
  if (incomeCategories.length === 0) {
    incomeList.innerHTML = '<div class="empty-categories">Belum ada kategori pemasukan</div>';
  } else {
    incomeList.innerHTML = incomeCategories.map(cat => `
      <div class="category-item">
        <span class="category-name">
          <i class="fas ${cat.icon || 'fa-tag'}"></i> ${cat.name}
        </span>
        <button class="btn-delete-category" data-id="${cat.id}"><i class="fas fa-trash"></i> Hapus</button>
      </div>
    `).join('');
    
    // Add event listeners
    incomeList.querySelectorAll('.btn-delete-category').forEach(btn => {
      btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
    });
  }

  // Display expense categories
  if (expenseCategories.length === 0) {
    expenseList.innerHTML = '<div class="empty-categories">Belum ada kategori pengeluaran</div>';
  } else {
    expenseList.innerHTML = expenseCategories.map(cat => `
      <div class="category-item">
        <span class="category-name">
          <i class="fas ${cat.icon || 'fa-tag'}"></i> ${cat.name}
        </span>
        <button class="btn-delete-category" data-id="${cat.id}"><i class="fas fa-trash"></i> Hapus</button>
      </div>
    `).join('');
    
    // Add event listeners
    expenseList.querySelectorAll('.btn-delete-category').forEach(btn => {
      btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
    });
  }
}

async function handleAddCategory(e) {
  e.preventDefault();

  const name = document.getElementById('newCategoryName').value.trim();
  const type = document.getElementById('newCategoryType').value;

  if (!name) {
    Toast.warning('Nama kategori harus diisi');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, type, icon: selectedIcon })
    });

    const data = await response.json();

    if (!response.ok) {
      Toast.error(data.error || 'Gagal menambah kategori');
      return;
    }

    // Reload categories
    await loadCategories();
    displayCategories();
    document.getElementById('addCategoryForm').reset();
    
    // Reset icon to default
    selectedIcon = '💰';
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector('.icon-option[data-icon="💰"]').classList.add('active');
    
    Toast.success('Kategori berhasil ditambahkan!');
  } catch (error) {
    console.error('Error adding category:', error);
    Toast.error('Error: ' + error.message);
  }
}

async function deleteCategory(id) {
  const confirmed = await Confirm.delete('Kategori yang dihapus tidak dapat dikembalikan.');
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      Toast.error(data.error || 'Gagal menghapus kategori');
      return;
    }

    // Reload categories
    await loadCategories();
    displayCategories();
    Toast.success('Kategori berhasil dihapus!');
  } catch (error) {
    console.error('Error deleting category:', error);
    Toast.error('Error: ' + error.message);
  }
}


// Tab switching
function setupTabSwitching() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.dataset.tab;
      
      // Remove active class from all nav items and tabs
      navItems.forEach(nav => nav.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
      
      // Add active class to clicked nav and corresponding tab
      item.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      
      // Load data for specific tabs
      if (tabId === 'tabRiwayat') {
        loadTransactions();
      } else if (tabId === 'tabLaporan') {
        loadReport();
      }
    });
  });
}

// Load report data
async function loadReport() {
  const reportMonth = document.getElementById('reportMonth').value;
  const reportYear = document.getElementById('reportYear').value;
  
  try {
    // Build URL with date filters
    let summaryUrl = `${API_URL}/transactions/summary`;
    let transactionsUrl = `${API_URL}/transactions`;
    const params = new URLSearchParams();
    
    // Add expense filter for transactions
    params.append('type', 'expense');
    
    if (reportMonth && reportYear) {
      const startDate = `${reportYear}-${reportMonth}-01`;
      const lastDay = new Date(reportYear, reportMonth, 0).getDate();
      const endDate = `${reportYear}-${reportMonth}-${String(lastDay).padStart(2, '0')}`;
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    } else if (reportYear) {
      params.append('startDate', `${reportYear}-01-01`);
      params.append('endDate', `${reportYear}-12-31`);
    }
    
    // Build final URLs
    const summaryParams = new URLSearchParams();
    if (reportMonth && reportYear) {
      const startDate = `${reportYear}-${reportMonth}-01`;
      const lastDay = new Date(reportYear, reportMonth, 0).getDate();
      const endDate = `${reportYear}-${reportMonth}-${String(lastDay).padStart(2, '0')}`;
      summaryParams.append('startDate', startDate);
      summaryParams.append('endDate', endDate);
    } else if (reportYear) {
      summaryParams.append('startDate', `${reportYear}-01-01`);
      summaryParams.append('endDate', `${reportYear}-12-31`);
    }
    
    if (summaryParams.toString()) {
      summaryUrl += '?' + summaryParams.toString();
    }
    
    if (params.toString()) {
      transactionsUrl += '?' + params.toString();
    }
    
    // Update summary in report tab
    const summaryResponse = await fetch(summaryUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (summaryResponse.ok) {
      const summary = await summaryResponse.json();
      document.getElementById('reportIncome').textContent = formatCurrency(summary.total_income);
      document.getElementById('reportExpense').textContent = formatCurrency(summary.total_expense);
      document.getElementById('reportBalance').textContent = formatCurrency(summary.balance);
    }

    // Get category breakdown
    const transactionsResponse = await fetch(transactionsUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (transactionsResponse.ok) {
      const transactions = await transactionsResponse.json();
      console.log('Transactions for report:', transactions);
      displayCategoryBreakdown(transactions);
    } else {
      console.error('Failed to load transactions for report:', transactionsResponse.status);
      displayCategoryBreakdown([]);
    }
  } catch (error) {
    console.error('Error loading report:', error);
  }
}

function displayCategoryBreakdown(transactions) {
  const container = document.getElementById('categoryBreakdown');
  
  console.log('displayCategoryBreakdown called with:', transactions);
  
  if (transactions.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada data pengeluaran</div>';
    return;
  }

  // Group by category and sum amounts
  const categoryTotals = {};
  let maxAmount = 0;

  transactions.forEach(t => {
    const categoryName = t.category_name || 'Kategori Tidak Diketahui';
    console.log('Processing transaction:', t, 'Category name:', categoryName);
    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = 0;
    }
    const amount = parseFloat(t.amount);
    categoryTotals[categoryName] += amount;
    if (amount > maxAmount) maxAmount = amount;
  });

  console.log('Category totals:', categoryTotals);

  // Convert to array and sort by amount
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  // Find max for percentage calculation
  const totalExpense = sortedCategories.reduce((sum, [_, amount]) => sum + amount, 0);

  container.innerHTML = sortedCategories.map(([category, amount]) => {
    const percentage = totalExpense > 0 ? (amount / totalExpense * 100).toFixed(1) : 0;
    const categoryName = category || 'Kategori Tidak Diketahui';
    return `
      <div class="category-item-report">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span class="category-name-report"><i class="fas fa-tag"></i> ${categoryName}</span>
            <span class="category-amount-report">${formatCurrency(amount)}</span>
          </div>
          <div class="category-bar">
            <div class="category-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <div style="font-size: 11px; color: #999; margin-top: 4px;">${percentage}% dari total pengeluaran</div>
        </div>
      </div>
    `;
  }).join('');
}


// Currency input masking
function setupCurrencyMask() {
  const amountInput = document.getElementById('amount');
  
  if (!amountInput) return;
  
  amountInput.addEventListener('input', function(e) {
    let value = e.target.value;
    
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    
    // Convert to number and format
    if (value) {
      const number = parseInt(value);
      e.target.value = formatCurrencyInput(number);
    } else {
      e.target.value = '';
    }
  });
  
  amountInput.addEventListener('focus', function(e) {
    if (e.target.value === '' || e.target.value === 'Rp 0') {
      e.target.value = '';
    }
  });
  
  amountInput.addEventListener('blur', function(e) {
    if (e.target.value === '') {
      e.target.value = 'Rp 0';
    }
  });
}

function formatCurrencyInput(number) {
  return 'Rp ' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseCurrencyInput(value) {
  // Remove 'Rp' and dots, then parse to number
  return parseFloat(value.replace(/[Rp.\s]/g, '')) || 0;
}


// Initialize year filters
function initializeYearFilters() {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const filterYear = document.getElementById('filterYear');
  const reportYear = document.getElementById('reportYear');
  const filterMonth = document.getElementById('filterMonth');
  const reportMonth = document.getElementById('reportMonth');
  
  // Populate year dropdowns (last 5 years + current + next year)
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i);
  }
  
  if (filterYear) {
    filterYear.innerHTML = '<option value="">Semua Tahun</option>' + 
      years.map(year => `<option value="${year}">${year}</option>`).join('');
    filterYear.value = currentYear;
  }
  
  if (reportYear) {
    reportYear.innerHTML = '<option value="">Semua Tahun</option>' + 
      years.map(year => `<option value="${year}">${year}</option>`).join('');
    reportYear.value = currentYear;
  }
  
  // Set current month as default
  if (filterMonth) {
    filterMonth.value = currentMonth;
  }
  
  if (reportMonth) {
    reportMonth.value = currentMonth;
  }
}


// Icon picker
function setupIconPicker() {
  const iconOptions = document.querySelectorAll('.icon-option');
  
  iconOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all
      iconOptions.forEach(opt => opt.classList.remove('active'));
      
      // Add active to clicked
      option.classList.add('active');
      
      // Store selected icon
      selectedIcon = option.dataset.icon;
    });
  });
}

// Export functionality
function setupExportButton() {
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToExcel);
  }
}

function exportToExcel() {
  if (!allTransactionsData || allTransactionsData.length === 0) {
    Toast.warning('Tidak ada data untuk diekspor');
    return;
  }

  // Get filtered data from DataTable
  let dataToExport = allTransactionsData;
  
  // Apply current filters
  const filterType = document.getElementById('filterType').value;
  const filterMonth = document.getElementById('filterMonth').value;
  const filterYear = document.getElementById('filterYear').value;
  
  if (filterType || filterMonth || filterYear) {
    dataToExport = allTransactionsData.filter(t => {
      // Filter by type
      if (filterType && t.type !== filterType) {
        return false;
      }
      
      // Filter by month/year
      if (filterMonth || filterYear) {
        const transactionDate = new Date(t.transaction_date);
        const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
        const transactionYear = transactionDate.getFullYear().toString();
        
        if (filterMonth && transactionMonth !== filterMonth) {
          return false;
        }
        
        if (filterYear && transactionYear !== filterYear) {
          return false;
        }
      }
      
      return true;
    });
  }

  if (dataToExport.length === 0) {
    Toast.warning('Tidak ada data yang sesuai filter untuk diekspor');
    return;
  }

  // Prepare CSV data
  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah'];
  const csvData = [headers];
  
  dataToExport.forEach(t => {
    csvData.push([
      formatDate(t.transaction_date),
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.category_name || 'Kategori',
      t.description || '',
      (t.type === 'income' ? '' : '-') + formatCurrency(t.amount).replace('Rp', '').trim()
    ]);
  });

  // Convert to CSV string
  const csvString = csvData.map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');

  // Create and download file
  const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `transaksi_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  Toast.success(`${dataToExport.length} transaksi berhasil diekspor!`);
}
// Edit transaction functionality
let editTransactionModal;
let currentEditId = null;

function initializeEditModal() {
  editTransactionModal = document.getElementById('editTransactionModal');
  
  // Setup event listeners
  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
  document.getElementById('editTransactionForm').addEventListener('submit', handleEditTransaction);
  document.getElementById('editType').addEventListener('change', updateEditCategoryOptions);
  
  // Close modal on outside click
  editTransactionModal.addEventListener('click', (e) => {
    if (e.target === editTransactionModal) {
      closeEditModal();
    }
  });
  
  // Setup currency mask for edit amount
  setupEditCurrencyMask();
}

async function editTransaction(id) {
  try {
    // Get transaction data
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      Toast.error('Gagal mengambil data transaksi');
      return;
    }

    const transaction = await response.json();
    
    // Populate form
    currentEditId = id;
    document.getElementById('editTransactionId').value = id;
    document.getElementById('editType').value = transaction.type;
    document.getElementById('editAmount').value = formatCurrencyInput(transaction.amount);
    document.getElementById('editDate').value = transaction.transaction_date.split('T')[0];
    document.getElementById('editDescription').value = transaction.description || '';
    
    // Update categories and select current one
    updateEditCategoryOptions();
    setTimeout(() => {
      document.getElementById('editCategory').value = transaction.category_id;
    }, 100);
    
    // Show modal
    editTransactionModal.classList.add('active');
  } catch (error) {
    console.error('Error loading transaction:', error);
    Toast.error('Error: ' + error.message);
  }
}

function closeEditModal() {
  editTransactionModal.classList.remove('active');
  document.getElementById('editTransactionForm').reset();
  currentEditId = null;
}

async function handleEditTransaction(e) {
  e.preventDefault();
  
  if (!currentEditId) {
    Toast.error('ID transaksi tidak valid');
    return;
  }
  
  const amountInput = document.getElementById('editAmount').value;
  const amount = parseCurrencyInput(amountInput);
  
  if (amount <= 0) {
    Toast.warning('Jumlah harus lebih dari 0');
    return;
  }
  
  const transaction = {
    type: document.getElementById('editType').value,
    amount: amount,
    category_id: document.getElementById('editCategory').value,
    description: document.getElementById('editDescription').value,
    date: document.getElementById('editDate').value
  };

  try {
    const response = await fetch(`${API_URL}/transactions/${currentEditId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(transaction)
    });

    if (!response.ok) {
      const data = await response.json();
      Toast.error(data.error || 'Gagal mengupdate transaksi');
      return;
    }

    closeEditModal();
    loadTransactions();
    loadSummary();
    Toast.success('Transaksi berhasil diupdate!');
  } catch (error) {
    console.error('Error updating transaction:', error);
    Toast.error('Error: ' + error.message);
  }
}

function updateEditCategoryOptions() {
  const typeSelect = document.getElementById('editType');
  const categorySelect = document.getElementById('editCategory');
  
  if (!typeSelect || !categorySelect) return;
  
  const selectedType = typeSelect.value;

  // Filter categories by type
  const filteredCategories = categories.filter(c => c.type === selectedType);

  // Update select options
  categorySelect.innerHTML = '<option value="">Pilih Kategori</option>';
  filteredCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
}

function setupEditCurrencyMask() {
  const amountInput = document.getElementById('editAmount');
  
  if (!amountInput) return;
  
  amountInput.addEventListener('input', function(e) {
    let value = e.target.value;
    
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    
    // Convert to number and format
    if (value) {
      const number = parseInt(value);
      e.target.value = formatCurrencyInput(number);
    } else {
      e.target.value = '';
    }
  });
  
  amountInput.addEventListener('focus', function(e) {
    if (e.target.value === '' || e.target.value === 'Rp 0') {
      e.target.value = '';
    }
  });
  
  amountInput.addEventListener('blur', function(e) {
    if (e.target.value === '') {
      e.target.value = 'Rp 0';
    }
  });
}
// Force update stats - untuk debugging
function forceUpdateStats() {
  console.log('Force updating stats...');
  console.log('Current allTransactionsData:', allTransactionsData);
  
  if (allTransactionsData && allTransactionsData.length > 0) {
    updateQuickStats();
  } else {
    console.log('No data available for stats');
  }
}

// Call this from browser console if needed: forceUpdateStats()
window.forceUpdateStats = forceUpdateStats;