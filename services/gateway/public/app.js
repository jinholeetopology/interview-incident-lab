const CUSTOMER_IDS = [
  "2f27bbb3-0e42-42e5-a7f7-5f95a707c97d",
  "98bbce96-1f77-4471-8975-f675d4b65065",
  "57f161dd-cf10-42d8-8854-1cdc5dae7155",
  "253ff05e-e7c5-4155-9eaa-487138da47be",
  "2bb64d83-1d38-4df2-86ef-e2402dafb081",
  "5674e53a-869a-41f5-b801-02064b0ce5a0",
  "a6a9fe45-f61f-46dc-8709-72a273a9bf81",
  "70cc03d7-8e52-49c9-955f-73b6a88b1b94"
];

const state = {
  apiKey: localStorage.getItem("atlas-api-key") || "demo-key-1",
  products: [],
  categories: [],
  orders: [],
  selectedProduct: null,
  price: null,
  stock: null,
  loading: false
};

const el = {
  apiKeyInput: document.querySelector("#apiKeyInput"),
  refreshButton: document.querySelector("#refreshButton"),
  readyText: document.querySelector("#readyText"),
  productRows: document.querySelector("#productRows"),
  productCount: document.querySelector("#productCount"),
  categoryFilter: document.querySelector("#categoryFilter"),
  searchInput: document.querySelector("#searchInput"),
  selectedProductText: document.querySelector("#selectedProductText"),
  tierSelect: document.querySelector("#tierSelect"),
  currencySelect: document.querySelector("#currencySelect"),
  qtyInput: document.querySelector("#qtyInput"),
  quoteButton: document.querySelector("#quoteButton"),
  unitPrice: document.querySelector("#unitPrice"),
  totalPrice: document.querySelector("#totalPrice"),
  appliedRules: document.querySelector("#appliedRules"),
  stockList: document.querySelector("#stockList"),
  customerSelect: document.querySelector("#customerSelect"),
  createOrderButton: document.querySelector("#createOrderButton"),
  orderProductName: document.querySelector("#orderProductName"),
  orderProductSku: document.querySelector("#orderProductSku"),
  orderRows: document.querySelector("#orderRows"),
  orderCount: document.querySelector("#orderCount"),
  reportDate: document.querySelector("#reportDate"),
  reportButton: document.querySelector("#reportButton"),
  settlementRows: document.querySelector("#settlementRows"),
  toast: document.querySelector("#toast")
};

const formatMoney = (value, currency) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0) / 100);

const today = () => new Date().toISOString().slice(0, 10);

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toast = (message) => {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.toast.classList.remove("show"), 2800);
};

const setBusy = (busy) => {
  state.loading = busy;
  el.refreshButton.disabled = busy;
  el.quoteButton.disabled = busy || !state.selectedProduct;
  el.createOrderButton.disabled = busy || !state.selectedProduct;
  el.reportButton.disabled = busy;
};

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": state.apiKey,
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message || body?.error || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }
  return body;
};

const loadReadiness = async () => {
  const response = await fetch("/ready");
  const body = await response.json();
  const services = Object.entries(body.services || {});
  const ok = services.every(([, status]) => status === "ok");
  el.readyText.textContent = ok ? "all services ok" : "service check needed";
};

const loadCatalog = async () => {
  const [categories, products] = await Promise.all([
    api("/api/catalog/categories"),
    api("/api/catalog/products?limit=100")
  ]);
  state.categories = categories.items || [];
  state.products = products.items || [];
  if (!state.selectedProduct && state.products.length > 0) {
    state.selectedProduct = state.products[0];
  }
  renderCategories();
  renderProducts();
};

const loadOrders = async () => {
  const orders = await api("/api/orders/orders?limit=12");
  state.orders = orders.items || [];
  renderOrders();
};

const loadSettlement = async () => {
  const date = el.reportDate.value || today();
  const report = await api(`/api/settlement/reports/daily?date=${encodeURIComponent(date)}`);
  renderSettlement(report.totals || []);
};

const refreshAll = async () => {
  setBusy(true);
  try {
    await loadReadiness();
    await loadCatalog();
    await Promise.all([loadOrders(), loadSettlement()]);
    await refreshSelectedProduct();
    toast("데이터를 새로고침했습니다.");
  } catch (err) {
    toast(err.message);
  } finally {
    setBusy(false);
  }
};

const renderCategories = () => {
  const current = el.categoryFilter.value;
  el.categoryFilter.innerHTML = `<option value="">전체 카테고리</option>`;
  for (const category of state.categories) {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    el.categoryFilter.append(option);
  }
  el.categoryFilter.value = current;
};

const filteredProducts = () => {
  const categoryId = el.categoryFilter.value;
  const keyword = el.searchInput.value.trim().toLowerCase();
  return state.products.filter((product) => {
    const matchesCategory = !categoryId || product.categoryId === categoryId;
    const matchesKeyword =
      !keyword ||
      product.sku.toLowerCase().includes(keyword) ||
      product.name.toLowerCase().includes(keyword);
    return matchesCategory && matchesKeyword;
  });
};

const renderProducts = () => {
  const products = filteredProducts();
  el.productCount.textContent = `${products.length} items`;
  el.productRows.innerHTML = "";
  for (const product of products) {
    const row = document.createElement("tr");
    row.className = `product-row ${state.selectedProduct?.id === product.id ? "selected" : ""}`;
    row.tabIndex = 0;
    row.innerHTML = `
      <td>${escapeHtml(product.sku)}</td>
      <td title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</td>
      <td><span class="status ${escapeHtml(product.status)}">${escapeHtml(product.status)}</span></td>
      <td class="num">${formatMoney(product.basePriceCents, product.currency)}</td>
    `;
    row.addEventListener("click", () => selectProduct(product));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter") selectProduct(product);
    });
    el.productRows.append(row);
  }
  if (products.length === 0) {
    el.productRows.innerHTML = `<tr><td colspan="4" class="empty">상품 없음</td></tr>`;
  }
  renderSelectedProduct();
};

const selectProduct = async (product) => {
  state.selectedProduct = product;
  state.price = null;
  state.stock = null;
  renderProducts();
  await refreshSelectedProduct();
};

const refreshSelectedProduct = async () => {
  if (!state.selectedProduct) {
    renderSelectedProduct();
    return;
  }
  await Promise.all([quotePrice(), loadStock()]);
};

const renderSelectedProduct = () => {
  const product = state.selectedProduct;
  el.selectedProductText.textContent = product ? `${product.sku} · ${product.name}` : "상품 선택 대기";
  el.orderProductName.textContent = product?.name || "-";
  el.orderProductSku.textContent = product?.sku || "-";
  el.quoteButton.disabled = state.loading || !product;
  el.createOrderButton.disabled = state.loading || !product;
};

const quotePrice = async () => {
  if (!state.selectedProduct) return;
  const params = new URLSearchParams({
    customerTier: el.tierSelect.value,
    currency: el.currencySelect.value,
    qty: el.qtyInput.value
  });
  state.price = await api(`/api/catalog/products/${state.selectedProduct.id}/price?${params}`);
  renderPrice();
};

const renderPrice = () => {
  const price = state.price;
  const qty = Number(el.qtyInput.value || 1);
  if (!price) {
    el.unitPrice.textContent = "-";
    el.totalPrice.textContent = "-";
    el.appliedRules.textContent = "-";
    return;
  }
  el.unitPrice.textContent = formatMoney(price.unitPriceCents, price.currency);
  el.totalPrice.textContent = formatMoney(price.unitPriceCents * qty, price.currency);
  el.appliedRules.textContent = price.appliedRuleIds?.length ? price.appliedRuleIds.length : "none";
};

const loadStock = async () => {
  if (!state.selectedProduct) return;
  state.stock = await api(`/api/inventory/stock/${state.selectedProduct.id}`);
  renderStock();
};

const renderStock = () => {
  const rows = state.stock?.byWarehouse || [];
  el.stockList.innerHTML = "";
  if (rows.length === 0) {
    el.stockList.innerHTML = `<div class="empty">재고 없음</div>`;
    return;
  }
  for (const row of rows) {
    const item = document.createElement("div");
    item.className = "stock-row";
    item.innerHTML = `
      <strong title="${escapeHtml(row.warehouseId)}">${escapeHtml(row.warehouseId)}</strong>
      <span>on ${row.onHand}</span>
      <span>res ${row.reserved}</span>
    `;
    el.stockList.append(item);
  }
};

const renderCustomers = () => {
  el.customerSelect.innerHTML = "";
  CUSTOMER_IDS.forEach((id, index) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `Buyer ${String(index + 1).padStart(2, "0")}`;
    el.customerSelect.append(option);
  });
};

const createOrder = async () => {
  if (!state.selectedProduct) return;
  setBusy(true);
  try {
    const qty = Number(el.qtyInput.value || 1);
    await api("/api/orders/orders", {
      method: "POST",
      headers: { "idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({
        customerId: el.customerSelect.value,
        lines: [{ productId: state.selectedProduct.id, qty }]
      })
    });
    await Promise.all([loadOrders(), loadStock(), loadSettlement()]);
    toast("주문을 생성했습니다.");
  } catch (err) {
    toast(err.message);
  } finally {
    setBusy(false);
  }
};

const updateOrder = async (orderId, action) => {
  setBusy(true);
  try {
    const body = action === "ship" ? { carrier: "Atlas", trackingNo: `TRK-${Date.now()}` } : {};
    await api(`/api/orders/orders/${orderId}/${action}`, {
      method: "POST",
      headers: { "idempotency-key": crypto.randomUUID() },
      body: JSON.stringify(body)
    });
    await loadOrders();
    toast(action === "ship" ? "출고 처리했습니다." : "주문을 취소했습니다.");
  } catch (err) {
    toast(err.message);
  } finally {
    setBusy(false);
  }
};

const renderOrders = () => {
  el.orderCount.textContent = `${state.orders.length} orders`;
  el.orderRows.innerHTML = "";
  if (state.orders.length === 0) {
    el.orderRows.innerHTML = `<tr><td colspan="4" class="empty">주문 없음</td></tr>`;
    return;
  }
  for (const order of state.orders) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td title="${escapeHtml(order.id)}">${escapeHtml(order.id.slice(0, 8))}</td>
      <td><span class="status ${escapeHtml(order.status)}">${escapeHtml(order.status)}</span></td>
      <td class="num">${formatMoney(order.totalCents, order.currency)}</td>
      <td>
        <div class="row-actions">
          <button type="button" title="취소" aria-label="취소">×</button>
          <button type="button" title="출고" aria-label="출고">✓</button>
        </div>
      </td>
    `;
    const [cancelButton, shipButton] = row.querySelectorAll("button");
    cancelButton.disabled = !["pending", "confirmed"].includes(order.status);
    shipButton.disabled = order.status !== "confirmed";
    cancelButton.addEventListener("click", () => updateOrder(order.id, "cancel"));
    shipButton.addEventListener("click", () => updateOrder(order.id, "ship"));
    el.orderRows.append(row);
  }
};

const renderSettlement = (rows) => {
  el.settlementRows.innerHTML = "";
  if (rows.length === 0) {
    el.settlementRows.innerHTML = `<div class="empty">정산 항목 없음</div>`;
    return;
  }
  for (const row of rows) {
    const item = document.createElement("div");
    item.className = "settlement-row";
    item.innerHTML = `
      <strong>${escapeHtml(row.account || row.entryType || "account")}</strong>
      <span>${formatMoney(row.amountCents || row.totalCents || 0, row.currency || "USD")}</span>
      <span>${escapeHtml(row.currency || "")}</span>
    `;
    el.settlementRows.append(item);
  }
};

el.apiKeyInput.value = state.apiKey;
el.reportDate.value = today();
renderCustomers();
renderPrice();
renderStock();

el.apiKeyInput.addEventListener("change", () => {
  state.apiKey = el.apiKeyInput.value.trim() || "demo-key-1";
  localStorage.setItem("atlas-api-key", state.apiKey);
  refreshAll();
});
el.refreshButton.addEventListener("click", refreshAll);
el.categoryFilter.addEventListener("change", renderProducts);
el.searchInput.addEventListener("input", renderProducts);
el.quoteButton.addEventListener("click", async () => {
  try {
    await quotePrice();
    toast("가격을 확인했습니다.");
  } catch (err) {
    toast(err.message);
  }
});
el.tierSelect.addEventListener("change", quotePrice);
el.currencySelect.addEventListener("change", quotePrice);
el.qtyInput.addEventListener("change", quotePrice);
el.createOrderButton.addEventListener("click", createOrder);
el.reportButton.addEventListener("click", async () => {
  try {
    await loadSettlement();
    toast("정산 리포트를 조회했습니다.");
  } catch (err) {
    toast(err.message);
  }
});

refreshAll();
