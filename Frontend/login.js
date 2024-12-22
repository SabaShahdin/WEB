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
// Google Sign-In with JWT
document.getElementById('google-signin-btn').addEventListener('click', function (event) {
  event.preventDefault();
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(async (result) => {
      const user = result.user;
      const role = user.email.includes('@admin.com') ? 'Admin' : 'Passenger';
      const data = {
        email: user.email,
        username: user.displayName,
        contact_number: user.phoneNumber || null,
        role: role
      };
      const response = await fetch('http://localhost:8081/auth/google-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (response.ok) {
        localStorage.setItem('token', responseData.token);
        showMessage(responseData.message);
        setTimeout(() => {
          if (role === 'Admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'real-time.html'; 
          }
        }, 3000);
      } else {
        showMessage('Login failed. Please try again.');
      }
    })
    .catch((error) => {
      showMessage("Login failed. Please try again.");
    });
});
// Handle sign-up form submission
document.getElementById("signUpForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("signUpUsername").value;
  const email = document.getElementById("signUpEmail").value;
  const password = document.getElementById("signUpPassword").value;
  const contactNumber = document.getElementById("signUpContact").value;
  const role = email.includes('@admin.com') ? 'Admin' : 'Passenger';
  const data = {
    username: username,
    email: email,
    password: password,
    contact_number: contactNumber,
    role: role
  };
  fetch('http://localhost:8081/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showMessage(data.error);
      } else {
        showMessage(data.message);
        document.getElementById("signUpForm").reset();
        container.classList.remove("right-panel-active");
      }
    })
    .catch((error) => {
      showMessage('Error during sign-up. Please try again.');
    });
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
      if (data.role === 'Admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'real-time.html';
      }
    }, 3000);
  }
});

// Handle Google sign-up
document.getElementById('google-signup-btn').addEventListener('click', function (event) {
  event.preventDefault();
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(async (result) => {
      const user = result.user;
      const role = user.email.includes('@admin.com') ? 'Admin' : 'Passenger';
      const data = {
        email: user.email,
        password: null,
        username: user.displayName,
        contact_number: user.phoneNumber || null,
        role: role
      };
      fetch('http://localhost:8081/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            showMessage(data.error);
          } else {
            showMessage(data.message);
            document.getElementById("signUpForm").reset();
            container.classList.remove("right-panel-active");
          }
        })
        .catch((error) => {
          showMessage('Error during Google sign-up. Please try again.' , error);
        });
    })
    .catch((error) => {
      showMessage('Google sign-in failed. Please try again.' , error);
    });
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
