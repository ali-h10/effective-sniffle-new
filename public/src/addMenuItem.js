$(document).ready(function () {

  $("#addMenuItemForm").on("submit", function (e) {
    e.preventDefault();

    const name = $("#name").val().trim();
    const category = $("#category").val();
    const description = $("#description").val().trim();
    const price = $("#price").val().trim();

    // 🔐 Validation
    if (!name || !category || !price) {
      alert("Please fill all required fields");
      return;
    }

    if (isNaN(price) || Number(price) <= 0) {
      alert("Price must be a valid number");
      return;
    }

    const data = {
      name,
      category,
      description,
      price
    };

    $.ajax({
      url: "/api/v1/menuItem/new",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function () {
        alert("Menu item added successfully!");
        window.location.href = "/menuItems";
      },
      error: function (err) {
        alert(err.responseJSON?.error || "Failed to add menu item");
      }
    });
  });

  // Cancel button
  $("#cancelBtn").on("click", function () {
    window.location.href = "/menuItems";
  });

});
