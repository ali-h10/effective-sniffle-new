$(document).ready(function () {

  $("#availabilityToggle").change(function () {
  const isAvailable = $(this).is(":checked");
  const availability = isAvailable ? "available" : "unavailable";

  $("#availabilityLabel").text(
    isAvailable ? "Available" : "Unavailable"
  );

  $.ajax({
    type: "PUT",
    url: "/api/v1/trucks/updateOrderStatus",
    contentType: "application/json",
    data: JSON.stringify({ orderStatus: availability }),
    success: function () {
      alert("Availability updated");
    },
    error: function (err) {
      alert("Error updating availability");
    }
  });
});


  // Quick Actions
  $("#addMenuBtn").click(function () {
    location.href = "/addMenuItem";
  });

  $("#manageMenuBtn").click(function () {
    location.href = "/menuItems";
  });

  $("#viewOrdersBtn").click(function () {
    location.href = "/truckOrders";
  });

  // Logout
  $("#logoutBtn").click(function () {
    location.href = "/logout";
  });

});
