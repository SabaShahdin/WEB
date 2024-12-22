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

const map = L.map("map").setView([31.5204, 74.3587], 12); // Centered on Lahore
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
}).addTo(map);

let routingControl;
let startLocation, endLocation;
let pickupLocation_lat = null;
let pickupLocation_lon = null;
function setCurrentLocation(inputField) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                startLocation = [lat, lon];
                pickupLocation_lat = lat;
                pickupLocation_lon = lon;
                const customIcon = L.icon({
                    iconUrl: 'images/current_Location.png',
                    iconSize: [45, 45],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });
                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
                    .then((response) => response.json())
                    .then((data) => {
                        const address = data.display_name || `Lat: ${lat}, Lon: ${lon}`;
                        inputField.value = address;
                        map.setView(startLocation, 12);
                        L.marker(startLocation, { icon: customIcon })
                            .addTo(map)
                            .bindPopup("Pickup Location")
                            .openPopup();
                    })
                    .catch(() => showMessage("Failed to get the current location address."));
            },
            () => {
                showMessage("Failed to access location. Please enable location services.");
            }
        );
    } else {
        showMessage("Geolocation is not supported by your browser.");
    }
}

function geocodeLocation(location, callback) {
    let locationParts = location.split(',');

    function tryGeocode(partialLocation) {
        const queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(partialLocation)}&addressdetails=1`;
        fetch(queryUrl)
            .then((response) => response.json())
            .then((data) => {
                if (data.length > 0) {
                    const lat = data[0].lat;
                    const lon = data[0].lon;
                    callback([lat, lon]);
                } else if (locationParts.length > 1) {
                    locationParts.pop();
                    tryGeocode(locationParts.join(','));
                } else {
                    showMessage("Location not found.");
                }
            })
            .catch(error => {
                showMessage("Failed to reverse geocode vehicle location.");
            });
    }
    tryGeocode(location);
}


function searchDestinationLocation(destination) {
    if (!destination) {
        showMessage("Please enter a destination.");
        return;
    }
    geocodeLocation(destination, (coords) => {
        endLocation = coords;
        map.setView(endLocation, 12);
        L.marker(endLocation)
            .addTo(map)
            .bindPopup("Drop-off Location")
            .openPopup();

        if (routingControl) {
            map.removeControl(routingControl);
        }
        routingControl = L.Routing.control({
            waypoints: [L.latLng(startLocation), L.latLng(endLocation)],
            routeWhileDragging: true,
        }).addTo(map);
    });
}
function searchRoute() {
    const pickupLocation = document.getElementById('pickupLocation').value;
    const dropoffLocation = document.getElementById('dropoffLocation').value;
    if (!pickupLocation || !dropoffLocation) {
        showMessage("Please provide both pickup and drop-off locations.");
        return;
    }
    geocodeLocation(pickupLocation, (pickupCoords) => {
        startLocation = pickupCoords;
        pickupLocation_lat = pickupCoords[0];
        pickupLocation_lon = pickupCoords[1];
        geocodeLocation(dropoffLocation, (dropoffCoords) => {
            endLocation = dropoffCoords;
            if (routingControl) {
                map.removeControl(routingControl);
            }
            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(startLocation),
                    L.latLng(endLocation)
                ],
                routeWhileDragging: false,
                createMarker: function (i, waypoint) {
                    return L.marker(waypoint.latLng, {
                        draggable: false,
                        icon: L.icon({
                            iconUrl: i === 0 ? 'images/current_Location.png' : 'images/current_Location.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41]
                        })
                    }).bindPopup(i === 0 ? "Pickup Location" : "Drop-off Location");
                }
            }).addTo(map);
        });
    });
}

document.getElementById('searchDestinationButton').addEventListener('click', function () {
    const destination = document.getElementById('dropoffLocation').value;
    searchDestinationLocation(destination);
});

let vehicleMarkers = [];
let selectedVehicleType = '';
function selectVehicle(type) {
    selectedVehicleType = type;
}
let selectedVehicleLat = null;
let selectedVehicleLng = null;
const carIcon = L.icon({
    iconUrl: 'https://img.icons8.com/color/48/000000/car.png'
    , iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});
const rickshawIcon = L.icon({
    iconUrl: 'https://img.icons8.com/color/48/000000/auto-rickshaw.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});
let vehicleToPickupRouting;
let driverId = null;
function searchVehicles() {
    hideSidebarAndVehicleType();
    if (!startLocation || !endLocation) {
        showMessage("Invalid coordinates. Please provide both pickup and drop-off locations.");
        window.location.href = 'real-time.html';
        return;
    }
    const vehicleType = selectedVehicleType;
    const startCoords = startLocation.join(',');
    const endCoords = endLocation.join(',');
    if (vehicleType === 'car' || vehicleType === 'rickshaw') {
        fetch(`http://localhost:8081/ride/api/vehicles?start=${encodeURIComponent(startCoords)}&end=${encodeURIComponent(endCoords)}&type=${vehicleType}`)
            .then(response => response.json())
            .then(data => {
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '';
                vehicleMarkers.forEach(marker => map.removeLayer(marker));
                vehicleMarkers = [];
                if (!Array.isArray(data)) {
                    const message = data.message || 'Unexpected response format.';
                    showMessage(message);
                    window.location.href = 'real-time.html';
                    return;
                }
                if (data.length === 0) {
                    showMessage("No vehicles found in the selected locations.");
                    window.location.href = 'real-time.html';
                    return;
                }
                data.forEach(vehicle => {
                    const { gps_latitude, gps_longitude, type_name, license_plate, fare, distance, vehicle_id, remaining_capacity, driver_id } = vehicle;
                    const icon = type_name === 'car' ? carIcon : rickshawIcon;
                    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${gps_latitude}&lon=${gps_longitude}&format=json`)
                        .then(response => response.json())
                        .then(geoData => {
                            const areaName = geoData.display_name || `Lat: ${gps_latitude}, Lng: ${gps_longitude}`;
                            map.setView([gps_latitude, gps_longitude], 14);
                            const vehicleMarker = L.marker([gps_latitude, gps_longitude], { icon: icon })
                                .addTo(map)
                                .bindPopup(`${type_name} (${license_plate}) - Fare: $${fare} - Distance: ${distance} km`)
                                .openPopup();
                            vehicleMarkers.push(vehicleMarker);
                            
                            const vehicleDiv = document.createElement('div');
                            vehicleDiv.className = 'vehicle';
                            vehicleDiv.innerHTML = `
                                    <h2>${type_name} (${license_plate})</h2>
                                    <p>Fare: $${fare}</p>
                                    <p>Distance: ${distance} km</p>
                                    <p>Location: ${areaName}</p>
                                    <p>Remaining Capacity: ${remaining_capacity}</p>
                                    <button class="select-vehicle-button" onclick="centerOnVehicle(${gps_latitude}, ${gps_longitude}, '${type_name}', '${license_plate}', ${fare}, ${distance}, ${vehicle_id} , ${remaining_capacity} , ${driver_id})">Select Vehicle</button>
                                `;
                            resultsDiv.appendChild(vehicleDiv);
                        })
                        .catch(error => {
                            console.log("Reverse geocoding error:", error);
                            showMessage("Failed to reverse geocode vehicle location.");
                            window.location.href = 'real-time.html';
                        });
                });
            })
            .catch(error => {
                console.log("Reverse geocoding error:", error);
                showMessage("Error fetching vehicles.");
            });
    } else if (vehicleType === 'bus') {
        window.location.href = 'bus.html';

    }
}

function centerOnVehicle(lat, lng, typeName, licensePlate, fare, distance, vehicleId, remaining_capacity , driver_id) {
    hide();
    // Call seats function if capacity is valid
    if (remaining_capacity > 0) {
        seats(remaining_capacity);
    } else {
        showMessage('No seats available.');
        return;
    }
    paymentMethod();
    hidesss();
    selectedVehicleLat = lat;
    selectedVehicleLng = lng;
    lisence = licensePlate;
    driverId = driver_id;
    map.setView([lat, lng], 15);
    if (vehicleToPickupRouting) {
        map.removeControl(vehicleToPickupRouting);
    }
    vehicleToPickupRouting = L.Routing.control({
        waypoints: [
            L.latLng(lat, lng),
            L.latLng(startLocation)
        ],
        routeWhileDragging: false,
        lineOptions: {
            styles: [{ color: 'green', opacity: 0.8, weight: 6 }]
        },
        createMarker: function (i, waypoint) {
            return L.marker(waypoint.latLng, {
                draggable: false,
                icon: L.icon({
                    iconUrl: i === 0 ? 'images/select.png' : 'images/pickup-icon.png',
                    iconSize: [32, 32],
                    iconAnchor: [12, 41]
                })
            }).bindPopup(i === 0 ? "Vehicle Location" : "Pickup Location");
        }
    }).addTo(map);
    const selectedVehicleDiv = document.getElementById('select');
    if (selectedVehicleDiv) {
        selectedVehicleDiv.innerHTML = `
    <h2>Selected Vehicle:</h2>
    <p>Type: ${typeName}</p>
    <p>License Plate: ${licensePlate}</p>
    <p>Fare: $${fare}</p>
    <p>Distance: ${distance} km</p>
    <p>Remaining Capacity: ${remaining_capacity} km</p>
    <button id="bookNowButton" class="book-now-button" onclick="bookRide(${vehicleId}, ${fare} , ${remaining_capacity})">Book Now</button>
`;
        const searchSection = document.getElementById('searchSection');
        if (searchSection) {
            searchSection.style.display = 'none';
        }
    } else {
        showMessage("The 'selectedVehicle' element was not found.");
    }
}
document.getElementById("useCurrentLocationButton").addEventListener("click", function () {
    setCurrentLocation(document.getElementById('pickupLocation'));
});
document.getElementById("searchVehiclesButton").addEventListener("click", searchVehicles);

const username = localStorage.getItem('username');
let userId = null;
if (username) {
    getUserId(username).then((id) => {
        userId = id;
    });
} else {
    showMessage("No username found in localStorage");
}
async function getUserId(username) {
    try {
        const response = await fetch(`http://localhost:8081/auth/get-user-id/${encodeURIComponent(username)}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        if (data.user_id) {
            localStorage.setItem('user_id', data.user_id);
            return data.user_id;
        } else {
            showMessage("User not found");
            return null;
        }
    } catch (error) {
        showMessage("Error fetching user ID:", error);
    }
}
let selectedSeatNumber = null;
let selectedPaymentMethod = null;
function paymentMethod() {
    document.getElementById("paymentMethodContainer").style.display = "block";
}
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
}
function updateCapacity(vehicle_id, remaining_capacity) {
    fetch('http://localhost:8081/book/api/update-capacity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            vehicle_id: vehicle_id,
            remaining_capacity: remaining_capacity
        })
    })
        .then(response => response.json())
        .then(data => {
            showMessage("The capacity of the vehicle is updated")
        })
        .catch(error => {
            showMessage("There is an error in updating the capacity")
        });
}
let selectFare = null;
let rideId = null;
let passengerId = null;
let storedRideRequests = {};
let vehiclesId = null;
async function bookRide(vehicleId, fare, remaining_capacity) {
    if (!userId) {
        showMessage('User ID not found. Please log in.');
        return;
    }
    if (!selectedPaymentMethod) {
        showMessage('Please select a payment method before booking.');
        return;
    }

    showMessage("Starting booking process...");
    selectFare = fare;
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now - offset).toISOString().slice(0, 19).replace('T', ' ');
    vehiclesId = vehicleId;
    const rideDetails = {
        passenger_id: userId,
        vehicle_id: vehicleId,
        pickup_latitude: pickupLocation_lat,
        pickup_longitude: pickupLocation_lon,
        dropoff_latitude: endLocation[0],
        dropoff_longitude: endLocation[1],
        fare: fare,
        ride_type: "On-Demand",
        booking_time: localTime,
        scheduled_time: localTime,
        seats: selectedSeatNumber,
        paymentMethod: selectedPaymentMethod,
        driverId: driverId || null  // If driver is not logged in, set to null
    };
    try {
        // Send booking request to the backend
        const response = await fetch('http://localhost:8081/book/api/book-ride', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rideDetails),
        });

        const data = await response.json();
        remaining_capacity = remaining_capacity - selectedSeatNumber;

        if (data.message === 'Ride booked successfully') {
            showMessage("Ride booked successfully!");
            updateCapacity(vehicleId, remaining_capacity);
            rideId = data.rideId;  
            passengerId = data.passengerId;  
            hidesss(); 
            reachStop();
        } else {
            showMessage("Failed to book ride.");
        }
    } catch (error) {
        showMessage("Error booking ride." , error);
    }
}
function seats(remaining_capacity) {
    const container = document.getElementById("seatSelectionForm");
    if (!container) {
        showMessage("Problem in seat selection");
        return;
    }
    container.innerHTML = ""; 
    for (let i = 1; i <= remaining_capacity; i++) {
        const radioBtn = document.createElement("input");
        radioBtn.type = "radio";
        radioBtn.name = "seatNumber";
        radioBtn.value = i;
        radioBtn.id = `${i}`;
        const label = document.createElement("label");
        label.htmlFor = `${i}`;
        label.textContent = `${i}`;
        container.appendChild(radioBtn);
        container.appendChild(label);
        container.appendChild(document.createElement("br"));
    }
    container.addEventListener("change", function (event) {
        selectedSeatNumber = event.target.value;
        showMessage("Selected Seat Number:", selectedSeatNumber); 
    });
    document.getElementById("seatSelectionContainer").style.display = "block";
}

// Other utility functions
function hideSidebarAndVehicleType() {
    const sidebar = document.getElementById('sidebar');
    const vehicleTypeSelector = document.getElementById('vehicleType');
    if (sidebar) {
        sidebar.style.display = 'none';
    }

    if (vehicleTypeSelector) {
        vehicleTypeSelector.style.display = 'none';
    }
}

function hide() {
    const vehicleSelect = document.getElementById('results');
    if (vehicleSelect) {
        vehicleSelect.style.display = 'none';
    }
    const Select = document.getElementById('selectedVehicle');
    if (Select) {
        Select.style.display = 'none';
    }
    document.getElementById("select").style.display = "none";
}

function hidesss() {
    document.getElementById("rideDetailsModal").style.display = "none"; // Assume this hides the modal
}

function hidesss() {
    document.getElementById("select").style.display = "none";
    const mapElement = document.getElementById("map");
    mapElement.style.visibility = "hidden";
}
function show() {
    document.getElementById("select").style.display = "block";
    const mapElement = document.getElementById("map");
    mapElement.style.visibility = "visible";
    document.getElementById("paymentMethodContainer").style.display = "none";
    document.getElementById("seatSelectionContainer").style.display = "none";
}

async function payment() {

    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now - offset).toISOString().slice(0, 19).replace('T', ' ');
    const rideDetails = {
        user_id: userId,
        passenger_id: passengerId,
        vehicle_id: vehiclesId,
        pickup_latitude: pickupLocation_lat,
        pickup_longitude: pickupLocation_lon,
        dropoff_latitude: endLocation[0],
        dropoff_longitude: endLocation[1],
        fare: selectFare,
        ride_type: "On-Demand",
        booking_time: localTime,
        scheduled_time: localTime,
        seats: selectedSeatNumber,
        paymentMethod: selectedPaymentMethod,
        driverId: driverId || null  // If driver is not logged in, set to null
    };
    sessionStorage.setItem('rideDetails', JSON.stringify(rideDetails));
    console.log(driverId);
    window.location.href = `payment.html?rideDetails =${rideDetails}&passengerId=${passengerId}&rideId=${rideId}&lisence=${lisence}&paymentMethod=${encodeURIComponent(selectedPaymentMethod)}`;
}
function reachStop() {
    document.getElementById("safeJourneyContainer").style.display = "block";
}
function cancelRide() {
    fetch(`http://localhost:8081/cancel/api/cancel-ride/${rideId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }) // Send userId in the request body
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to cancel ride: ${response.statusText}`);
            }
            return response.json();
        })
        .then(() => {
            showMessage(`Ride ${rideId} cancelled successfully.`);
            updateVehicleStatus();
            window.location.href = 'real-time.html';
        })
        .catch(error => {
           
            showMessage('Failed to cancel the ride. Please try again.' , error );
        });
}

function updateVehicleStatus() {
    showMessage("I entered it ");
    if (!lisence || !rideId) {
        showMessage("Please fill in all the fields.");
        return;
    }
    const data = {
        licensePlate: lisence,
        rideId: rideId
    };
    fetch('http://localhost:8081/real/api/update-vehicle-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showMessage(data.error);
            } else {
                showMessage(data.message);
            }
        })
        .catch(error => {
            showMessage('Something went wrong. Please try again later.' , error);
        });
}

