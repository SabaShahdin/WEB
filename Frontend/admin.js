
// Function to fetch and display pending driver requests
function fetchPendingDriverRequests() {
    fetch('http://localhost:8081/driver/api/pending-drivers')
        .then(response => response.json())
        .then(data => {
            const driverListContainer = document.getElementById('pending-driver-list');
            // driverListContainer.innerHTML = ''; // Clear existing content

            if (data.length === 0) {
                driverListContainer.innerHTML = '<p>No pending driver requests at the moment.</p>';
                return;
            }

            data.forEach(driver => {
                // Create a container for each driver
                const driverDiv = document.createElement('div');
                driverDiv.classList.add('driver-card');

                driverDiv.innerHTML = `
                        <h3>${driver.driver_name}</h3>
                        <p><strong>Email:</strong> ${driver.driver_email}</p>
                        <p><strong>Contact:</strong> ${driver.contact_number}</p>
                        <p><strong>License Number:</strong> ${driver.license_number}</p>
                        <p><strong>Vehicle Registration:</strong> ${driver.vehicle_registration_number}</p>
                        <p><strong>Vehicle Type:</strong> ${driver.vehicle_type}</p>
                        <div class="driver-actions">
                            <button onclick="approveDriver(${driver.driver_id}, '${driver.vehicle_registration_number}')">Approve</button>
                            <button onclick="rejectDriver(${driver.driver_id}, '${driver.vehicle_registration_number}')">Reject</button>
                        </div>
                    `;

                driverListContainer.appendChild(driverDiv);
            });
        })
        .catch(error => {
            console.error('Error fetching driver requests:', error);
            document.getElementById('pending-driver-list').innerHTML = '<p>Error loading data. Please try again later.</p>';
        });
}

// Function to approve a driver
function approveDriver(driverId, vehicleRegNumber) {
    fetch('http://localhost:8081/driver/api/approve-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            driver_id: driverId,
            vehicle_registration_number: vehicleRegNumber
        })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message || 'Driver approved successfully!');
            fetchPendingDriverRequests(); // Refresh the list
        })
        .catch(error => {
            console.error('Error approving driver:', error);
            alert('Error approving driver. Please try again.');
        });
}

// Function to reject a driver
function rejectDriver(driverId, vehicleRegNumber) {
    fetch('http://localhost:8081/driver/api/reject-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            driver_id: driverId,
            vehicle_registration_number: vehicleRegNumber
        })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message || 'Driver rejected successfully!');
            fetchPendingDriverRequests(); // Refresh the list
        })
        .catch(error => {
            console.error('Error rejecting driver:', error);
            alert('Error rejecting driver. Please try again.');
        });
}

// Fetch the city count from the backend and display it
async function fetchPassengerCount() {
    try {
        const response = await fetch('http://localhost:8081/stats/passenger-count'); // Ensure the URL matches your API endpoint
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
  
        // Display the city count
        const passengerCountElement = document.getElementById('passengerCount');
        passengerCountElement.textContent = `${data.passengerCount}`;
    } catch (error) {
        console.error('Error fetching passenger count:', error);
        document.getElementById('passengerCount').textContent = 'Error loading passenger count';
    }
  }

  // Fetch the city count from the backend and display it
async function fetchvehiclesCount() {
    try {
        const response = await fetch('http://localhost:8081/stats/vehicles-count'); // Ensure the URL matches your API endpoint
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
  console.log(data);
        // Display the city count
        const vehiclesCountElement = document.getElementById('vehiclesCount');
        vehiclesCountElement.textContent = `${data.vehicleCount}`;
        console.log(vehiclesCountElement.textContent = `${data.vehicleCount}`);
    } catch (error) {
        console.error('Error fetching vehicles count:', error);
        document.getElementById('vehiclesCount').textContent = 'Error loading vehicles count';
    }
  }
  
  async function fetchdriverCount() {
    try {
        const response = await fetch('http://localhost:8081/stats/driver-count'); // Ensure the URL matches your API endpoint
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
  console.log(data);
        // Display the city count
        const driverCountElement = document.getElementById('driverCount');
        driverCountElement.textContent = `${data.driverCount}`;
        console.log(driverCountElement.textContent = `${data.driverCount}`);
    } catch (error) {
        console.error('Error fetching vehicles count:', error);
        document.getElementById('driverCount').textContent = 'Error loading driver count';
    }
  }
      // Ensure the functions run after the DOM content is fully loaded
      document.addEventListener('DOMContentLoaded', () => {
        // fetchCityCount();
        fetchPassengerCount();
        fetchvehiclesCount();
        fetchdriverCount();
      });