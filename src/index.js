import express from 'express';
import crypto from 'node:crypto';
import { extractTasksFromTranscript } from './services/openai.js';
import { downloadTranscript } from './services/zoom.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/**
 * Verifica la firma del webhook de Zoom
 */
function verifyZoomWebhook(req) {
  const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`;
  const hashForVerify = crypto
    .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN)
    .update(message)
    .digest('hex');
  
  const signature = `v0=${hashForVerify}`;
  return signature === req.headers['x-zm-signature'];
}

/**
 * Endpoint principal para recibir webhooks de Zoom
 */
app.post('/webhook/zoom', async (req, res) => {
  console.log('📩 Webhook recibido:', req.body.event);

  // Zoom envía un challenge para validar el endpoint
  if (req.body.event === 'endpoint.url_validation') {
    const hashForValidate = crypto
      .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN)
      .update(req.body.payload.plainToken)
      .digest('hex');

    return res.json({
      plainToken: req.body.payload.plainToken,
      encryptedToken: hashForValidate
    });
  }

  // Verificar firma del webhook
  if (!verifyZoomWebhook(req)) {
    console.error('❌ Firma de webhook inválida');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Procesar evento de grabación completada
  if (req.body.event === 'recording.completed') {
    try {
      await handleRecordingCompleted(req.body.payload);
      res.json({ status: 'ok' });
    } catch (error) {
      console.error('❌ Error procesando grabación:', error);
      res.status(500).json({ error: 'Processing error' });
    }
  } else {
    res.json({ status: 'ignored', event: req.body.event });
  }
});

/**
 * Maneja el evento de grabación completada
 */
async function handleRecordingCompleted(payload) {
  const { object } = payload;
  const meetingId = object.id;
  const topic = object.topic;
  
  console.log(`\n🎥 Grabación completada para: "${topic}" (ID: ${meetingId})`);

  // Buscar el archivo de transcripción (VTT)
  const transcriptFile = object.recording_files?.find(
    file => file.file_type === 'TRANSCRIPT' || file.file_extension === 'VTT'
  );

  if (!transcriptFile) {
    console.log('⚠️ No se encontró archivo de transcripción');
    return;
  }

  console.log('📄 Descargando transcripción...');
  const transcript = await downloadTranscript(transcriptFile.download_url);
  
  console.log('🤖 Extrayendo tareas con OpenAI...');
  const tasks = await extractTasksFromTranscript(transcript, topic);

  console.log('\n✅ Tareas extraídas:');
  console.log('═'.repeat(50));
  tasks.forEach((task, i) => {
    console.log(`${i + 1}. ${task.task}`);
    if (task.assignee) console.log(`   👤 Asignado a: ${task.assignee}`);
    if (task.deadline) console.log(`   📅 Fecha límite: ${task.deadline}`);
    console.log('');
  });
  console.log('═'.repeat(50));

  return tasks;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Solo iniciar el servidor si no estamos en Vercel (serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor webhook escuchando en puerto ${PORT}`);
    console.log(`📍 Endpoint: POST /webhook/zoom`);
    console.log(`❤️  Health check: GET /health\n`);
  });
}

export default app;
