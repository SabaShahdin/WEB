const firebaseConfig = {
  apiKey: "AIzaSyCqMmaRCvBoo61LxWaqpqnlnbrj436RU28",
  authDomain: "transport-management-sys-ce9dd.firebaseapp.com",
  projectId: "transport-management-sys-ce9dd",
  storageBucket: "transport-management-sys-ce9dd.appspot.com",
  messagingSenderId: "679430301511",
  appId: "1:679430301511:web:d40d99ce37e9352bb94e62",
  measurementId: "G-04MT0ECCZ5"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
// Toggle between sign-up and sign-in views
const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");
signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});
signInButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});
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

document.getElementById('loginForm').addEventListener('submit', async function (event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const response = await fetch('http://localhost:8081/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    showMessage(data.message);
    setTimeout(() => {
      
        window.location.href = 'driver.html';
      
    }, 3000);
  }
});

async function fetchUserData() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('Token is missing!');
    return;
  }
  try {
    const response = await fetch('http://localhost:8081/auth/get-user-data', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    if (response.status === 403) {
      const refreshResponse = await fetch('http://localhost:8081/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') })
      });
      const refreshData = await refreshResponse.json();
      if (refreshData.newToken) {
        localStorage.setItem('token', refreshData.newToken);
        fetchUserData();
      }
    } else {
      const data = await response.json();
    }
  } catch (error) {
    showMessage('Error fetching user data:', error);
  }
}
