import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

/* 🔥 CORS LIBERADO CORRETAMENTE */
app.use(cors({
  origin: true, // permite qualquer localhost
  credentials: true
}));

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Erro OpenAI:", error);
    res.status(500).json({ error: "Erro ao chamar OpenAI" });
  }
});

app.listen(3001, "127.0.0.1", () => {
  console.log("🔥 Backend rodando em http://127.0.0.1:3001");
});