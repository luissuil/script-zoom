/**
 * Descarga el contenido de la transcripción desde Zoom
 * @param {string} downloadUrl - URL de descarga del archivo VTT
 * @returns {Promise<string>} - Contenido de la transcripción
 */
export async function downloadTranscript(downloadUrl) {
  // Zoom requiere el token de acceso para descargar
  // En producción, necesitarías OAuth. Para la POC, el download_url
  // ya incluye el token si está configurado correctamente.
  
  const response = await fetch(downloadUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.ZOOM_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`Error descargando transcripción: ${response.status}`);
  }

  const vttContent = await response.text();
  return parseVTT(vttContent);
}

/**
 * Parsea contenido VTT y extrae solo el texto
 * @param {string} vttContent - Contenido del archivo VTT
 * @returns {string} - Texto limpio de la transcripción
 */
function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const textLines = [];

  for (const line of lines) {
    // Ignorar cabecera WEBVTT, timestamps y líneas vacías
    if (
      line.startsWith('WEBVTT') ||
      line.includes('-->') ||
      line.trim() === '' ||
      /^\d+$/.test(line.trim())
    ) {
      continue;
    }
    textLines.push(line.trim());
  }

  return textLines.join(' ');
}
