let allOrders = [];
let currentFilter = "all";

$(document).ready(function () {
  loadOrders();
  setupFilters();
});

function loadOrders() {
  $.ajax({
    url: "/api/v1/order/truckOrders",
    method: "GET",
    success: function (orders) {
      allOrders = orders;
      $("#orderCount").text(`${orders.length} orders`);
      renderOrders();
    },
    error: function () {
      alert("Failed to load orders");
    }
  });
}

function setupFilters() {
  $(".filter").click(function () {
    $(".filter").removeClass("active");
    $(this).addClass("active");
    currentFilter = $(this).data("status");
    renderOrders();
  });
}

function renderOrders() {
  const container = $("#ordersContainer");
  container.empty();

  const filteredOrders = currentFilter === "all"
    ? allOrders
    : allOrders.filter(o => o.orderStatus === currentFilter);

  if (filteredOrders.length === 0) {
    container.html(`<p class="empty">No orders found</p>`);
    return;
  }

  filteredOrders.forEach(order => {
    const orderHtml = `
      <div class="order-card">
        <div class="order-top">
          <span class="order-id">#${order.orderId}</span>
          <span class="status ${order.orderStatus}">${order.orderStatus}</span>
        </div>

        <div class="order-info">
          <p><strong>Customer:</strong> ${order.customername}</p>
          <p><strong>Total:</strong> ${order.totalPrice} EGP</p>
          <p><strong>Pickup:</strong> ${new Date(order.scheduledPickupTime).toLocaleString()}</p>
        </div>

        <div class="order-actions">
          <select id="status-${order.orderId}">
            ${["pending","preparing","ready","completed","cancelled"].map(status =>
              `<option value="${status}" ${status === order.orderStatus ? "selected" : ""}>
                ${status}
              </option>`
            ).join("")}
          </select>

          <button class="update-btn" data-id="${order.orderId}">Update Status</button>
          <button class="details-btn" data-id="${order.orderId}">View Details</button>
        </div>
      </div>
    `;

    container.append(orderHtml);
  });

  attachActionHandlers();
}

function attachActionHandlers() {

  $(".update-btn").off("click").on("click", function () {
    const orderId = $(this).data("id");
    const newStatus = $(`#status-${orderId}`).val();

    $.ajax({
      url: `/api/v1/order/updateStatus/${orderId}`,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify({ orderStatus: newStatus }),
      success: function () {
        loadOrders();
      },
      error: function () {
        alert("Failed to update order status");
      }
    });
  });

  $(".details-btn").off("click").on("click", function () {
    const orderId = $(this).data("id");

    $.ajax({
      url: `/api/v1/order/truckOwner/${orderId}`,
      method: "GET",
      success: function (order) {

        let itemsText = "";
        order.items.forEach(item => {
          itemsText += `• ${item.itemName} x${item.quantity} (${item.price} EGP)\n`;
        });

       // Fill modal content
$("#modalOrderTitle").text(`Order #${order.orderId}`);
$("#modalTruckName").text(order.truckName);
$("#modalStatus").text(order.orderStatus);
$("#modalTotal").text(order.totalPrice);
$("#modalPickup").text(
  new Date(order.scheduledPickupTime).toLocaleString()
);

// Items
$("#modalItems").empty();
if (!order.items || order.items.length === 0) {
  $("#modalItems").append("<li>No items</li>");
} else {
  order.items.forEach(item => {
    $("#modalItems").append(
      `<li>${item.itemName} x${item.quantity} — ${item.price} EGP</li>`
    );
  });
}

// Show modal
$("#orderDetailsModal").removeClass("hidden");

      },
      error: function () {
        alert("Failed to load order details");
      }
    });
  });
  $(".close-modal").on("click", function () {
  $("#orderDetailsModal").addClass("hidden");
});

$("#orderDetailsModal").on("click", function (e) {
  if (e.target.id === "orderDetailsModal") {
    $("#orderDetailsModal").addClass("hidden");
  }
});

}
