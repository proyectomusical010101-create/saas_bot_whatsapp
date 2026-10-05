/**
 * ============================================================================
 * WHATSAPP AI BOT - STARTER TEMPLATE
 * Compatible con Node.js 18+ / 20 LTS, Google Gemini AI y PM2
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Client, LocalAuth, Message, MessageMedia } = require('whatsapp-web.js');
require('dotenv').config();

const serverStartTime = Date.now();
const PORT = process.env.PORT || 3000;

// ============================================================================
// 1. RUTAS DE ARCHIVOS DEL PROYECTO
// ============================================================================
const CONFIG_PATH = path.join(__dirname, 'bot_config.json');
const KNOWLEDGE_PATH = path.join(__dirname, 'knowledge.txt');
const AUTH_CREDENTIALS_PATH = path.join(__dirname, 'auth_credentials.json');
const ORDERS_PATH = path.join(__dirname, 'orders.json');
const AUTH_DATA_PATH = path.join(__dirname, '.wwebjs_auth');
const PUBLIC_QR_PATH = path.join(__dirname, 'public', 'qr.png');

// ============================================================================
// 2. PARCHE DE COMPATIBILIDAD WHATSAPP WEB 2.3000+ (Descarga multimedia robusta)
// ============================================================================
const originalDownloadMedia = Message.prototype.downloadMedia;
Message.prototype.downloadMedia = async function () {
    if (!this.hasMedia) return undefined;
    const msgId = this.id._serialized || this.id.$1;

    try {
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 6000));
        const res = await Promise.race([originalDownloadMedia.call(this), timeoutPromise]);
        if (res && res.data) return res;
    } catch (err) {
        // Fallback si falla el método oficial
    }

    try {
        const result = await this.client.pupPage.evaluate(async (mId) => {
            if (window.WWebJS && window.WWebJS.resolveMediaBlob) {
                try {
                    const resolved = await window.WWebJS.resolveMediaBlob(mId);
                    if (resolved && resolved.blob) {
                        const data = await window.WWebJS.arrayBufferToBase64Async(await resolved.blob.arrayBuffer());
                        return { data, mimetype: resolved.mimetype || 'image/jpeg', filename: resolved.filename || 'media_file' };
                    }
                } catch (e) {}
            }
            return null;
        }, msgId);

        if (result && result.data) {
            return new MessageMedia(result.mimetype, result.data, result.filename);
        }
    } catch (e) {}

    return undefined;
};

// ============================================================================
// 3. CARGA Y GESTIÓN DE CONFIGURACIÓN & CONOCIMIENTO
// ============================================================================
function readConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error('[Config]: Error leyendo bot_config.json:', e.message);
    }
    return {
        botName: 'Asistente Virtual',
        businessName: 'Mi Negocio',
        country: 'México',
        currency: 'MXN',
        timezone: 'America/Mexico_City',
        schedule: { weekdays: '09:00 AM - 06:00 PM', saturdays: '09:00 AM - 02:00 PM' }
    };
}

function saveConfig(cfg) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error('[Config]: Error guardando bot_config.json:', e.message);
        return false;
    }
}

function readKnowledge() {
    try {
        if (fs.existsSync(KNOWLEDGE_PATH)) {
            return fs.readFileSync(KNOWLEDGE_PATH, 'utf-8');
        }
    } catch (e) {
        console.error('[Knowledge]: Error leyendo knowledge.txt:', e.message);
    }
    return 'Información no disponible temporalmente.';
}

function saveKnowledge(content) {
    try {
        fs.writeFileSync(KNOWLEDGE_PATH, content, 'utf-8');
        return true;
    } catch (e) {
        console.error('[Knowledge]: Error guardando knowledge.txt:', e.message);
        return false;
    }
}

function readAuthCredentials() {
    try {
        if (fs.existsSync(AUTH_CREDENTIALS_PATH)) {
            return JSON.parse(fs.readFileSync(AUTH_CREDENTIALS_PATH, 'utf-8'));
        }
    } catch (e) {}
    return { username: 'admin', password: 'admin12345' };
}

function readOrders() {
    try {
        if (fs.existsSync(ORDERS_PATH)) {
            return JSON.parse(fs.readFileSync(ORDERS_PATH, 'utf-8'));
        }
    } catch (e) {}
    return [];
}

function saveOrders(orders) {
    try {
        fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error('[Orders]: Error guardando orders.json:', e.message);
        return false;
    }
}

// ============================================================================
// 4. MOTOR DE INTELIGENCIA ARTIFICIAL (GOOGLE GEMINI POOL MULTI-KEY)
// ============================================================================
const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP,
    process.env.GEMINI_API_KEY_BACKUP_2
].filter(k => k && k.trim());

if (API_KEYS.length === 0) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ AVISO: No se detectó GEMINI_API_KEY en el .env. Configúrala antes de procesar mensajes.');
}

let currentApiKeyIndex = 0;
function getGenAIClient() {
    if (API_KEYS.length === 0) return null;
    const key = API_KEYS[currentApiKeyIndex % API_KEYS.length];
    return new GoogleGenerativeAI(key);
}

function rotateApiKey(reason = 'Cuota excedida o error de API') {
    if (API_KEYS.length <= 1) return;
    currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS.length;
    console.warn(`[Gemini API]: 🔄 Rotando a clave de respaldo (${currentApiKeyIndex + 1}/${API_KEYS.length}). Motivo: ${reason}`);
}

// Historial en memoria por chat (últimos 10 turnos)
const chatHistories = new Map();

function buildSystemPrompt() {
    const cfg = readConfig();
    const knowledge = readKnowledge();
    const now = new Date();
    const timeString = now.toLocaleString('es-ES', { timeZone: cfg.timezone || 'America/Mexico_City' });

    return `Eres ${cfg.botName || 'el Asistente Virtual'}, la asistente comercial y de atención al cliente de "${cfg.businessName || 'nuestra empresa'}".

FECHA Y HORA ACTUAL EN TIENDA: ${timeString}

REGLAS DE ATENCIÓN Y COMPORTAMIENTO:
1. Responde de forma amable, cercana, profesional y natural, usando emojis adecuados para WhatsApp.
2. NUNCA inventes productos, precios, números de cuenta o condiciones que no existan en la BASE DE CONOCIMIENTO.
3. Si el cliente pregunta algo no incluido en la base de datos o pide un asesor humano, indícale amablemente que transferirás su solicitud al equipo de ventas.
4. Mantén las respuestas concisas (máximo 2 a 4 oraciones por mensaje). No abrumes al cliente con párrafos largos.
5. NO uses etiquetas Markdown como almohadillas (#), utiliza negritas de WhatsApp (*texto*) si necesitas destacar algo importante.

---
BASE DE CONOCIMIENTO OFICIAL DEL NEGOCIO:
${knowledge}
---`;
}

async function askGemini(chatId, userMessage, customerName = 'Cliente') {
    const clientAI = getGenAIClient();
    if (!clientAI) {
        return 'Hola. En este momento estamos afinando los detalles de nuestro sistema. En breve un asesor te responderá personalmente.';
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const systemPrompt = buildSystemPrompt();

    // Obtener historial previo
    if (!chatHistories.has(chatId)) {
        chatHistories.set(chatId, []);
    }
    const history = chatHistories.get(chatId);

    try {
        const model = clientAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt
        });

        // Formatear mensajes previos para Gemini
        const formattedHistory = history.map(item => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
        }));

        const chat = model.startChat({ history: formattedHistory });
        const result = await chat.sendMessage(userMessage);
        const reply = result.response.text();

        // Actualizar historial local (mantener hasta 10 mensajes)
        history.push({ role: 'user', text: userMessage });
        history.push({ role: 'model', text: reply });
        if (history.length > 10) history.splice(0, 2);

        return reply;
    } catch (error) {
        console.error('[Gemini Error]:', error.message);
        if (error.message.includes('429') || error.message.includes('quota')) {
            rotateApiKey('429 Quota Exceeded');
        }
        return 'Disculpa la molestia, estoy experimentando un momento de alta demanda. Por favor reintenta tu pregunta o espera un momento que te atenderá un asesor.';
    }
}

// ============================================================================
// 5. GESTOR DE WHATSAPP WEB (whatsapp-web.js con LocalAuth)
// ============================================================================
let connectionStatus = 'loading'; // loading | qr | ready | disconnected
let currentQr = null;

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: AUTH_DATA_PATH }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', async (qr) => {
    console.log('[WhatsApp]: 📲 Nuevo código QR generado. Escanéalo en la terminal o abre el Dashboard Web.');
    connectionStatus = 'qr';
    currentQr = qr;
    qrcodeTerminal.generate(qr, { small: true });

    try {
        if (!fs.existsSync(path.join(__dirname, 'public'))) {
            fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
        }
        await QRCode.toFile(PUBLIC_QR_PATH, qr, { width: 350, margin: 2 });
    } catch (err) {
        console.error('[QR File Error]:', err.message);
    }
});

client.on('ready', () => {
    connectionStatus = 'ready';
    currentQr = null;
    try {
        if (fs.existsSync(PUBLIC_QR_PATH)) fs.unlinkSync(PUBLIC_QR_PATH);
    } catch (e) {}

    const phone = client.info && client.info.wid ? client.info.wid.user : 'Desconocido';
    console.log('\x1b[32m%s\x1b[0m', `[WhatsApp]: 🟢 ¡BOT CONECTADO Y EN LÍNEA! Número: +${phone}`);
});

client.on('authenticated', () => {
    console.log('[WhatsApp]: 🔑 Sesión autenticada con éxito.');
});

client.on('auth_failure', (msg) => {
    console.error('[WhatsApp]: ❌ Fallo de autenticación:', msg);
    connectionStatus = 'disconnected';
});

client.on('disconnected', (reason) => {
    console.warn('[WhatsApp]: ⚠️ Cliente desconectado. Motivo:', reason);
    connectionStatus = 'disconnected';
    currentQr = null;
});

// Manejo de mensajes entrantes
client.on('message', async (msg) => {
    try {
        // Ignorar estados, mensajes del bot y mensajes previos al arranque
        if (msg.from === 'status@broadcast') return;
        if (msg.fromMe) return;
        if (msg.timestamp * 1000 < serverStartTime) return;

        // Ignorar grupos a menos que se desee habilitar
        if (msg.from.endsWith('@g.us')) return;

        const senderPhone = msg.from.replace('@c.us', '');
        const incomingText = (msg.body || '').trim();

        if (!incomingText) return;

        console.log(`[Mensaje Recibido] (+${senderPhone}): "${incomingText.substring(0, 50)}..."`);

        // Simular escritura natural en WhatsApp
        const chat = await msg.getChat();
        await chat.sendStateTyping();

        // Obtener nombre del contacto
        const contact = await msg.getContact().catch(() => null);
        const customerName = contact ? (contact.pushname || contact.name || 'Cliente') : 'Cliente';

        // Generar respuesta con IA
        const botReply = await askGemini(msg.from, incomingText, customerName);

        // Enviar respuesta
        await chat.clearState();
        await msg.reply(botReply);
        console.log(`[Respuesta Enviada] (+${senderPhone}): "${botReply.substring(0, 50)}..."`);

    } catch (err) {
        console.error('[Message Handler Error]:', err.message);
    }
});

// Inicializar cliente de WhatsApp
client.initialize().catch(err => {
    console.error('[WhatsApp Init Error]:', err.message);
});

// ============================================================================
// 6. SERVIDOR WEB Y API REST PARA EL DASHBOARD
// ============================================================================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Estado general de la conexión
app.get('/api/status', (req, res) => {
    let connectedPhone = '';
    try {
        if (client && client.info && client.info.wid) {
            connectedPhone = client.info.wid.user;
        }
    } catch (e) {}

    res.json({
        status: connectionStatus,
        connectedPhone,
        timestamp: Date.now()
    });
});

// Obtener código QR en formato imagen PNG
app.get('/api/qr-code', (req, res) => {
    if (fs.existsSync(PUBLIC_QR_PATH)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Content-Type', 'image/png');
        return res.sendFile(PUBLIC_QR_PATH);
    }
    if (currentQr) {
        QRCode.toBuffer(currentQr, { width: 350, margin: 2 }, (err, buffer) => {
            if (!err && buffer) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Content-Type', 'image/png');
                return res.send(buffer);
            }
            res.status(404).send('QR no disponible');
        });
        return;
    }
    res.status(404).send('Código QR no generado aún.');
});

// Desconectar sesión y forzar regeneración de nuevo QR
app.post('/api/regenerate-qr', async (req, res) => {
    console.log('[Dashboard]: Solicitud de desconexión y regeneración de QR...');
    connectionStatus = 'loading';
    currentQr = null;

    try {
        if (fs.existsSync(PUBLIC_QR_PATH)) fs.unlinkSync(PUBLIC_QR_PATH);
    } catch (e) {}

    res.json({ success: true, message: 'Cerrando sesión para regenerar código QR...' });

    try {
        if (client) {
            await client.logout().catch(() => {});
            await client.destroy().catch(() => {});
        }
    } catch (e) {}

    if (process.platform === 'linux') {
        try {
            require('child_process').execSync('pkill -9 -f chromium || pkill -9 -f chrome || true');
        } catch (e) {}
    }

    try {
        if (fs.existsSync(AUTH_DATA_PATH)) {
            fs.rmSync(AUTH_DATA_PATH, { recursive: true, force: true });
        }
    } catch (e) {}

    setTimeout(() => {
        console.log('[Dashboard]: Reiniciando proceso para generar QR limpio...');
        process.exit(1);
    }, 500);
});

// Autenticación administrativa del Dashboard
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body || {};
        const stored = readAuthCredentials();

        if (username === stored.username && password === stored.password) {
            const token = 'starter_token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            return res.json({ success: true, token, username: stored.username });
        }
        return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Error interno de autenticación.' });
    }
});

// Base de Conocimiento (GET & POST)
app.get('/api/knowledge', (req, res) => {
    res.json({ content: readKnowledge() });
});

app.post('/api/knowledge', (req, res) => {
    const { content } = req.body;
    if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Contenido inválido.' });
    }
    const saved = saveKnowledge(content);
    if (saved) {
        return res.json({ success: true, message: 'Base de conocimiento guardada.' });
    }
    res.status(500).json({ error: 'Error al escribir el archivo.' });
});

// Configuración del Negocio (GET & POST)
app.get('/api/config', (req, res) => {
    res.json(readConfig());
});

app.post('/api/config', (req, res) => {
    const newConfig = req.body;
    if (!newConfig || typeof newConfig !== 'object') {
        return res.status(400).json({ error: 'Configuración inválida.' });
    }
    const current = readConfig();
    const updated = { ...current, ...newConfig };
    const saved = saveConfig(updated);
    if (saved) {
        return res.json({ success: true, config: updated });
    }
    res.status(500).json({ error: 'Error al actualizar configuración.' });
});

// Registro y visualización de pedidos
app.get('/api/orders', (req, res) => {
    res.json({ orders: readOrders() });
});

app.post('/api/orders', (req, res) => {
    const orderData = req.body;
    if (!orderData) return res.status(400).json({ error: 'Datos de pedido faltantes' });

    const orders = readOrders();
    orders.unshift({
        id: Date.now(),
        fecha: new Date().toLocaleDateString('es-ES'),
        ...orderData
    });
    saveOrders(orders);
    res.json({ success: true, orders });
});

// Inicio del servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================================');
    console.log(`🌐 Dashboard Web del Bot activo en: http://localhost:${PORT}`);
    console.log('========================================================');
});
