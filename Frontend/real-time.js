// Initialize map centered on Lahore
console.log("Initializing map centered on Lahore.");
const map = L.map('map').setView([31.5497, 74.3436], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markers = [];
const icons = {
    car: L.icon({ iconUrl: 'https://img.icons8.com/color/48/000000/car.png', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] }),
    rickshaw: L.icon({ iconUrl: 'https://img.icons8.com/color/48/000000/auto-rickshaw.png', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] }),
    bus: L.icon({ iconUrl: 'https://img.icons8.com/color/48/000000/bus.png', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] })
};

// Connect to WebSocket for real-time vehicle data
console.log("Connecting to WebSocket for real-time vehicle data.");
const socket = new WebSocket('ws://localhost:8080');
// Event listener for filter button click
document.getElementById('applyFilterButton').addEventListener('click', fetchFilteredVehicles);
window.onload = loadAreas();
function loadAreas() {
    console.log("Fetching areas for dropdown.");
    fetch('http://localhost:8081/get-area/areas')
        .then(response => response.json())
        .then(areas => {
            const areaFilter = document.getElementById('areaFilter');
            areas.forEach(area => {
                const option = document.createElement('option');
                option.value = area.area_name; // Area name to be used as the value
                option.textContent = area.area_name; // Area name displayed in the dropdown
                areaFilter.appendChild(option);
            });
            
        })
        .catch(error => showMessage('Error fetching areas:', error));
}

function fetchFilteredVehicles() {
    const vehicleFilter = document.getElementById('vehicleFilter').value || 'All'; // Default to 'All' if empty
    const statusFilter = document.getElementById('statusFilter').value || 'All'; // Default to 'All' if empty
    const areaFilter = document.getElementById('areaFilter').value || 'All'; // Default to 'All' if empty
    // Construct the URL with filters, ensuring proper handling of empty or default values
    const url = `http://localhost:8081/real/all-vehicles?type=${vehicleFilter}&status=${statusFilter}&area=${areaFilter}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(vehicleData => {
            if (Array.isArray(vehicleData) && vehicleData.length > 0) {
                addVehicleMarkers(vehicleData);  
            } else {
                showMessage('No vehicles found for the selected filters.');
            }
        })
        .catch(error => showMessage('Error fetching filtered vehicles:', error));
}
function addVehicleMarkers(vehicleData) {
    
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    const vehicleFilter = document.getElementById('vehicleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const filteredData = vehicleData.filter(vehicle => 
        (vehicleFilter === 'All' || vehicle.type_name === vehicleFilter) && 
        (statusFilter === 'All' || vehicle.status === statusFilter)
    );
    filteredData.forEach(vehicle => {
        const lat = parseFloat(vehicle.gps_latitude);
        const lon = parseFloat(vehicle.gps_longitude);
        const marker = L.marker([lat, lon], { icon: icons[vehicle.type_name.toLowerCase()] || icons['car'] })
            .addTo(map)
            .bindPopup(`<h3>${vehicle.type_name}</h3><p>License Plate: ${vehicle.license_plate}</p><p>Status: ${vehicle.status}</p>`);
        markers.push(marker);
    });
    if (markers.length) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds());
    } else {
        showMessage("No markers to display.");
    }
}

document.getElementById('applyFilterButton').addEventListener('click', () => {
    fetchFilteredVehicles();
});

// WebSocket listener for real-time updates
socket.addEventListener('message', function(event) {
    const vehicleData = JSON.parse(event.data);
    addVehicleMarkers(vehicleData); // Update markers based on WebSocket data
});

socket.addEventListener('open', () => console.log("WebSocket connection opened."));
socket.addEventListener('error', error => console.error("WebSocket error:", error));
socket.addEventListener('close', () => console.log("WebSocket connection closed."));
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