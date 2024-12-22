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
let pickupLocation_lat, pickupLocation_lon;
let dropoffLocation_lat, dropoffLocation_lon;


const map = L.map("map").setView([31.5204, 74.3587], 12); // Centered on Lahore
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
}).addTo(map);

let routingControl;
function setCurrentLocation(inputField) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                pickupLocation_lat = position.coords.latitude;
                pickupLocation_lon = position.coords.longitude;

                startLocation = [pickupLocation_lat, pickupLocation_lon];

                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pickupLocation_lat}&lon=${pickupLocation_lon}&format=json`)
                    .then(response => response.json())
                    .then(data => {
                        const address = data.display_name || `Lat: ${pickupLocation_lat.toFixed(2)}, Lon: ${pickupLocation_lon.toFixed(2)}`;
                        inputField.value = address;

                        map.setView(startLocation, 12);
                        L.circleMarker(startLocation, {
                            color: "blue",
                            radius: 8,
                        }).addTo(map)
                            .bindPopup("Current Location")
                            .openPopup();
                    })
                    .catch(() => showMessage("Failed to get the current location address."));
            },
            () => showMessage("Failed to access location. Please enable location services.")
        );
    } else {
        showMessage("Geolocation is not supported by your browser.");
    }
}

function geocodeLocation(location, callback) {
    let locationParts = location.split(','); // Split the location into parts
    let queryUrl;

    function tryGeocode(partialLocation) {
        queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(partialLocation)}&addressdetails=1`;

        fetch(queryUrl)
            .then((response) => response.json())
            .then((data) => {

                if (data.length > 0) {
                    const lat = data[0].lat;
                    const lon = data[0].lon;
                    callback([lat, lon]); // Found a match
                } else if (locationParts.length > 1) {
                    locationParts.pop(); // Remove the last part and retry
                    tryGeocode(locationParts.join(',')); // Retry with a simplified address
                } else {
                    showMessage("Location not found.");
                }
            })
            .catch(() => showMessage("Failed to geocode location."));
    }

    // Start the geocoding process
    tryGeocode(location);
}
document.getElementById("useCurrentLocationButton").addEventListener("click", () => {
    const inputField = document.getElementById("pickupLocation");
    setCurrentLocation(inputField);
});

let vehicleMarkers = [];
let startLocation;
let selectedBusId;
let nearestStopCoords;
let selectedDestinationStop = null;
let lisence = null;
let selectedVehicleLat = null;
let selectedVehicleLng = null;
let nearestlat = null;
let nearestlng = null;
let routeCoordinates = [];
let stopnumber = null;
let route ;
let driverId = null;
// Function to search for buses within the 5 km radius of the user's current location
function searchVehicles() {
    hideInput();
    console.log("Hiding input fields and starting vehicle search.");

    if (!startLocation) {
        showMessage("Invalid coordinates. Please provide both pickup and drop-off locations.");
        console.log("Error: Start location is not defined.");
        return;
    }

    const vehicleType = 'Bus';
    const startCoords = startLocation.join(',');
    console.log(`Start location coordinates: ${startCoords}`);

    // Fetch buses within the 5 km radius of the start location
    fetch(`http://localhost:8081/bus/api/get-all-buses?lat=${encodeURIComponent(startLocation[0])}&lng=${encodeURIComponent(startLocation[1])}`)
        .then(response => {
            console.log("Response received from bus API:", response);
            return response.json();
        })
        .then(data => {
            console.log("Data fetched from API:", data);

            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = ''; // Clear previous results

            // Remove previous markers from the map
            console.log("Clearing previous vehicle markers.");
            vehicleMarkers.forEach(marker => map.removeLayer(marker));
            vehicleMarkers = []; // Clear the markers array

            if (!Array.isArray(data)) {
                const message = data.message || 'Unexpected response format.';
                resultsDiv.innerHTML = `${message}`;
                console.log("Error: Unexpected response format.", data);
                return;
            }

            if (data.length === 0) {
                resultsDiv.innerHTML = 'No buses found near your location.';
                console.log("No buses found near the start location.");
                return;
            }

            // Process each bus
            data.forEach(vehicle => {
                const { gps_latitude, gps_longitude, type_name, license_plate, fare, distance, vehicle_id, remaining_capacity  , driver_id } = vehicle;
                console.log("Processing vehicle:", vehicle);

                if (!gps_latitude || !gps_longitude) {
                    showMessage('Invalid vehicle coordinates:', vehicle);
                    console.log("Error: Invalid GPS coordinates for vehicle:", vehicle);
                    return; // Skip this vehicle if GPS coordinates are missing or invalid
                }

                const fareValue = !isNaN(fare) && fare !== undefined ? parseFloat(fare) : 0;
                const distanceValue = !isNaN(distance) && distance !== undefined ? parseFloat(distance) : 0;

                console.log(`Vehicle ${license_plate} - Fare: ${fareValue}, Distance: ${distanceValue} km`);
                
                // Fetch location info for the bus using reverse geocoding
                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${gps_latitude}&lon=${gps_longitude}&format=json`)
                    .then(response => {
                        console.log("Response from reverse geocoding:", response);
                        return response.json();
                    })
                    .then(geoData => {
                        console.log("Geocoding data received:", geoData);

                        if (geoData && geoData.display_name) {
                            const areaName = geoData.display_name;

                            // Create a marker for the bus on the map
                            const vehicleMarker = L.marker([gps_latitude, gps_longitude])
                                .addTo(map)
                                .bindPopup(`${type_name} (${license_plate}) - Fare: $${fareValue.toFixed(2)} - Distance: ${distanceValue.toFixed(2)} km`)
                                .openPopup();
                            vehicleMarkers.push(vehicleMarker);
                            
                            console.log(`Added marker for vehicle ${license_plate} at ${gps_latitude}, ${gps_longitude}.`);
                           
                            // Create vehicle details for the user to view
                            const vehicleDiv = document.createElement('div');
                            vehicleDiv.className = 'vehicle';
                            vehicleDiv.innerHTML = `
                                <h2>${type_name} (${license_plate})</h2>
                                <p>Fare: Rs.${fareValue.toFixed(2)}</p>
                                <p>Distance: ${distanceValue.toFixed(2)} km</p>
                                <p>Location: ${areaName}</p>
                                <p>Remaining Capacity: ${remaining_capacity}</p>
                                <p>Remaining Capacity: ${driver_id}</p>
                                <p>Remaining : ${driverId}</p>
                                
                                <button class="select-vehicle-button" onclick="centerOnVehicle(${gps_latitude}, ${gps_longitude}, '${type_name}', '${license_plate}', ${fare}, ${distance}, ${vehicle_id}, ${remaining_capacity} , ${driver_id})">Select Vehicle</button>
                            `;
                            resultsDiv.appendChild(vehicleDiv);
                        } else {
                            showMessage('Geocoding result is empty or invalid for vehicle:', vehicle);
                            console.log("Error: Invalid geocoding data for vehicle:", vehicle);
                        }
                    })
                    .catch(err => {
                        showMessage('Failed to reverse geocode vehicle location for:', vehicle, err);
                        console.log("Error during reverse geocoding:", err);
                    });
            });
        })
        .catch(error => {
            showMessage('Error fetching buses:', error);
            console.log("Error fetching buses:", error);
            document.getElementById('results').innerHTML = 'Error fetching buses.';
        });
}

function centerOnVehicle(gps_latitude, gps_longitude, type_name, license_plate, fareValue, distanceValue, vehicle_id, remaining_capacity , driver_id) {
    hide();
    // Call seats function if capacity is valid
    if (remaining_capacity > 0) {
        seats(remaining_capacity);
    } else {
        showMessage('No seats available.');
        return;
    }
    paymentMethod();
    hidesss();// Add button dynamically to show functionality
driverId = driver_id
    document.getElementById("results").style.display = 'none';
    
    selectedBusId = vehicle_id;
    map.setView([gps_latitude, gps_longitude], 13);
    selectedVehicleLat = gps_latitude;
    selectedVehicleLng = gps_longitude;
    lisence = license_plate;
    fetch(`http://localhost:8081/bus/api/get-bus-stops?vehicle_id=${vehicle_id}`)
        .then(response => response.json())
        .then(data => {

            if (Array.isArray(data) && data.length > 0) {
                busStops = data;
console.log(data);
                // Find the nearest bus stop to the user's location
                let nearestStop = null;
                let minDistance = Infinity;

                busStops.forEach(stop => {
                    const stopLat = stop.lat;
                    const stopLng = stop.lng;
stopnumber = stop.stop_order;
console.log(stopnumber);
                    // Calculate distance from user's current location to the bus stop
                    const distance = calculateDistance(pickupLocation_lat, pickupLocation_lon, stopLat, stopLng);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestStop = stop;
                    }
                });

                if (nearestStop) {
                    nearestStopCoords = [nearestStop.lat, nearestStop.lng];
                    nearestlat = nearestStop.lat;
                    nearestlng = nearestStop.lng;
                    console.log(nearestlat);
                    console.log(nearestlng);
                    // Create a new routing control to fetch the route between pickup location and nearest stop
                    vehicleToPickupRouting = L.Routing.control({
                        waypoints: [
                            L.latLng(startLocation[0], startLocation[1]),  // Pickup location
                            L.latLng(nearestlat, nearestlng)  // Nearest stop
                        ],
                        routeWhileDragging: false,
                        lineOptions: {
                            styles: [{ color: 'red', opacity: 0.8, weight: 6 }]
                        },
                    }).addTo(map);
                    const nearestStopMarker = L.marker(nearestStopCoords).addTo(map)
                        .bindPopup(`Nearest Stop: ${nearestStop.area_name}`).openPopup();
                }

                // Populate dropdown with stop names
                const dropdown = document.getElementById('destinationDropdown');
                dropdown.innerHTML = ''; // Clear any previous options
                busStops.forEach((stop, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `Stop ${index + 1} - ${stop.area_name}`;
                    dropdown.appendChild(option);
                });

                // Additional logic to add all stops on the map, if required
                busStops.forEach((stop, index) => {
                    const stopCoordinates = [stop.lat, stop.lng];
                    const stopMarker = L.marker(stopCoordinates).addTo(map)
                        .bindPopup(`Stop ${index + 1}`);
                    vehicleMarkers.push(stopMarker);
                });
                const route = L.polyline(busStops.map(stop => [stop.lat, stop.lng]), { color: 'blue' }).addTo(map);
                map.fitBounds(route.getBounds());
                routeCoordinates = busStops.map(stop => {
                    if (stop.lat && stop.lng) {
                        showMessage([parseFloat(stop.lat), parseFloat(stop.lng)]);
                        return [parseFloat(stop.lat), parseFloat(stop.lng)];

                    } else {
                        console.error("Invalid stop coordinates:", stop);
                        return null;  // or handle it appropriately
                    }
                }).filter(coord => coord !== null);

                // Event listener for "Set Destination" button
                document.getElementById("setDestinationBtn").addEventListener('click', () => {
                    const selectedStopIndex = dropdown.value;
                    selectedDestinationStop = busStops[selectedStopIndex];
                    displayRouteAndInfo(gps_latitude, gps_longitude, type_name, license_plate, fareValue, distanceValue, selectedDestinationStop, vehicle_id, remaining_capacity);
                });
            } else {
                showMessage('No bus stops found for the selected vehicle.');

                window.location.href = 'fare.html';
            }
        })
        .catch(error => {
            showMessage('Error fetching bus stops:', error);
        });
}

function displayRouteAndInfo(gps_latitude, gps_longitude, type_name, license_plate, fareValue, distanceValue, destinationStop, vehicle_id, remaining_capacity) {
    document.getElementById("destinationDropdown").style.display = 'none';
    document.getElementById("setDestinationBtn").style.display = 'none';

    // Center map on selected destination stop
    const destinationCoords = [destinationStop.lat, destinationStop.lng];
    map.setView(destinationCoords, 13);
    // Fetch human-readable address for pickup location using geocoding
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pickupLocation_lat}&lon=${pickupLocation_lon}&format=json`)
        .then(response => response.json())
        .then(data => {
            const pickupAddress = data.display_name || `${pickupLocation_lat}, ${pickupLocation_lon}`;
            const selectedVehicleDiv = document.getElementById('select');
            selectedVehicleDiv.style.display = 'block';
            selectedVehicleDiv.innerHTML = `
                <h2>Selected Vehicle:</h2>
                <p>Type: ${vehicle_id}</p>
                <p>Type: ${type_name}</p>
                <p>License Plate: ${license_plate}</p>
                <p>Fare: Rs.${fareValue}</p>
                <p>Distance to destination: ${distanceValue.toFixed(2)} km</p>
                <p>Destination Stop: ${destinationStop.area_name}</p>
                <p>Pickup Location: ${pickupAddress}</p>
                 <p>Remaining Capacity: ${remaining_capacity} km</p>
    <button id="bookNowButton" class="book-now-button" onclick="bookRide(${vehicle_id}, ${fareValue} , ${remaining_capacity})">Book Now</button>
            `;

        })
        .catch(error => {
            showMessage("Error fetching pickup address:", error);
           
        });
}
let destinationIndex = null
document.getElementById('setDestinationBtn').addEventListener('click', function () {
    const dropdown = document.getElementById('destinationDropdown');
    const selectedIndex = dropdown.value;

    if (selectedIndex !== "") {
        const selectedStop = busStops[selectedIndex];
        dropoffLocation_lat = selectedStop.lat;
        dropoffLocation_lon = selectedStop.lng;
        map.setView([dropoffLocation_lat, dropoffLocation_lon], 13);
destinationIndex = selectedStop;
console.log(destinationIndex);
        // Add a marker for the destination
        const destinationMarker = L.marker([dropoffLocation_lat, dropoffLocation_lon]).addTo(map)
            .bindPopup(`Destination: Stop ${selectedIndex + 1}`).openPopup();

        vehicleMarkers.push(destinationMarker);
    } else {
        showMessage("Please select a destination stop.");
    }
});
document.getElementById("searchVehiclesButton").addEventListener("click", searchVehicles);

function hideInput() {
    const sidebar = document.getElementById('searchSection');
    if (sidebar) {
        sidebar.style.display = 'none';
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in kilometers
    return distance;
}


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
// Global variable to store the selected seat
let selectedSeatNumber = null;
// Global variable to store the selected payment method
let selectedPaymentMethod = null;

// Function to display the payment method container
function paymentMethod() {
    document.getElementById("paymentMethodContainer").style.display = "block";
}

// Function to store the selected payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    console.log(`Selected payment method: ${selectedPaymentMethod}`);
}
function updateCapacity(vehicle_id, remaining_capacity) {
    console.log(`Updating database for vehicle: ${vehicle_id}, Latitude: ${remaining_capacity}`);
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
            console.log('Database update successful', data);
        })
        .catch(error => {
            console.error('Error updating the database:', error);
        });
}
let selectFare = null;
let rideId = null;
let passengerId = null;
let vehiclesId = null;
async function bookRide(vehicle_id, fare, remaining_capacity) {
    console.log("Remaining Capacity:", remaining_capacity);
    if (!userId) {
        showMessage('User ID not found. Please log in.');
        return;
    }

    if (!selectedPaymentMethod) {
        showMessage('Please select a payment method before booking.');
        return;
    }
    console.log("Starting booking process...");
    selectFare = fare;
    const bookingTime = new Date();
    const formattedBookingTime = bookingTime.toISOString().slice(0, 19).replace('T', ' ');
    vehiclesId = vehicle_id;
    const rideDetails = {
        passenger_id: userId,
        vehicle_id: vehicle_id,
        pickup_latitude: pickupLocation_lat,
        pickup_longitude: pickupLocation_lon,
        dropoff_latitude: dropoffLocation_lat,
        dropoff_longitude: dropoffLocation_lon,
        fare: fare,
        ride_type: "On-Demand",
        booking_time: formattedBookingTime,
        scheduled_time: formattedBookingTime,
        seats: selectedSeatNumber,
        paymentMethod: selectedPaymentMethod,
        driverId: driverId || null  // If driver is not logged in, set to null
        
    };
    alert(driverId);
    try {
        const response = await fetch('http://localhost:8081/book/api/bus-book-ride', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rideDetails),
        });
        const data = await response.json();
        remaining_capacity = remaining_capacity - selectedSeatNumber;
        console.log(remaining_capacity);
        if (data.message === 'Ride booked successfully') {
            updateCapacity(vehicle_id, remaining_capacity);
            showMessage("Ride booked successfully!");
            rideId = data.rideId;  // Assuming the response includes the rideId
            passengerId = data.passengerId;  // Assuming the response includes the passengerId
            console.log('Ride ID:', rideId);
            console.log('Passenger ID:', passengerId);
            hidesss();
            reachStop();
        } else {
            showMessage("Failed to book ride.");
        }
    } catch (error) {
        console.error("Error booking ride:", error);
        showMessage("Error booking ride.");
    }
}
// Function to generate seat selection
function seats(remaining_capacity) {
    console.log("Generating seat selection..."); // Confirm function is called

    const container = document.getElementById("seatSelectionForm");
    if (!container) {
        console.error("seatSelectionForm not found");
        return;
    }

    container.innerHTML = ""; // Clear previous content

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

    // Add event listener to track selected seat
    container.addEventListener("change", function (event) {
        selectedSeatNumber = event.target.value;
        console.log("Selected Seat Number:", selectedSeatNumber); // Confirm value is stored
    });

    // Display the seat selection container
    document.getElementById("seatSelectionContainer").style.display = "block";
}



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
}
function hidesss() {
    document.getElementById("select").style.display = "none";
    const mapElement = document.getElementById("map");
    mapElement.style.visibility = "hidden";

}
function show() {
    document.getElementById("destinationDropdown").style.display = 'block';
    document.getElementById("setDestinationBtn").style.display = 'block';
    document.getElementById("select").style.display = "block";
    const mapElement = document.getElementById("map");
    mapElement.style.visibility = "visible";
    document.getElementById("paymentMethodContainer").style.display = "none";
    document.getElementById("seatSelectionContainer").style.display = "none";
}

function storeDataAndNavigate() {
    const dataToStore = {
        startLocation,
        nearestlat,
        nearestlng,
        routeCoordinates,
        destinationIndex,
        lisence,
        stopnumber,
    };
    // Store the data in localStorage
    localStorage.setItem("busData", JSON.stringify(dataToStore));
    console.log("Data stored in localStorage:", dataToStore);
    const url = `buspayment.html?fare=${encodeURIComponent(selectFare)}&paymentMethod=${encodeURIComponent(selectedPaymentMethod)}&passengerId=${passengerId}&rideId=${rideId}`;
    window.location.href = url;
}


function payment() {
    const bookingTime = new Date();
    const formattedBookingTime = bookingTime.toISOString().slice(0, 19).replace('T', ' ');
    const rideDetails = {
        // passenger_id: userId,
        // vehicle_id: vehiclesId,
        // pickup_latitude: pickupLocation_lat,
        // pickup_longitude: pickupLocation_lon,
        // dropoff_latitude: dropoffLocation_lat,
        // dropoff_longitude: dropoffLocation_lon,
        // fare: selectFare,
        // ride_type: "On-Demand",
        // booking_time: formattedBookingTime,
        // scheduled_time: formattedBookingTime,
        // seats: selectedSeatNumber,
        // paymentMethod: selectedPaymentMethod,
        user_id: userId,
        passenger_id: passengerId,
        vehicle_id: vehiclesId,
        pickup_latitude: nearestlat,
        pickup_longitude: nearestlng,
        dropoff_latitude: dropoffLocation_lat,
        dropoff_longitude: dropoffLocation_lon,
        fare: selectFare,
        ride_type: "On-Demand",
        booking_time: formattedBookingTime,
        scheduled_time: formattedBookingTime,
        seats: selectedSeatNumber,
        paymentMethod: selectedPaymentMethod,
        driverId: driverId || null  // If driver is not logged in, set to null
    };
    alert(rideDetails.driverId);
    sessionStorage.setItem('rideDetails', JSON.stringify(rideDetails));
    sessionStorage.setItem('routeCoordinates' ,JSON.stringify(routeCoordinates));
    const url = `buspayment.html?rideDetails =${rideDetails}&routeCoordinates =${routeCoordinates}&fare=${encodeURIComponent(selectFare)}&paymentMethod=${encodeURIComponent(selectedPaymentMethod)}&lisence=${lisence}&passengerId=${passengerId}&rideId=${rideId}&pickupLocation_lat=${pickupLocation_lat}&pickupLocation_lng=${pickupLocation_lon}`;
    window.location.href = url;

}

function reachStop() {
    document.getElementById("safeJourneyContainer").style.display = "block";
}



function cancelRide() {
    console.log(rideId);
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
        console.error('Error cancelling ride:', error);
        showMessage('Failed to cancel the ride. Please try again.');
    });
    }
  // Function to handle the form submission
  function updateVehicleStatus() {
    // Validate the input fields
    if (!lisence || !rideId) {
        showMessage("Please fill in all the fields.");
        return;
    }

    // Prepare the data to send to the backend
    const data = {
        licensePlate: lisence,
        rideId: rideId
    };

    // Make the API request
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
            console.error('Error:', error);
            showMessage('Something went wrong. Please try again later.');
        });
}

