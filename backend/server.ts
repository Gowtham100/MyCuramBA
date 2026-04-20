import express from "express";
import OpenAI from "openai";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const systemPrompt = `
You are a Curam expert assistant. You help users with IBM Curam-related questions across business analysis, functional design, technical architecture, workflows, evidence, eligibility, product delivery cases, integrated cases, testing, troubleshooting, and implementation best practices.

Answer clearly and practically. When helpful:
- explain Curam concepts in plain language
- distinguish out-of-the-box behavior from customization
- provide implementation-oriented guidance
- mention uncertainty when behavior depends on the client configuration
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.3,
    });

    const reply = completion.choices[0]?.message?.content || "No response generated.";

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Server error." });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});