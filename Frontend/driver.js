// Modal Elements
const modal = document.getElementById("messageModal");
const messageText = document.getElementById("messageText");
const closeModalButton = document.getElementById("closeMessageModal");
function showMessage(message) {
    messageText.textContent = message;
    modal.style.display = "flex";
    modal.style.visibility = "visible";
}
closeModalButton.addEventListener('click', () => {
    modal.style.display = "none";
});
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

function toggleLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.style.display = logoutBtn.style.display === 'block' ? 'none' : 'block';
}

// Logout functionalityusers
function logout() {
    alert('Logged out successfully!');
}

// Function to show selected section
function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';

    const links = document.querySelectorAll('.sidebar nav ul li a');
    links.forEach(link => link.classList.remove('active'));
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
}
let users = null;

let driverId = null;
async function fetchUserSession() {
    try {
        // Retrieve the JWT token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            document.getElementById('user-info').innerHTML = '<p>No user logged in.</p>';
            return;
        }

        // Fetch the user session data
        const response = await fetch('http://localhost:8081/auth/get-session-user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user session.');
        }

        const data = await response.json();

        // Check if the username exists in the response
        if (data.username) {
            document.getElementById('user-info').innerHTML = `
               <p><strong>Welcome </strong> ${data.username}</p>
               ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ''}
               <button class="logout-btn" onclick="logout()">Logout</button>
           `;

            const username = data.username;
            console.log('Username:', username);

            // Fetch the user ID using the username
            const userId = await getUserId(username);
            console.log('User ID:', userId);

            driverId = userId;
            console.log(driverId)
            if (userId) {
                // Check user approval status
                const approvalStatus = await getApprovalStatus(userId);
                if (approvalStatus === 'pending') {
                    disableControls();
                    showMessage('Your account is pending approval. Please wait for admin approval.');
                } else if (approvalStatus === 'approved') {
                    enableControls();
                    await fetchPassengerCount(userId);
                    await fetchRideCount(userId);
                    await fetchRideStatus(userId);
                    await fetchfare(userId);
                    await checkDriverRegistrationStatus();
                    websession();
                    // fetchRideData(userId);
                }
            }
        } else {
            document.getElementById('user-info').innerHTML = '<p>User not found.</p>';
        }
    } catch (error) {
        console.error('Error fetching user session:', error);
        document.getElementById('user-info').innerHTML = `<p>Error fetching user info: ${error.message}</p>`;
    }
}

async function getUserId(username) {
    try {
        const response = await fetch(`http://localhost:8081/auth/get-driver-id/${encodeURIComponent(username)}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        // Check for driver_id instead of user_id
        if (data.driver_id) {
            localStorage.setItem('driver_id', data.driver_id); // Store as driver_id for clarity
            return data.driver_id;
        } else {
            showMessage('Driver not found');
            return null;
        }
    } catch (error) {
        showMessage(`Error fetching driver ID: ${error.message}`);
        return null;
    }
}

async function getApprovalStatus(userId) {
    try {
        const response = await fetch(`http://localhost:8081/driver/check-approval`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ driver_id: userId }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data.registration_status);
        return data.registration_status; // Assuming API returns { status: "pending" or "approved" }
    } catch (error) {
        showMessage(`Error fetching approval status: ${error.message}`);
        return null;
    }
}


function disableControls() {
    const sections = document.querySelectorAll('.content-section, .regi-vehcile, .sidebar nav ul li a');
    sections.forEach(section => section.style.pointerEvents = 'none');
    sections.forEach(section => section.style.opacity = '0.5');
}

function enableControls() {
    const sections = document.querySelectorAll('.content-section, .regi-vehcile, .sidebar nav ul li a');
    sections.forEach(section => section.style.pointerEvents = 'auto');
    sections.forEach(section => section.style.opacity = '1');
}

async function fetchPassengerCount(driverId) {
    try {
        // Ensure the URL matches your backend endpoint, including the driverId as a parameter
        const response = await fetch(`http://localhost:8081/stats/passenger/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Display the passenger count
        const passengerCountElement = document.getElementById('passengerCount');
        passengerCountElement.textContent = `${data.passengerCount}`;
    } catch (error) {
        console.error('Error fetching passenger count:', error);
        document.getElementById('passengerCount').textContent = 'Error loading passenger count';
    }
}
async function fetchRideCount(driverId) {
    try {
        // Ensure the URL matches your backend endpoint, including the driverId as a parameter
        const response = await fetch(`http://localhost:8081/stats/ride/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Display the passenger count
        const rideCountElement = document.getElementById('rideCount');
        rideCountElement.textContent = `${data.rideCount}`;
    } catch (error) {
        console.error('Error fetching passenger count:', error);
        document.getElementById('rideCount').textContent = 'Error loading passenger count';
    }
}
async function fetchRideStatus(driverId) {
    try {
        // Ensure the URL matches your backend endpoint, including the driverId as a parameter
        const response = await fetch(`http://localhost:8081/stats/ride-status/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Display the passenger count
        const rideCountElement = document.getElementById('ridestatus');
        rideCountElement.textContent = `${data.ridestatus}`;
    } catch (error) {
        console.error('Error fetching passenger count:', error);
        document.getElementById('ridestatus').textContent = 'Error loading passenger count';
    }
}
async function fetchfare(driverId) {
    try {
        // Ensure the URL matches your backend endpoint, including the driverId as a parameter
        const response = await fetch(`http://localhost:8081/stats/fare/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Display the passenger count
        const rideCountElement = document.getElementById('fare');
        rideCountElement.textContent = `${data.fare}`;
    } catch (error) {
        console.error('Error fetching passenger count:', error);
        document.getElementById('fare').textContent = 'Error loading passenger count';
    }
}

async function fetchDriverVehicles() {
    try {
        console.log(users);
        const response = await fetch(`http://localhost:8081/driver/vehicles/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const vehicles = await response.json();
        const vehicleListElement = document.getElementById('vehicle-list');
        vehicleListElement.innerHTML = ''; // Clear previous content

        if (vehicles.length === 0) {
            vehicleListElement.innerHTML = '<p>No vehicles found for this driver.</p>';
            return;
        }

        // Create table structure
        const table = document.createElement('table');
        table.className = 'vehicle-table';

        // Table header
        table.innerHTML = `
           <thead>
               <tr>
                   <th>Vehicle ID</th>
                   <th>License Plate</th>
                   <th>Type</th>
                   <th>Status</th>
                   <th>City</th>
                   <th>Location Area</th>
                   <th>Remaining Capacity</th>
                   <th>Actions</th>
               </tr>
           </thead>
           <tbody></tbody>
       `;

        const tableBody = table.querySelector('tbody');

        // Populate table rows
        vehicles.forEach(vehicle => {
            const row = document.createElement('tr');
            // Show "Loading..." initially in the location area cell
            row.innerHTML = `
               <td>${vehicle.vehicle_id}</td>
               <td>${vehicle.license_plate}</td>
               <td>${vehicle.type_name} (Capacity: ${vehicle.capacity})</td>
               <td>${vehicle.status}</td>
               <td>${vehicle.city}</td>
               <td class="area-location">Loading...</td>
               <td>${vehicle.remaining_capacity}</td>
               <td>
                   <button class="delete-btn" onclick="deleteVehicle(${vehicle.vehicle_id})">Delete</button>
               </td>
           `;

            tableBody.appendChild(row);

            // Perform geocoding for the city and GPS coordinates, then update the area in the table
            geocodeLocation(vehicle.city, vehicle.gps_latitude, vehicle.gps_longitude, area => {
                row.querySelector('.area-location').textContent = area;
            });
        });

        // Append the table to the vehicle list element
        vehicleListElement.appendChild(table);
    } catch (error) {
        console.error('Error fetching driver vehicles:', error);
        document.getElementById('vehicle-list').innerHTML = '<p>Error loading vehicles.</p>';
    }
}
function deleteVehicle(vehicleId) {
    fetch(`http://localhost:8081/real/delete-vehicle/${vehicleId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.message) {
            alert(data.message);
            // Optionally reload or update the UI
            location.reload();
        } else {
            alert(data.error || 'An error occurred.');
        }
    })
    .catch((error) => {
        console.error('Error deleting vehicle:', error);
    });
}

// Geocode location to get area name
function geocodeLocation(city, latitude, longitude, callback) {
    const queryUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    fetch(queryUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.address) {
                // Extract area from the geocoding response
                const address = data.address;
                const area = address.neighbourhood || address.suburb || address.village || address.town || address.city || 'Unknown Area';
                callback(area);
            } else {
                callback('Unknown Area');
            }
        })
        .catch(() => {
            callback('Error fetching area');
        });
}
async function checkDriverRegistrationStatus() {
    try {
        const response = await fetch(`http://localhost:8081/driver/can-register/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { canRegister } = await response.json();
        const registerButton = document.getElementById('register-vehicle-btn');

        if (canRegister) {
            // Enable the button and set default text
            registerButton.disabled = false;
            registerButton.textContent = 'Register a New Vehicle';
            window.location.href = 'registervehicle.html';
        } else {
            // Disable the button and show a message
            registerButton.disabled = true;
            registerButton.textContent = 'You can register only one vehicle at a time';
        }
    } catch (error) {
        console.error('Error checking driver registration status:', error);
        const registerButton = document.getElementById('register-vehicle-btn');
        registerButton.disabled = true;
        registerButton.textContent = 'Error loading registration status';
    }
}

let map; 
let pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude;
let driverMarker, pickupMarker, dropoffMarker;
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login copy.html';
    } else {
        fetchUserSession();
    }
});

function websession() {
    const ws = new WebSocket('ws://localhost:8080');
    // WebSocket open event
    ws.addEventListener('open', () => {
        console.log('Connected to the WebSocket server as a driver');
        ws.send(JSON.stringify({
            type: 'driver',
            driverId: driverId, 
        }));
    });
    console.log(driverId);
    ws.addEventListener('message', (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Message received from server:', data);
            // const { pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude } = data.data;

            if (data.type === 'rideRequest' && data.data.driverId === driverId) {
                console.log('Ride request received for the logged-in driver:', data.data);
                pickup_latitude = data.data.pickup_latitude;
                pickup_longitude = data.data.pickup_longitude;
                dropoff_latitude = data.data.dropoff_latitude;
                dropoff_longitude = data.data.dropoff_longitude;
                // Show ride request message
                document.getElementById('ride-request-msg').textContent = `New Ride Request: Pickup - ${data.data.pickup_latitude}, Destination - ${data.data.passengerId}`;

                // Show accept/reject buttons
                const acceptBtn = document.getElementById('accept-ride-btn');
                // const rejectBtn = document.getElementById('reject-ride-btn');

                acceptBtn.style.display = 'inline-block';
                // rejectBtn.style.display = 'inline-block';



                // Prompt driver to accept/reject the ride request (optional confirmation prompt)
                const acceptRide = confirm(`New Ride Request: Pickup - ${data.data.pickup_latitude}, Destination - ${data.data.passenger_id}. Accept ride?`);

                if (acceptRide) {
                    // Add event listener for accepting the ride
                    acceptBtn.addEventListener('click', function () {
                        // Hide the driver section and show the passenger section
                        document.getElementById('dashboard').style.display = 'none';
                        document.getElementById('passenger-management').style.display = 'block';

                        console.log(data.data.passengerId);
                        // Trigger ride updates and proceed with accepting the ride
                        startRideUpdates(data.data.passenger_id, data.data.pickup_latitude, data.data.pickup_longitude);
                    });

                } else {
                    // Handle rejection (could be a server call to update ride status)
                    console.log('Driver rejected the ride request.');
                    // Notify server of ride rejection
                    ws.send(JSON.stringify({
                        type: 'driver',
                        action: 'rejectRide',
                        driverId: driverId,
                        data: {
                            passengerId: data.data.passenger_id,  // Corrected to use passengerId
                        },
                    }));
                    console.log('Ride rejected and response sent to server.');
                }
                if (acceptRide) {
                    // Notify server of ride acceptance
                    ws.send(JSON.stringify({
                        type: 'driver',
                        action: 'acceptRide',
                        driverId: driverId,
                        data: {
                            passengerId: data.data.passenger_id,  // Corrected to use passengerId
                            pickup: data.data.pickup,
                            destination: data.data.destination,
                        },
                    }));
                    console.log('Ride accepted and response sent to server.');
                } else {
                    // Notify server of ride rejection
                    ws.send(JSON.stringify({
                        type: 'driver',
                        action: 'rejectRide',
                        driverId: driverId,
                        data: {
                            passengerId: data.data.passenger_id,  // Corrected to use passengerId
                        },
                    }));
                    console.log('Ride rejected and response sent to server.');
                }
            }
        } catch (error) {
            console.error('Error processing message:', error.message);
        }
    });

    // WebSocket close event
    ws.addEventListener('close', () => {
        console.log('Disconnected from the WebSocket server');
    });

    // WebSocket error event
    ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error.message);
    });
    let locationUpdateInterval; // Variable to hold the interval ID

    // Start ride location updates
    function startRideUpdates(passengerId, dropoffLatitude, dropoffLongitude) {
        console.log("Starting ride location updates for passenger ID:", passengerId);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const initialLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                console.log('Initial Location:', initialLocation);
                // Initialize the map with the driver's location
                initializeMap(initialLocation);
                // Notify server of ride start
                const rideStartMessage = {
                    type: 'startRide',
                    driverId: driverId,
                    passengerId: passengerId,
                    location: initialLocation,
                    role: 'driver',
                };
                console.log("Sending ride start information to server:", JSON.stringify(rideStartMessage));
                ws.send(JSON.stringify(rideStartMessage));

                console.log("Ride start data sent.");
                // Update location every 5 seconds
                console.log("Starting location updates every 5 seconds...");
                locationUpdateInterval = setInterval(() => {
                    sendLocationUpdate(passengerId, dropoffLatitude, dropoffLongitude);
                }, 5000);
            }, handleError);
        } else {
            console.error('Geolocation is not supported by this browser.');
            alert('Geolocation is not supported by this browser.');
        }
    }
    // Continuously update location and send to the server
    function sendLocationUpdate(passengerId, dropoffLatitude, dropoffLongitude) {
        console.log("Sending location update for passenger ID:", passengerId);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                console.log('Updated Location:', currentLocation);
                // Update the driver's marker on the map
                updateDriverMarker(currentLocation);
                // Check if the driver has reached the drop-off location
                const threshold = 0.0001; // Define a proximity threshold
                console.log(Math.abs(currentLocation.lat - dropoffLatitude) <= threshold &&
                    Math.abs(currentLocation.lng - dropoffLongitude) <= threshold);
                console.log(Math.abs(currentLocation.lat - dropoffLatitude));
                console.log(Math.abs(currentLocation.lng - dropoffLongitude));

                // If the driver has reached the drop-off location, send the drop-off location to the server
                if (
                    Math.abs(currentLocation.lat - dropoffLatitude) <= threshold &&
                    Math.abs(currentLocation.lng - dropoffLongitude) <= threshold
                ) {
                    console.log("Driver has reached the drop-off location. Stopping location updates.");
                    alert("Passenger has been dropped off.");

                    // Send drop-off location to the server
                    const dropoffMessage = {
                        type: 'locationUpdate',
                        driverId: driverId,
                        passengerId: passengerId,
                        location: currentLocation,
                        role: 'driver',
                    };
                    document.getElementById('dashboard').style.display = 'block';
                    document.getElementById('passenger-management').style.display = 'none';
                    console.log("Sending drop-off location to server:", JSON.stringify(dropoffMessage));
                    ws.send(JSON.stringify(dropoffMessage));

                    // Stop location updates without closing WebSocket
                    clearInterval(locationUpdateInterval); // Stop sending location updates
                    console.log("Location updates stopped.");
                    return; // Stop further location updates
                }

                // Send location update to the server
                const locationUpdateMessage = {
                    type: 'locationUpdate',
                    driverId: driverId,
                    passengerId: passengerId,
                    location: currentLocation,
                    role: 'driver',
                };
                console.log("Sending location update to server:", JSON.stringify(locationUpdateMessage));
                ws.send(JSON.stringify(locationUpdateMessage));

                console.log("Location update sent.");
            }, handleError);
        } else {
            console.error('Geolocation is not supported by this browser.');
            alert('Geolocation is not supported by this browser.');
        }
    }
}

function handleError(error) {
    console.error("Geolocation Error:", error);

    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.log('User denied the request for Geolocation.');
            alert('User denied the request for Geolocation.');
            break;
        case error.POSITION_UNAVAILABLE:
            console.log('Location information is unavailable.');
            alert('Location information is unavailable.');
            break;
        case error.TIMEOUT:
            console.log('The request to get user location timed out.');
            alert('The request to get user location timed out.');
            break;
        case error.UNKNOWN_ERROR:
            console.log('An unknown error occurred.');
            alert('An unknown error occurred.');
            break;
    }
}

// Initialize the map and add a marker for the driver's current location
function initializeMap(initialLocation) {
    // Create the map centered at the initial location
    map = L.map("map").setView([initialLocation.lat, initialLocation.lng], 12); // Adjust zoom level as needed
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(map);

    // Add a marker for the driver's location
    driverMarker = L.marker([initialLocation.lat, initialLocation.lng]).addTo(map);

    driverMarker.bindPopup("You are here").openPopup();
    // Add markers for pickup and drop-off locations
    if (pickupMarker) map.removeLayer(pickupMarker);
    if (dropoffMarker) map.removeLayer(dropoffMarker);

    pickupMarker = L.marker([pickup_latitude, pickup_longitude])
        .addTo(map)
        .bindPopup('Pickup Location')
        .openPopup();

    dropoffMarker = L.marker([dropoff_latitude, dropoff_longitude])
        .addTo(map)
        .bindPopup('Drop-off Location');

    // Zoom to fit both pickup and drop-off locations
    const bounds = L.latLngBounds(
        [pickup_latitude, pickup_longitude],
        [dropoff_latitude, dropoff_longitude]
    );
    map.fitBounds(bounds);
}

// Update the driver's marker on the map
function updateDriverMarker(location) {
    if (driverMarker) {
        driverMarker.setLatLng([location.lat, location.lng]); // Update marker position
        map.setView([location.lat, location.lng]); // Center the map on the updated location
    }

}