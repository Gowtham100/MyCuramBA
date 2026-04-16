import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { runWorkflow } from "../src/agent/curamWorkflow.ts";

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasKey: !!process.env.OPENAI_API_KEY,
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    const payload = req.body;

    const result = await runWorkflow({
      input_as_text: JSON.stringify(payload, null, 2),
    });

    console.log("Workflow result:", result);

    res.json({
      markdown: result.formatted || "No formatted output returned.",
      raw: result,
    });
  } catch (error) {
    console.error("Workflow error:", error);

    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Unknown workflow error",
    });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});