$(document).ready(function () {

  loadCart();

  function loadCart() {
    $.get('/api/v1/cart/view', function (res) {

      if (!res || res.length === 0) {
        $('#cartContainer').html(
          '<p>Your cart is empty 🪄 <a href="/trucks">Browse Trucks</a></p>'
        );
        $('#cartFooter').hide();
        return;
      }

      let total = 0;
      let html = '';

      res.forEach(item => {
        const name = item.itemName;
        const qty = Number(item.quantity);
        const totalPrice = Number(item.price);
        const unitPrice = totalPrice / qty;
        const subtotal = unitPrice * qty;

        total += subtotal;

        html += `
          <div class="card mb-3"
               data-cart-id="${item.cartId}"
               data-unit-price="${unitPrice}">
            <div class="card-body d-flex justify-content-between align-items-center">
              <div>
                <h5>${name}</h5>
                <p>
                  ${unitPrice.toFixed(2)} EGP x
                  <span class="itemQtyDisplay">${qty}</span>
                  = <span class="itemSubtotal">${subtotal.toFixed(2)}</span> EGP
                </p>
              </div>
              <div class="d-flex align-items-center">
                <button class="btn btn-sm btn-secondary decrease">−</button>
                <span class="mx-2 fw-bold itemQty">${qty}</span>
                <button class="btn btn-sm btn-secondary increase">+</button>
                <button class="btn btn-sm btn-danger remove ms-3">Remove</button>
              </div>
            </div>
          </div>
        `;
      });

      $('#cartContainer').html(html);
      $('#cartTotal').text(total.toFixed(2));
      $('#cartFooter').show();
    });
  }

  // Increase
  $(document).on('click', '.increase', function () {
    updateQuantity($(this).closest('.card'), 1);
  });

  // Decrease
  $(document).on('click', '.decrease', function () {
    updateQuantity($(this).closest('.card'), -1);
  });

  function updateQuantity(card, delta) {
    const qtyEl = card.find('.itemQty');
    let qty = Number(qtyEl.text());
    if (qty + delta < 1) return;
    qty += delta;

    qtyEl.text(qty); // update the visible number between + and −
    card.find('.itemQtyDisplay').text(qty); // update in the subtotal line too

    const unitPrice = Number(card.data('unit-price'));
    const subtotal = qty * unitPrice;
    card.find('.itemSubtotal').text(subtotal.toFixed(2));

    updateTotal();

    $.ajax({
      url: `/api/v1/cart/edit/${card.data('cart-id')}`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ quantity: qty })
    });
  }

  // Remove item
  $(document).on('click', '.remove', function () {
    const card = $(this).closest('.card');
    $.ajax({ url: `/api/v1/cart/delete/${card.data('cart-id')}`, method: 'DELETE' });
    card.remove();
    updateTotal();
  });

  function updateTotal() {
    let total = 0;
    $('.itemSubtotal').each(function () { total += Number($(this).text()); });
    $('#cartTotal').text(total.toFixed(2));
    if (total === 0) {
      $('#cartContainer').html(
        '<p>Your cauldron is empty 🪄 <a href="/trucks">Browse Trucks</a></p>'
      );
      $('#cartFooter').hide();
    }
  }

  // Place order
  $('#placeOrderBtn').click(function () {
    const pickupTime = $('#pickupTime').val();
    if (!pickupTime) return alert('Please select pickup time');

    $.ajax({
      url: '/api/v1/order/new',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ scheduledPickupTime: pickupTime }),
      success: function (res) {
        console.log("Order success response:", res);
        $('#orderMsg').fadeIn();
        setTimeout(() => {
          window.location.href = '/myOrders';
        }, 2000);
      },
      error: function (xhr) {
        console.log("AJAX error response:", xhr.responseText);
        alert("Something went wrong. Check console for details.");
      }
    });
  });

});

