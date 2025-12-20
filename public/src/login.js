$(document).ready(function () {

  let selectedRole = "customer";

  // Role toggle
  // $(".role").click(function () {
  //   $(".role").removeClass("active");
  //   $(this).addClass("active");
  //   selectedRole = $(this).data("role");
  // });

  $("#loginForm").submit(function (e) {
    e.preventDefault();

    const email = $("#email").val().trim();
    const password = $("#password").val().trim();

    $("#errorMsg").text("");

    if (!email || !password) {
      $("#errorMsg").text("Please fill in all fields");
      return;
    }

    $.ajax({
      url: "/api/v1/user/login",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        email: email,
        password: password,
        // role: selectedRole
      }),
      success: function (response) {
        // Login successful
        window.location.href = "/dashboard";
      },
      error: function (xhr) {
        const msg =
          xhr.responseJSON?.error ||
          "Invalid email or password";
        $("#errorMsg").text(msg);
      }
    });
  });

});
