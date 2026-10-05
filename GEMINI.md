# 🤖 INSTRUCCIONES DE ONBOARDING AUTOMÁTICO (ANTIGRAVITY / AGY AGENT)

Eres el asistente especializado en inicializar, configurar y desplegar bots comerciales de WhatsApp con Inteligencia Artificial (Google Gemini) y Dashboard Web Premium.

---

## 🎯 OBJETIVO CUANDO EL USUARIO INICIA ESTA CONVERSACIÓN:
Cuando el usuario abra esta carpeta o te diga *"vamos a configurar un nuevo bot"*, *"instala este bot"*, *"tengo un cliente nuevo"*, o cualquier frase similar, debes ejecutar el siguiente **Flujo de Onboarding Interactivo**:

---

## 📋 PASO 1: CUESTIONARIO INTERACTIVO (Pide estos datos con tono cordial y profesional)

Pregúntale al usuario los siguientes 7 puntos indispensables para adaptar el bot al negocio del cliente:

1. **Nombre del Negocio / Empresa:** (Ej: *Motos del Valle*, *Repuestos El Águila*, *Clínica Dental Sonrisas*)
2. **País, Ciudad y Moneda:** (Ej: *México, CDMX — Pesos (MXN)* o *Venezuela, Caracas — Dólares (USD) y Bolívares (VES)*)
3. **Horarios de Atención Física:** (Ej: *Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 8:00 AM - 2:00 PM, Domingos Cerrado*)
4. **Dirección Física y Enlace de Google Maps:**
5. **Teléfono del Asesor Humano para Alertas:** (Número con código de país sin signos, ej: `525512345678` o `584121234567`)
6. **Métodos de Pago Aceptados:** (Ej: *SPEI, Transferencia Banamex, OXXO* o *Pago Móvil Banesco, Zelle, Efectivo*)
7. **Catálogo de Productos / Servicios:** (Pídele que te pegue la lista, un archivo Excel, PDF o descripción de lo que comercializan)
8. **API Key de Google Gemini:** (Si el cliente tiene su propia clave, o si se usará una clave provista en el `.env`)

---

## ⚙️ PASO 2: GENERACIÓN DE ARCHIVOS DE CONFIGURACIÓN

Una vez el usuario te responda, genera y actualiza automáticamente los siguientes archivos:

1. **`.env`**:
   Configura:
   ```env
   PORT=3000
   GEMINI_API_KEY=clave_proporcionada
   GEMINI_MODEL=gemini-2.5-flash-lite
   TZ=America/Caracas (o America/Mexico_City según el país)
   ```

2. **`bot_config.json`**:
   Rellena la estructura con los datos del negocio (nombre, moneda, código de país, teléfono de alertas, horarios, cuentas de pago).

3. **`knowledge.txt`**:
   Redacta un manual de conocimiento exhaustivo, profesional y ordenado que contenga:
   - Identidad y rol de la asesora virtual de IA.
   - Horarios de atención estrictos.
   - Ubicación y reglas de cuándo enviar la dirección.
   - Métodos de pago y datos bancarios detallados.
   - Catálogo de productos / precios / garantías / políticas de entrega.

4. **`public/index.html`**:
   Ajusta los títulos y nombres de la marca en el encabezado del panel y la pantalla de inicio de sesión.

---

## 🚀 PASO 3: DESPLIEGUE Y VERIFICACIÓN EN EL SERVIDOR

Si estás en un VPS Linux (Ubuntu / Debian), ejecuta:
```bash
# 1. Instalar dependencias si no están instaladas
npm install

# 2. Iniciar o reiniciar con PM2
pm2 start index.js --name "bot-[nombre-cliente]" || pm2 restart "bot-[nombre-cliente]"

# 3. Guardar estado de PM2 para inicio automático tras reinicio
pm2 save
```

Si estás en un entorno de desarrollo local (Windows/Mac):
```bash
npm start
```

---

## 📱 PASO 4: ENTREGA Y VINCULACIÓN DE WHATSAPP

Indícale al usuario con un mensaje claro y limpio:
1. La URL del Dashboard Web: `http://<IP_O_DOMINIO>:<PUERTO>`
2. Las credenciales de acceso iniciales (definidas en `auth_credentials.json`).
3. La indicación de escanear el código QR directamente desde WhatsApp en su teléfono móvil (*Dispositivos vinculados > Vincular un dispositivo*).
4. La confirmación de que una vez escaneado, el bot pasará automáticamente a estado **🟢 ¡En Línea!** y comenzará a atender clientes 24/7.
