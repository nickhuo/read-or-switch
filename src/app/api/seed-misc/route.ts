import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        console.log("Seeding all static data...");

        // Disable FK checks to allow truncate
        await query('SET FOREIGN_KEY_CHECKS = 0');
        await query('TRUNCATE TABLE letter_comparison_problems');
        await query('TRUNCATE TABLE vocabulary_questions');
        await query('TRUNCATE TABLE comprehension_questions');
        await query('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Letter Problems (10 items)
        const letterProblems = [
            ['PRDBZTYFN', 'PRDBZTYFN', true],
            ['NCWJDZ', 'NCMJDZ', false],
            ['KHW', 'KBW', false],
            ['ZRBGMF', 'ZRBCMF', false],
            ['BTH', 'BYH', false],
            ['XWKQRYCNZ', 'XWKQRYCNZ', true],
            ['HNPDLK', 'HNPDLK', true],
            ['WMQTRSGLZ', 'WMQTRZGLZ', false],
            ['JPN', 'JPN', true],
            ['QLXSVT', 'QLNSVT', false]
        ];

        for (const p of letterProblems) {
            await query(
                'INSERT INTO letter_comparison_problems (string_1, string_2, is_same) VALUES (?, ?, ?)',
                p
            );
        }

        // 2. Vocab Questions (3 items)
        const vocabQuestions = [
            ['mumble', 'speak indistinctly', 'complain', 'handle awkwardly', 'fall over something', 'tear apart', 1],
            ['perspire', 'struggle', 'sweat', 'happen', 'penetrate', 'submit', 2],
            ['gush', 'giggle', 'spout', 'sprinkle', 'hurry', 'cry', 2]
        ];

        for (const v of vocabQuestions) {
            await query(
                'INSERT INTO vocabulary_questions (word, option_1, option_2, option_3, option_4, option_5, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)',
                v
            );
        }

        // 3. Comprehension Questions (4 items matching FinalAssessment.tsx IDs 1-4)
        // Note: story_id 1 is used as placeholder.
        const compQuestions = [
            [1, 'A medical supplier is interested in understanding the market size of bone graft material. What kind of population may be in the market?', 'an athlete with severe fractures', 'a retiree with significant bone loss', 'a patient suffering from cancer', 'all of the above', 4],
            [1, 'A tissue banks is responsible for screening the medical histories of the donors and freeze the donated bones (T/F)', 'TRUE', 'FALSE', '', '', 1],
            [1, 'What could be a risk that is associated with surgical procedure of bone graft?', 'osteoporosis', 'infection', 'muscle atrophy', 'nerve damage', 2],
            [1, 'Due to ethical concerns, all bone graft materials can only come from donors who have died (T/F)', 'TRUE', 'FALSE', '', '', 2]
        ];

        for (const c of compQuestions) {
            await query(
                'INSERT INTO comprehension_questions (story_id, question_text, option_1, option_2, option_3, option_4, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)',
                c
            );
        }

        return NextResponse.json({ success: true, message: "Seeded letter(10), vocab(3), comp(4)" });
    } catch (error: unknown) {
        console.error("Seeding failed:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
