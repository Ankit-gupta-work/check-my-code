import 'dotenv/config';
import express from "express";
import cors from "cors";
import { analyzeCode } from "./aiservice.js";

const app = express();

// In backend/index.js
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://check-my-code-chi.vercel.app' 
    : 'http://localhost:3000'
}));
app.use(express.json());

app.post("/review", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const result = await analyzeCode(code);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});