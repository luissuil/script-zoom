# Zoom Meeting Tasks Extractor

Servidor webhook que escucha eventos de grabaciones completadas de Zoom, descarga la transcripción y usa OpenAI (gpt-4o-mini) para extraer las tareas mencionadas en la reunión.

## Requisitos

- Node.js 24+
- Cuenta de Zoom con grabaciones en la nube y transcripción habilitada
- API key de OpenAI

## Instalación

```bash
npm install
```

## Configuración

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Configura las variables en `.env`:
   - `ZOOM_WEBHOOK_SECRET_TOKEN`: Token secreto del webhook de Zoom
   - `ZOOM_ACCESS_TOKEN`: Token de acceso OAuth de Zoom (para descargar transcripciones)
   - `OPENAI_API_KEY`: Tu API key de OpenAI

## Configurar Zoom Webhook

1. Ve a [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Crea una app tipo "Webhook Only" o "Server-to-Server OAuth"
3. En la sección de Webhooks, añade tu endpoint: `https://tu-servidor.com/webhook/zoom`
4. Suscríbete al evento `recording.completed`
5. Copia el Secret Token a tu `.env`

## Uso

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

## Para pruebas locales (VS Code Port Forwarding)

En lugar de ngrok, puedes usar el reenvío de puertos integrado de VS Code:

1. Ve a la pestaña **PUERTOS** (PORTS) en el panel inferior de VS Code.
2. Si no ves el puerto 3000, haz clic en "Agregar puerto" y escribe `3000`.
3. Haz clic derecho sobre la fila del puerto 3000 > **Visibilidad del puerto** > **Público**.
   > **Importante:** Debe ser "Público" para que Zoom pueda enviar el webhook sin autenticación.
4. Copia la "Dirección reenviada" (ej. `https://tu-url-vscode.tunnels.code.com`).
5. Usa esa URL en la configuración de Zoom: `https://tu-url-vscode.tunnels.code.com/webhook/zoom`

## Endpoints

- `POST /webhook/zoom` - Recibe webhooks de Zoom
- `GET /health` - Health check

## Ejemplo de respuesta

Cuando se completa una grabación con transcripción, el servidor extrae tareas como:

```json
[
  {
    "task": "Preparar presentación del proyecto para el cliente",
    "assignee": "Juan",
    "deadline": "viernes",
    "priority": "alta"
  },
  {
    "task": "Revisar el documento de requisitos",
    "assignee": "María",
    "deadline": null,
    "priority": "media"
  }
]
```
