// ============================================================
// RYZTOR — Pago con tarjeta (Whop) desde el cart drawer
// Calcula envío (USA), pide dirección y redirige al checkout de Whop.
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

  var state = { showing: false };

  function money(v) {
    return '$' + Number(v).toFixed(2);
  }

  function getCart() {
    return fetch('/cart.js', { headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json(); });
  }

  function buildItems(cart) {
    return (cart.items || []).map(function (it) {
      return { variantId: it.variant_id, qty: it.quantity };
    });
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
      '  <p class="ryztor-pay__title">Envío a Estados Unidos</p>',
      '  <div class="ryztor-pay__field"><label>Nombre completo *</label><input type="text" id="rz-name" placeholder="John Smith" autocomplete="name"></div>',
      '  <div class="ryztor-pay__field"><label>Email *</label><input type="email" id="rz-email" placeholder="tu@correo.com" autocomplete="email"></div>',
      '  <div class="ryztor-pay__field"><label>Dirección *</label><input type="text" id="rz-address" placeholder="123 Main St, Apt 4" autocomplete="street-address"></div>',
      '  <div class="ryztor-pay__field"><label>Ciudad *</label><input type="text" id="rz-city" placeholder="Miami" autocomplete="address-level2"></div>',
      '  <div class="ryztor-pay__row">',
      '    <div class="ryztor-pay__field"><label>Estado *</label><select id="rz-state">' + opts + '</select></div>',
      '    <div class="ryztor-pay__field"><label>CP *</label><input type="text" id="rz-zip" placeholder="33101" autocomplete="postal-code"></div>',
      '  </div>',
      '  <div class="ryztor-pay__summary" id="rz-summary"></div>',
      '  <div class="ryztor-pay__secure">🔒 Pago seguro · SSL · Visa / Mastercard</div>',
      '  <button type="button" id="rz-pay-btn" class="ryztor-pay__btn">🔒 Pagar con tarjeta</button>',
      '  <div class="ryztor-pay__err" id="rz-err"></div>',
      '</div>'
    ].join('');
  }

  // Insertar justo antes del bloque de botones (.cart__ctas) dentro del resumen
  function insertInto() {
    var ctas = document.querySelector('.cart__ctas') ||
               document.querySelector('#checkout')?.parentElement ||
               document.querySelector('.cart-totals__container')?.parentElement;
    if (!ctas || document.getElementById('ryztor-pay')) return;
    var holder = document.createElement('div');
    holder.innerHTML = formHTML();
    ctas.parentNode.insertBefore(holder.firstChild, ctas);
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
    return total;
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
    // Ocultar el botón CHECKOUT nativo de Shopify
    var native = document.getElementById('checkout');
    if (native) native.style.display = 'none';

    insertInto();

    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'rz-pay-btn') handlePay(e.target);
    });

    // Recalcular cuando cambie el carrito (drawer abre, add-to-cart, etc.)
    var recalc = function () {
      var el = document.getElementById('ryztor-pay');
      if (!el) { insertInto(); }
      if (!document.getElementById('ryztor-pay')) return;
      getCart().then(function (cart) { renderSummary(getSubtotal(cart)); }).catch(function () {});
    };
    document.addEventListener('cart:updated', recalc);
    document.addEventListener('ajaxComplete', recalc);
    // Poll suave por si el drawer se re-renderiza
    setInterval(recalc, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
