$(document).ready(function () {

    // Highlight active nav button
const currentPath = window.location.pathname;

$(".nav-btn").each(function () {
  const buttonPath = $(this).data("path");

  if (currentPath === buttonPath) {
    $(this).addClass("active-nav");
  }
});

// Navigation clicks
$(".nav-btn").click(function () {
  const path = $(this).data("path");
  location.href = path;
});

$("#logoutBtn").click(function () {
  location.href = "/logout";
});

  // Navbar buttons
  $("#browseTrucksBtn, #browseAction").click(function () {
    location.href = "/trucks";
  });

  $("#cartBtn, #cartAction").click(function () {
    location.href = "/cart";
  });

  $("#ordersBtn, #ordersAction").click(function () {
    location.href = "/myOrders";
  });

  $("#logoutBtn").click(function () {
    location.href = "/logout";
  });

});