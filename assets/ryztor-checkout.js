// ============================================================
// RYZTOR — Checkout con tarjeta (Whop)
//  - Drawer: botón "Pagar con tarjeta" -> /pages/ryztor-checkout
//  - /pages/ryztor-checkout: items + formulario envío (USA) + pago
// ============================================================
(function () {
  'use strict';

  var CONFIG = {
    checkoutEndpoint: 'https://yizap.com/api/ryztor/whop/checkout',
    freeShippingThreshold: 50, // subtotal >= 50 -> gratis
    flatShipping: 6.99,        // subtotal < 50  -> 6.99
    US_STATES: [
      'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
      'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
      'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
      'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
      'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
    ]
  };

  var CHECKOUT_PATH = '/pages/ryztor-checkout';
  var isCheckoutPage = window.location.pathname.indexOf(CHECKOUT_PATH) === 0;

  function money(v) { return '$' + Number(v).toFixed(2); }

  function getCart() {
    return fetch('/cart.js', { headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json(); });
  }

  function buildItems(cart) {
    return (cart.items || []).map(function (it) { return { variantId: it.variant_id, qty: it.quantity }; });
  }

  function getSubtotal(cart) {
    var v = typeof cart.items_subtotal_price === 'number' ? cart.items_subtotal_price : cart.total_price;
    return Number(v || 0) / 100;
  }

  function calcShipping(subtotal) {
    return subtotal >= CONFIG.freeShippingThreshold ? 0 : CONFIG.flatShipping;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------- RENDER: página de checkout ----------
  function renderCheckoutPage() {
    var root = document.getElementById('ryztor-checkout-root');
    // Si el template no trajo el contenedor, lo creamos (funciona con cualquier template de página)
    if (!root) {
      root = document.createElement('div');
      root.id = 'ryztor-checkout-root';
      root.style.cssText = 'max-width:720px;margin:0 auto;padding:24px 20px 60px;';
      var content = document.querySelector('main') || document.getElementById('MainContent') || document.body;
      content.appendChild(root);
    }

    getCart().then(function (cart) {
      if (!cart.items || cart.items.length === 0) {
        root.innerHTML =
          '<div style="max-width:560px;margin:0 auto;padding:60px 20px;text-align:center;font-family:inherit;">' +
          '  <h1 style="font-size:24px;font-weight:800;">Tu carrito está vacío</h1>' +
          '  <p style="color:#64748b;margin:12px 0 24px;">Agrega productos para continuar.</p>' +
          '  <a href="/" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;font-weight:700;padding:13px 30px;border-radius:10px;">Ir a la tienda</a>' +
          '</div>';
        return;
      }

      var subtotal = getSubtotal(cart);
      var ship = calcShipping(subtotal);
      var total = subtotal + ship;

      var itemsHtml = (cart.items || []).map(function (it) {
        var line = (it.line_price || 0) / 100;
        return '' +
          '<div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #f1f5f9;">' +
          '  <div style="flex:1;min-width:0;">' +
          '    <div style="font-weight:600;font-size:14px;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(it.title) + '</div>' +
          '    <div style="font-size:12px;color:#64748b;">Cantidad: ' + it.quantity + '</div>' +
          '  </div>' +
          '  <div style="font-weight:700;font-size:14px;color:#111827;">' + money(line) + '</div>' +
          '</div>';
      }).join('');

      var states = CONFIG.US_STATES.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');

      root.innerHTML =
        '<div style="max-width:720px;margin:0 auto;padding:24px 20px 60px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;color:#111827;">' +
        '  <h1 style="font-size:26px;font-weight:800;margin:0 0 4px;">Checkout</h1>' +
        '  <p style="color:#64748b;font-size:13px;margin:0 0 20px;">Pago seguro con tarjeta</p>' +
        '  <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:28px;align-items:start;">' +
        // Columna izquierda: formulario de envío
        '    <div>' +
        '      <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;">Datos de envío</h2>' +
        '      <div class="ryztor-pay__field"><label for="rz-name">Nombre completo *</label><input type="text" id="rz-name" placeholder="John Smith" autocomplete="name"></div>' +
        '      <div class="ryztor-pay__field"><label for="rz-email">Email *</label><input type="email" id="rz-email" placeholder="tu@correo.com" autocomplete="email"></div>' +
        '      <div class="ryztor-pay__field"><label for="rz-address">Dirección *</label><input type="text" id="rz-address" placeholder="123 Main St, Apt 4" autocomplete="street-address"></div>' +
        '      <div class="ryztor-pay__field"><label for="rz-city">Ciudad *</label><input type="text" id="rz-city" placeholder="Miami" autocomplete="address-level2"></div>' +
        '      <div class="ryztor-pay__row">' +
        '        <div class="ryztor-pay__field"><label for="rz-state">Estado *</label><select id="rz-state">' + states + '</select></div>' +
        '        <div class="ryztor-pay__field"><label for="rz-zip">Código postal *</label><input type="text" id="rz-zip" placeholder="33101" autocomplete="postal-code"></div>' +
        '      </div>' +
        '      <div class="ryztor-pay__secure">🔒 Tus datos están protegidos con cifrado SSL</div>' +
        '    </div>' +
        // Columna derecha: resumen del pedido
        '    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;">' +
        '      <h2 style="font-size:16px;font-weight:700;margin:0 0 8px;">Tu pedido</h2>' +
        '      <div style="border-bottom:1px solid #e2e8f0;margin-bottom:8px;">' + itemsHtml + '</div>' +
        '      <div class="ryztor-pay__srow"><span>Subtotal</span><span>' + money(subtotal) + '</span></div>' +
        '      <div class="ryztor-pay__srow"><span>Envío</span><span>' + (ship === 0 ? 'GRATIS' : money(ship)) + '</span></div>' +
        '      <div class="ryztor-pay__srow ryztor-pay__srow--total"><span>Total</span><span>' + money(total) + '</span></div>' +
        '      <button type="button" id="rz-pay-btn" class="ryztor-pay__btn" style="margin-top:12px;width:100%;padding:14px;background:#059669;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;">🔒 Pagar con tarjeta</button>' +
        '      <div class="ryztor-pay__err" id="rz-err"></div>' +
        '      <div style="font-size:10px;color:#94a3b8;text-align:center;margin-top:10px;">Visa · Mastercard · American Express</div>' +
        '    </div>' +
        '  </div>' +
        '</div>';

      document.getElementById('rz-pay-btn').addEventListener('click', function (e) { handlePay(e.target); });
    }).catch(function () {
      root.innerHTML = '<div style="max-width:560px;margin:0 auto;padding:60px 20px;text-align:center;"><p style="color:#dc2626;">No se pudo cargar el carrito. Intenta de nuevo.</p></div>';
    });
  }

  // ---------- DRAWER: botón que lleva al checkout ----------
  function initDrawerButton() {
    if (isCheckoutPage) return;
    var ctas = document.querySelector('.cart__ctas') ||
               document.querySelector('#checkout')?.parentElement ||
               document.querySelector('.cart-totals__container')?.parentElement;
    if (!ctas || document.getElementById('rz-open-btn')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'rz-open-btn';
    btn.className = 'ryztor-open-btn';
    btn.textContent = '💳 Pagar con tarjeta';
    btn.addEventListener('click', function () {
      window.location.href = CHECKOUT_PATH;
    });
    ctas.parentNode.insertBefore(btn, ctas);
  }

  function validate() {
    var get = function (id) { return document.getElementById(id); };
    var err = get('rz-err');
    var name = get('rz-name').value.trim();
    var email = get('rz-email').value.trim();
    var address = get('rz-address').value.trim();
    var city = get('rz-city').value.trim();
    var state = get('rz-state').value;
    var zip = get('rz-zip').value.trim();
    if (!name) return fail(err, 'Ingresa tu nombre completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(err, 'Ingresa un email válido.');
    if (!address) return fail(err, 'Ingresa tu dirección.');
    if (!city) return fail(err, 'Ingresa tu ciudad.');
    if (!state) return fail(err, 'Selecciona tu estado.');
    if (!/^\d{5}(-\d{4})?$/.test(zip)) return fail(err, 'Ingresa un código postal válido.');
    if (err) err.textContent = '';
    return { name: name, email: email, address1: address, city: city, province: state, zip: zip, country: 'US' };
  }

  function fail(err, msg) { if (err) err.textContent = msg; return false; }

  function handlePay(btn) {
    var data = validate();
    if (!data) return;
    var err = document.getElementById('rz-err');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando…'; }
    getCart().then(function (cart) {
      var items = buildItems(cart);
      var subtotal = getSubtotal(cart);
      var shipping = calcShipping(subtotal);
      var total = subtotal + shipping;
      if (items.length === 0) throw new Error('Tu carrito está vacío.');
      return fetch(CONFIG.checkoutEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: total, items: items, shippingCost: shipping, address: data })
      }).then(function (r) {
        return r.json().then(function (j) { return { ok: r.ok, json: j }; });
      }).then(function (res) {
        if (!res.ok) throw new Error(res.json.message || 'Error creando el pago.');
        window.location.href = res.json.purchaseUrl;
      });
    }).catch(function (e) {
      if (err) err.textContent = e.message || 'Ocurrió un error. Intenta de nuevo.';
      if (btn) { btn.disabled = false; btn.textContent = '🔒 Pagar con tarjeta'; }
    });
  }

  function init() {
    if (isCheckoutPage) {
      renderCheckoutPage();
    } else {
      initDrawerButton();
    }
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    if (isCheckoutPage) setTimeout(init, 1000);
    else setTimeout(init, 1500);
  }
  boot();
})();
