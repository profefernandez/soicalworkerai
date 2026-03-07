-- MySQL schema for crisis-aware AI chatbot platform

CREATE DATABASE IF NOT EXISTS soicalworkerai;
USE soicalworkerai;

-- Therapist / admin accounts
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('therapist', 'admin') NOT NULL DEFAULT 'therapist',
  lemonade_api_key TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  client_identifier VARCHAR(255),
  crisis_active TINYINT(1) DEFAULT 0,
  crisis_activated_at TIMESTAMP NULL,
  active_agent_id VARCHAR(255) DEFAULT NULL,
  lemonade_conversation_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Encrypted chat messages
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  sender ENUM('client', 'ai', 'social_worker_ai', 'admin') NOT NULL,
  content_encrypted TEXT NOT NULL,
  iv VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Crisis audit trail (session_id may be NULL for global/system-level entries)
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36),
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  detail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification log
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  type ENUM('sms', 'call', 'email') NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Migration: add agent tracking and expanded sender types
ALTER TABLE sessions ADD COLUMN active_agent_id VARCHAR(255) DEFAULT NULL;

ALTER TABLE messages MODIFY COLUMN sender ENUM('client', 'ai', 'social_worker_ai', 'admin') NOT NULL;
