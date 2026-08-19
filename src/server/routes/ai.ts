import { Router } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { logger } from "../../lib/logger";

export const aiRouter = Router();

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

aiRouter.post("/evaluate-lesson", async (req, res) => {
  try {
    const { title, content, author, courseCode, fileName } = req.body;

    if (!title && !content) {
      return res.status(400).json({ error: "Title or content is required" });
    }

    const ai = getGenAI();

    if (ai) {
      const prompt = `
You are an expert academic and theological curriculum evaluator for the HTEIM School of Ministry.
Analyze the following lesson / course material and generate a structured evaluation.

Lesson Title: ${title || fileName || "Untitled Lesson"}
Author / Instructor: ${author || "Unknown"}
Target Course Code: ${courseCode || "General"}
File Name: ${fileName || "N/A"}

Lesson Content / Excerpt:
"""
${(content || "").slice(0, 8000)}
"""

Please provide a JSON object with the following fields:
1. "summary": A crisp 2-3 sentence executive summary of the lesson suitable for a course material card (highlighting key theological concepts, scripture references, or core objectives).
2. "category": A recommended category string (e.g., "Textbook", "Study Guide", "Lecture Notes", "Scripture Memory", "Syllabus", "Expository Manual").
3. "keyTakeaways": An array of 3-4 bullet points highlighting key learning outcomes or ministerial takeaways.
4. "courseCode": Recommended or confirmed course code (e.g. "SOM-101", "SOM-102", "SOM-CORE", or user-provided).
`;

      const modelsToTry = ["gemini-3.7-flash", "gemini-3.1-flash-lite"];

      for (const modelName of modelsToTry) {
        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
          attempts++;
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    summary: {
                      type: Type.STRING,
                      description: "A 2-3 sentence executive summary of the lesson",
                    },
                    category: {
                      type: Type.STRING,
                      description: "Curriculum category such as Textbook, Study Guide, or Lecture Notes",
                    },
                    keyTakeaways: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Key learning outcomes or ministerial takeaways",
                    },
                    courseCode: {
                      type: Type.STRING,
                      description: "Course code like SOM-101 or SOM-CORE",
                    },
                  },
                  required: ["summary", "category", "keyTakeaways", "courseCode"],
                },
              },
            });

            const textResponse = response.text;
            if (textResponse) {
              const cleanedText = textResponse.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
              const parsed = JSON.parse(cleanedText);
              return res.json({
                success: true,
                evaluatedByAI: true,
                summary: parsed.summary || "Summary evaluated by Gemini AI.",
                category: parsed.category || "Study Guide",
                keyTakeaways: parsed.keyTakeaways || [],
                courseCode: parsed.courseCode || courseCode || "SOM-CORE",
              });
            }
          } catch (geminiError: any) {
            const errorMessage = geminiError?.message || String(geminiError);
            const isTransient =
              errorMessage.includes("503") ||
              errorMessage.includes("high demand") ||
              errorMessage.includes("UNAVAILABLE") ||
              errorMessage.includes("429") ||
              errorMessage.includes("RESOURCE_EXHAUSTED");

            if (isTransient && attempts < maxAttempts) {
              logger.warn(`Gemini (${modelName}) transient demand spike, retrying in 1s...`);
              await sleep(1000);
              continue;
            }

            logger.warn(`Gemini API call warning with ${modelName}:`, errorMessage);
            break; // Try next model if available
          }
        }
      }
    }

    // High quality intelligent heuristic fallback if API is unreachable or during extreme cloud spikes
    const rawContent = (content || "").trim();
    const generatedSummary = rawContent.length > 50
      ? `Lesson overview covering key ministerial principles: "${rawContent.slice(0, 160).trim()}..."`
      : `Comprehensive curriculum module titled "${title || fileName || 'Ministry Lesson'}" designed for the HTEIM School of Ministry student body.`;

    const inferredCategory = title?.toLowerCase().includes("audio") ? "Lecture Audio"
      : title?.toLowerCase().includes("guide") ? "Study Guide"
      : title?.toLowerCase().includes("handbook") || title?.toLowerCase().includes("manual") ? "Textbook"
      : title?.toLowerCase().includes("scripture") || title?.toLowerCase().includes("memory") ? "Scripture Memory"
      : "Lecture Notes";

    const keyTakeaways = [
      `Grasp foundational kingdom concepts presented in ${title || 'this lesson'}.`,
      "Apply scripture memory and biblical exegesis to practical ministry.",
      "Integrate leadership ethics and doctrine into pastoral service."
    ];

    return res.json({
      success: true,
      evaluatedByAI: false,
      summary: generatedSummary,
      category: inferredCategory,
      keyTakeaways,
      courseCode: courseCode || "SOM-CORE",
    });
  } catch (err: any) {
    logger.error("Error evaluating lesson:", err);
    return res.status(500).json({ error: "Failed to evaluate lesson content" });
  }
});
