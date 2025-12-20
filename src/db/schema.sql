CREATE DATABASE IF NOT EXISTS `read-or-switch`;
USE `read-or-switch`;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS participants;
CREATE TABLE IF NOT EXISTS participants (

    participant_id BIGINT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    part2_condition INT COMMENT '0 or 1',
    part3_condition INT COMMENT '0, 1, or 2',
    email VARCHAR(255) NOT NULL DEFAULT 'testing@illionis.edu',
    consent BOOLEAN NOT NULL DEFAULT TRUE
);

DROP TABLE IF EXISTS demographics;
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

DROP TABLE IF EXISTS participant_knowledge;
CREATE TABLE IF NOT EXISTS participant_knowledge (
    participant_id BIGINT,
    topic_id INT,
    rating INT COMMENT '1-7 scale',
    PRIMARY KEY (participant_id, topic_id),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Part A: Sentence Reading Study Tables

DROP TABLE IF EXISTS part_a_sentences;
CREATE TABLE IF NOT EXISTS part_a_sentences (
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

DROP TABLE IF EXISTS part_a_summaries;
CREATE TABLE IF NOT EXISTS part_a_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    group_id INT COMMENT 'For summaries (per group)',
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

DROP TABLE IF EXISTS part_a_questions;
CREATE TABLE IF NOT EXISTS part_a_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    study_part_id INT,
    sent_set INT,
    text_id VARCHAR(50),
    sent_order INT,
    p1_con_id VARCHAR(50),
    predict_id INT,
    make_sense_id INT,
    text_type_id INT,
    gen_type_id INT,
    question_text TEXT NOT NULL,
    option_1 TEXT NOT NULL,
    option_2 TEXT NOT NULL,
    option_3 TEXT NOT NULL,
    option_4 TEXT NOT NULL,
    correct_ans VARCHAR(255),
    correct_option INT COMMENT '1-4 (Legacy/index)'
);

DROP TABLE IF EXISTS part_a_responses;
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

DROP TABLE IF EXISTS part_a_logs;
CREATE TABLE IF NOT EXISTS part_a_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    set_id INT NOT NULL,
    sentence_index INT NOT NULL,
    word_index INT,
    action_type VARCHAR(50) DEFAULT 'word_reveal',
    reading_time_ms INT,
    timestamp DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);


-- Part B: Story Reading & Comprehension
-- ==========================================

-- PRACTICE Tables
DROP TABLE IF EXISTS part_b_practice_stories;
CREATE TABLE IF NOT EXISTS part_b_practice_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    story_topic_id VARCHAR(50)
);

DROP TABLE IF EXISTS part_b_practice_segments;
CREATE TABLE IF NOT EXISTS part_b_practice_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    content TEXT NOT NULL,
    segment_order INT NOT NULL,
    text_id VARCHAR(50),
    predictability VARCHAR(20),
    predict_id INT,
    sp2_con_id VARCHAR(50),
    FOREIGN KEY (story_id) REFERENCES part_b_practice_stories(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS part_b_practice_actions;
CREATE TABLE IF NOT EXISTS part_b_practice_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    segment_id INT,
    action_type ENUM('continue', 'switch', 'start_story') NOT NULL,
    reading_time_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES part_b_practice_stories(id),
    FOREIGN KEY (segment_id) REFERENCES part_b_practice_segments(id)
);

DROP TABLE IF EXISTS part_b_practice_questions;
CREATE TABLE IF NOT EXISTS part_b_practice_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_order INT,
    option_1 VARCHAR(255) NOT NULL,
    option_2 VARCHAR(255) NOT NULL,
    option_3 VARCHAR(255) NOT NULL,
    option_4 VARCHAR(255) NOT NULL,
    correct_option INT NOT NULL COMMENT '1-4',
    FOREIGN KEY (story_id) REFERENCES part_b_practice_stories(id)
);

DROP TABLE IF EXISTS part_b_practice_responses;
CREATE TABLE IF NOT EXISTS part_b_practice_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    response_option INT NOT NULL COMMENT '1-4',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (question_id) REFERENCES part_b_practice_questions(id)
);

-- FORMAL Tables
DROP TABLE IF EXISTS part_b_formal_stories;
CREATE TABLE IF NOT EXISTS part_b_formal_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    story_topic_id VARCHAR(50)
);

DROP TABLE IF EXISTS part_b_formal_segments;
CREATE TABLE IF NOT EXISTS part_b_formal_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    content TEXT NOT NULL,
    segment_order INT NOT NULL,
    text_id VARCHAR(50),
    predictability VARCHAR(20),
    predict_id INT,
    sp2_con_id VARCHAR(50),
    FOREIGN KEY (story_id) REFERENCES part_b_formal_stories(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS part_b_formal_actions;
CREATE TABLE IF NOT EXISTS part_b_formal_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    story_id INT NOT NULL,
    segment_id INT,
    action_type ENUM('continue', 'switch', 'start_story') NOT NULL,
    reading_time_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (story_id) REFERENCES part_b_formal_stories(id),
    FOREIGN KEY (segment_id) REFERENCES part_b_formal_segments(id)
);

DROP TABLE IF EXISTS part_b_formal_summaries;
CREATE TABLE IF NOT EXISTS part_b_formal_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

DROP TABLE IF EXISTS part_b_formal_questions;
CREATE TABLE IF NOT EXISTS part_b_formal_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_order INT,
    option_1 VARCHAR(255) NOT NULL,
    option_2 VARCHAR(255) NOT NULL,
    option_3 VARCHAR(255) NOT NULL,
    option_4 VARCHAR(255) NOT NULL,
    correct_option INT NOT NULL COMMENT '1-4',
    FOREIGN KEY (story_id) REFERENCES part_b_formal_stories(id)
);

DROP TABLE IF EXISTS part_b_formal_responses;
CREATE TABLE IF NOT EXISTS part_b_formal_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    response_option INT NOT NULL COMMENT '1-4',
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (question_id) REFERENCES part_b_formal_questions(id)
); 


-- ==========================================
-- Part C: Text Foraging
-- ==========================================

-- part_c_topic
DROP TABLE IF EXISTS `part_c_topic`;
CREATE TABLE `part_c_topic` (
    `topID` varchar(8) NOT NULL,
    `topTitle` varchar(100) NOT NULL,
    `topIdeasBonusWords` longtext NOT NULL,
    PRIMARY KEY (`topID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_subtopic
DROP TABLE IF EXISTS `part_c_subtopic`;
CREATE TABLE `part_c_subtopic` (
    `subtopID` varchar(8) NOT NULL,
    `topID` varchar(8) NOT NULL,
    `subtopTitle` varchar(100) NOT NULL,
    PRIMARY KEY (`subtopID`, `topID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_passage
DROP TABLE IF EXISTS `part_c_passage`;
CREATE TABLE `part_c_passage` (
    `topID` varchar(8) NOT NULL,
    `subtopID` varchar(8) NOT NULL,
    `conID` varchar(8) NOT NULL,
    `passID` char(6) NOT NULL,
    `passOrder` varchar(4) NOT NULL,
    `passTitle` varchar(100) NOT NULL,
    `passText` longtext NOT NULL,
    PRIMARY KEY (`topID`, `subtopID`, `conID`, `passID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_pass_qop
DROP TABLE IF EXISTS `part_c_pass_qop`;
CREATE TABLE `part_c_pass_qop` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `uid` int(11) NOT NULL,
    `sid` varchar(100) NOT NULL,
    `topID` varchar(8) NOT NULL,
    `subtopID` varchar(8) NOT NULL,
    `conID` varchar(8) NOT NULL,
    `passID` char(6) NOT NULL,
    `passOrder` varchar(4) NOT NULL,
    `c1Ans` int(11) NOT NULL,
    `c2Ans` int(11) NOT NULL DEFAULT 0,
    `c3Ans` int(11) NOT NULL DEFAULT 0,
    `c4Ans` int(11) NOT NULL DEFAULT 0,
    `passRT` int(11) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_task_time
DROP TABLE IF EXISTS `part_c_task_time`;
CREATE TABLE `part_c_task_time` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `uid` int(11) NOT NULL,
    `sid` varchar(100) NOT NULL,
    `topID` varchar(8) NOT NULL,
    `timeStart` int(10) NOT NULL,
    `timeEnd` int(10) NOT NULL,
    `timeStartStamp` varchar(50) NOT NULL,
    `timeEndStamp` varchar(50) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_subtop_qos
DROP TABLE IF EXISTS `part_c_subtop_qos`;
CREATE TABLE `part_c_subtop_qos` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `uid` int(11) NOT NULL,
    `sid` varchar(100) NOT NULL,
    `topID` varchar(8) NOT NULL,
    `subtopID` varchar(8) NOT NULL,
    `conID` varchar(8) NOT NULL,
    `pageTypeID` varchar(8) NOT NULL,
    `quesAns1` varchar(10) NOT NULL,
    `quesAns2` varchar(10) NOT NULL,
    `quesAns3` varchar(10) NOT NULL,
    `subtopScore` decimal(10,1) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `part_c_prac_topic`;
CREATE TABLE `part_c_prac_topic` (
    `topID` varchar(8) NOT NULL,
    `topTitle` varchar(100) NOT NULL,
    `topIdeasBonusWords` longtext NOT NULL,
    PRIMARY KEY (`topID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_prac_subtopic
DROP TABLE IF EXISTS `part_c_prac_subtopic`;
CREATE TABLE `part_c_prac_subtopic` (
    `subtopID` varchar(8) NOT NULL,
    `topID` varchar(8) NOT NULL,
    `subtopTitle` varchar(100) NOT NULL,
    PRIMARY KEY (`subtopID`, `topID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_prac_passage
DROP TABLE IF EXISTS `part_c_prac_passage`;
CREATE TABLE `part_c_prac_passage` (
    `topID` varchar(8) NOT NULL,
    `subtopID` varchar(8) NOT NULL,
    `conID` varchar(8) NOT NULL,
    `passID` char(6) NOT NULL,
    `passOrder` varchar(4) NOT NULL,
    `passTitle` varchar(100) NOT NULL,
    `passText` longtext NOT NULL,
    PRIMARY KEY (`topID`, `subtopID`, `conID`, `passID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_prac_pass_qop
DROP TABLE IF EXISTS `part_c_prac_pass_qop`;
CREATE TABLE `part_c_prac_pass_qop` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `uid` int(11) NOT NULL,
    `sid` varchar(100) NOT NULL,
    `topID` varchar(8) NOT NULL,
    `subtopID` varchar(8) NOT NULL,
    `conID` varchar(8) NOT NULL,
    `passID` char(6) NOT NULL,
    `passOrder` varchar(4) NOT NULL,
    `c1Ans` int(11) NOT NULL,
    `c2Ans` int(11) NOT NULL,
    `c3Ans` int(11) NOT NULL,
    `c4Ans` int(11) NOT NULL DEFAULT 0,
    `passRT` int(11) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_prac_task_time
DROP TABLE IF EXISTS `part_c_prac_task_time`;
CREATE TABLE `part_c_prac_task_time` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `uid` int(11) NOT NULL,
    `sid` varchar(100) NOT NULL,
    `topID` varchar(8) NOT NULL,
    `timeStart` int(10) NOT NULL,
    `timeEnd` int(10) NOT NULL,
    `timeStartStamp` varchar(50) NOT NULL,
    `timeEndStamp` varchar(50) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_questions
DROP TABLE IF EXISTS `part_c_questions`;
CREATE TABLE `part_c_questions` (
    `questionID` varchar(233) NOT NULL,
    `passID` char(6) NOT NULL,
    `topID` varchar(8) NOT NULL,
    `subtopID` varchar(8) NOT NULL,
    `conID` varchar(8) NOT NULL,
    `passOrder` varchar(100) NOT NULL,
    `passTitle` varchar(100) NOT NULL,
    `questionText` text NOT NULL,
    `choiceA` text NOT NULL,
    `choiceB` text NOT NULL,
    `choiceC` text NOT NULL,
    `choiceD` text NOT NULL,
    `correctAns` varchar(10) NOT NULL,
    PRIMARY KEY (`questionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_multi_qop
DROP TABLE IF EXISTS `part_c_multi_qop`;
CREATE TABLE `part_c_multi_qop` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `uid` int(11) NOT NULL,
    `sid` varchar(100) NOT NULL,
    `questionID` varchar(8) NOT NULL,
    `topID` varchar(8) NOT NULL,
    `subtopID` varchar(8) NOT NULL,
    `conID` varchar(8) NOT NULL,
    `passID` char(6) NOT NULL,
    `passOrder` varchar(4) NOT NULL,
    `choice` varchar(4) NOT NULL,
    `isCorrect` int(11) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_letter_item
DROP TABLE IF EXISTS `part_c_letter_item`;
CREATE TABLE `part_c_letter_item` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `uid` int(11) NOT NULL,
    `sid` varchar(100) NOT NULL,
    `round_number` tinyint NOT NULL,
    `item_index` tinyint NOT NULL,
    `left_str` varchar(64) NOT NULL,
    `right_str` varchar(64) NOT NULL,
    `correct_answer` char(1) NOT NULL,
    `response` char(1) NOT NULL,
    `is_correct` tinyint(1) NOT NULL,
    `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_letter_item` (`uid`, `sid`, `round_number`, `item_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_vocabulary_responses
DROP TABLE IF EXISTS `part_c_vocabulary_responses`;
CREATE TABLE `part_c_vocabulary_responses` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `participant_id` bigint(20) NOT NULL,
    `question_id` varchar(255) NOT NULL,
    `response_option` int(11) NOT NULL,
    `is_correct` tinyint(1) NOT NULL,
    `reaction_time_ms` int(11) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- part_c_practice_responses
DROP TABLE IF EXISTS `part_c_practice_responses`;
CREATE TABLE `part_c_practice_responses` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `participant_id` bigint(20) NOT NULL,
    `question_id` varchar(255) NOT NULL,
    `response_option` int(11) NOT NULL,
    `is_correct` tinyint(1) NOT NULL,
    `reaction_time_ms` int(11) NOT NULL,
    `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `part_c_formal_responses`;
CREATE TABLE `part_c_formal_responses` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `participant_id` bigint(20) NOT NULL,
    `question_id` varchar(255) NOT NULL,
    `response_option` int(11) NOT NULL,
    `is_correct` tinyint(1) NOT NULL,
    `reaction_time_ms` int(11) NOT NULL,
    `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




