require("dotenv").config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require("node-fetch");

// --- KONFIGURASI ---
const API_KEY = process.env.GEMINI_API_KEY;
// Gunakan model yang terbukti ada di list kamu sebelumnya
const MODEL = "gemma-3-4b-it"; 

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
// --- INISIALISASI WHATSAPP ---
const client = new Client({
    authStrategy: new LocalAuth(), // Menyimpan sesi agar tidak scan QR terus
    puppeteer: {
        handleSIGINT: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Menampilkan QR Code di terminal
client.on('qr', (qr) => {
    console.log('🚀 SCAN QR CODE INI UNTUK LOGIN:');
    qrcode.generate(qr, { small: true });
});

// Bot Siap
client.on('ready', () => {
    console.log('✅ WhatsApp Bot Berhasil Terhubung!');
});

// --- FUNGSI GEMINI AI ---
async function tanyaGemini(pesanUser) {
    try {
        // Membersihkan pesan dari awalan !ask atau /ask jika ada
        const cleanPrompt = pesanUser.replace(/^\/ask\s*|^\!ask\s*/i, "");

        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: cleanPrompt }] }]
            }),
        });

        const data = await response.json();

        // --- DEBUGGING: Lihat apa yang dikirim Google ke terminal ---
        if (data.error) {
            console.log("❌ ERROR DARI GOOGLE:", data.error.message);
            return `Maaf, ada error dari Google: ${data.error.message}`;
        }

        // Cek apakah ada candidate (jawaban)
        if (!data.candidates || data.candidates.length === 0) {
            console.log("⚠️ GOOGLE TIDAK MEMBERIKAN JAWABAN. Data:", JSON.stringify(data));
            return "Maaf, AI tidak memberikan jawaban. Mungkin pesan mengandung kata sensitif.";
        }

        // Ambil teks
        const hasilTeks = data.candidates[0].content?.parts?.[0]?.text;
        
        if (hasilTeks) {
            return hasilTeks;
        } else {
            console.log("⚠️ STRUKTUR TEKS TIDAK DITEMUKAN. Data:", JSON.stringify(data));
            return "Maaf, format jawaban AI tidak dikenali.";
        }

    } catch (error) {
        console.error("❌ KESALAHAN SISTEM:", error.message);
        return "Terjadi kesalahan koneksi pada server bot.";
    }
}
// --- LOGIKA PESAN MASUK ---
client.on('message', async (msg) => {
    // Abaikan jika pesan berasal dari status/story
    if (msg.from === 'status@broadcast') return;

    const chat = await msg.getChat();
    
    // Opsi: Hanya balas chat pribadi (bukan grup)
    if (!chat.isGroup) {
        console.log(`📩 Chat dari ${msg.from}: ${msg.body}`);

        // Berikan efek "typing..." di WhatsApp
        chat.sendStateTyping();

        // Kirim pesan user ke Gemini
        const jawabanAI = await tanyaGemini(msg.body);

        // Balas pesan
        await msg.reply(jawabanAI);
    }
});

// Jalankan Bot
client.initialize();