import express from "express";
import { GoogleGenerativeAI } from "@google/genai";

const app = express();
app.use(express.json());

// Petite route de test
app.get("/", (req, res) => {
  res.send("API Gemini OK ✅");
});

// Route principale: le front enverra { prompt: "..." }
app.post("/generate", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY manquante sur Render (Environment Variables)."
      });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Champ 'prompt' manquant." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? "";

    return res.json({ text });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Erreur inconnue" });
  }
});

const port = process.env.PORT || 10000; // Render fournit PORT
app.listen(port, () => {
  console.log(`API démarrée sur le port ${port}`);
});
