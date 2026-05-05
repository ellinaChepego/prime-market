let products = {};
let salesProductIds = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function isOnSale(productId) {
    return salesProductIds.includes(parseInt(productId));
}

function showNotification(message, type = 'info') {
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = '';
    switch(type) {
        case 'cart': icon = '🛒 '; break;
        case 'favorite': icon = '❤️ '; break;
        case 'error': icon = '❌ '; break;
        default: icon = 'ℹ️ ';
    }
    
    notification.innerHTML = `${icon} ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

function updateCartCount() {
    document.querySelectorAll('#cart-count').forEach(el => {
        if (el) el.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    });
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    if (window.location.pathname.includes('cart.html')) renderCart();
}

function addToCart(productId) {
    const product = products[productId];
    if (!product) return;
    
    const existingItem = cart.find(item => item.id == productId);
    
    if (existingItem) {
        existingItem.quantity++;
        showNotification(`${product.name} +1 (${existingItem.quantity} шт.)`, 'cart');
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
        showNotification(`${product.name} добавлен в корзину!`, 'cart');
    }
    saveCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    saveCart();
    showNotification('Товар удален из корзины', 'info');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id == productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
        }
    }
}

function renderCart() {
    const cartList = document.getElementById('cart-list');
    const totalPriceElem = document.getElementById('total-price');
    if (!cartList) return;
    
    if (cart.length === 0) {
        cartList.innerHTML = '<div style="text-align: center; padding: 40px;">🛒 Корзина пуста</div>';
        if (totalPriceElem) totalPriceElem.textContent = '0 бел руб';
        return;
    }
    
    cartList.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        cartList.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.src='img/logo.svg'">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <span>${item.price} бел руб</span>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span class="quantity-num">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                </div>
                <div class="item-price">${itemTotal} бел руб</div>
                <button class="btn-delete" data-id="${item.id}">🗑️</button>
            </div>
        `;
    });
    
    if (totalPriceElem) totalPriceElem.textContent = `${total} бел руб`;
    
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.onclick = () => updateQuantity(btn.dataset.id, -1);
    });
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.onclick = () => updateQuantity(btn.dataset.id, 1);
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = () => removeFromCart(btn.dataset.id);
    });
}

function updateFavButtons() {
    document.querySelectorAll('.add-to-fav, .btn-fav-large').forEach(btn => {
        const id = btn.dataset.id;
        if (id && favorites.includes(parseInt(id))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavButtons();
}

function toggleFavorite(productId) {
    const id = parseInt(productId);
    const product = products[id];
    if (!product) return;
    
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
        showNotification(`${product.name} удален из избранного ❌`, 'favorite');
    } else {
        favorites.push(id);
        showNotification(`${product.name} добавлен в избранное ❤️`, 'favorite');
    }
    
    saveFavorites();
    updateFavButtons();
    if (window.location.pathname.includes('favorites.html')) renderFavorites();
}

function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    if (!favoritesList) return;
    
    const favoriteProducts = favorites.map(id => products[id]).filter(p => p);
    
    if (favoriteProducts.length === 0) {
        favoritesList.innerHTML = '<div style="text-align: center; padding: 60px 20px; font-size: 20px; color: #888;">❤️ Нет избранных товаров</div>';
        return;
    }
    
    favoritesList.innerHTML = '';
    favoriteProducts.forEach(product => {
        favoritesList.appendChild(createProductCard(product));
    });
}

function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-id', product.id);
    
    const isFavorite = favorites.includes(product.id);
    const hasSale = isOnSale(product.id);
    const discount = hasSale && product.oldPrice && product.oldPrice > 0 ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
    
    let priceHtml = '';
    if (hasSale && product.oldPrice && product.oldPrice > 0) {
        priceHtml = `<span class="new-price">${product.price} бел руб</span>
                     <span class="old-price">${product.oldPrice} бел руб</span>`;
    } else {
        priceHtml = `${product.price} бел руб`;
    }
    
    card.innerHTML = `
        <button class="add-to-fav ${isFavorite ? 'active' : ''}" data-id="${product.id}">❤</button>
        ${hasSale && product.oldPrice && product.oldPrice > 0 ? `<div class="sale-badge">-${discount}%</div>` : ''}
        <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.src='img/logo.svg'">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <div class="price">${priceHtml}</div>
        <button class="btn-main add-to-cart" data-id="${product.id}">В корзину</button>
    `;
    
    card.querySelector('.add-to-fav').onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(product.id);
    };
    
    card.querySelector('.add-to-cart').onclick = (e) => {
        e.stopPropagation();
        addToCart(product.id);
    };
    
    card.onclick = (e) => {
        if (e.target.classList.contains('add-to-fav') || 
            e.target.classList.contains('add-to-cart') ||
            e.target.closest('.add-to-fav') ||
            e.target.closest('.add-to-cart')) return;
        
        if (product.id == 4) {
            window.location.href = `bread.html?id=${product.id}`;
        } else {
            showNotification(`Страница товара "${product.name}" в разработке 🚧`, 'info');
        }
    };
    
    return card;
}

function loadProductsOnMain() {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    
    productGrid.innerHTML = '';
    const mainProductIds = [1, 2, 3, 4];
    mainProductIds.forEach(id => {
        if (products[id]) {
            productGrid.appendChild(createProductCard(products[id]));
        }
    });
}

function searchProducts() {
    const query = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    let foundCount = 0;
    
    document.querySelectorAll('.product-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const brand = card.querySelector('p')?.textContent.toLowerCase() || '';
        
        if (title.includes(query) || brand.includes(query) || query === '') {
            card.style.display = '';
            foundCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (query && foundCount === 0) showNotification('Ничего не найдено', 'info');
}

function renderSales() {
    const salesList = document.getElementById('sales-list');
    if (!salesList) return;
    
    const salesIds = [5, 6, 7, 8];
    const saleProducts = salesIds.map(id => products[id]).filter(p => p);
    
    salesList.innerHTML = '';
    saleProducts.forEach(product => salesList.appendChild(createProductCard(product)));
}

function loadProfileData() {
    const profile = JSON.parse(localStorage.getItem('userProfile')) || {};
    if (document.getElementById('profile-name')) {
        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-surname').value = profile.surname || '';
        document.getElementById('profile-email').value = profile.email || '';
        document.getElementById('profile-address').value = profile.address || '';
    }
}

function saveProfileData() {
    const profile = {
        name: document.getElementById('profile-name')?.value || '',
        surname: document.getElementById('profile-surname')?.value || '',
        email: document.getElementById('profile-email')?.value || '',
        address: document.getElementById('profile-address')?.value || ''
    };
    localStorage.setItem('userProfile', JSON.stringify(profile));
    showNotification('Данные сохранены!', 'info');
}

function deleteProfileData() {
    if (confirm('Вы уверены, что хотите удалить все данные?')) {
        localStorage.removeItem('userProfile');
        if (document.getElementById('profile-name')) {
            document.getElementById('profile-name').value = '';
            document.getElementById('profile-surname').value = '';
            document.getElementById('profile-email').value = '';
            document.getElementById('profile-address').value = '';
        }
        showNotification('Данные удалены', 'info');
    }
}

function logout() {
    if (confirm('Выйти из аккаунта?')) {
        localStorage.removeItem('userProfile');
        showNotification('Вы вышли из аккаунта', 'info');
        setTimeout(() => window.location.href = 'index.html', 1000);
    }
}

function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id')) || 4;
    
    if (productId !== 4) {
        showNotification('Страница доступна только для хлеба! 🍞', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }
    
    const product = products[4];
    if (!product) return;
    
    const hasSale = isOnSale(4);
    
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-brand').textContent = product.brand;
    document.getElementById('product-price').textContent = product.price;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('product-image').src = product.image;
    
    const oldPriceElem = document.getElementById('product-old-price');
    if (oldPriceElem) {
        if (hasSale && product.oldPrice && product.oldPrice > 0) {
            oldPriceElem.textContent = `${product.oldPrice} бел руб`;
            oldPriceElem.style.display = 'inline';
        } else {
            oldPriceElem.style.display = 'none';
        }
    }
    
    const specsElem = document.getElementById('product-specs');
    if (specsElem && product.specs) {
        specsElem.innerHTML = `<h3>Характеристики</h3><div class="spec-item"><span class="spec-value">${product.specs}</span></div>`;
    }
    
    document.getElementById('add-to-cart-detail').onclick = () => addToCart(4);
    
    const favBtn = document.getElementById('add-to-fav-detail');
    if (favBtn) {
        favBtn.dataset.id = 4;
        if (favorites.includes(4)) favBtn.classList.add('active');
        favBtn.onclick = () => toggleFavorite(4);
    }
    
    renderSimilarProducts();
}

function renderSimilarProducts() {
    const similarGrid = document.getElementById('similar-products');
    if (!similarGrid) return;
    
    similarGrid.innerHTML = '';
    const similarIds = [9, 10, 11, 12];
    similarIds.forEach(id => {
        const product = products[id];
        if (product) {
            const card = document.createElement('div');
            card.className = 'similar-card';
            
            const hasSale = isOnSale(id);
            let priceHtml = '';
            if (hasSale && product.oldPrice && product.oldPrice > 0) {
                priceHtml = `<span class="new-price">${product.price} бел руб</span>
                             <span class="old-price">${product.oldPrice} бел руб</span>`;
            } else {
                priceHtml = `${product.price} бел руб`;
            }
            
            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.src='img/logo.svg'">
                <h3>${product.name}</h3>
                <div class="similar-brand">${product.brand}</div>
                <div class="similar-price">${priceHtml}</div>
                <button class="btn-small add-to-cart-similar" data-id="${product.id}">В корзину</button>
            `;
            
            card.querySelector('.add-to-cart-similar').onclick = (e) => {
                e.stopPropagation();
                addToCart(product.id);
            };
            
            card.onclick = (e) => {
                if (!e.target.classList.contains('btn-small')) {
                    showNotification(`Страница товара "${product.name}" в разработке 🚧`, 'info');
                }
            };
            
            similarGrid.appendChild(card);
        }
    });
}

function checkout() {
    if (cart.length === 0) {
        showNotification('Корзина пуста!', 'error');
        return;
    }
    
    const profile = JSON.parse(localStorage.getItem('userProfile'));
    if (!profile || !profile.address) {
        showNotification('Заполните адрес доставки в личном кабинете!', 'error');
        setTimeout(() => window.location.href = 'account.html', 1500);
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    showNotification(`Заказ оформлен! Сумма: ${total} бел руб. Доставка: ${profile.address}`, 'info');
    
    cart = [];
    saveCart();
    if (window.location.pathname.includes('cart.html')) renderCart();
}

function initBurgerMenu() {
    const burgerBtn = document.getElementById('burger');
    const navMenu = document.getElementById('navMenu');
    
    if (burgerBtn && navMenu) {
        burgerBtn.onclick = (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            burgerBtn.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
        };
        
        document.onclick = (e) => {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                !burgerBtn.contains(e.target)) {
                navMenu.classList.remove('active');
                burgerBtn.textContent = '☰';
            }
        };
    }
}

function loadProductsFromXML() {
    console.log('Загрузка данных из XML...');
    
    // Используем fetch для загрузки XML файла
    fetch('data.xml')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(xmlText => {
            // Парсим XML текст
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Проверка на ошибки парсинга
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Ошибка парсинга XML: ' + parserError.textContent);
            }
            
            // Получаем все элементы product
            const productNodes = xmlDoc.getElementsByTagName('product');
            
            products = {};
            salesProductIds = [];
            
            for (let i = 0; i < productNodes.length; i++) {
                const productNode = productNodes[i];
                
                // Получаем атрибуты
                const id = parseInt(productNode.getAttribute('id'));
                const onSale = productNode.getAttribute('on-sale') === 'true';
                
                // Получаем дочерние элементы
                const name = getElementText(productNode, 'name');
                const brand = getElementText(productNode, 'brand');
                const price = parseFloat(getElementText(productNode, 'price'));
                const oldPrice = parseFloat(getElementText(productNode, 'old-price'));
                const image = getElementText(productNode, 'image');
                const description = getElementText(productNode, 'description');
                const specs = getElementText(productNode, 'specs');
                
                // Сохраняем товар (oldPrice: 0 означает без скидки)
                products[id] = {
                    id: id,
                    name: name,
                    brand: brand,
                    price: price,
                    oldPrice: oldPrice > 0 ? oldPrice : null,
                    image: image,
                    description: description,
                    specs: specs
                };
                
                // Если товар со скидкой (oldPrice > 0) или атрибут on-sale="true"
                if (oldPrice > 0 || onSale) {
                    salesProductIds.push(id);
                }
            }
            
            console.log('✅ XML загружен. Товаров:', Object.keys(products).length);
            console.log('Товары со скидкой:', salesProductIds);
            
            // Запускаем приложение
            startApp();
        })
        .catch(error => {
            console.error('❌ Ошибка загрузки XML:', error);
            showNotification('Ошибка загрузки данных. Используем резервные данные.', 'error');
            
            // Резервные данные на случай ошибки (чтобы сайт работал)
            loadFallbackData();
            startApp();
        });
}

// Вспомогательная функция для безопасного получения текста элемента
function getElementText(parent, tagName) {
    const element = parent.getElementsByTagName(tagName)[0];
    return element ? element.textContent.trim() : '';
}

// Резервные данные (если XML не загрузился)
function loadFallbackData() {
    console.log('Загрузка резервных данных...');
    products = {
        1: { id: 1, name: 'Бананы', brand: 'GlobalFruit', price: 6, oldPrice: null, image: 'img/бананы.avif', description: 'Спелые и сладкие бананы из Эквадора.', specs: 'Вес: 1 кг, Страна: Эквадор' },
        2: { id: 2, name: 'Молоко', brand: 'Савушкин', price: 3, oldPrice: null, image: 'img/молоко.avif', description: 'Свежее молоко 3.2% жирности.', specs: 'Объем: 1 л, Жирность: 3.2%' },
        3: { id: 3, name: 'Красные яблоки', brand: 'Местный фермер', price: 5, oldPrice: null, image: 'img/яблоки.avif', description: 'Сочные красные яблоки.', specs: 'Вес: 1 кг, Сорт: Ред Делишес' },
        4: { id: 4, name: 'Хлеб Цельнозерновой', brand: 'Пекарь №1', price: 3, oldPrice: 4.5, image: 'img/хлеб.webp', description: 'Полезный цельнозерновой хлеб с семечками.', specs: 'Вес: 400 г' },
        5: { id: 5, name: 'Лосось слабосоленый', brand: 'SeaFood', price: 24, oldPrice: 35, image: 'img/лосось.jpg', description: 'Нежный слабосоленый лосось.', specs: 'Вес: 300 г' },
        6: { id: 6, name: 'Сыр Пармезан', brand: 'ItalianCheese', price: 18, oldPrice: 28, image: 'img/сыр.jpeg', description: 'Твердый сыр Пармезан.', specs: 'Вес: 200 г' },
        7: { id: 7, name: 'Мед цветочный', brand: 'Пасека', price: 12, oldPrice: 18, image: 'img/мед.webp', description: 'Натуральный цветочный мед.', specs: 'Объем: 500 г' },
        8: { id: 8, name: 'Авокадо', brand: 'GreenFruit', price: 5, oldPrice: 8, image: 'img/авокадо.jpg', description: 'Спелые авокадо из Перу.', specs: 'Вес: 1 шт' },
        9: { id: 9, name: 'Багет Французский', brand: 'Пекарь №1', price: 2.5, oldPrice: null, image: 'img/багет.webp', description: 'Хрустящий багет', specs: 'Вес: 300 г' },
        10: { id: 10, name: 'Бородинский хлеб', brand: 'Хлебзавод', price: 2.8, oldPrice: 3.5, image: 'img/бородинский.jpg', description: 'Ржаной хлеб', specs: 'Вес: 400 г' },
        11: { id: 11, name: 'Пшеничный хлеб', brand: 'Домашний', price: 2.2, oldPrice: null, image: 'img/пшеничный.png', description: 'Для тостов', specs: 'Вес: 350 г' },
        12: { id: 12, name: 'Ржаной хлеб', brand: 'Пекарь №1', price: 3.2, oldPrice: 4, image: 'img/ржаной.webp', description: 'Сладковатый вкус', specs: 'Вес: 400 г' }
    };
    
    // Заполняем массив товаров со скидкой
    salesProductIds = [];
    for (let id in products) {
        if (products[id].oldPrice && products[id].oldPrice > 0) {
            salesProductIds.push(parseInt(id));
        }
    }
}

function startApp() {
    updateCartCount();
    updateFavButtons();
    
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        loadProductsOnMain();
    }
    if (path.includes('cart.html')) {
        renderCart();
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) checkoutBtn.onclick = checkout;
    }
    if (path.includes('favorites.html')) {
        renderFavorites();
    }
    if (path.includes('sales.html')) {
        renderSales();
    }
    if (path.includes('account.html')) {
        loadProfileData();
        const saveBtn = document.getElementById('save-profile-btn');
        const deleteBtn = document.getElementById('delete-profile-btn');
        const logoutBtn = document.getElementById('logout-btn');
        if (saveBtn) saveBtn.onclick = saveProfileData;
        if (deleteBtn) deleteBtn.onclick = deleteProfileData;
        if (logoutBtn) logoutBtn.onclick = logout;
    }
    if (path.includes('bread.html')) {
        loadProductDetail();
    }
    
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn) searchBtn.onclick = searchProducts;
    if (searchInput) {
        searchInput.onkeyup = (e) => { 
            if (e.key === 'Enter') searchProducts(); 
        };
    }
    }

document.addEventListener('DOMContentLoaded', () => {
    initBurgerMenu();
    loadProductsFromXML();
});