// ====== ডেটা লেয়ার ======
const STORAGE_KEY = 'shopManagerData';
let state = { products: [], transactions: [] };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function money(n) {
  return '৳ ' + Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
function typeLabel(type) {
  switch (type) {
    case 'sale': return 'বিক্রয়';
    case 'purchase': return 'ক্রয়';
    case 'income': return 'আয়';
    case 'expense': return 'ব্যয়';
    default: return type;
  }
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        products: parsed.products || [],
        transactions: parsed.transactions || []
      };
    }
  } catch (e) {
    console.error('ডেটা লোড করতে সমস্যা:', e);
  }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ====== নেভিগেশন ======
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.getAttribute('data-target');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(target).classList.add('active');
  });
});

// ====== প্রোডাক্ট ফর্ম ======
const productForm = document.getElementById('product-form');
const productId = document.getElementById('product-id');
const pName = document.getElementById('p-name');
const pCost = document.getElementById('p-cost');
const pPrice = document.getElementById('p-price');
const pStock = document.getElementById('p-stock');
const cancelEdit = document.getElementById('cancel-edit');

productForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = pName.value.trim();
  const cost = parseFloat(pCost.value);
  const price = parseFloat(pPrice.value);
  const stock = parseFloat(pStock.value);
  if (!name || isNaN(cost) || isNaN(price) || isNaN(stock)) {
    return alert('সব ঘর সঠিকভাবে পূরণ করুন');
  }
  if (productId.value) {
    const p = state.products.find(x => x.id === productId.value);
    if (p) {
      p.name = name; p.cost = cost; p.price = price; p.stock = stock;
    }
  } else {
    state.products.push({ id: uid(), name, cost, price, stock });
  }
  saveData();
  productForm.reset();
  productId.value = '';
  cancelEdit.style.display = 'none';
  renderAll();
});

cancelEdit.addEventListener('click', () => {
  productForm.reset();
  productId.value = '';
  cancelEdit.style.display = 'none';
});

// প্রোডাক্ট লিস্ট রেন্ডার + একশন
function renderProducts() {
  const tbody = document.getElementById('product-list');
  tbody.innerHTML = '';
  if (state.products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">কোনো পণ্য পাওয়া যায়নি</td></tr>';
    return;
  }
  state.products.slice().sort((a, b) => a.name.localeCompare(b.name, 'bn')).forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${esc(p.name)}</td>
      <td>${money(p.cost)}</td>
      <td>${money(p.price)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn small secondary" data-edit="${p.id}">এডিট</button>
        <button class="btn small danger" data-del="${p.id}">ডিলিট</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('product-list').addEventListener('click', e => {
  const editId = e.target.getAttribute('data-edit');
  const delId = e.target.getAttribute('data-del');
  if (editId) {
    const p = state.products.find(x => x.id === editId);
    if (p) {
      productId.value = p.id;
      pName.value = p.name;
      pCost.value = p.cost;
      pPrice.value = p.price;
      pStock.value = p.stock;
      cancelEdit.style.display = 'inline-block';
      document.querySelector('.nav-btn[data-target="products"]').click();
      pName.focus();
    }
  }
  if (delId) {
    if (confirm('আপনি কি এই পণ্যটি ডিলিট করতে চান?')) {
      state.products = state.products.filter(x => x.id !== delId);
      saveData();
      renderAll();
    }
  }
});

// ====== স্টক ইন / আউট সিলেক্ট ======
const siProduct = document.getElementById('si-product');
const soProduct = document.getElementById('so-product');
const siCost = document.getElementById('si-cost');
const soPrice = document.getElementById('so-price');

function populateProductSelects() {
  [siProduct, soProduct].forEach(sel => {
    const current = sel.value;
    sel.innerHTML = '<option value="">-- নির্বাচন করুন --</option>';
    state.products.slice().sort((a, b) => a.name.localeCompare(b.name, 'bn')).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (স্টক: ${p.stock})`;
      sel.appendChild(opt);
    });
    if (current && state.products.some(p => p.id === current)) sel.value = current;
  });
}

siProduct.addEventListener('change', () => {
  const p = state.products.find(x => x.id === siProduct.value);
  if (p) siCost.value = p.cost;
});
soProduct.addEventListener('change', () => {
  const p = state.products.find(x => x.id === soProduct.value);
  if (p) soPrice.value = p.price;
});

// ====== স্টক ইন ফর্ম ======
const siForm = document.getElementById('stockin-form');
const siQty = document.getElementById('si-qty');
const siDate = document.getElementById('si-date');
const siNote = document.getElementById('si-note');

siForm.addEventListener('submit', e => {
  e.preventDefault();
  const pid = siProduct.value;
  const qty = parseFloat(siQty.value);
  const cost = parseFloat(siCost.value);
  const date = siDate.value || todayStr();
  if (!pid || isNaN(qty) || qty <= 0 || isNaN(cost)) return alert('সব ঘর সঠিকভাবে পূরণ করুন');
  const p = state.products.find(x => x.id === pid);
  if (!p) return alert('পণ্য পাওয়া যায়নি');

  p.stock += qty;
  p.cost = cost;
  const total = qty * cost;
  state.transactions.push({
    id: uid(), type: 'purchase', productId: p.id, productName: p.name,
    qty, unitPrice: cost, unitCost: cost, total, date,
    category: 'স্টক ক্রয়', note: siNote.value.trim()
  });
  saveData();
  siForm.reset();
  siDate.value = todayStr();
  renderAll();
  alert('স্টক সফলভাবে যোগ করা হয়েছে!');
});

// ====== স্টক আউট ফর্ম ======
const soForm = document.getElementById('stockout-form');
const soQty = document.getElementById('so-qty');
const soDate = document.getElementById('so-date');
const soNote = document.getElementById('so-note');

soForm.addEventListener('submit', e => {
  e.preventDefault();
  const pid = soProduct.value;
  const qty = parseFloat(soQty.value);
  const price = parseFloat(soPrice.value);
  const date = soDate.value || todayStr();
  if (!pid || isNaN(qty) || qty <= 0 || isNaN(price)) return alert('সব ঘর সঠিকভাবে পূরণ করুন');
  const p = state.products.find(x => x.id === pid);
  if (!p) return alert('পণ্য পাওয়া যায়নি');
  if (p.stock < qty) return alert(`স্টকে পর্যাপ্ত পণ্য নেই! বর্তমান স্টক: ${p.stock}`);

  p.stock -= qty;
  const total = qty * price;
  state.transactions.push({
    id: uid(), type: 'sale', productId: p.id, productName: p.name,
    qty, unitPrice: price, unitCost: p.cost, total, date,
    category: 'বিক্রয়', note: soNote.value.trim()
  });
  saveData();
  soForm.reset();
  soDate.value = todayStr();
  renderAll();
  alert('বিক্রয় সফলভাবে সম্পন্ন হয়েছে!');
});

// ====== ম্যানুয়াল আয়/ব্যয় ======
const mtForm = document.getElementById('manual-txn-form');
const mtType = document.getElementById('mt-type');
const mtCategory = document.getElementById('mt-category');
const mtAmount = document.getElementById('mt-amount');
const mtDate = document.getElementById('mt-date');
const mtNote = document.getElementById('mt-note');

mtForm.addEventListener('submit', e => {
  e.preventDefault();
  const type = mtType.value;
  const amount = parseFloat(mtAmount.value);
  const date = mtDate.value || todayStr();
  if (isNaN(amount) || amount <= 0) return alert('সঠিক টাকার পরিমাণ দিন');
  state.transactions.push({
    id: uid(), type,
    category: mtCategory.value.trim() || (type === 'income' ? 'অন্যান্য আয়' : 'অন্যান্য ব্যয়'),
    total: amount, date, note: mtNote.value.trim()
  });
  saveData();
  mtForm.reset();
  mtDate.value = todayStr();
  renderAll();
  alert('লেনদেন যোগ করা হয়েছে!');
});

// ====== রেন্ডার ফাংশন ======
function renderDashboard() {
  const totalProducts = state.products.length;
  const totalStockQty = state.products.reduce((s, p) => s + Number(p.stock || 0), 0);
  const stockValue = state.products.reduce((s, p) => s + Number(p.stock || 0) * Number(p.cost || 0), 0);
  const sales = state.transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.total, 0);
  const purchases = state.transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + t.total, 0);
  const otherIncome = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.total, 0);
  const otherExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.total, 0);
  const balance = (sales + otherIncome) - (purchases + otherExpense);
  const lowStock = state.products.filter(p => Number(p.stock) <= 5).length;

  document.getElementById('stat-products').textContent = totalProducts;
  document.getElementById('stat-stock').textContent = totalStockQty;
  document.getElementById('stat-stock-value').textContent = money(stockValue);
  document.getElementById('stat-sales').textContent = money(sales);
  document.getElementById('stat-purchase').textContent = money(purchases);
  document.getElementById('stat-balance').textContent = money(balance);
  document.getElementById('stat-low').textContent = lowStock;

  const recent = state.transactions.slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  const tbody = document.getElementById('recent-transactions');
  tbody.innerHTML = '';
  if (recent.length === 0) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">কোনো লেনদেন নেই</td></tr>';
  recent.forEach(t => {
    const tr = document.createElement('tr');
    const desc = t.productName ? `${esc(t.productName)} (${t.qty} x ${money(t.unitPrice)})` : esc(t.category || '');
    const isIncome = t.type === 'sale' || t.type === 'income';
    tr.innerHTML = `
      <td>${esc(t.date)}</td>
      <td>${desc} ${t.note ? '<br><small>' + esc(t.note) + '</small>' : ''}</td>
      <td><span class="badge ${t.type}">${typeLabel(t.type)}</span></td>
      <td style="color:${isIncome ? 'green' : 'red'};font-weight:600;">
        ${isIncome ? '+' : '-'} ${money(t.total)}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStockIn() {
  const list = state.transactions.filter(t => t.type === 'purchase')
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  const tbody = document.getElementById('stockin-list');
  tbody.innerHTML = '';
  if (list.length === 0) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">কোনো স্টক ইন নেই</td></tr>';
  list.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${esc(t.date)}</td><td>${esc(t.productName || '')}</td><td>${t.qty}</td><td>${money(t.unitPrice)}</td><td>${money(t.total)}</td>`;
    tbody.appendChild(tr);
  });
}

function renderStockOut() {
  const list = state.transactions.filter(t => t.type === 'sale')
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  const tbody = document.getElementById('stockout-list');
  tbody.innerHTML = '';
  if (list.length === 0) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">কোনো বিক্রয় নেই</td></tr>';
  list.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${esc(t.date)}</td><td>${esc(t.productName || '')}</td><td>${t.qty}</td><td>${money(t.unitPrice)}</td><td>${money(t.total)}</td>`;
    tbody.appendChild(tr);
  });
}

function renderHisab() {
  const sales = state.transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.total, 0);
  const purchases = state.transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + t.total, 0);
  const otherIncome = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.total, 0);
  const otherExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.total, 0);
  const totalIncome = sales + otherIncome;
  const totalExpense = purchases + otherExpense;

  document.getElementById('h-income').textContent = money(totalIncome);
  document.getElementById('h-expense').textContent = money(totalExpense);
  document.getElementById('h-balance').textContent = money(totalIncome - totalExpense);

  const all = state.transactions.slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const tbody = document.getElementById('txn-list');
  tbody.innerHTML = '';
  if (all.length === 0) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">কোনো লেনদেন নেই</td></tr>';
  all.forEach(t => {
    const tr = document.createElement('tr');
    const desc = t.productName ? `${esc(t.productName)} (${t.qty} x ${money(t.unitPrice)})` : esc(t.category || '');
    const inc = (t.type === 'sale' || t.type === 'income') ? money(t.total) : '';
    const exp = (t.type === 'purchase' || t.type === 'expense') ? money(t.total) : '';
    tr.innerHTML = `
      <td>${esc(t.date)}</td>
      <td>${desc} ${t.note ? '<br><small>' + esc(t.note) + '</small>' : ''}</td>
      <td><span class="badge ${t.type}">${typeLabel(t.type)}</span></td>
      <td style="color:green;font-weight:600;">${inc}</td>
      <td style="color:red;font-weight:600;">${exp}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAll() {
  populateProductSelects();
  renderProducts();
  renderDashboard();
  renderStockIn();
  renderStockOut();
  renderHisab();
}

// ====== ইনিশিয়ালাইজ ======
loadData();
document.getElementById('si-date').value = todayStr();
document.getElementById('so-date').value = todayStr();
document.getElementById('mt-date').value = todayStr();
renderAll();
