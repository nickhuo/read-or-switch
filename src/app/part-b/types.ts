
export interface Story {
    id: number;
    title: string;
    phase: "practice" | "formal";
}

export interface Segment {
    id: number;
    story_id: number;
    content: string;
    segment_order: number;
}

export interface Question {
    id: number;
    story_id: number;
    story_title: string;
    question_text: string;
    question_order?: number;
    option_1: string;
    option_2: string;
    option_3: string;
    option_4: string;
    correct_option: number;
}
