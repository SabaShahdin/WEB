// db.js
const mysql = require('mysql2');

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '2022', // Make sure to change this password if needed
  database: 'TransportManagementSystem8', // Your database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    process.exit(1); // Exit the process if there is an error
  }
  console.log('Connected to MySQL!');
});

// Export the db connection to be used in other files
module.exports = db;
