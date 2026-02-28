-- Carbon Contribution Tracking & Reward System
-- Database Schema

DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_username ON users(username);

CREATE TABLE activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    points INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id ON activities(user_id);
CREATE INDEX idx_status ON activities(status);

ALTER TABLE users ADD COLUMN password VARCHAR(255);
ALTER TABLE users ADD COLUMN role VARCHAR(50);

ALTER TABLE activities ADD COLUMN activity_type VARCHAR(50);
ALTER TABLE activities ADD COLUMN description TEXT;
ALTER TABLE activities ADD COLUMN declared_quantity INT DEFAULT 0;
ALTER TABLE activities ADD COLUMN proof_image TEXT;
ALTER TABLE activities ADD COLUMN latitude DOUBLE;
ALTER TABLE activities ADD COLUMN longitude DOUBLE;
ALTER TABLE activities ADD COLUMN proof_time TIMESTAMP;
ALTER TABLE activities ADD COLUMN verification_flag VARCHAR(20) DEFAULT 'OK';

CREATE TABLE user_daily_limits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    date DATE NOT NULL,
    activity_count INT DEFAULT 0,
    trees_declared INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

CREATE TABLE proof_sessions (
    id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    activity_id BIGINT,
    start_time TIMESTAMP,
    expiry_time TIMESTAMP,
    status VARCHAR(20)
);
