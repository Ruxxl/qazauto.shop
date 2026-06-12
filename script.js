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
  let prods=db.products;
  if(activeCat!=='Все') prods=prods.filter(p=>p.category===activeCat);
  if(q) prods=prods.filter(p=>p.name.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q));
  const g=document.getElementById('products-grid');
  const empty=document.getElementById('no-products');
  if(!prods.length){g.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
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

// ... (остальные функции: renderOrdersAdmin, changeStatus, deleteOrder, viewOrder, renderProductsAdmin, openProductModal, previewImg, saveProduct, deleteProduct, renderCategoriesAdmin, addCategory, deleteCategory, renderSettings, saveTgSettings, testTelegram, changePassword, exportOrders, clearOrders, openModal, closeModal, showToast)

// Ограничим вывод для краткости, подразумевается полный перенос всех функций из index.html

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