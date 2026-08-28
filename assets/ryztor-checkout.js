// ============================================================
// RYZTOR — Pago con tarjeta (Whop)
//  - En el cart drawer: botón que lleva a la página /cart
//  - En la página /cart: formulario de envío (USA) + pago Whop
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

  var isCartPage = /\/cart/.test(window.location.pathname);

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

  function formHTML() {
    var opts = CONFIG.US_STATES.map(function (s) {
      return '<option value="' + s + '">' + s + '</option>';
    }).join('');
    return [
      '<div class="ryztor-pay" id="ryztor-pay">',
      '  <h3 class="ryztor-pay__title">Envío a Estados Unidos</h3>',
      '  <div class="ryztor-pay__field"><label for="rz-name">Nombre completo *</label><input type="text" id="rz-name" placeholder="John Smith" autocomplete="name"></div>',
      '  <div class="ryztor-pay__field"><label for="rz-email">Email *</label><input type="email" id="rz-email" placeholder="tu@correo.com" autocomplete="email"></div>',
      '  <div class="ryztor-pay__field"><label for="rz-address">Dirección *</label><input type="text" id="rz-address" placeholder="123 Main St, Apt 4" autocomplete="street-address"></div>',
      '  <div class="ryztor-pay__field"><label for="rz-city">Ciudad *</label><input type="text" id="rz-city" placeholder="Miami" autocomplete="address-level2"></div>',
      '  <div class="ryztor-pay__row">',
      '    <div class="ryztor-pay__field"><label for="rz-state">Estado *</label><select id="rz-state">' + opts + '</select></div>',
      '    <div class="ryztor-pay__field"><label for="rz-zip">CP *</label><input type="text" id="rz-zip" placeholder="33101" autocomplete="postal-code"></div>',
      '  </div>',
      '  <div class="ryztor-pay__summary" id="rz-summary"></div>',
      '  <div class="ryztor-pay__secure">🔒 Pago seguro · SSL · Visa / Mastercard</div>',
      '  <button type="button" id="rz-pay-btn" class="ryztor-pay__btn">🔒 Pagar con tarjeta</button>',
      '  <div class="ryztor-pay__err" id="rz-err"></div>',
      '</div>'
    ].join('');
  }

  // -------- En la página /cart --------
  function initCartPage() {
    // Ocultar el botón CHECKOUT nativo de Shopify en /cart
    var native = document.querySelector('#checkout, .cart__checkout-button');
    if (native) native.style.display = 'none';

    var summary = document.querySelector('.cart__ctas') ||
                  document.querySelector('.cart-totals__container')?.parentElement ||
                  document.querySelector('[data-testid="cart-total-value"]')?.closest('.cart-totals');
    if (!summary) return;
    if (document.getElementById('ryztor-pay')) return;

    var holder = document.createElement('div');
    holder.innerHTML = formHTML();
    summary.parentNode.insertBefore(holder.firstChild, summary);

    renderSummaryFromCart();

    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'rz-pay-btn') handlePay(e.target);
    });

    var recalc = function () {
      if (document.getElementById('ryztor-pay')) renderSummaryFromCart();
    };
    document.addEventListener('cart:updated', recalc);
    document.addEventListener('ajaxComplete', recalc);
    setInterval(recalc, 2000);
  }

  function renderSummaryFromCart() {
    getCart().then(function (cart) { renderSummary(getSubtotal(cart)); }).catch(function () {});
  }

  function renderSummary(subtotal) {
    var el = document.getElementById('rz-summary');
    if (!el) return;
    var ship = calcShipping(subtotal);
    var total = subtotal + ship;
    el.innerHTML =
      '<div class="ryztor-pay__srow"><span>Subtotal</span><span>' + money(subtotal) + '</span></div>' +
      '<div class="ryztor-pay__srow"><span>Envío</span><span>' + (ship === 0 ? 'GRATIS' : money(ship)) + '</span></div>' +
      '<div class="ryztor-pay__srow ryztor-pay__srow--total"><span>Total</span><span>' + money(total) + '</span></div>';
  }

  // -------- En el drawer: botón que lleva a /cart --------
  function initDrawerButton() {
    var ctas = document.querySelector('.cart__ctas') ||
               document.querySelector('#checkout')?.parentElement;
    if (!ctas || document.getElementById('rz-open-btn')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'rz-open-btn';
    btn.className = 'ryztor-open-btn';
    btn.textContent = '💳 Pagar con tarjeta';
    btn.addEventListener('click', function () {
      window.location.href = '/cart';
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
    if (isCartPage) {
      initCartPage();
    } else {
      // En el drawer/sidebar (y en cualquier página con carrito)
      initDrawerButton();
    }
  }

  // Esperar a que el DOM esté listo y reintentar si el drawer se renderiza tarde
  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    setTimeout(init, 1500);
  }
  boot();
})();
