CREATE TABLE areas (
  area_id int NOT NULL AUTO_INCREMENT,
  area_name varchar(100) NOT NULL,
  city varchar(100) NOT NULL,
  latitude decimal(9,6) DEFAULT NULL,
  longitude decimal(9,6) DEFAULT NULL,
  radius decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (area_id)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE busschedules (
  schedule_id int NOT NULL AUTO_INCREMENT,
  route_id int DEFAULT NULL,
  stop_id int DEFAULT NULL,
  vehicle_id int DEFAULT NULL,
  stop_order int DEFAULT NULL,
  PRIMARY KEY (schedule_id),
  KEY route_id (route_id),
  KEY stop_id (stop_id),
  KEY vehicle_id (vehicle_id),
  CONSTRAINT busschedules_ibfk_1 FOREIGN KEY (route_id) REFERENCES routes (route_id),
  CONSTRAINT busschedules_ibfk_2 FOREIGN KEY (stop_id) REFERENCES areas (area_id),
  CONSTRAINT busschedules_ibfk_3 FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE drivers (
  driver_id int NOT NULL AUTO_INCREMENT,
  license_number varchar(50) NOT NULL,
  rating decimal(3,2) DEFAULT '0.00',
  status varchar(20) DEFAULT 'Active',
  user_id int DEFAULT NULL,
  registration_status enum('pending','approved','rejected') DEFAULT 'pending',
  PRIMARY KEY (driver_id),
  UNIQUE KEY license_number (license_number),
  KEY fk_user_id (user_id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE fare (
  fare_id int NOT NULL AUTO_INCREMENT,
  vehicle_type_id int DEFAULT NULL,
  base_fare decimal(10,2) DEFAULT NULL,
  per_km_rate decimal(10,2) DEFAULT NULL,
  min_fare decimal(10,2) DEFAULT NULL,
  peak_time_multiplier decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (fare_id),
  KEY vehicle_type_id (vehicle_type_id),
  CONSTRAINT fare_ibfk_1 FOREIGN KEY (vehicle_type_id) REFERENCES vehicletypes (vehicle_type_id)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE intercityschedules (
  schedule_id int NOT NULL AUTO_INCREMENT,
  route_id int DEFAULT NULL,
  vehicle_id int DEFAULT NULL,
  departure_time timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  arrival_time timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  fare decimal(10,2) DEFAULT NULL,
  distance decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (schedule_id),
  KEY route_id (route_id),
  KEY vehicle_id (vehicle_id),
  CONSTRAINT intercityschedules_ibfk_1 FOREIGN KEY (route_id) REFERENCES routes (route_id),
  CONSTRAINT intercityschedules_ibfk_2 FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE passengers (
  passenger_id int NOT NULL AUTO_INCREMENT,
  user_id int DEFAULT NULL,
  preferred_payment_method varchar(50) DEFAULT NULL,
  PRIMARY KEY (passenger_id),
  KEY user_id (user_id),
  CONSTRAINT passengers_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB AUTO_INCREMENT=473 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE payments (
  payment_id int NOT NULL AUTO_INCREMENT,
  ride_id int DEFAULT NULL,
  amount decimal(7,2) DEFAULT NULL,
  payment_status enum('Pending','Completed') DEFAULT 'Pending',
  transaction_id varchar(100) DEFAULT NULL,
  passenger_id int DEFAULT NULL,
  PRIMARY KEY (payment_id),
  KEY ride_id (ride_id),
  KEY passenger_id (passenger_id),
  CONSTRAINT payments_ibfk_1 FOREIGN KEY (ride_id) REFERENCES rides (ride_id),
  CONSTRAINT payments_ibfk_2 FOREIGN KEY (passenger_id) REFERENCES passengers (passenger_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ride_cancellations (
  id int NOT NULL AUTO_INCREMENT,
  ride_id int NOT NULL,
  canceled_by varchar(50) NOT NULL,
  reason text,
  cancellation_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vehicle_id int DEFAULT NULL,
  passenger_id int DEFAULT NULL,
  PRIMARY KEY (id),
  KEY ride_id (ride_id),
  KEY vehicle_id (vehicle_id),
  KEY fk_passenger_id (passenger_id),
  CONSTRAINT fk_passenger_id FOREIGN KEY (passenger_id) REFERENCES passengers (passenger_id),
  CONSTRAINT ride_cancellations_ibfk_1 FOREIGN KEY (ride_id) REFERENCES rides (ride_id),
  CONSTRAINT ride_cancellations_ibfk_3 FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE rides (
  ride_id int NOT NULL AUTO_INCREMENT,
  passenger_id int DEFAULT NULL,
  vehicle_id int DEFAULT NULL,
  pickup_latitude decimal(9,6) DEFAULT NULL,
  pickup_longitude decimal(9,6) DEFAULT NULL,
  dropoff_latitude decimal(9,6) DEFAULT NULL,
  dropoff_longitude decimal(9,6) DEFAULT NULL,
  ride_type enum('Scheduled','On-Demand') DEFAULT 'On-Demand',
  booking_time timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  fare decimal(7,2) DEFAULT NULL,
  status varchar(20) DEFAULT 'Pending',
  scheduled_time timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  seats int NOT NULL,
  PRIMARY KEY (ride_id),
  KEY passenger_id (passenger_id),
  KEY vehicle_id (vehicle_id),
  CONSTRAINT rides_ibfk_1 FOREIGN KEY (passenger_id) REFERENCES passengers (passenger_id),
  CONSTRAINT rides_ibfk_2 FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id)
) ENGINE=InnoDB AUTO_INCREMENT=375 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE routes (
  route_id int NOT NULL AUTO_INCREMENT,
  route_name varchar(255) NOT NULL,
  distance decimal(5,2) NOT NULL,
  duration decimal(4,2) NOT NULL,
  stops text NOT NULL,
  origin_city varchar(100) DEFAULT NULL,
  destination_city varchar(100) DEFAULT NULL,
  PRIMARY KEY (route_id)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE routestops (
  route_stop_id int NOT NULL AUTO_INCREMENT,
  route_id int DEFAULT NULL,
  stop_id int DEFAULT NULL,
  stop_order int DEFAULT NULL,
  city varchar(100) DEFAULT NULL,
  PRIMARY KEY (route_stop_id),
  KEY route_id (route_id),
  KEY stop_id (stop_id),
  CONSTRAINT routestops_ibfk_1 FOREIGN KEY (route_id) REFERENCES routes (route_id),
  CONSTRAINT routestops_ibfk_2 FOREIGN KEY (stop_id) REFERENCES areas (area_id)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE users (
  user_id int NOT NULL AUTO_INCREMENT,
  username varchar(50) NOT NULL,
  password varchar(255) DEFAULT NULL,
  role enum('Passenger','Driver','Admin') NOT NULL,
  email varchar(100) NOT NULL,
  contact_number varchar(15) DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE vehicles (
  vehicle_id int NOT NULL AUTO_INCREMENT,
  driver_id int DEFAULT NULL,
  vehicle_type_id int DEFAULT NULL,
  license_plate varchar(20) NOT NULL,
  status enum('Available','OnRide','Inactive') NOT NULL,
  gps_latitude decimal(9,6) DEFAULT NULL,
  gps_longitude decimal(9,6) DEFAULT NULL,
  remaining_capacity int DEFAULT NULL,
  city varchar(100) DEFAULT NULL,
  PRIMARY KEY (vehicle_id),
  UNIQUE KEY license_plate (license_plate),
  KEY driver_id (driver_id),
  KEY vehicle_type_id (vehicle_type_id),
  CONSTRAINT vehicles_ibfk_1 FOREIGN KEY (driver_id) REFERENCES drivers (driver_id),
  CONSTRAINT vehicles_ibfk_2 FOREIGN KEY (vehicle_type_id) REFERENCES vehicletypes (vehicle_type_id)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE vehicletypes (
  vehicle_type_id int NOT NULL AUTO_INCREMENT,
  type_name varchar(50) NOT NULL,
  capacity int NOT NULL,
  PRIMARY KEY (vehicle_type_id)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;thsi is my database design correct it fot my approach 
CREATE TABLE ride_requests (
  request_id INT NOT NULL AUTO_INCREMENT,  -- Unique identifier for each ride request
  passenger_id INT NOT NULL,  -- The ID of the passenger requesting the ride
  driver_id INT DEFAULT NULL,  -- The ID of the driver (can be NULL if not assigned yet)
  pickup_latitude DECIMAL(9,6) NOT NULL,  -- Latitude of the pickup location
  pickup_longitude DECIMAL(9,6) NOT NULL,  -- Longitude of the pickup location
  dropoff_latitude DECIMAL(9,6) NOT NULL,  -- Latitude of the dropoff location
  dropoff_longitude DECIMAL(9,6) NOT NULL,  -- Longitude of the dropoff location
  fare DECIMAL(7,2) NOT NULL,  -- Fare for the ride
  seats INT NOT NULL,  -- Number of seats requested
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',  -- Status of the ride request
  booking_time TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,  -- Timestamp when the request was created
  PRIMARY KEY (request_id),  -- Primary key for the table
  KEY passenger_id (passenger_id),  -- Index for passenger_id
  KEY driver_id (driver_id),  -- Index for driver_id
  CONSTRAINT ride_requests_ibfk_1 FOREIGN KEY (passenger_id) REFERENCES passengers (passenger_id),  -- Foreign key for passenger
  CONSTRAINT ride_requests_ibfk_2 FOREIGN KEY (driver_id) REFERENCES drivers (driver_id)  -- Foreign key for driver
);
