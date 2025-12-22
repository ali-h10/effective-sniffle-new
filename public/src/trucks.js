$(document).ready(function() {
  loadTrucks();
  setupSearch();
  setupLogout();

  function loadTrucks() {
    $.ajax({
      url: '/api/v1/trucks/view',
      method: 'GET',
      success: function(trucks) {
        displayTrucks(trucks);
      },
      error: function(xhr) {
        console.error('Error loading trucks:', xhr);
        $('#trucksContainer').html('<div class="error">Failed to load trucks. Please try again.</div>');
      }
    });
  }

  function displayTrucks(trucks) {
    const container = $('#trucksContainer');
    container.empty();

    if (trucks.length === 0) {
      $('#emptyState').removeClass('d-none');
      container.addClass('d-none');
      return;
    }

    $('#emptyState').addClass('d-none');
    container.removeClass('d-none');

    trucks.forEach(truck => {
      const isAvailable = truck.orderStatus === 'available';
      const truckCard = `
        <div class="truck-card" onclick="window.goToMenu(${truck.truckId})">
          <div class="truck-card-header">🚚</div>
          <div class="truck-card-body">
            <h3>${truck.truckName}</h3>
            <p>Fresh and delicious food prepared daily</p>
            <span class="truck-status ${isAvailable ? 'status-available' : 'status-unavailable'}">
              ${isAvailable ? '✓ Available' : '✗ Unavailable'}
            </span>
            <button class="btn btn-primary" ${!isAvailable ? 'disabled' : ''}>View Menu</button>
          </div>
        </div>
      `;
      container.append(truckCard);
    });
  }

  function setupSearch() {
    $('#searchInput').on('keyup', function() {
      const searchTerm = $(this).val().toLowerCase();
      $('.truck-card').each(function() {
        const truckName = $(this).find('h3').text().toLowerCase();
        $(this).toggle(truckName.includes(searchTerm));
      });
    });
  }

  function setupLogout() {
    $('#logoutBtn').on('click', function() {
      if (confirm('Are you sure you want to logout?')) {
        // Call logout API or just redirect
        window.location.href = '/';
      }
    });
  }
});

// Global function for navigation
window.goToMenu = function(truckId) {
  window.location.href = `/truckMenu/${truckId}`;
};
  
function viewMenu(truckId) {
  location.href = `/truckMenu?truckId=${truckId}`;
}
