import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extrae tareas de una transcripción de reunión usando GPT-4o-mini
 * @param {string} transcript - Texto de la transcripción
 * @param {string} meetingTopic - Tema de la reunión
 * @returns {Promise<Array>} - Lista de tareas extraídas
 */
export async function extractTasksFromTranscript(transcript, meetingTopic) {
  const systemPrompt = `Eres un asistente experto en extraer tareas y compromisos de transcripciones de reuniones.

Tu trabajo es identificar:
- Tareas específicas mencionadas
- Quién es responsable (si se menciona)
- Fechas límite (si se mencionan)

Responde SOLO con un JSON array. Cada tarea debe tener:
- "task": descripción clara de la tarea
- "assignee": nombre del responsable o null
- "deadline": fecha límite o null
- "priority": "alta", "media" o "baja" basado en el contexto

Si no hay tareas claras, devuelve un array vacío: []`;

  const userPrompt = `Reunión: "${meetingTopic}"

Transcripción:
${transcript}

Extrae todas las tareas y compromisos mencionados.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    // El modelo puede devolver { tasks: [...] } o directamente [...]
    return parsed.tasks || parsed;
  } catch (error) {
    console.error('Error llamando a OpenAI:', error.message);
    throw error;
  }
}
