// Modal Elements
const modal = document.getElementById("messageModal");
const messageText = document.getElementById("messageText");
const closeModalButton = document.getElementById("closeMessageModal");
function showMessage(message) {
    
    if (messageText && modal) {
        messageText.textContent = message; // Set the message text
        modal.style.display = "flex"; // Show the modal
        modal.style.visibility = "visible"; // Ensure it is visible
    } else {
        console.log('Modal or messageText is undefined');
    }
}
// Close the modal when the user clicks the close button
closeModalButton.addEventListener('click', () => {
    modal.style.display = "none"; // Hide the modal
});

// Close the modal if the user clicks outside of it
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = "none"; // Hide the modal
    }
});

document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission
    // Collect form data
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    // Create a data object to send in the request
    const data = {
        name: name,
        email: email,
        phone: phone,
        message: message
    };
    // Send data to the server
    fetch('http://localhost:8081/submit-contact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message); // Display success message in the modal
    })
    .catch((error) => {
        
        showMessage('There was an error. Please try again.' , error); // Show error message in the modal
    });
});
