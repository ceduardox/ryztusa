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
    // El CSS (body.ryztor-checkout-page) ya oculta el drawer, header y contenido.
    // Aquí solo creamos el contenedor del checkout si no existe.
    var root = document.getElementById('ryztor-checkout-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'ryztor-checkout-root';
      var content = document.querySelector('main') || document.getElementById('MainContent') || document.body;
      content.appendChild(root);
    }

    getCart().then(function (cart) {
      if (!cart.items || cart.items.length === 0) {
        root.innerHTML =
          '<div style="max-width:560px;margin:60px auto;padding:0 20px;text-align:center;">' +
          '  <h1 style="font-size:24px;font-weight:700;">Tu carrito está vacío</h1>' +
          '  <p style="color:#64748b;margin:12px 0 24px;">Agrega productos para continuar.</p>' +
          '  <a href="/" style="display:inline-block;background:#1976f2;color:#fff;text-decoration:none;font-weight:600;padding:14px 32px;border-radius:6px;">Continuar comprando</a>' +
          '</div>';
        return;
      }

      var subtotal = getSubtotal(cart);
      var ship = calcShipping(subtotal);
      var total = subtotal + ship;

      var itemsHtml = (cart.items || []).map(function (it) {
        var line = (it.line_price || 0) / 100;
        return '' +
          '<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #e5e7eb;">' +
          '  <div style="flex:1;min-width:0;">' +
          '    <div style="font-size:15px;color:#111;line-height:1.3;">' + escapeHtml(it.title) + '</div>' +
          '    <div style="font-size:12px;color:#6b7280;margin-top:2px;">Cantidad: ' + it.quantity + '</div>' +
          '  </div>' +
          '  <div style="font-size:15px;color:#111;white-space:nowrap;">' + money(line) + '</div>' +
          '</div>';
      }).join('');

      var states = CONFIG.US_STATES.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');

      root.innerHTML =
        '<div style="min-height:100vh;background:#fff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;color:#111;">' +
        // Header
        '  <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 24px;border-bottom:1px solid #e5e7eb;">' +
        '    <div style="font-size:17px;font-weight:700;letter-spacing:.5px;">RYZTOR</div>' +
        '    <div title="Pago seguro">🔒</div>' +
        '  </div>' +
        // Cuerpo: 2 columnas
        '  <div class="rz-cols" style="display:flex;flex-wrap:wrap;min-height:calc(100vh - 60px);">' +
        // Columna izquierda: formulario
        '    <div class="rz-col rz-col--form" style="flex:1 1 400px;padding:32px 20px;background:#fff;">' +
        '      <div style="max-width:520px;margin:0 auto;">' +
        // Contact
        '        <h2 style="font-size:16px;font-weight:600;margin:0 0 4px;">Contact</h2>' +
        '        <div class="ryztor-pay__field"><input type="email" id="rz-email" placeholder="Email" autocomplete="email"></div>' +
        '        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#111;margin:8px 0 24px;"><input type="checkbox" checked style="width:16px;height:16px;"> Email me with news and offers</label>' +
        // Delivery
        '        <h2 style="font-size:16px;font-weight:600;margin:0 0 4px;">Delivery</h2>' +
        '        <div class="ryztor-pay__field"><input type="text" id="rz-country" value="United States" disabled style="background:#f9fafb;color:#6b7280;"></div>' +
        '        <div class="ryztor-pay__row" style="gap:10px;">' +
        '          <div class="ryztor-pay__field"><input type="text" id="rz-first" placeholder="First name" autocomplete="given-name"></div>' +
        '          <div class="ryztor-pay__field"><input type="text" id="rz-last" placeholder="Last name" autocomplete="family-name"></div>' +
        '        </div>' +
        '        <div class="ryztor-pay__field"><input type="text" id="rz-address" placeholder="Address" autocomplete="street-address"></div>' +
        '        <div class="ryztor-pay__field"><input type="text" id="rz-apt" placeholder="Apartment, suite, etc. (optional)" autocomplete="address-line2"></div>' +
        '        <div class="ryztor-pay__row" style="grid-template-columns:1.2fr 1fr 1fr;gap:10px;">' +
        '          <div class="ryztor-pay__field"><input type="text" id="rz-city" placeholder="City" autocomplete="address-level2"></div>' +
        '          <div class="ryztor-pay__field"><select id="rz-state">' + states + '</select></div>' +
        '          <div class="ryztor-pay__field"><input type="text" id="rz-zip" placeholder="ZIP code" autocomplete="postal-code"></div>' +
        '        </div>' +
        '        <div class="ryztor-pay__field"><input type="tel" id="rz-phone" placeholder="Phone (optional)" autocomplete="tel"></div>' +
        // Shipping method
        '        <h2 style="font-size:16px;font-weight:600;margin:24px 0 4px;">Shipping method</h2>' +
        '        <div style="border:1px solid #e5e7eb;border-radius:6px;padding:14px;font-size:13px;color:#6b7280;display:flex;justify-content:space-between;">' +
        '          <span>' + (ship === 0 ? 'Envío gratis' : 'Envío estándar (USA)') + '</span>' +
        '          <span style="font-weight:600;color:#111;">' + (ship === 0 ? 'GRATIS' : money(ship)) + '</span>' +
        '        </div>' +
        // Payment
        '        <h2 style="font-size:16px;font-weight:600;margin:24px 0 4px;">Payment</h2>' +
        '        <p style="font-size:12px;color:#6b7280;margin:0 0 14px;">All transactions are secure and encrypted.</p>' +
        '        <div style="border:1px solid #1976f2;border-radius:6px;padding:14px;display:flex;gap:10px;align-items:center;">' +
        '          <span style="width:16px;height:16px;border-radius:50%;background:#1976f2;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:10px;">✓</span>' +
        '          <span style="font-size:14px;font-weight:500;">Credit card</span>' +
        '          <span style="margin-left:auto;font-size:11px;color:#6b7280;">Visa · Mastercard · Amex</span>' +
        '        </div>' +
        // Resumen total + botón
        '        <div class="ryztor-pay__summary" id="rz-summary" style="margin-top:16px;"></div>' +
        '        <button type="button" id="rz-pay-btn" class="ryztor-pay__btn" style="margin-top:18px;width:100%;padding:16px;background:#1976f2;color:#fff;border:none;border-radius:6px;font-size:16px;font-weight:600;cursor:pointer;">Pay now</button>' +
        '        <div class="ryztor-pay__err" id="rz-err" style="text-align:center;"></div>' +
        '        <div style="font-size:11px;color:#9ca3af;text-align:center;margin-top:20px;padding-bottom:20px;">Terms · Privacy policy</div>' +
        '      </div>' +
        '    </div>' +
        // Columna derecha: resumen gris
        '    <div class="rz-col rz-col--summary" style="flex:1 1 360px;background:#f7f7f7;padding:32px 20px;">' +
        '      <div style="max-width:440px;margin:0 auto;">' +
        '        <div style="font-size:13px;color:#6b7280;margin-bottom:14px;">' + itemsHtml + '</div>' +
        '        <div style="font-size:14px;color:#111;display:flex;justify-content:space-between;padding:8px 0;"><span>Subtotal</span><span>' + money(subtotal) + '</span></div>' +
        '        <div style="font-size:14px;color:#111;display:flex;justify-content:space-between;padding:8px 0;"><span>Shipping</span><span>' + (ship === 0 ? 'GRATIS' : money(ship)) + '</span></div>' +
        '        <div style="font-size:16px;font-weight:700;color:#111;display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid #e5e7eb;margin-top:4px;"><span>Total</span><span>USD ' + money(total) + '</span></div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>';

      renderSummary(subtotal);
      document.getElementById('rz-pay-btn').addEventListener('click', function (e) { handlePay(e.target); });
    }).catch(function () {
      root.innerHTML = '<div style="max-width:560px;margin:60px auto;padding:0 20px;text-align:center;"><p style="color:#dc2626;">No se pudo cargar el carrito. Intenta de nuevo.</p></div>';
    });
  }

  // ---------- DRAWER: botón que lleva al checkout ----------
  function initDrawerButton() {
    if (isCheckoutPage) return;
    var ctas = document.querySelector('.cart__ctas') ||
               document.querySelector('#checkout')?.parentElement ||
               document.querySelector('.cart-totals__container')?.parentElement;
    if (!ctas || document.getElementById('rz-open-btn')) return;

    // Ocultar el botón "Check out" nativo de Shopify en el drawer
    var native = document.getElementById('checkout') || document.querySelector('.cart__checkout-button');
    if (native) native.style.display = 'none';

    // Reemplazar el botón nativo por el de RYZTOR, con el MISMO estilo
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'rz-open-btn';
    btn.className = 'ryztor-open-btn cart__checkout-button button';
    btn.innerHTML = '<span class="button-text">' + (getLang() === 'es' ? '💳 Pagar con tarjeta' : '💳 Pay with card') + '</span>';
    btn.addEventListener('click', function () {
      window.location.href = CHECKOUT_PATH;
    });
    // Reemplaza al botón nativo en su posición exacta (mismo lugar, mismo ancho)
    if (native && native.parentNode === ctas) {
      ctas.replaceChild(btn, native);
    } else {
      ctas.appendChild(btn);
    }
  }

  // Detectar idioma de la página (Shopify usa <html lang="...">)
  function getLang() {
    var l = (document.documentElement.lang || 'en').toLowerCase();
    return l.indexOf('es') === 0 ? 'es' : 'en';
  }

  function renderSummary(subtotal) {
    var el = document.getElementById('rz-summary');
    if (!el) return;
    var ship = calcShipping(subtotal);
    var total = subtotal + ship;
    el.innerHTML =
      '<div style="font-size:14px;color:#111;display:flex;justify-content:space-between;padding:8px 0;"><span>Subtotal</span><span>' + money(subtotal) + '</span></div>' +
      '<div style="font-size:14px;color:#111;display:flex;justify-content:space-between;padding:8px 0;"><span>Shipping</span><span>' + (ship === 0 ? 'GRATIS' : money(ship)) + '</span></div>' +
      '<div style="font-size:16px;font-weight:700;color:#111;display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid #e5e7eb;"><span>Total</span><span>USD ' + money(total) + '</span></div>';
  }

  function validate() {
    var get = function (id) { return document.getElementById(id); };
    var err = get('rz-err');
    var first = get('rz-first').value.trim();
    var last = get('rz-last').value.trim();
    var email = get('rz-email').value.trim();
    var address = get('rz-address').value.trim();
    var city = get('rz-city').value.trim();
    var state = get('rz-state').value;
    var zip = get('rz-zip').value.trim();
    if (!first || !last) return fail(err, 'Ingresa tu nombre y apellido.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(err, 'Ingresa un email válido.');
    if (!address) return fail(err, 'Ingresa tu dirección.');
    if (!city) return fail(err, 'Ingresa tu ciudad.');
    if (!state) return fail(err, 'Selecciona tu estado.');
    if (!/^\d{5}(-\d{4})?$/.test(zip)) return fail(err, 'Ingresa un código postal válido.');
    if (err) err.textContent = '';
    return {
      first_name: first,
      last_name: last,
      email: email,
      address1: address,
      city: city,
      province: state,
      zip: zip,
      country: 'US'
    };
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
      if (btn) { btn.disabled = false; btn.textContent = 'Pay now'; }
    });
  }

  function init() {
    if (isCheckoutPage) {
      renderCheckoutPage();
      // El theme puede re-hidratar el drawer; mantenerlo oculto de forma persistente
      setInterval(function () {
        document.querySelectorAll('#shopify-section-cart-drawer-section, #cart-drawer, cart-items-component, .cart-drawer__inner').forEach(function (el) {
          if (el && el.style.display !== 'none') el.style.display = 'none';
        });
      }, 1000);
      var mo = new MutationObserver(function () {
        document.querySelectorAll('#shopify-section-cart-drawer-section, #cart-drawer, cart-items-component, .cart-drawer__inner').forEach(function (el) {
          if (el && el.style.display !== 'none') el.style.display = 'none';
        });
      });
      mo.observe(document.body, { childList: true, subtree: true });
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
