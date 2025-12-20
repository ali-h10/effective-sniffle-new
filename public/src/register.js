$(document).ready(function () {

  $("#registerForm").submit(function (e) {
    e.preventDefault(); 

    // Get values
    const name = $("#name").val().trim();
    const email = $("#email").val().trim();
    const password = $("#password").val().trim();
    const birthDate = $("#birthDate").val();

    // Hide old errors
    $("#errorMsg").addClass("d-none").text("");

    // Validation
    if (!name || !email || !password || !birthDate) {
      showError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    // AJAX request
    $.ajax({
      url: "/api/v1/user",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        name: name,
        email: email,
        password: password,
        birthDate: birthDate
      }),
      success: function (response) {
        alert("Registration successful! Please login.");
        window.location.href = "/"; // login page
      },
      error: function (xhr) {
        const message =
          xhr.responseJSON?.message || "Registration failed. Try again.";
        showError(message);
      }
    });
  });

  // Helper function
  function showError(msg) {
    $("#errorMsg")
      .removeClass("d-none")
      .text(msg);
  }

});