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

-- ==========================================
-- Part 3: Cognitive Tests
-- ==========================================

-- Letter Comparison Problems (Static Content)
CREATE TABLE IF NOT EXISTS letter_comparison_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    string_1 VARCHAR(255) NOT NULL,
    string_2 VARCHAR(255) NOT NULL,
    is_same BOOLEAN NOT NULL
);

-- Letter Comparison Responses
CREATE TABLE IF NOT EXISTS part3_letter_comparison_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    problem_id INT NOT NULL,
    response_same BOOLEAN NOT NULL COMMENT 'User response: True if they thought it was same',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (problem_id) REFERENCES letter_comparison_problems(id)
);

-- Vocabulary Questions (Static Content)
CREATE TABLE IF NOT EXISTS vocabulary_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(255) NOT NULL,
    option_1 VARCHAR(255) NOT NULL,
    option_2 VARCHAR(255) NOT NULL,
    option_3 VARCHAR(255) NOT NULL,
    option_4 VARCHAR(255) NOT NULL,
    option_5 VARCHAR(255) NOT NULL,
    correct_option INT NOT NULL COMMENT '1-5'
);

-- Vocabulary Responses
CREATE TABLE IF NOT EXISTS part3_vocabulary_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    response_option INT COMMENT '1-6, where 6 is "Not sure"',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (question_id) REFERENCES vocabulary_questions(id)
);

-- ==========================================
-- Part 4: Final Assessment
-- ==========================================

-- Comprehension Questions (Static Content)
CREATE TABLE IF NOT EXISTS comprehension_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_1 TEXT NOT NULL,
    option_2 TEXT NOT NULL,
    option_3 TEXT NOT NULL,
    option_4 TEXT NOT NULL,
    correct_option INT NOT NULL COMMENT '1-4',
    FOREIGN KEY (story_id) REFERENCES stories(id)
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

INSERT IGNORE INTO comprehension_questions (story_id, question_text, option_1, option_2, option_3, option_4, correct_option) VALUES
(1, 'A medical supplier is interested in understanding the market size of bone graft material. What kind of population may be in the market?', 'an athlete with severe fractures', 'a retiree with significant bone loss', 'a patient suffering from cancer', 'all of the above', 4),
(1, 'A tissue banks is responsible for screening the medical histories of the donors and freeze the donated bones (T/F)', 'TRUE', 'FALSE', '', '', 1),
(1, 'What could be a risk that is associated with surgical procedure of bone graft?', 'osteoporosis', 'infection', 'muscle atrophy', 'nerve damage', 2);

-- ==========================================
-- Part 2: Story Reading & Comprehension
-- ==========================================

CREATE TABLE IF NOT EXISTS part2_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    phase ENUM('practice', 'formal') NOT NULL
);

CREATE TABLE IF NOT EXISTS part2_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    content TEXT NOT NULL,
    segment_order INT NOT NULL,
    FOREIGN KEY (story_id) REFERENCES part2_stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS part2_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    segment_id INT,
    action_type ENUM('continue', 'switch', 'start_story') NOT NULL,
    reading_time_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES part2_stories(id),
    FOREIGN KEY (segment_id) REFERENCES part2_segments(id)
);

CREATE TABLE IF NOT EXISTS part2_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    phase ENUM('practice', 'formal') NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

CREATE TABLE IF NOT EXISTS part2_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    sentence_text TEXT NOT NULL, -- The sentence with the missing word
    missing_word VARCHAR(255) NOT NULL,
    option_1 VARCHAR(255) NOT NULL,
    option_2 VARCHAR(255) NOT NULL,
    option_3 VARCHAR(255) NOT NULL,
    option_4 VARCHAR(255) NOT NULL,
    correct_option INT NOT NULL COMMENT '1-4',
    FOREIGN KEY (story_id) REFERENCES part2_stories(id)
);

CREATE TABLE IF NOT EXISTS part2_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    response_option INT NOT NULL COMMENT '1-4',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (question_id) REFERENCES part2_questions(id)
);

-- Seed Part 2 Stories (Mock)
INSERT IGNORE INTO part2_stories (title, phase) VALUES 
('The Hidden Treasure', 'practice'),
('Office Surprise', 'practice'),
('Runaway Cat', 'practice'),
('Global Warming', 'formal'),
('Quantum Computing', 'formal'),
('Deep Sea Exploration', 'formal'),
('Mars Colonization', 'formal');

-- Seed Part 2 Segments (Mock - Simplified)
-- For Practice (3 stories)
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'This is a practice segment. It is about 50 words long to match the requirement.', 1 FROM part2_stories WHERE phase = 'practice';
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'This is the second segment of the practice story. Reading is fun and important.', 2 FROM part2_stories WHERE phase = 'practice';
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'Segment three continues the narrative. The plot thickens as we read more.', 3 FROM part2_stories WHERE phase = 'practice';
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'Segment four brings a twist. Unexpected events happen in the story.', 4 FROM part2_stories WHERE phase = 'practice';
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'Segment five resolves some conflicts. The characters are learning.', 5 FROM part2_stories WHERE phase = 'practice';
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'Segment six concludes the practice story. Good job reading!', 6 FROM part2_stories WHERE phase = 'practice';

-- For Formal (4 stories)
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'This is a formal segment. It should be longer, around 220 words. (Mock content)', 1 FROM part2_stories WHERE phase = 'formal';
-- (Adding just one segment per story for brevity in development, usually we need 6)
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'Formal segment 2. Detailed information about the topic.', 2 FROM part2_stories WHERE phase = 'formal';
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'Formal segment 3. More details.', 3 FROM part2_stories WHERE phase = 'formal';
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'Formal segment 4. Analysis of the topic.', 4 FROM part2_stories WHERE phase = 'formal';
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'Formal segment 5. Discussion.', 5 FROM part2_stories WHERE phase = 'formal';
INSERT INTO part2_segments (story_id, content, segment_order)
SELECT id, 'Formal segment 6. Conclusion.', 6 FROM part2_stories WHERE phase = 'formal';

-- Seed Part 2 Questions (Mock)
INSERT INTO part2_questions (story_id, sentence_text, missing_word, option_1, option_2, option_3, option_4, correct_option)
SELECT id, 'The scientist discovered a new ___ in the ocean.', 'species', 'car', 'species', 'building', 'planet', 2 FROM part2_stories WHERE title = 'Deep Sea Exploration'; 

