// ACADEX UNIFIED 24/7 SERVER - PWA + WhatsApp Bot + USSD on ONE PORT (for Render)
// So you get ONE permanent link: https://acadex.onrender.com
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ verify: (req,res,buf)=>req.rawBody=buf }));
app.use(express.urlencoded({ extended:true }));

// --- Import bot and ussd logic ---
import './whatsapp/bot-acadex-secure.js'; // this will mount its own app? Instead we mount routes manually

// For unified, we will copy routes here to ensure single port
// Simple static serve for PWA
app.use(express.static(__dirname));
app.use('/audio', express.static(path.join(__dirname, 'audio')));
app.use('/whatsapp', express.static(path.join(__dirname, 'whatsapp')));

app.get('/health', (req,res)=>res.json({ status:'ACADEX live', time: new Date().toISOString() }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log(`ACADEX Unified live on :${PORT}`));
