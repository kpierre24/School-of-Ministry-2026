import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../../lib/logger";

export const aiRouter = Router();

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

aiRouter.post("/evaluate-lesson", async (req, res) => {
  try {
    const { title, content, author, courseCode, fileName } = req.body;

    if (!title && !content) {
      return res.status(400).json({ error: "Title or content is required" });
    }

    const ai = getGenAI();

    if (ai) {
      try {
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

Return ONLY raw JSON in this format:
{
  "summary": "...",
  "category": "...",
  "keyTakeaways": ["...", "..."],
  "courseCode": "..."
}
`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const textResponse = response.text;
        if (textResponse) {
          const parsed = JSON.parse(textResponse);
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
        logger.warn("Gemini API call warning, falling back to local heuristic evaluation:", geminiError.message);
      }
    }

    const sampleText = (content || title || "").slice(0, 300);
    const generatedSummary = content && content.length > 30
      ? `Lesson overview covering key ministerial principles: "${content.slice(0, 140).trim()}..."`
      : `Comprehensive lesson material titled "${title || fileName || 'Ministry Lesson'}" structured for the School of Ministry.`;

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
