$(document).ready(function () {

  $.ajax({
    type: "GET",
    url: "/api/v1/trucks/view",   // existing API
    success: function (trucks) {
      $("#trucksContainer").empty();
      if (!trucks || trucks.length === 0) {
  $("#trucksContainer").html(
    `<p style="text-align:center;color:#aaa;margin-top:40px;">
      No trucks are available
     </p>`
  );
  return; // 🔥 stop here
}

      trucks.forEach(truck => {
        const isAvailable = truck.orderStatus === "available";

        const truckCard = `
          <div class="stat-card" style="flex-direction:column;text-align:center;">
            

            <h3 style="margin-top:12px;">${truck.truckName}</h3>
            <div class="truck-logo">
              <img src="/images/truck-placeholder.png" alt="Truck Logo">
            </div>
            <span style="
              margin:10px auto;
              padding:4px 12px;
              border-radius:20px;
              font-size:12px;
              background:${isAvailable ? "#1f7a4a" : "#7a1f1f"};
            ">
              ${isAvailable ? "Available" : "Unavailable"}
            </span>

            <button
              class="logout-btn"
              style="
                width:100%;
                margin-top:14px;
                background:${isAvailable ? "#caa74d" : "#555"};
                color:${isAvailable ? "#2b1d03" : "#aaa"};
              "
              ${!isAvailable ? "disabled" : ""}
              onclick="viewMenu(${truck.truckId})"
            >
              👁 View Menu
            </button>

          </div>
        `;

        $("#trucksContainer").append(truckCard);
      });
    },

    error: function () {
      alert("Error loading trucks");
    }
  });

});

function viewMenu(truckId) {
  location.href = `/truckMenu?truckId=${truckId}`;
}
