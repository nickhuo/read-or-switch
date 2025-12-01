CREATE DATABASE IF NOT EXISTS `read-or-switch`;
USE `read-or-switch`;

CREATE TABLE IF NOT EXISTS participants (

    participant_id BIGINT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demographics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
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
    participant_id BIGINT,
    topic_id INT,
    rating INT COMMENT '1-7 scale',
    PRIMARY KEY (participant_id, topic_id),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Part A: Sentence Reading Study Tables

CREATE TABLE IF NOT EXISTS sentences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    group_id INT NOT NULL COMMENT 'Groups sentences into blocks of 5'
);

CREATE TABLE IF NOT EXISTS participant_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    group_id INT COMMENT 'For summaries (per group)',
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
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

-- Seed Sentences (Mock Data)
INSERT INTO sentences (content, group_id) VALUES 
('The quick brown fox jumps over the lazy dog.', 1),
('She sells seashells by the seashore.', 1),
('Peter Piper picked a peck of pickled peppers.', 1),
('How much wood would a woodchuck chuck.', 1),
('A watched pot never boils.', 1);

-- Part B: Narrative Text Foraging Tables

CREATE TABLE IF NOT EXISTS stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    phase ENUM('practice', 'formal') NOT NULL
);

CREATE TABLE IF NOT EXISTS story_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    content TEXT NOT NULL,
    segment_order INT NOT NULL,
    is_predictable BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS participant_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    segment_id INT,
    action_type ENUM('continue', 'switch', 'start_story') NOT NULL,
    reading_time_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES stories(id),
    FOREIGN KEY (segment_id) REFERENCES story_segments(id)
);

CREATE TABLE IF NOT EXISTS story_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    phase ENUM('practice', 'formal') NOT NULL,
    summary TEXT,
    q1_new_info INT COMMENT '0-100 scale',
    q2_difficulty INT COMMENT '0-100 scale',
    q3_learning_article INT COMMENT '0-100 scale',
    q4_learning_overall INT COMMENT '0-100 scale',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES stories(id)
);

-- Seed Stories (Mock Data)
INSERT IGNORE INTO stories (title, phase) VALUES 
('The Lost Key', 'practice'),
('A Day at the Park', 'practice'),
('Cooking Dinner', 'practice'),
('The Space Mission', 'formal'),
('Underwater Adventure', 'formal'),
('Mountain Climbing', 'formal'),
('The Ancient City', 'formal'),
('Desert Journey', 'formal');

-- Seed Segments (Mock Data - Simplified for now)
-- We will add a few segments for testing. In production this would be populated with real text.
-- Using a stored procedure or just simple inserts for now.

INSERT INTO story_segments (story_id, content, segment_order, is_predictable) 
SELECT id, 'This is segment 1 of the story. It introduces the main character and setting.', 1, TRUE FROM stories WHERE title = 'The Lost Key';
INSERT INTO story_segments (story_id, content, segment_order, is_predictable) 
SELECT id, 'This is segment 2. The character faces a minor problem.', 2, TRUE FROM stories WHERE title = 'The Lost Key';
INSERT INTO story_segments (story_id, content, segment_order, is_predictable) 
SELECT id, 'This is segment 3. The problem gets worse.', 3, TRUE FROM stories WHERE title = 'The Lost Key';
INSERT INTO story_segments (story_id, content, segment_order, is_predictable) 
SELECT id, 'This is segment 4. They find a clue.', 4, TRUE FROM stories WHERE title = 'The Lost Key';
INSERT INTO story_segments (story_id, content, segment_order, is_predictable) 
SELECT id, 'This is segment 5. They are close to the solution.', 5, TRUE FROM stories WHERE title = 'The Lost Key';
INSERT INTO story_segments (story_id, content, segment_order, is_predictable) 
SELECT id, 'This is segment 6. The mystery is solved.', 6, TRUE FROM stories WHERE title = 'The Lost Key';

-- Repeat for other stories (simplified)
INSERT INTO story_segments (story_id, content, segment_order, is_predictable) 
SELECT id, CONCAT('Segment ', n, ' content for ', title), n, TRUE 
FROM stories 
JOIN (SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) numbers
WHERE title != 'The Lost Key';
