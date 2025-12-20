document.addEventListener('DOMContentLoaded', () => {
  fetchOrders();
  const topBtn = document.getElementById('viewDetailsBtn');
  if (topBtn) {
    topBtn.addEventListener('click', () => {
      if (!selectedOrderId) return;
      openOrderModal(selectedOrderId);
    });
  }
});

let selectedOrderId = null;
let currentlyExpandedOrderId = null;

function fetchOrders() {
  fetch('/api/v1/order/myOrders')
    .then(res => res.json())
    .then(orders => {
      const container = document.getElementById('ordersContainer');
      const countDiv = document.getElementById('ordersCount');
      const noOrdersMsg = document.getElementById('noOrders');

      container.innerHTML = '';

      if (!orders || orders.length === 0) {
        noOrdersMsg.classList.remove('d-none');
        countDiv.textContent = '0 orders';
        return;
      }

      noOrdersMsg.classList.add('d-none');
      countDiv.textContent = `${orders.length} orders`;

      orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.orderId = order.orderId;

        card.innerHTML = `
          <h3>${order.truckName}</h3>
          <p>Order #ORD-${order.orderId}</p>
          <p class="${getStatusClass(order.orderStatus)}">
            ${capitalize(order.orderStatus)}
          </p>
          <p>Pickup: ${new Date(order.scheduledPickupTime).toLocaleString()}</p>
          <h4>$${order.totalPrice.toFixed(2)}</h4>

          <button class="btn btn-sm btn-outline-info mt-2 view-details-btn">
            View Details
          </button>
          <div class="order-details mt-3" style="display:none"></div>
        `;

        // CARD CLICK (select order)
        card.addEventListener('click', () => {
          document.querySelectorAll('.card').forEach(c =>
            c.classList.remove('border', 'border-info')
          );

          card.classList.add('border', 'border-info');
          selectedOrderId = order.orderId;

          // 🔥 ENABLE TOP BUTTON (if present)
          const _topBtn = document.getElementById('viewDetailsBtn');
          if (_topBtn) _topBtn.disabled = false;
        });

        // BUTTON CLICK (inline details)
        card.querySelector('.view-details-btn').addEventListener('click', (e) => {
          e.stopPropagation(); // 🔥 VERY IMPORTANT
          openOrderModal(order.orderId);
        });

        container.appendChild(card);
      });
    });
}

// MODAL FUNCTION
function openOrderModal(orderId) {
  // Toggle inline details for the given orderId. If another order is expanded, collapse it.
  const card = document.querySelector(`.card[data-order-id="${orderId}"]`);
  if (!card) return;

  const detailsDiv = card.querySelector('.order-details');

  // If already expanded, collapse and return
  if (currentlyExpandedOrderId === orderId && detailsDiv && detailsDiv.style.display !== 'none') {
    detailsDiv.style.display = 'none';
    currentlyExpandedOrderId = null;
    return;
  }

  // Collapse any previously expanded card
  if (currentlyExpandedOrderId && currentlyExpandedOrderId !== orderId) {
    const prev = document.querySelector(`.card[data-order-id="${currentlyExpandedOrderId}"]`);
    if (prev) {
      const prevDetails = prev.querySelector('.order-details');
      if (prevDetails) prevDetails.style.display = 'none';
    }
  }

  // Show loading state
  if (detailsDiv) {
    detailsDiv.style.display = 'block';
    detailsDiv.innerHTML = '<em>Loading details...</em>';
  }

  fetch(`/api/v1/order/details/${orderId}`)
    .then(res => res.json())
    .then(order => {
      if (!detailsDiv) return;

      detailsDiv.innerHTML = `
        <div class="p-3" style="background:#0f0f0f;border-radius:8px;">
          <p><strong>Truck:</strong> ${order.truckName}</p>
          <p><strong>Status:</strong> ${capitalize(order.orderStatus)}</p>
          <p><strong>Pickup:</strong> ${new Date(order.scheduledPickupTime).toLocaleString()}</p>
          <hr>
          <ul class="mb-2">
            ${order.items.map(i =>
              `<li>${i.name} × ${i.quantity} — $${i.price}</li>`
            ).join('')}
          </ul>
          <hr>
          <h5>Total: $${order.totalPrice}</h5>
        </div>
      `;

      currentlyExpandedOrderId = orderId;
    })
    .catch(err => {
      if (detailsDiv) detailsDiv.innerHTML = '<span class="text-danger">Failed to load details.</span>';
      console.error('Failed to fetch order details', err);
    });
}

function getStatusClass(status) {
  if (!status) return '';
  return `status-${status.toLowerCase()}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}




