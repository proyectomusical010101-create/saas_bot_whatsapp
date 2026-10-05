# 🤖 WhatsApp AI Bot Starter (Multi-Client Edition)

Plantilla profesional y agnóstica para desplegar **Bots de WhatsApp con Inteligencia Artificial (Google Gemini)** y **Dashboard Web Premium** en minutos para cualquier cliente o negocio (concesionarios de motos, tiendas de ropa, clínicas, restaurantes, servicios profesionales, etc.).

---

## 🌟 Características Principales

- 🧠 **Cerebro con Google Gemini:** Respuestas contextuales, ultra-rápidas y humanizadas usando Gemini 2.5 Flash Lite (o Gemini 1.5 Flash).
- 🔄 **Pool Multi-Clave:** Soporte para múltiples API Keys de Gemini con rotación automática en caso de saturación o límite de cuota (429).
- 📊 **Dashboard Web Glassmorphism:** Panel administrativo en tiempo real con visor de QR dinámico, gestión de base de conocimiento, configuración comercial y tabla de pedidos.
- 📱 **QR Sin Fricción:** Generación de QR tanto en la consola de comandos como en la interfaz web con botón de desconexión y regeneración limpia.
- 🛡️ **Totalmente Aislado:** Diseñado para clonarse en cualquier VPS independiente sin dependencias externas ni cruce de datos con otros clientes.
- ⚡ **Auto-Onboarding con Antigravity:** Al abrir la carpeta en Antigravity, el archivo `GEMINI.md` activa un asistente que te hace 7 preguntas y parametriza todo el bot de forma automática.

---

## 📁 Estructura del Proyecto

```text
whatsapp-bot-starter/
├── public/                     # Frontend del Dashboard Web
│   ├── index.html              # Interfaz moderna de control
│   ├── styles.css              # Estilos glassmorphism y dark mode
│   └── app.js                  # Lógica de estados, polling y QR
├── .env.example                # Plantilla de variables de entorno (PORT, API KEYS)
├── .gitignore                  # Excluye node_modules, .env, sesiones de WhatsApp y logs
├── auth_credentials.json       # Credenciales del panel web (admin / admin12345)
├── bot_config.json             # Ajustes del cliente (nombre, horarios, moneda, asesor)
├── GEMINI.md                   # Instrucciones del asistente de instalación automática
├── index.js                    # Servidor Node.js (WhatsApp Web + Gemini + API REST)
├── knowledge.txt               # Manual de conocimiento comercial que lee la IA
├── package.json                # Dependencias oficiales de Node.js
├── README.md                   # Guía de uso y despliegue
└── setup.sh                    # Script de instalación 1-Click para VPS Linux
```

---

## 🚀 1. Cómo Subir este Proyecto a GitHub

Desde tu computadora (en la carpeta `whatsapp-bot-starter`):

```bash
# 1. Iniciar el repositorio local
git init

# 2. Agregar todos los archivos (el .gitignore protege tus contraseñas y sesiones)
git add .

# 3. Crear el primer commit
git commit -m "feat: starter kit profesional de bot de whatsapp con ia"

# 4. Vincular a tu repositorio privado de GitHub
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 5. Subir a GitHub
git push -u origin main
```

---

## 🌐 2. Despliegue en un Nuevo VPS (2 Métodos Fáciles)

### Método A: Despliegue Asistido con Antigravity (Recomendado)
1. En el nuevo VPS, clona el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git bot-cliente
   cd bot-cliente
   ```
2. Abre la carpeta con **Antigravity**.
3. Escribe en el chat: *"Vamos a instalar el bot para un nuevo cliente"*.
4. Antigravity leerá `GEMINI.md`, te hará las 7 preguntas indispensables del negocio, configurará los archivos y pondrá a correr el bot con PM2 automáticamente.

---

### Método B: Instalación 1-Click con Script Bash
1. En tu servidor VPS (Ubuntu o Debian), dale permisos al script de instalación y ejecútalo:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
2. El script instalará automáticamente:
   - Node.js 20 LTS
   - Librerías de Chromium para Puppeteer / WhatsApp Web
   - PM2 para que el bot nunca se caiga y se inicie solo con el servidor
   - Todas las dependencias (`npm install`)

---

## 💻 3. Acceso al Dashboard y Vinculación

Una vez iniciado el bot:

1. Abre tu navegador en:
   `http://TU_IP_VPS:3000` (o el puerto configurado en `.env`).
2. Inicia sesión con las credenciales por defecto:
   - **Usuario:** `admin`
   - **Contraseña:** `admin12345`
   *(Puedes cambiarlas en `auth_credentials.json`)*.
3. Escanea el código QR que aparece en pantalla desde WhatsApp (*Ajustes > Dispositivos vinculados > Vincular dispositivo*).
4. El estado cambiará a **🟢 ¡En Línea!** y el bot comenzará a responder automáticamente a todos los clientes.

---

## 🛠️ Comandos Útiles de PM2 en el VPS

- **Ver estado del bot:** `pm2 status`
- **Ver logs en tiempo real:** `pm2 logs`
- **Reiniciar el bot:** `pm2 restart all`
- **Detener el bot:** `pm2 stop all`

---

## 📄 Licencia
Distribuido bajo la licencia MIT. Uso comercial y privado permitido.
