require("dotenv").config();
const fetch = require("node-fetch");

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    try {
        const res = await fetch(URL);
        const data = await res.json();
        console.log("--- Daftar Model Tersedia ---");
        data.models.forEach(m => console.log(m.name));
    } catch (err) {
        console.error("Gagal mengambil daftar model:", err.message);
    }
}

listModels();