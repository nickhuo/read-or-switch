# Product Requirement Document (PRD): Narrative Text Foraging Study

## 1. Overview
This project aims to develop a web-based experiment platform to study the effects of surprise (predictability) on the tradeoff between exploitation (continuing to read the current story) and exploration (switching to a new story) in narrative text foraging.

## 2. Research Question
To examine how the predictability of the last sentence in a text segment influences a reader's decision to continue reading the same story or switch to a different one.

## 3. User Flow
The experiment consists of the following stages:
1.  **Informed Consent**: Participant agrees to the study terms.
2.  **Demographic Information**: Collection of basic user data.
3.  **Part A: Sentence Reading Study**
4.  **Part B: Story Reading Study** (Main Task)
5.  **Part C: Multi-text Learning Study**
6.  **Cognitive Measures**
7.  **Debriefing and Thank You**

## 4. Functional Requirements

### 4.1 General
-   **Platform**: Web-based application (accessible via browser).
-   **Timing**: The system must track time accurately for task limits and reading times.
-   **Data Logging**: All user interactions (clicks, reading times, text inputs, answers) must be logged.

### 4.2 Part A: Sentence Reading Study
-   **Instructions**: Display instructions for 10 minutes (or allow user to proceed when ready?). *Note: Source doc says "Instructions (10 minute)", likely meaning the task duration or estimated time.*
-   **Stimuli**: 20 sentences total.
-   **Display Format**:
    -   Show one word at a time (RSVP or self-paced reading?). *Source says "Show one word at a time".*
    -   Grouped in sequences of 5 sentences.
-   **Tasks**:
    -   **Written Summary**: After the sequence, user writes a summary.
    -   **Comprehension Questions**: User answers questions about the sentences.

### 4.3 Part B: Story Reading Study (Core Task)
This part investigates the "foraging" behavior.

#### 4.3.1 Practice Phase
-   **Duration**: 4 minutes.
-   **Content**: 3 Stories.
-   **Structure per Story**:
    -   6 text segments per story.
    -   Length: ~50 words per segment (45-55 words).
-   **Task Flow**:
    1.  User sees titles of available stories.
    2.  User selects a story to start reading.
    3.  User reads one text segment at a time.
    4.  **Manipulation**: The last sentence of the text varies in predictability (Predictable vs. Unpredictable).
    5.  **Decision Point**: After each segment, the user chooses to:
        -   **Continue**: Read the next segment of the current story.
        -   **Switch**: Go back to the main menu to select a different story.
    6.  **Post-Task**:
        -   Written summary.
        -   Comprehension questions.

#### 4.3.2 Formal Task Phase
-   **Duration**: 15 minutes.
-   **Content**: 5 Stories.
-   **Structure per Story**:
    -   6 text segments per story.
    -   Length: ~220 words per segment (200-250 words).
-   **Task Flow**: Same as Practice Phase (Select -> Read -> Decide -> Repeat).
-   **Post-Task**:
    -   Written summary.
    -   Comprehension questions.

### 4.4 Part C: Multi-text Learning Study
-   **Practice Phase**:
    -   Duration: 4 minutes.
    -   Topic: "Animal task".
    -   No recall required.
    -   Written summary.
    -   Fixed comprehension questions.
-   **Formal Task Phase**:
    -   Duration: 15 minutes.
    -   Topic: "Health task".
    -   No recall required.
    -   Written summary.
    -   Fixed comprehension questions.

### 4.5 Cognitive Measures
-   Standard cognitive tests (same as current study - specific details to be confirmed from external reference if needed, but placeholder for now).

## 5. Content & Stimuli
The content includes stories with alternative endings for the text segments.
*See `Paragraph_unexpected_20251023.docx` for specific text examples.*

**Example Structure:**
-   **Predictable Ending**: The text concludes in a way that logically follows the preceding context.
-   **Unpredictable Ending**: The text concludes with a surprising twist or unexpected event.

## 6. Data Collection Requirements
The system must record:
-   **Timestamp** for every event.
-   **Reading Time**: Time spent on each text segment.
-   **Navigation Choices**: Whether the user continued or switched after each segment.
-   **Story Selection**: Which story was chosen and in what order.
-   **Input Data**:
    -   Demographic details.
    -   Written summaries.
    -   Answers to comprehension questions.
-   **Cognitive Measure Scores**.

## 7. Technical Constraints & Notes
-   Ensure smooth transitions between segments.
-   Prevent back-navigation (browser back button should be disabled or handled).
-   Progress saving (optional but recommended in case of disconnect).

---
*Based on documents: `Task_Design_Jiajun_20251110.docx`, `Study Design_Narrative Text Foraging.docx`, `Paragraph_unexpected_20251023.docx`.*
