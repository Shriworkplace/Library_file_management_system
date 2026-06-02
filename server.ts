import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load local environment variables if any
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse incoming request body
  app.use(express.json());

  // Initialize server-side Gemini client
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (geminiApiKey) {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // 1. Core AI Endpoint: Create a customized, structured Skill Learning Roadmap
  app.post("/api/generate-roadmap", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({
          error: "GEMINI_API_KEY environment variable is not configured. Please supply your API key under Settings panel."
        });
      }

      const { skillName } = req.body;
      if (!skillName || typeof skillName !== "string" || skillName.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid 'skillName' body parameter." });
      }

      const trimmedSkill = skillName.trim();
      const prompt = `You are a world-class academic advisor and curriculum developer. Create a comprehensive, realistic, and highly practical academic and skills learning roadmap for learning: "${trimmedSkill}".
      The roadmap MUST contain exactly 3 stages: 'Beginner', 'Intermediate', and 'Advanced'.
      For each stage, generate exactly 2 structured milestones.
      Include professional and free external learning resource suggestions such as official documentation guides, YouTube playlists, Coursera free-audit courses, MDN/web articles, or practice platforms.
      
      Generate a clean JSON payload mapping EXACTLY to this structure. No markdown formatting in the properties.
      Ensure the resource and roadmap IDs are unique and hyphenated alphanumeric strings only.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You only output JSON that matches the strict responseSchema layout requested. Do not return empty fields or mock placeholders.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roadmap: {
                type: Type.OBJECT,
                properties: {
                  skillId: { type: Type.STRING, description: "A unique slug ID starting with roadmap- (e.g. roadmap-python). Lowercase, alphanumeric and hyphens only." },
                  name: { type: Type.STRING, description: "Clear descriptive title of the learning roadmap (e.g., Complete Python Programming Curriculum)." },
                  skillName: { type: Type.STRING, description: "The short name of the skill (e.g., Python, UI/UX Design, Cloud Computing)." },
                  description: { type: Type.STRING, description: "An introductory description summarizing what this roadmap covers." },
                  estimatedHours: {
                    type: Type.OBJECT,
                    properties: {
                      beginner: { type: Type.INTEGER, description: "Estimated hours for beginner stage (e.g. 40)." },
                      intermediate: { type: Type.INTEGER, description: "Estimated hours for intermediate stage (e.g. 50)." },
                      advanced: { type: Type.INTEGER, description: "Estimated hours for advanced stage (e.g. 60)." }
                    },
                    required: ["beginner", "intermediate", "advanced"]
                  },
                  stages: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stageName: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
                        milestones: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              milestoneId: { type: Type.STRING, description: "Unique slug identifier (e.g., milestone-py-basics). Lowercase, alphanumeric and hyphnes only." },
                              title: { type: Type.STRING, description: "Short descriptive title of the milestone." },
                              description: { type: Type.STRING, description: "Extended explanation of topics in this milestone." },
                              learningObjectives: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "List of 2-3 specific learning outcome targets."
                              },
                              estimatedHours: { type: Type.INTEGER, description: "Syllabus hour estimation for this milestone." },
                              order: { type: Type.INTEGER, description: "Sequential timeline number of the milestone starting from 1." },
                              resources: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "List of resourceId references (must match the resourceId from the resources array)."
                              }
                            },
                            required: ["milestoneId", "title", "description", "learningObjectives", "estimatedHours", "order", "resources"]
                          }
                        }
                      },
                      required: ["stageName", "milestones"]
                    }
                  },
                  isActive: { type: Type.BOOLEAN, description: "Always set to true." }
                },
                required: ["skillId", "name", "skillName", "description", "estimatedHours", "stages", "isActive"]
              },
              resources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    resourceId: { type: Type.STRING, description: "Unique slug for resource, referencing from milestone (e.g., res-py-basics-yt)." },
                    title: { type: Type.STRING, description: "Title of the learning resource (e.g., Modern Python Tutorial by FreeCodeCamp)." },
                    description: { type: Type.STRING, description: "Summary of the resource." },
                    url: { type: Type.STRING, description: "A high-quality educational link related to the resource provider. Prefer official URLs, real Youtube search links, or well-known platforms." },
                    type: { type: Type.STRING, enum: ["video", "article", "course", "documentation", "practice", "project"] },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of related skill strings." },
                    difficulty: { type: Type.STRING, enum: ["beginner", "intermediate", "advanced"] },
                    provider: { type: Type.STRING, description: "Name of the resource provider (e.g. YouTube, FreeCodeCamp, MDN, Coursera)." },
                    isPaid: { type: Type.BOOLEAN, description: "Always set to false (free educational material)." },
                    rating: { type: Type.NUMBER, description: "Star score between 4.0 and 5.0." },
                    upvoteCount: { type: Type.INTEGER, description: "Simulated positive votes count (e.g. 10 to 150)." },
                    downvoteCount: { type: Type.INTEGER, description: "Simulated downvotes count (e.g. 0 to 5)." },
                    isCurated: { type: Type.BOOLEAN, description: "Always set to true." }
                  },
                  required: ["resourceId", "title", "description", "url", "type", "skills", "difficulty", "provider", "isPaid", "rating", "upvoteCount", "downvoteCount", "isCurated"]
                }
              }
            },
            required: ["roadmap", "resources"]
          }
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText);

      return res.json(data);
    } catch (error) {
      console.error("AI Roadmap Generation Error:", error);
      return res.status(500).json({
        error: "Failed to generate learning roadmap. Deep error: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });

  // 2. Serving UI Assets via Vite Middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    // Development server mode using Vite HMR-free middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production build delivery
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BooksAbove Full-Stack Server listening on http://localhost:${PORT}`);
  });
}

startServer();
