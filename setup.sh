#!/bin/bash
# ========================================================
# SCRIPT DE INSTALACIÓN RÁPIDA 1-CLICK PARA VPS (Ubuntu/Debian)
# ========================================================
set -e

echo "🚀 Iniciando instalación del Bot de WhatsApp con IA en el VPS..."

# 1. Actualizar paquetes del sistema
sudo apt update -y && sudo apt upgrade -y

# 2. Instalar dependencias de Chromium / Puppeteer para WhatsApp Web sin errores de librerías
echo "📦 Instalando librerías de Chromium y herramientas necesarias..."
sudo apt install -y curl wget git build-essential \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
    libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 \
    libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
    libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 lsb-release xdg-utils

# 3. Instalar Node.js 20 LTS si no está presente
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "✅ Node.js ya está instalado: $(node -v)"
fi

# 4. Instalar PM2 globalmente si no está presente
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2 gestor de procesos..."
    sudo npm install -g pm2
    sudo pm2 startup systemd -u $USER --hp $HOME || true
else
    echo "✅ PM2 ya está instalado: $(pm2 -v)"
fi

# 5. Instalar dependencias de Node del proyecto
echo "📦 Instalando dependencias de npm..."
npm install

# 6. Preparar archivo .env si no existe
if [ ! -f .env ]; then
    echo "⚙️ Creando .env inicial desde .env.example..."
    cp .env.example .env
fi

# 7. Iniciar con PM2
BOT_NAME="whatsapp-ai-bot"
echo "🚀 Levantando bot con PM2 bajo el nombre: $BOT_NAME..."
pm2 start index.js --name "$BOT_NAME" || pm2 restart "$BOT_NAME"
pm2 save

echo ""
echo "========================================================"
echo "🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!"
echo "========================================================"
echo "El bot y su Dashboard Web están activos en el puerto 3000."
echo "Puedes revisar los logs con: pm2 logs $BOT_NAME"
echo "Abre tu navegador para escanear el código QR."
echo "========================================================"
