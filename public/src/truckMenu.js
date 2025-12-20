$(document).ready(function () {

  // ======= 1️⃣ NAVIGATION BUTTONS =======
  $(".nav-btn").click(function () {
    const path = $(this).data("path");
    window.location.href = path;
  });

  $("#logoutBtn").click(function () {
    window.location.href = "/logout";
  });

  // ======= 2️⃣ GET TRUCK ID FROM URL =======
  const urlParams = new URLSearchParams(window.location.search);
  let truckId = urlParams.get("truckId");

  if (!truckId) {
    const pathParts = window.location.pathname.split("/");
    truckId = pathParts[pathParts.length - 1];
  }

  if (!truckId || isNaN(truckId)) {
    alert("No truck selected. Returning to trucks page.");
    window.location.href = "/trucks";
    return;
  }

  let allItems = [];

  // ======= 3️⃣ RENDER MENU ITEMS =======
  function renderItems(items) {
    const container = $("#menuItems");
    container.empty();

    if (items.length === 0) {
      container.html("<p>No menu items available.</p>");
      return;
    }

    items.forEach(item => {
      container.append(`
        <div class="menu-item">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Price:</strong> $${item.price}</p>

          <label>Quantity:</label>
          <input type="number" min="1" value="1" id="qty-${item.itemId}" />

          <button onclick="addToCart(${item.itemId}, ${item.price})">
            Add to Cart
          </button>
        </div>
        <hr>
      `);
    });
  }

  // ======= 4️⃣ POPULATE CATEGORY DROPDOWN =======
  function populateCategories(items) {
    const select = $("#categorySelect");
    select.empty();
    select.append(`<option value="">All</option>`);

    const categories = [...new Set(items.map(i => i.category))];
    categories.forEach(cat => {
      select.append(`<option value="${cat}">${cat}</option>`);
    });
  }

  // ======= 5️⃣ FETCH ALL MENU ITEMS =======
  $.get(`/api/v1/menuItem/truck/${truckId}`)
    .done(data => {
      allItems = data;
      renderItems(data);
      populateCategories(data);
    })
    .fail(() => alert("Failed to load menu items"));

  // ======= 6️⃣ FILTER BY CATEGORY =======
  $("#categorySelect").change(function () {
    const category = $(this).val();
    if (!category) renderItems(allItems);
    else {
      $.get(`/api/v1/menuItem/truck/${truckId}/category/${category}`)
        .done(data => renderItems(data))
        .fail(() => alert("Failed to filter menu"));
    }
  });

  // ======= 7️⃣ ADD TO CART =======
  window.addToCart = function(itemId, price) {
    const quantity = $(`#qty-${itemId}`).val();

    if (quantity < 1) {
      alert("Quantity must be at least 1");
      return;
    }

    $.post("/api/v1/cart/new", { itemId, quantity, price })
      .done(() => {
        $("#successMsg").fadeIn().delay(1500).fadeOut();
      })
      .fail(err => alert(err.responseJSON?.message || "Failed to add item"));
  };

});


