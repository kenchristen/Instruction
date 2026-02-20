import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("API Gemini OK ✅"));

app.post("/generate", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY manquante sur Render (Environment Variables).",
      });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Champ 'prompt' manquant." });
    }

    // ✅ Nouveau SDK @google/genai
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return res.json({ text: response.text ?? "" });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Erreur inconnue" });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`API démarrée sur le port ${port}`));
