$(document).ready(function () {
  loadMenuItems();
});

function loadMenuItems() {
  $.ajax({
    url: "/api/v1/menuItem/view",
    method: "GET",
    success: function (items) {
      $("#itemsCount").text(`${items.length} items`);
      renderItems(items);
    },
    error: function () {
      alert("Failed to load menu items");
    }
  });
}

function renderItems(items) {
  const tbody = $("#menuItemsBody");
  tbody.empty();

  items.forEach(item => {
    tbody.append(`
      <tr id="row-${item.itemId}">
        <td>${item.itemId}</td>
        <td class = "name">${item.name}</td>
        <td class = "category"><span class="badge">${item.category}</span></td>
        <td class="description">${item.description}</td>
        <td class ="price">$${parseFloat(item.price).toFixed(2)}</td>
        <td>
          <span class="status ${item.status}">
            ${item.status}
          </span>
        </td>
        <td class="actions">
          <button onclick="viewItem(${item.itemId})">👁</button>
          <button onclick="enableEdit(${item.itemId})">✏️</button>
          <button onclick="deleteItem(${item.itemId})">🗑</button>
        </td>
      </tr>
    `);
  });
  
}
function viewItem(itemId) {
  $.get(`/api/v1/menuItem/view/${itemId}`, function (item) {
    $("#modalItemName").text(item.name);
    $("#modalItemCategory").text(item.category);
    $("#modalItemDescription").text(item.description);
    $("#modalItemPrice").text(parseFloat(item.price).toFixed(2));

    const statusEl = $("#modalItemStatus");
    statusEl.text(item.status);
    statusEl.removeClass("available unavailable");
    statusEl.addClass(item.status);

    $("#viewItemModal").fadeIn(150);
  });
}

function closeViewModal() {
  $("#viewItemModal").fadeOut(150);
}

function enableEdit(itemId) {
  const row = $(`#row-${itemId}`);

  const name = row.find(".name").text();
  const description = row.find(".description").text();
  const category = row.find(".category").text().trim();
  const status = row.find(".status").text().trim();
  const price = row.find(".price").text().trim().slice(1);

  row.find(".price").html(`<input  type="text" value="${price}">`);
  row.find(".name").html(`<input type="text" value="${name}">`);
  row.find(".description").html(`<textarea>${description}</textarea>`);

  row.find(".category").html(`
    <select>
      <option ${category === "Main" ? "selected" : ""}>Main</option>
      <option ${category === "Pastries" ? "selected" : ""}>Pastries</option>
      <option ${category === "Dessert" ? "selected" : ""}>Dessert</option>
      <option ${category === "Beverages" ? "selected" : ""}>Beverages</option>
    </select>
  `);

  row.find(".status").html(`
    <label class="switch">
      <input type="checkbox" ${status === "available" ? "checked" : ""}>
      <span class="slider"></span>
    </label>
  `);

  row.find(".actions").html(`
    <button onclick="saveEdit(${itemId})">💾</button>
    <button onclick="cancelEdit()">❌</button>
  `);
}
function saveEdit(itemId) {
  const row = $(`#row-${itemId}`);

  const updatedItem = {
    name: row.find(".name input").val(),
    description: row.find(".description textarea").val(),
    category: row.find(".category select").val(),
    price: row.find(".price input").val(),
    status: row.find(".status input").is(":checked") ? "available" : "unavailable"
  };

  $.ajax({
    url: `/api/v1/menuItem/edit/${itemId}`,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify(updatedItem),
    success: function () {
      alert("Item updated successfully");
      loadMenuItems();
    },
    error: function () {
      alert("Failed to update item");
    }
  });
}
function cancelEdit() {
  loadMenuItems();
}
function deleteItem(itemId) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  $.ajax({
    url: `/api/v1/menuItem/delete/${itemId}`,
    method: "DELETE",
    success: function () {
      alert("Item deleted successfully");
      loadMenuItems();
    },
    error: function () {
      alert("Failed to delete item");
    }
  });
}

