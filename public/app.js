// ========================================================
// DASHBOARD LOGIC - WHATSAPP AI BOT STARTER
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Elementos del DOM
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const btnLogoutPanel = document.getElementById('btn-logout-panel');

    const qrImage = document.getElementById('qr-image');
    const qrLoading = document.getElementById('qr-loading');
    const qrConnected = document.getElementById('qr-connected');
    const btnRegenerateQr = document.getElementById('btn-regenerate-qr');
    const connectedPhoneDisplay = document.getElementById('connected-phone-display');

    const globalStatusPill = document.getElementById('global-status-pill');
    const globalStatusText = document.getElementById('global-status-text');
    const botStatusBadge = document.getElementById('bot-status-badge');
    const sidebarBusinessName = document.getElementById('sidebar-business-name');

    const metricModel = document.getElementById('metric-model');
    const metricPhone = document.getElementById('metric-phone');
    const metricSchedule = document.getElementById('metric-schedule');
    const metricCurrency = document.getElementById('metric-currency');

    const knowledgeEditor = document.getElementById('knowledge-editor');
    const btnSaveKnowledge = document.getElementById('btn-save-knowledge');

    const cfgBusinessName = document.getElementById('cfg-business-name');
    const cfgAdvisorPhone = document.getElementById('cfg-advisor-phone');
    const cfgScheduleWeekdays = document.getElementById('cfg-schedule-weekdays');
    const cfgScheduleSaturdays = document.getElementById('cfg-schedule-saturdays');
    const cfgAddress = document.getElementById('cfg-address');
    const cfgMapsUrl = document.getElementById('cfg-maps-url');
    const btnSaveConfig = document.getElementById('btn-save-config');

    const ordersTbody = document.getElementById('orders-tbody');
    const btnRefreshOrders = document.getElementById('btn-refresh-orders');

    let currentStatus = 'loading';

    // 2. Control de Autenticación
    const authToken = localStorage.getItem('bot_dashboard_token');
    if (!authToken) {
        if (loginOverlay) loginOverlay.classList.remove('hidden');
    } else {
        if (loginOverlay) loginOverlay.classList.add('hidden');
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            loginError.classList.add('hidden');

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('bot_dashboard_token', data.token);
                    loginOverlay.classList.add('hidden');
                    initDashboard();
                } else {
                    loginError.textContent = data.error || 'Credenciales inválidas.';
                    loginError.classList.remove('hidden');
                }
            } catch (err) {
                loginError.textContent = 'Error conectando con el servidor.';
                loginError.classList.remove('hidden');
            }
        });
    }

    if (btnLogoutPanel) {
        btnLogoutPanel.addEventListener('click', () => {
            if (confirm('¿Deseas cerrar la sesión administrativa?')) {
                localStorage.removeItem('bot_dashboard_token');
                window.location.reload();
            }
        });
    }

    // 3. Navegación entre Pestañas
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => {
                t.classList.remove('active');
                t.classList.add('hidden');
            });

            btn.classList.add('active');
            const targetEl = document.getElementById(targetTab);
            if (targetEl) {
                targetEl.classList.remove('hidden');
                targetEl.classList.add('active');
            }
        });
    });

    // 4. Polling de Estado y Código QR
    async function checkStatus() {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            updateStatusUI(data.status, data.connectedPhone);
        } catch (err) {
            updateStatusUI('offline', '');
        }
    }

    function updateStatusUI(status, connectedPhone = '') {
        currentStatus = status;
        const dot = globalStatusPill ? globalStatusPill.querySelector('.status-dot-indicator') : null;

        if (status === 'ready' || status === 'authenticated') {
            if (dot) dot.className = 'status-dot-indicator online';
            if (globalStatusText) globalStatusText.textContent = 'En Línea';
            if (botStatusBadge) botStatusBadge.innerHTML = '<span class="dot" style="background: #10b981;"></span> Conectado';

            if (qrLoading) qrLoading.classList.add('hidden');
            if (qrImage) {
                qrImage.classList.add('hidden');
                qrImage.dataset.loadedStatus = '';
            }
            if (qrConnected) qrConnected.classList.remove('hidden');

            const phoneClean = (connectedPhone || '').replace(/\D/g, '');
            const phoneText = phoneClean ? `+${phoneClean}` : 'Conectado';
            if (connectedPhoneDisplay) connectedPhoneDisplay.textContent = phoneText;
            if (metricPhone) metricPhone.textContent = phoneText;
        } else if (status === 'qr') {
            if (dot) dot.className = 'status-dot-indicator';
            if (globalStatusText) globalStatusText.textContent = 'Esperando QR';
            if (botStatusBadge) botStatusBadge.innerHTML = '<span class="dot" style="background: #f59e0b;"></span> Esperando QR';

            if (qrLoading) qrLoading.classList.add('hidden');
            if (qrConnected) qrConnected.classList.add('hidden');
            if (qrImage) qrImage.classList.remove('hidden');

            // Cargar imagen de QR una sola vez sin parpadeo constante
            if (qrImage) {
                const shouldReload = !qrImage.src || qrImage.dataset.loadedStatus !== 'qr' || qrImage.naturalWidth === 0;
                if (shouldReload) {
                    qrImage.dataset.loadedStatus = 'qr';
                    qrImage.src = `/api/qr-code?t=${new Date().getTime()}`;
                }
            }
            if (metricPhone) metricPhone.textContent = 'Escaneo pendiente';
        } else {
            if (dot) dot.className = 'status-dot-indicator offline';
            if (globalStatusText) globalStatusText.textContent = status === 'loading' ? 'Iniciando...' : 'Desconectado';
            if (botStatusBadge) botStatusBadge.innerHTML = '<span class="dot" style="background: #ef4444;"></span> Desconectado';

            if (qrConnected) qrConnected.classList.add('hidden');
            if (qrImage) {
                qrImage.classList.add('hidden');
                qrImage.dataset.loadedStatus = '';
            }
            if (qrLoading) qrLoading.classList.remove('hidden');
            if (metricPhone) metricPhone.textContent = 'Sin conexión';
        }
    }

    // 5. Botón de Regenerar QR
    if (btnRegenerateQr) {
        btnRegenerateQr.addEventListener('click', async () => {
            if (!confirm('¿Deseas cerrar la sesión actual de WhatsApp y generar un nuevo código QR?')) return;

            btnRegenerateQr.disabled = true;
            btnRegenerateQr.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando nuevo QR...';
            updateStatusUI('loading');

            try {
                const res = await fetch('/api/regenerate-qr', { method: 'POST' });
                if (res.ok) {
                    let attempts = 0;
                    const poll = setInterval(async () => {
                        attempts++;
                        await checkStatus();
                        if (currentStatus === 'qr' || attempts >= 10) {
                            clearInterval(poll);
                            btnRegenerateQr.disabled = false;
                            btnRegenerateQr.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Desconectar y Generar Nuevo QR';
                        }
                    }, 1500);
                } else {
                    alert('Error solicitando regeneración de QR.');
                    btnRegenerateQr.disabled = false;
                    btnRegenerateQr.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Desconectar y Generar Nuevo QR';
                }
            } catch (e) {
                alert('No se pudo contactar con el backend.');
                btnRegenerateQr.disabled = false;
                btnRegenerateQr.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Desconectar y Generar Nuevo QR';
            }
        });
    }

    // 6. Carga y Guardado de Base de Conocimiento
    async function loadKnowledge() {
        if (!knowledgeEditor) return;
        try {
            const res = await fetch('/api/knowledge');
            const data = await res.json();
            knowledgeEditor.value = data.content || '';
        } catch (e) {
            console.error('Error al cargar knowledge:', e);
        }
    }

    if (btnSaveKnowledge) {
        btnSaveKnowledge.addEventListener('click', async () => {
            btnSaveKnowledge.disabled = true;
            btnSaveKnowledge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

            try {
                const res = await fetch('/api/knowledge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: knowledgeEditor.value })
                });
                if (res.ok) {
                    alert('✅ Base de conocimiento guardada correctamente.');
                } else {
                    alert('Error al guardar la base de conocimiento.');
                }
            } catch (e) {
                alert('Error al conectar con el servidor.');
            } finally {
                btnSaveKnowledge.disabled = false;
                btnSaveKnowledge.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios';
            }
        });
    }

    // 7. Carga y Guardado de Configuración
    async function loadConfig() {
        try {
            const res = await fetch('/api/config');
            const cfg = await res.json();

            if (sidebarBusinessName) sidebarBusinessName.textContent = cfg.businessName || 'WhatsApp AI Bot';
            if (cfgBusinessName) cfgBusinessName.value = cfg.businessName || '';
            if (cfgAdvisorPhone) cfgAdvisorPhone.value = cfg.advisorPhone || '';
            if (cfgScheduleWeekdays) cfgScheduleWeekdays.value = cfg.schedule?.weekdays || '';
            if (cfgScheduleSaturdays) cfgScheduleSaturdays.value = cfg.schedule?.saturdays || '';
            if (cfgAddress) cfgAddress.value = cfg.address || '';
            if (cfgMapsUrl) cfgMapsUrl.value = cfg.mapsUrl || '';

            if (metricSchedule) metricSchedule.textContent = cfg.schedule?.weekdays || '08:00 AM - 05:00 PM';
            if (metricCurrency) metricCurrency.textContent = cfg.currency || 'USD';
        } catch (e) {
            console.error('Error cargando configuración:', e);
        }
    }

    if (btnSaveConfig) {
        btnSaveConfig.addEventListener('click', async () => {
            btnSaveConfig.disabled = true;
            btnSaveConfig.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

            const payload = {
                businessName: cfgBusinessName?.value.trim(),
                advisorPhone: cfgAdvisorPhone?.value.trim(),
                schedule: {
                    weekdays: cfgScheduleWeekdays?.value.trim(),
                    saturdays: cfgScheduleSaturdays?.value.trim(),
                    sundays: 'Cerrado'
                },
                address: cfgAddress?.value.trim(),
                mapsUrl: cfgMapsUrl?.value.trim()
            };

            try {
                const res = await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    alert('✅ Ajustes del negocio guardados correctamente.');
                    loadConfig();
                } else {
                    alert('Error al guardar ajustes.');
                }
            } catch (e) {
                alert('Error al conectar con el servidor.');
            } finally {
                btnSaveConfig.disabled = false;
                btnSaveConfig.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Ajustes';
            }
        });
    }

    // 8. Carga de Pedidos
    async function loadOrders() {
        if (!ordersTbody) return;
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            const orders = data.orders || [];

            if (orders.length === 0) {
                ordersTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay pedidos registrados aún.</td></tr>`;
                return;
            }

            ordersTbody.innerHTML = orders.map(ord => `
                <tr>
                    <td>${ord.fecha || '--'}</td>
                    <td><strong>${ord.nombre || 'Cliente'}</strong></td>
                    <td class="font-mono">+${ord.telefono || ''}</td>
                    <td>${ord.servicio || ord.items || '--'}</td>
                    <td><span class="badge badge-purple">${ord.estado || 'Pendiente'}</span></td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Error cargando pedidos:', e);
        }
    }

    if (btnRefreshOrders) {
        btnRefreshOrders.addEventListener('click', loadOrders);
    }

    // 9. Inicializador del Dashboard
    function initDashboard() {
        checkStatus();
        loadConfig();
        loadKnowledge();
        loadOrders();

        // Polling cada 3 segundos para el estado de WhatsApp
        setInterval(checkStatus, 3000);
        setInterval(loadOrders, 10000);
    }

    if (authToken) {
        initDashboard();
    }
});
