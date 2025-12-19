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
    study_part_id INT,
    set_id INT NOT NULL,
    text_id VARCHAR(50),
    sentence_index INT NOT NULL,
    sp1_con_id VARCHAR(50),
    predictability VARCHAR(10),
    predict_id INT,
    make_sense VARCHAR(10),
    make_sense_id INT,
    text_type VARCHAR(20),
    text_type_id INT,
    gen_type VARCHAR(20),
    gen_type_id INT,
    note TEXT,
    content TEXT NOT NULL
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


-- ==========================================
-- Part 3: Text Foraging (Part C)
-- ==========================================

-- PRACTICE Tables
CREATE TABLE IF NOT EXISTS part3_practice_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    story_topic_id VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS part3_practice_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    content TEXT NOT NULL,
    segment_order INT NOT NULL,
    text_id VARCHAR(50),
    predictability VARCHAR(20),
    predict_id INT,
    sp2_con_id VARCHAR(50),
    FOREIGN KEY (story_id) REFERENCES part3_practice_stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS part3_practice_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    segment_id INT,
    action_type ENUM('continue', 'switch', 'start_story') NOT NULL,
    reading_time_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES part3_practice_stories(id),
    FOREIGN KEY (segment_id) REFERENCES part3_practice_segments(id)
);

CREATE TABLE IF NOT EXISTS part3_practice_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    segment_order INT NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES part3_practice_stories(id)
);

CREATE TABLE IF NOT EXISTS part3_practice_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_order INT, -- Use this to map to segment_order
    option_1 VARCHAR(255) NOT NULL,
    option_2 VARCHAR(255) NOT NULL,
    option_3 VARCHAR(255) NOT NULL,
    option_4 VARCHAR(255) NOT NULL,
    correct_option INT NOT NULL COMMENT '1-4',
    FOREIGN KEY (story_id) REFERENCES part3_practice_stories(id)
);

CREATE TABLE IF NOT EXISTS part3_practice_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    response_option INT NOT NULL COMMENT '1-4',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (question_id) REFERENCES part3_practice_questions(id)
);

-- FORMAL Tables
CREATE TABLE IF NOT EXISTS part3_formal_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    story_topic_id VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS part3_formal_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    content TEXT NOT NULL,
    segment_order INT NOT NULL,
    text_id VARCHAR(50),
    predictability VARCHAR(20),
    predict_id INT,
    sp2_con_id VARCHAR(50),
    FOREIGN KEY (story_id) REFERENCES part3_formal_stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS part3_formal_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    segment_id INT,
    action_type ENUM('continue', 'switch', 'start_story') NOT NULL,
    reading_time_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES part3_formal_stories(id),
    FOREIGN KEY (segment_id) REFERENCES part3_formal_segments(id)
);

CREATE TABLE IF NOT EXISTS part3_formal_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    segment_order INT NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES part3_formal_stories(id)
);

CREATE TABLE IF NOT EXISTS part3_formal_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_order INT,
    option_1 VARCHAR(255) NOT NULL,
    option_2 VARCHAR(255) NOT NULL,
    option_3 VARCHAR(255) NOT NULL,
    option_4 VARCHAR(255) NOT NULL,
    correct_option INT NOT NULL COMMENT '1-4',
    FOREIGN KEY (story_id) REFERENCES part3_formal_stories(id)
);

CREATE TABLE IF NOT EXISTS part3_formal_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    response_option INT NOT NULL COMMENT '1-4',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (question_id) REFERENCES part3_formal_questions(id)
);

-- ==========================================
-- Part 4: Final Assessment
-- ==========================================

-- Comprehension Questions (Part 4 - Final Assessment, mostly static content now)
CREATE TABLE IF NOT EXISTS comprehension_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    option_1 TEXT NOT NULL,
    option_2 TEXT NOT NULL,
    option_3 TEXT NOT NULL,
    option_4 TEXT NOT NULL,
    correct_option INT NOT NULL COMMENT '1-4'
    -- Removed story_id dependency as these questions are static/mock for now or matched by ID
);

-- Comprehension Responses
CREATE TABLE IF NOT EXISTS part4_comprehension_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    response_option INT NOT NULL COMMENT '1-4',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (question_id) REFERENCES comprehension_questions(id)
);

-- Seed Data for Cognitive Tests (Mock)
INSERT IGNORE INTO letter_comparison_problems (string_1, string_2, is_same) VALUES
('PRDBZTYFN', 'PRDBZTYFN', TRUE),
('NCWJDZ', 'NCMJDZ', FALSE),
('KHW', 'KBW', FALSE),
('ZRBGMF', 'ZRBCMF', FALSE),
('BTH', 'BYH', FALSE),
('XWKQRYCNZ', 'XWKQRYCNZ', TRUE),
('HNPDLK', 'HNPDLK', TRUE),
('WMQTRSGLZ', 'WMQTRZGLZ', FALSE),
('JPN', 'JPN', TRUE),
('QLXSVT', 'QLNSVT', FALSE);

INSERT IGNORE INTO vocabulary_questions (word, option_1, option_2, option_3, option_4, option_5, correct_option) VALUES
('mumble', 'speak indistinctly', 'complain', 'handle awkwardly', 'fall over something', 'tear apart', 1),
('perspire', 'struggle', 'sweat', 'happen', 'penetrate', 'submit', 2),
('gush', 'giggle', 'spout', 'sprinkle', 'hurry', 'cry', 2);

INSERT IGNORE INTO comprehension_questions (question_text, option_1, option_2, option_3, option_4, correct_option) VALUES
('A medical supplier is interested in understanding the market size of bone graft material. What kind of population may be in the market?', 'an athlete with severe fractures', 'a retiree with significant bone loss', 'a patient suffering from cancer', 'all of the above', 4),
('A tissue banks is responsible for screening the medical histories of the donors and freeze the donated bones (T/F)', 'TRUE', 'FALSE', '', '', 1),
('What could be a risk that is associated with surgical procedure of bone graft?', 'osteoporosis', 'infection', 'muscle atrophy', 'nerve damage', 2),
('Due to ethical concerns, all bone graft materials can only come from donors who have died (T/F)', 'TRUE', 'FALSE', '', '', 2);

-- Part 2: Story Reading & Comprehension
-- ==========================================

-- PRACTICE Tables
CREATE TABLE IF NOT EXISTS part2_practice_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    story_topic_id VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS part2_practice_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    content TEXT NOT NULL,
    segment_order INT NOT NULL,
    text_id VARCHAR(50),
    predictability VARCHAR(20),
    predict_id INT,
    sp2_con_id VARCHAR(50),
    FOREIGN KEY (story_id) REFERENCES part2_practice_stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS part2_practice_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    segment_id INT,
    action_type ENUM('continue', 'switch', 'start_story') NOT NULL,
    reading_time_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES part2_practice_stories(id),
    FOREIGN KEY (segment_id) REFERENCES part2_practice_segments(id)
);

CREATE TABLE IF NOT EXISTS part2_practice_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

CREATE TABLE IF NOT EXISTS part2_practice_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_order INT,
    option_1 VARCHAR(255) NOT NULL,
    option_2 VARCHAR(255) NOT NULL,
    option_3 VARCHAR(255) NOT NULL,
    option_4 VARCHAR(255) NOT NULL,
    correct_option INT NOT NULL COMMENT '1-4',
    FOREIGN KEY (story_id) REFERENCES part2_practice_stories(id)
);

CREATE TABLE IF NOT EXISTS part2_practice_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    response_option INT NOT NULL COMMENT '1-4',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (question_id) REFERENCES part2_practice_questions(id)
);

-- FORMAL Tables
CREATE TABLE IF NOT EXISTS part2_formal_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    story_topic_id VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS part2_formal_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    content TEXT NOT NULL,
    segment_order INT NOT NULL,
    text_id VARCHAR(50),
    predictability VARCHAR(20),
    predict_id INT,
    sp2_con_id VARCHAR(50),
    FOREIGN KEY (story_id) REFERENCES part2_formal_stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS part2_formal_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    segment_id INT,
    action_type ENUM('continue', 'switch', 'start_story') NOT NULL,
    reading_time_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES part2_formal_stories(id),
    FOREIGN KEY (segment_id) REFERENCES part2_formal_segments(id)
);

CREATE TABLE IF NOT EXISTS part2_formal_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

CREATE TABLE IF NOT EXISTS part2_formal_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_order INT,
    option_1 VARCHAR(255) NOT NULL,
    option_2 VARCHAR(255) NOT NULL,
    option_3 VARCHAR(255) NOT NULL,
    option_4 VARCHAR(255) NOT NULL,
    correct_option INT NOT NULL COMMENT '1-4',
    FOREIGN KEY (story_id) REFERENCES part2_formal_stories(id)
);

CREATE TABLE IF NOT EXISTS part2_formal_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    response_option INT NOT NULL COMMENT '1-4',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (question_id) REFERENCES part2_formal_questions(id)
); 


-- ==========================================
-- Part A: Comprehensive Questions
-- ==========================================

CREATE TABLE IF NOT EXISTS part_a_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    option_1 TEXT NOT NULL,
    option_2 TEXT NOT NULL,
    option_3 TEXT NOT NULL,
    option_4 TEXT NOT NULL,
    correct_option INT NOT NULL COMMENT '1-4'
);

CREATE TABLE IF NOT EXISTS part_a_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    response_option INT NOT NULL COMMENT '1-4',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (question_id) REFERENCES part_a_questions(id)
);

-- Seed Part A Questions (Mock)
INSERT IGNORE INTO part_a_questions (question_text, option_1, option_2, option_3, option_4, correct_option) VALUES
('What was the main theme of the sentences about the fox?', 'Laziness', 'Speed', 'Agility', 'Colors', 3),
('Which object was mentioned as being watched?', 'Clock', 'Pot', 'Television', 'Bird', 2),
('Who picked the pickled peppers?', 'Paul', 'Peter', 'Patrick', 'Phil', 2),
('What did she sell by the seashore?', 'Seaweed', 'Sandcastles', 'Seashells', 'Surfboards', 3);
