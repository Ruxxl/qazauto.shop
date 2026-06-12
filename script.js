// ====================== DATA ======================
let db = {
  settings: {
    tgBotToken: '',
    tgChatId: '',
    adminPassword: 'admin123',
    storeName: 'QazAuto.Shop'
  },
  categories: ['Все','Ароматизаторы','Держатели','Чехлы на руль','Химия','Аксессуары','Новинки'],
  products: [
    {id:1,name:'Силиконовый чехол на руль',desc:'Универсальный, подходит на большинство авто',price:1500,category:'Чехлы на руль',emoji:'🎯',image:'',badge:'Хит'},
    {id:2,name:'Ароматизатор Mitsui',desc:'Удалитель запахов, нейтрализует любые запахи',price:2500,category:'Ароматизаторы',emoji:'🌸',image:'',badge:''},
    {id:3,name:'Восстановитель пластика RD',desc:'Возвращает первоначальный вид пластиковым деталям',price:3200,category:'Химия',emoji:'✨',image:'',badge:'Новинка'},
    {id:4,name:'Чернитель резины',desc:'Профессиональный уход за шинами',price:1800,category:'Химия',emoji:'🖤',image:'',badge:''},
    {id:5,name:'Leather Cleaner ShineSystem',desc:'Профессиональная химчистка руля и кожи',price:4500,category:'Химия',emoji:'🧴',image:'',badge:'Топ'},
    {id:6,name:'Держатель для телефона',desc:'Магнитный, на воздуховод',price:2200,category:'Держатели',emoji:'📱',image:'',badge:''},
    {id:7,name:'Ароматизатор древесный',desc:'Натуральный аромат, длительный эффект',price:1200,category:'Ароматизаторы',emoji:'🌲',image:'',badge:''},
    {id:8,name:'Очиститель стёкол ASMR',desc:'Без разводов, профессиональная формула',price:2800,category:'Химия',emoji:'💎',image:'',badge:'Новинка'},
  ],
  orders: [],
  nextOrderId: 1001
};

let cart = [];
let adminLoggedIn = false;
let currentAdminTab = 'dashboard';
let editingProductId = null;

// ---- PERSIST ----
function save(){localStorage.setItem('qazauto_db',JSON.stringify(db));}
function loadDB(){
  const s=localStorage.getItem('qazauto_db');
  if(s){try{const d=JSON.parse(s);Object.assign(db,d);}catch(e){}}
}
loadDB();

// ====================== SHOP ======================
function goShop(){
  if (window.location.pathname.includes('admin.html')) {
    window.location.href = 'index.html';
  } else {
    showPage('shop-page');
    renderCategories();
    renderProducts();
  }
}

function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');}

function renderCategories(){
  const g=document.getElementById('cats-grid');
  if (!g) return;
  const section = g.closest('.section');

  if (db.products.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }

  if (section) section.style.display = 'block';
  const cats=['Все',...new Set(db.products.map(p=>p.category).filter(Boolean))];
  g.innerHTML=cats.map(c=>`<div class="cat-chip ${c==='Все'?'active':''}" onclick="selectCat(this,'${c}')">${c}</div>`).join('');
}

let activeCat='Все';
function selectCat(el,cat){
  document.querySelectorAll('.cat-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  activeCat=cat;
  renderProducts();
}

function filterProducts(){renderProducts();}

function renderProducts(){
  const q=document.getElementById('search-input')?.value?.toLowerCase()||'';
  const g=document.getElementById('products-grid');
  const empty=document.getElementById('no-products');
  const title=document.getElementById('products-title');
  if(!g) return;

  if (db.products.length === 0) {
    g.innerHTML = '';
    if (empty) empty.style.display = 'block';
    if (title) title.style.display = 'none';
    return;
  }

  let prods=db.products;
  if(activeCat!=='Все') prods=prods.filter(p=>p.category===activeCat);
  if(q) prods=prods.filter(p=>p.name.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q));

  if(!prods.length){g.innerHTML='';empty.style.display='block';if(title) title.style.display = 'block';return;}
  empty.style.display='none';
  if(title) title.style.display = 'block';
  g.innerHTML=prods.map(p=>`
    <div class="product-card" onclick="addToCart(${p.id},event)">
      <div class="product-img">
        ${p.image?`<img src="${p.image}" alt="${p.name}">`:`<span>${p.emoji||'📦'}</span>`}
        ${p.badge?`<div class="product-badge">${p.badge}</div>`:''}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-bottom">
          <div class="product-price">${fmtPrice(p.price)}</div>
          <button class="btn-add" onclick="addToCart(${p.id},event)">+</button>
        </div>
      </div>
    </div>`).join('');
}

function fmtPrice(n){return n.toLocaleString('ru-RU')+' ₸';}

// ====================== CART ======================
function addToCart(id,e){
  if(e){e.stopPropagation();}
  const prod=db.products.find(p=>p.id===id);
  if(!prod) return;
  const ex=cart.find(i=>i.id===id);
  if(ex) ex.qty++;
  else cart.push({id,name:prod.name,price:prod.price,emoji:prod.emoji||'📦',image:prod.image,qty:1});
  updateCartCount();
  showToast('Добавлено в корзину: '+prod.name,'success');
}

function updateCartCount(){
  const n=cart.reduce((s,i)=>s+i.qty,0);
  document.getElementById('cart-count').textContent=n;
}

function openCart(){
  renderCartItems();
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-sidebar').classList.add('open');
}

function closeCart(){
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-sidebar').classList.remove('open');
}

function renderCartItems(){
  const list=document.getElementById('cart-items-list');
  const foot=document.getElementById('cart-foot');
  if(!cart.length){
    list.innerHTML='<div class="cart-empty"><div class="big-icon">🛒</div><p>Корзина пуста</p></div>';
    foot.style.display='none';
    return;
  }
  list.innerHTML=cart.map(i=>`
    <div class="cart-item">
      <div class="cart-item-img">${i.image?`<img src="${i.image}">`:`<span>${i.emoji}</span>`}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-price">${fmtPrice(i.price)} × ${i.qty}</div>
        <div class="cart-item-ctrl">
          <button class="qty-btn" onclick="changeQty(${i.id},-1)">−</button>
          <span class="qty-val">${i.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i.id},1)">+</button>
          <button class="cart-item-del" onclick="removeFromCart(${i.id})">🗑️</button>
        </div>
      </div>
    </div>`).join('');
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  document.getElementById('cart-total').textContent=fmtPrice(total);
  foot.style.display='block';
}

function changeQty(id,d){
  const i=cart.find(x=>x.id===id);
  if(!i) return;
  i.qty+=d;
  if(i.qty<=0) cart=cart.filter(x=>x.id!==id);
  updateCartCount();
  renderCartItems();
}

function removeFromCart(id){
  cart=cart.filter(x=>x.id!==id);
  updateCartCount();
  renderCartItems();
}

// ====================== CHECKOUT ======================
function goCheckout(){
  if(!cart.length){showToast('Корзина пуста','error');return;}
  closeCart();
  renderCheckoutSummary();
  showPage('checkout-page');
}

function renderCheckoutSummary(){
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const el=document.getElementById('checkout-summary');
  el.innerHTML=`<h3>Ваш заказ</h3>${cart.map(i=>`<div class="summary-item"><span>${i.name} × ${i.qty}</span><span>${fmtPrice(i.price*i.qty)}</span></div>`).join('')}<div class="summary-item"><span>Итого</span><span>${fmtPrice(total)}</span></div>`;
}

document.getElementById('co-delivery')?.addEventListener('change',function(){
  document.getElementById('address-group').style.display=this.value==='delivery'?'block':'none';
  renderCheckoutSummary();
});

function submitOrder(){
  const name=document.getElementById('co-name').value.trim();
  const phone=document.getElementById('co-phone').value.trim();
  const delivery=document.getElementById('co-delivery').value;
  const address=document.getElementById('co-address').value.trim();
  const comment=document.getElementById('co-comment').value.trim();
  if(!name){showToast('Введите имя','error');return;}
  if(!phone){showToast('Введите телефон','error');return;}
  if(delivery==='delivery'&&!address){showToast('Введите адрес доставки','error');return;}
  const deliveryLabels={pickup1:'Самовывоз — ТЦ Рахмет',pickup2:'Самовывоз — Uly Tau',delivery:'Доставка по Астане'};
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0)+(delivery==='delivery'?500:0);
  const order={
    id:db.nextOrderId++,
    date:new Date().toLocaleString('ru-RU'),
    name,phone,delivery:deliveryLabels[delivery],address,comment,
    items:[...cart],total,status:'new'
  };
  db.orders.unshift(order);
  save();
  sendToTelegram(order);
  document.getElementById('success-order-num').textContent='#'+order.id;
  cart=[];
  updateCartCount();
  showPage('success-page');
}

async function sendToTelegram(order){
  const {tgBotToken,tgChatId}=db.settings;
  if(!tgBotToken||!tgChatId) return;
  const items=order.items.map(i=>`  • ${i.name} × ${i.qty} = ${fmtPrice(i.price*i.qty)}`).join('\n');
  const text=`🛒 *Новый заказ #${order.id}*\n\n👤 *Клиент:* ${order.name}\n📞 *Телефон:* ${order.phone}\n📦 *Доставка:* ${order.delivery}\n${order.address?'📍 *Адрес:* '+order.address+'\n':''}\n🛍 *Товары:*\n${items}\n\n💰 *Итого: ${fmtPrice(order.total)}*\n${order.comment?'\n💬 '+order.comment:''}`;
  try{
    await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({chat_id:tgChatId,text,parse_mode:'Markdown'})
    });
  }catch(e){console.log('TG error',e);}
}

// ====================== ADMIN ======================
function showAdmin(){
  if (!window.location.pathname.includes('admin.html')) {
    window.location.href = 'admin.html';
  } else {
    showPage('admin-login-page');
  }
}

function doLogin(){
  const u=document.getElementById('login-user').value;
  const p=document.getElementById('login-pass').value;
  if(u==='admin'&&p===db.settings.adminPassword){
    adminLoggedIn=true;
    showPage('admin-page');
    adminTab('dashboard');
  } else showToast('Неверный логин или пароль','error');
}
function logout(){adminLoggedIn=false;goShop();}

function adminTab(tab){
  currentAdminTab=tab;
  document.querySelectorAll('.admin-nav a').forEach(a=>{a.classList.remove('active');});
  const el=document.getElementById('nav-'+tab);
  if(el) el.classList.add('active');
  const m=document.getElementById('admin-main');
  if(tab==='dashboard') m.innerHTML=renderDashboard();
  else if(tab==='orders') m.innerHTML=renderOrdersAdmin();
  else if(tab==='products') m.innerHTML=renderProductsAdmin();
  else if(tab==='categories') m.innerHTML=renderCategoriesAdmin();
  else if(tab==='settings') m.innerHTML=renderSettings();
}

function renderDashboard(){
  const total=db.orders.length;
  const revenue=db.orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);
  const newOrders=db.orders.filter(o=>o.status==='new').length;
  const prods=db.products.length;
  return `
  <div class="admin-topbar"><h1>📊 Дашборд</h1></div>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Всего заказов</div><div class="stat-value">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Новых заказов</div><div class="stat-value yellow">${newOrders}</div></div>
    <div class="stat-card"><div class="stat-label">Выручка</div><div class="stat-value green">${fmtPrice(revenue)}</div></div>
    <div class="stat-card"><div class="stat-label">Товаров</div><div class="stat-value">${prods}</div></div>
  </div>
  <div class="admin-table-wrap">
    <table>
      <thead><tr><th>№</th><th>Клиент</th><th>Сумма</th><th>Статус</th><th>Дата</th><th>Действия</th></tr></thead>
      <tbody>${db.orders.slice(0,10).map(o=>`
        <tr>
          <td>#${o.id}</td>
          <td>${o.name}<br><small style="color:var(--gray)">${o.phone}</small></td>
          <td><strong>${fmtPrice(o.total)}</strong></td>
          <td><span class="status-badge status-${o.status}">${statusLabel(o.status)}</span></td>
          <td style="font-size:12px;color:var(--gray)">${o.date}</td>
          <td><div class="td-actions">
            <button class="btn-secondary" onclick="viewOrder(${o.id})">👁</button>
            <select onchange="changeStatus(${o.id},this.value)" style="font-size:12px;padding:4px;border:1px solid var(--border);border-radius:4px;">
              <option value="">Статус</option>
              <option value="new">Новый</option>
              <option value="processing">В обработке</option>
              <option value="done">Выполнен</option>
              <option value="cancelled">Отменён</option>
            </select>
          </div></td>
        </tr>`).join('')||'<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--gray)">Заказов пока нет</td></tr>'}
      </tbody>
    </table>
  </div>`;
}

function statusLabel(s){return{new:'🆕 Новый',processing:'⚙️ В обработке',done:'✅ Выполнен',cancelled:'❌ Отменён'}[s]||s;}

function renderOrdersAdmin(){
  return `
  <div class="admin-topbar"><h1>📋 Заказы</h1></div>
  <div class="admin-table-wrap">
    <table>
      <thead><tr><th>№</th><th>Клиент</th><th>Телефон</th><th>Сумма</th><th>Доставка</th><th>Статус</th><th>Дата</th><th></th></tr></thead>
      <tbody>${db.orders.map(o=>`
        <tr>
          <td>#${o.id}</td>
          <td>${o.name}</td>
          <td>${o.phone}</td>
          <td><strong>${fmtPrice(o.total)}</strong></td>
          <td style="font-size:12px">${o.delivery}</td>
          <td><span class="status-badge status-${o.status}">${statusLabel(o.status)}</span></td>
          <td style="font-size:12px;color:var(--gray)">${o.date}</td>
          <td><div class="td-actions">
            <button class="btn-secondary" onclick="viewOrder(${o.id})">👁 Детали</button>
            <select onchange="changeStatus(${o.id},this.value)" style="font-size:12px;padding:4px;border:1px solid var(--border);border-radius:4px;">
              <option value="">Статус</option>
              <option value="new">Новый</option>
              <option value="processing">В обработке</option>
              <option value="done">Выполнен</option>
              <option value="cancelled">Отменён</option>
            </select>
            <button class="btn-danger" onclick="deleteOrder(${o.id})">🗑</button>
          </div></td>
        </tr>`).join('')||'<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--gray)">Заказов пока нет</td></tr>'}
      </tbody>
    </table>
  </div>`;
}

function changeStatus(id,status){
  if(!status) return;
  const o=db.orders.find(x=>x.id===id);
  if(o){o.status=status;save();adminTab(currentAdminTab);showToast('Статус обновлён','success');}
}

function deleteOrder(id){
  if(!confirm('Удалить заказ?')) return;
  db.orders=db.orders.filter(o=>o.id!==id);save();adminTab(currentAdminTab);
}

function viewOrder(id){
  const o=db.orders.find(x=>x.id===id);
  if(!o) return;
  document.getElementById('order-modal-content').innerHTML=`
    <div class="order-detail-item"><span><b>Заказ №</b></span><span>#${o.id}</span></div>
    <div class="order-detail-item"><span><b>Клиент</b></span><span>${o.name}</span></div>
    <div class="order-detail-item"><span><b>Телефон</b></span><span>${o.phone}</span></div>
    <div class="order-detail-item"><span><b>Доставка</b></span><span>${o.delivery}</span></div>
    ${o.address?`<div class="order-detail-item"><span><b>Адрес</b></span><span>${o.address}</span></div>`:''}
    ${o.comment?`<div class="order-detail-item"><span><b>Комментарий</b></span><span>${o.comment}</span></div>`:''}
    <div style="margin:12px 0;font-weight:700">Товары:</div>
    ${o.items.map(i=>`<div class="order-detail-item"><span>${i.name} × ${i.qty}</span><span>${fmtPrice(i.price*i.qty)}</span></div>`).join('')}
    <div class="order-detail-item" style="font-weight:700;font-size:16px"><span>ИТОГО</span><span>${fmtPrice(o.total)}</span></div>
    <div class="order-detail-item"><span><b>Дата</b></span><span>${o.date}</span></div>
    <div class="order-detail-item"><span><b>Статус</b></span><span><span class="status-badge status-${o.status}">${statusLabel(o.status)}</span></span></div>`;
  openModal('order-modal');
}

function renderProductsAdmin(){
  return `
  <div class="admin-topbar">
    <h1>📦 Товары</h1>
    <button class="btn-primary" onclick="openProductModal()">+ Добавить товар</button>
  </div>
  <div class="admin-table-wrap">
    <table>
      <thead><tr><th>Товар</th><th>Категория</th><th>Цена</th><th>Метка</th><th>Действия</th></tr></thead>
      <tbody>${db.products.map(p=>`
        <tr>
          <td><div class="prod-name-cell">
            <div class="prod-thumb">${p.image?`<img src="${p.image}">`:`<span>${p.emoji||'📦'}</span>`}</div>
            <div><div style="font-weight:600">${p.name}</div><div style="font-size:12px;color:var(--gray)">${p.desc}</div></div>
          </div></td>
          <td>${p.category||'—'}</td>
          <td><strong>${fmtPrice(p.price)}</strong></td>
          <td>${p.badge?`<span class="status-badge status-new">${p.badge}</span>`:'—'}</td>
          <td><div class="td-actions">
            <button class="btn-secondary" onclick="openProductModal(${p.id})">✏️ Изменить</button>
            <button class="btn-danger" onclick="deleteProduct(${p.id})">🗑</button>
          </div></td>
        </tr>`).join('')||'<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--gray)">Товаров нет</td></tr>'}
      </tbody>
    </table>
  </div>`;
}

function openProductModal(id){
  editingProductId=id||null;
  const p=id?db.products.find(x=>x.id===id):{id:null,name:'',desc:'',price:'',category:'',emoji:'',image:'',badge:''};
  document.getElementById('modal-title').textContent=id?'Редактировать товар':'Новый товар';
  const cats=db.categories.filter(c=>c!=='Все');
  document.getElementById('modal-content').innerHTML=`
    <div class="form-group">
      <label>Фото товара</label>
      <div class="img-upload-area">
        <img class="img-preview" src="${p.image||''}" id="img-preview-show" style="${p.image?'':'display:none'}">
        <div id="img-upload-placeholder" style="${p.image?'display:none':''}">
          <div style="font-size:24px;margin-bottom:8px">📸</div>
          <div style="font-size:13px;color:var(--gray)">Нажмите, чтобы загрузить фото</div>
        </div>
        <input type="file" id="prod-file" accept="image/*" onchange="handleFileUpload(this)">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Название *</label><input type="text" id="prod-name" value="${p.name}" placeholder="Название товара"></div>
      <div class="form-group"><label>Цена (₸) *</label><input type="number" id="prod-price" value="${p.price}" placeholder="1500"></div>
    </div>
    <div class="form-group"><label>Описание</label><textarea id="prod-desc" style="min-height:60px">${p.desc}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Категория</label><select id="prod-cat">${cats.map(c=>`<option ${c===p.category?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label>Эмодзи (если нет фото)</label><input type="text" id="prod-emoji" value="${p.emoji||''}" placeholder="🚗"></div>
    </div>
    <div class="form-group"><label>Метка (Хит / Новинка / Топ)</label><input type="text" id="prod-badge" value="${p.badge||''}" placeholder="Хит"></div>`;
  document.getElementById('modal-save-btn').onclick=saveProduct;
  openModal('product-modal');
}

function handleFileUpload(input){
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const img = document.getElementById('img-preview-show');
    const ph = document.getElementById('img-upload-placeholder');
    img.src = e.target.result;
    img.style.display = 'block';
    if(ph) ph.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function saveProduct(){
  const name=document.getElementById('prod-name').value.trim();
  const price=parseInt(document.getElementById('prod-price').value);
  if(!name){showToast('Введите название','error');return;}
  if(!price||price<=0){showToast('Введите цену','error');return;}
  const data={
    name,price,
    desc:document.getElementById('prod-desc').value.trim(),
    category:document.getElementById('prod-cat').value,
    emoji:document.getElementById('prod-emoji').value.trim(),
    image:document.getElementById('img-preview-show').style.display !== 'none' ? document.getElementById('img-preview-show').src : '',
    badge:document.getElementById('prod-badge').value.trim()
  };
  if(editingProductId){
    const i=db.products.findIndex(p=>p.id===editingProductId);
    if(i>=0) db.products[i]={...db.products[i],...data};
  } else {
    data.id=Date.now();
    db.products.push(data);
  }
  save();
  closeModal('product-modal');
  adminTab('products');
  showToast(editingProductId?'Товар обновлён':'Товар добавлен','success');
}

function deleteProduct(id){
  if(!confirm('Удалить товар?')) return;
  db.products=db.products.filter(p=>p.id!==id);
  save();adminTab('products');
}

function renderCategoriesAdmin(){
  return `
  <div class="admin-topbar"><h1>🏷️ Категории</h1></div>
  <div style="display:flex;gap:12px;margin-bottom:20px">
    <input type="text" id="new-cat-input" placeholder="Название категории" style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:14px">
    <button class="btn-primary" onclick="addCategory()">+ Добавить</button>
  </div>
  <div class="admin-table-wrap">
    <table>
      <thead><tr><th>Категория</th><th>Товаров</th><th></th></tr></thead>
      <tbody>${db.categories.filter(c=>c!=='Все').map(c=>`
        <tr>
          <td><strong>${c}</strong></td>
          <td>${db.products.filter(p=>p.category===c).length}</td>
          <td><button class="btn-danger" onclick="deleteCategory('${c}')">🗑 Удалить</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function addCategory(){
  const v=document.getElementById('new-cat-input').value.trim();
  if(!v){showToast('Введите название','error');return;}
  if(db.categories.includes(v)){showToast('Уже есть','error');return;}
  db.categories.push(v);save();adminTab('categories');
}

function deleteCategory(c){
  if(!confirm(`Удалить категорию "${c}"?`)) return;
  db.categories=db.categories.filter(x=>x!==c);
  db.products.forEach(p=>{if(p.category===c) p.category='';});
  save();adminTab('categories');
}

function renderSettings(){
  return `
  <div class="admin-topbar"><h1>⚙️ Настройки</h1></div>
  <div class="settings-card">
    <h3>📱 Telegram уведомления</h3>
    <div class="form-group">
      <label>Bot Token</label>
      <input type="text" id="tg-token" value="${db.settings.tgBotToken}" placeholder="1234567890:ABCdef...">
      <div class="settings-note">Получите токен у @BotFather в Telegram</div>
    </div>
    <div class="form-group">
      <label>Chat ID</label>
      <input type="text" id="tg-chat" value="${db.settings.tgChatId}" placeholder="-100123456789 или @username">
      <div class="settings-note">ID вашего чата/канала куда приходят заказы. Узнать: @userinfobot</div>
    </div>
    <button class="btn-primary" onclick="saveTgSettings()">💾 Сохранить Telegram</button>
  </div>`;
}

function saveTgSettings(){
  db.settings.tgBotToken=document.getElementById('tg-token').value.trim();
  db.settings.tgChatId=document.getElementById('tg-chat').value.trim();
  save();showToast('Telegram настройки сохранены','success');
}

// ====================== MODALS ======================
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}

// ====================== TOAST ======================
function showToast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.className='toast '+(type||'');
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

// ====================== INIT ======================
if (window.location.pathname.includes('admin.html')) {
  // Если мы на странице админки, показываем логин
  showPage('admin-login-page');
} else {
  // Если на главной, запускаем магазин
  goShop();
}

// Слушатель изменений в localStorage для синхронизации вкладок
window.addEventListener('storage', (e) => {
  if (e.key === 'qazauto_db') {
    try {
      const newData = JSON.parse(e.newValue);
      if (newData) {
        Object.assign(db, newData);
        if (!window.location.pathname.includes('admin.html')) {
          renderCategories();
          renderProducts();
        }
      }
    } catch (err) { console.error('Sync error:', err); }
  }
});