CREATE DATABASE IF NOT EXISTS `read-or-switch`;
USE `read-or-switch`;

CREATE TABLE IF NOT EXISTS participants (

    participant_id INT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demographics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    dob DATE,
    gender ENUM('Male', 'Female', 'Other'),
    education_level INT COMMENT '1-8 scale',
    native_speaker BOOLEAN,
    first_language VARCHAR(255),
    proficiency_reading INT COMMENT '1-7 scale',
    proficiency_writing INT COMMENT '1-7 scale',
    is_hispanic BOOLEAN,
    race VARCHAR(255),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS participant_knowledge (
    participant_id INT,
    topic_id INT,
    rating INT COMMENT '1-7 scale',
    PRIMARY KEY (participant_id, topic_id),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- Seed topics
INSERT IGNORE INTO topics (name) VALUES 
('Bone grafts'),
('Hypertension'),
('Blood donation'),
('Multiple sclerosis'),
('Corneal transplants'),
('Kidney dialysis'),
('Liver cancer'),
('Vaccine'),
('Colorectal cancer'),
('Alzheimer''s disease');
