"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function DemographicsForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const participantId = searchParams.get("participant_id");

    const [formData, setFormData] = useState({
        dobMonth: "",
        dobDay: "",
        dobYear: "",
        age: "",
        gender: "",
        education: "",
        nativeSpeaker: "",
        firstLanguage: "",
        proficiencyReading: "",
        proficiencyWriting: "",
        isHispanic: "",
        race: "",
        knowledge: {
            "Bone grafts": "",
            "Hypertension": "",
            "Blood donation": "",
            "Multiple sclerosis": "",
            "Corneal transplants": "",
            "Kidney dialysis": "",
            "Liver cancer": "",
            "Vaccine": "",
            "Colorectal cancer": "",
            "Alzheimer's disease": "",
        } as Record<string, string>,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleKnowledgeChange = (topic: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            knowledge: {
                ...prev.knowledge,
                [topic]: value,
            },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!participantId) {
            alert("Missing Participant ID");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/demographics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    ...formData,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to submit");
            }

            // Immediately navigate, no success alert needed
            router.push(`/part-a?participant_id=${participantId}`);
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again.";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!participantId) {
        return <div className="p-8 text-center text-red-500">Error: No Participant ID provided.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl bg-white p-8 shadow rounded-lg">
                <h1 className="mb-8 text-2xl font-bold text-gray-900">Demographic Information</h1>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Date of Birth */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth:</label>
                        <div className="mt-2 flex gap-4">
                            <input
                                type="number"
                                placeholder="MM"
                                className="w-20 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none text-black"
                                value={formData.dobMonth}
                                onChange={(e) => setFormData({ ...formData, dobMonth: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="DD"
                                className="w-20 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none text-black"
                                value={formData.dobDay}
                                onChange={(e) => setFormData({ ...formData, dobDay: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="YYYY"
                                className="w-24 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none text-black"
                                value={formData.dobYear}
                                onChange={(e) => setFormData({ ...formData, dobYear: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Gender:</label>
                        <div className="mt-2 space-x-6">
                            {["Male", "Female"].map((g) => (
                                <label key={g} className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value={g}
                                        checked={formData.gender === g}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                        required
                                    />
                                    <span className="ml-2 text-gray-700">{g}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Education */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Using the scale below, how many years of formal education did you complete?
                        </label>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {[
                                { val: "1", label: "Fewer than 8 years (1)" },
                                { val: "2", label: "Completed 8th grade (2)" },
                                { val: "3", label: "Some high school (3)" },
                                { val: "4", label: "Graduated high school (4)" },
                                { val: "5", label: "Some college (5)" },
                                { val: "6", label: "Graduated college (6)" },
                                { val: "7", label: "Master's degree (7)" },
                                { val: "8", label: "Doctoral or medical degree (8)" },
                            ].map((opt) => (
                                <label key={opt.val} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="education"
                                        value={opt.val}
                                        checked={formData.education === opt.val}
                                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                        required
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Native Speaker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Are you a native speaker of English?</label>
                        <div className="mt-2 space-x-6">
                            {["Yes", "No"].map((opt) => (
                                <label key={opt} className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="nativeSpeaker"
                                        value={opt}
                                        checked={formData.nativeSpeaker === opt}
                                        onChange={(e) => setFormData({ ...formData, nativeSpeaker: e.target.value })}
                                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                        required
                                    />
                                    <span className="ml-2 text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* First Language (Conditional) */}
                    {formData.nativeSpeaker === "No" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">If not, what is your first language?</label>
                            <div className="mt-2 space-y-2">
                                <select
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none text-black"
                                    value={[
                                        "Chinese", "Spanish", "Hindi", "Arabic", "Portuguese",
                                        "Bengali", "Russian", "Japanese", "German", "French", "Korean", "Italian"
                                    ].includes(formData.firstLanguage) ? formData.firstLanguage : (formData.firstLanguage ? "Other" : "")}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "Other") {
                                            setFormData({ ...formData, firstLanguage: "" });
                                        } else {
                                            setFormData({ ...formData, firstLanguage: val });
                                        }
                                    }}
                                    required={formData.nativeSpeaker === "No" && !formData.firstLanguage}
                                >
                                    <option value="" disabled>Select a language</option>
                                    <option value="Chinese">Chinese</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Arabic">Arabic</option>
                                    <option value="Portuguese">Portuguese</option>
                                    <option value="Bengali">Bengali</option>
                                    <option value="Russian">Russian</option>
                                    <option value="Japanese">Japanese</option>
                                    <option value="German">German</option>
                                    <option value="French">French</option>
                                    <option value="Korean">Korean</option>
                                    <option value="Italian">Italian</option>
                                    <option value="Other">Other</option>
                                </select>

                                {(![
                                    "Chinese", "Spanish", "English", "Hindi", "Arabic", "Portuguese",
                                    "Bengali", "Russian", "Japanese", "German", "French", "Korean", "Italian"
                                ].includes(formData.firstLanguage) && formData.firstLanguage !== undefined) && (
                                        <input
                                            type="text"
                                            placeholder="Please specify"
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none text-black"
                                            value={formData.firstLanguage}
                                            onChange={(e) => setFormData({ ...formData, firstLanguage: e.target.value })}
                                            required
                                        />
                                    )}
                            </div>
                        </div>
                    )}

                    {/* Proficiency */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            How would you rate your overall proficiency in English? (1 = Not proficient at all, 7 = Native-level proficiency)
                        </label>
                        <div className="mt-4 space-y-4">
                            {["Reading", "Writing"].map((skill) => (
                                <div key={skill} className="flex items-center justify-between border-b pb-2">
                                    <span className="w-24 text-sm font-medium text-gray-700">{skill}</span>
                                    <div className="flex flex-1 justify-between px-4">
                                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                            <label key={num} className="flex flex-col items-center">
                                                <span className="mb-1 text-xs text-gray-500">{num}</span>
                                                <input
                                                    type="radio"
                                                    name={`proficiency_${skill}`}
                                                    value={num}
                                                    checked={formData[skill === "Reading" ? "proficiencyReading" : "proficiencyWriting"] === String(num)}
                                                    onChange={(e) => setFormData({ ...formData, [skill === "Reading" ? "proficiencyReading" : "proficiencyWriting"]: e.target.value })}
                                                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    required
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ethnicity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Are you Hispanic or Latino?</label>
                        <div className="mt-2 space-x-6">
                            {["Yes", "No"].map((opt) => (
                                <label key={opt} className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="isHispanic"
                                        value={opt}
                                        checked={formData.isHispanic === opt}
                                        onChange={(e) => setFormData({ ...formData, isHispanic: e.target.value })}
                                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                        required
                                    />
                                    <span className="ml-2 text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Please check one of the following ethnic or racial categories that best describe you.
                        </label>
                        <div className="mt-2 space-y-2">
                            {[
                                "Native American/Alaska Native",
                                "Asian",
                                "Native Hawaiian or Other Pacific Islander",
                                "Black or African American",
                                "White or Caucasian",
                            ].map((race) => (
                                <label key={race} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="race"
                                        value={race}
                                        checked={formData.race === race}
                                        onChange={(e) => setFormData({ ...formData, race: e.target.value })}
                                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                        required
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{race}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Prior Knowledge */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Prior knowledge question</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            How much do you already know about each of the following topics? (1 = I don&apos;t know anything, 7 = I know a lot)
                        </p>

                        <div className="mt-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Topic</th>
                                        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                            <th key={n} className="px-2 py-2 text-center text-sm font-medium text-gray-700">{n}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {Object.keys(formData.knowledge).map((topic) => (
                                        <tr key={topic}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{topic}</td>
                                            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                                <td key={n} className="px-2 py-3 text-center">
                                                    <input
                                                        type="radio"
                                                        name={`knowledge_${topic.replace(/[^a-zA-Z0-9]/g, "_")}`}
                                                        value={n}
                                                        checked={formData.knowledge[topic] === String(n)}
                                                        onChange={(e) => handleKnowledgeChange(topic, e.target.value)}
                                                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        required
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DemographicsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DemographicsForm />
        </Suspense>
    );
}
