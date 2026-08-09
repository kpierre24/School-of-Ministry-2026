import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createHttpServer(app);
const PORT = 3000;

// Increase JSON payload limit for file/text evaluations
app.use(express.json({ limit: "20mb" }));

/**
 * Fetches the latest code updates from the specified GitHub repository
 * and overwrites the current workspace files with the remote content.
 */
export function pullFromGithub(
  repoUrl: string = "https://github.com/kpierre24/School-of-Ministry-2026.git",
  targetDir: string = process.cwd()
): { success: boolean; message?: string; error?: string } {
  const tempDir = path.join("/tmp", `github_pull_${Date.now()}`);
  try {
    console.log(`Cloning ${repoUrl} into temporary directory...`);
    execSync(`git clone --depth 1 ${repoUrl} ${tempDir}`, { stdio: "inherit" });

    const copyRecursive = (src: string, dst: string) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        if ([".git", "node_modules", ".vite", "dist"].includes(entry.name)) continue;
        const srcPath = path.join(src, entry.name);
        const dstPath = path.join(dst, entry.name);
        if (entry.isDirectory()) {
          if (!fs.existsSync(dstPath)) {
            fs.mkdirSync(dstPath, { recursive: true });
          }
          copyRecursive(srcPath, dstPath);
        } else {
          fs.copyFileSync(srcPath, dstPath);
        }
      }
    };

    copyRecursive(tempDir, targetDir);
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log("Successfully updated workspace from GitHub repository.");
    return { success: true, message: "Workspace successfully updated from GitHub repository." };
  } catch (err: any) {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    console.error("Failed to pull from GitHub:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

// API Route: Pull latest code updates from GitHub repository
app.post("/api/pull-from-github", (req, res) => {
  const repoUrl = req.body?.repoUrl || "https://github.com/kpierre24/School-of-Ministry-2026.git";
  const result = pullFromGithub(repoUrl);
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

// Lazy initializer for Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// API Route: Evaluate Lesson Content with Gemini AI
app.post("/api/evaluate-lesson", async (req, res) => {
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
        console.warn("Gemini API call warning, falling back to local heuristic evaluation:", geminiError.message);
      }
    }

    // Fallback heuristic evaluation if Gemini API key is missing or errored
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
    console.error("Error evaluating lesson:", err);
    return res.status(500).json({ error: "Failed to evaluate lesson content" });
  }
});

async function startServer() {
  // Vite middleware for development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`HTEIM School of Ministry server running on http://localhost:${PORT}`);
  });
}

startServer();
