// api/resultados.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { juego } = req.query;
  const juegosPermitidos = new Set([
    'loteria-nacional',
    'once',
    'la-primitiva',
    'bonoloto',
    'euromillones',
    'el-gordo-de-la-primitiva',
    'eurojackpot',
    'la-quiniela',
    'el-quinigol'
  ]);
  if (typeof juego !== 'string' || !juegosPermitidos.has(juego)) {
    return res.status(400).json({ error: 'Juego no válido' });
  }

  const apiKey = process.env.LOTERIA_API_KEY;
  if (!apiKey) {
    console.error('Falta configurar la variable de entorno LOTERIA_API_KEY');
    return res.status(500).json({ error: 'La API no está configurada en el servidor' });
  }

  try {
    const respuestaApi = await fetch(`https://api.loteriasapi.com/api/v1/results/${encodeURIComponent(juego)}/latest`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!respuestaApi.ok) {
      console.error(`Loteria API respondió con HTTP ${respuestaApi.status} para ${juego}`);
      return res.status(502).json({ error: 'No se pudieron obtener los resultados' });
    }

    const datos = await respuestaApi.json();
    return res.status(200).json(datos);
  } catch (error) {
    console.error(`Error al consultar Loteria API para ${juego}:`, error);
    return res.status(502).json({ error: 'No se pudieron obtener los resultados' });
  }
}
