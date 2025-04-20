// backend/server.js

// --- Importaciones de Módulos ---
const express = require('express');             // Framework web para Node.js.
const cors = require('cors');                   // Middleware para habilitar Cross-Origin Resource Sharing.
const multer = require('multer');               // Middleware para manejar la carga de archivos (multipart/form-data).
const { spawn } = require('child_process');     // Módulo para crear procesos hijos (ejecutar Python).
const path = require('path');                   // Módulo para trabajar con rutas de archivos y directorios.
const fs = require('fs');                       // Módulo para interactuar con el sistema de archivos.

// --- Inicialización de Express ---
const app = express();
const port = 5001; // Puerto en el que escuchará el servidor backend.

// --- Configuración de Middleware Global ---
app.use(cors()); // Habilita CORS para permitir solicitudes desde el frontend (servidor de desarrollo React).
app.use(express.urlencoded({ extended: true })); // Middleware para parsear datos URL-encoded (necesario para leer campos de FormData como 'language' en req.body).
app.use(express.json()); // Middleware para parsear cuerpos de solicitud JSON (útil para otras rutas o APIs).

// --- Configuración de Carga de Archivos (Multer) ---
// Define el directorio donde se almacenarán temporalmente los archivos subidos.
const uploadDir = path.join(__dirname, 'uploads');
// Crea el directorio si no existe.
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Define la configuración de almacenamiento para Multer (dónde y cómo guardar archivos).
const storage = multer.diskStorage({
    // Especifica el directorio de destino para los archivos subidos.
    destination: (req, file, cb) => cb(null, uploadDir),
    // Define cómo se nombrarán los archivos guardados para evitar colisiones.
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Crea la instancia del middleware Multer con la configuración de almacenamiento y límites.
// Se espera que el archivo venga en un campo llamado 'audioFile' desde el FormData del frontend.
const upload = multer({ storage: storage, limits: { fileSize: 150 * 1024 * 1024 } }); // Establece un límite de tamaño de archivo (ej. 150MB).

// --- Definición de Rutas de la API ---

/**
 * @route GET /api/status
 * @description Endpoint simple para verificar si el servidor backend está en ejecución.
 * @access Public
 */
app.get('/api/status', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

/**
 * @route POST /api/transcribe
 * @description Endpoint que recibe un archivo de audio y un idioma opcional,
 *              lo procesa usando un script Python con Whisper y devuelve la transcripción.
 * @access Public
 * @param {File} req.file - El archivo de audio subido (gestionado por Multer).
 * @param {string} [req.body.language] - El código de idioma opcional (ej. 'es', 'en').
 */
app.post('/api/transcribe', upload.single('audioFile'), (req, res) => {
    // Registro inicial de la solicitud recibida.
    console.log('POST /api/transcribe recibido');

    // --- Extracción de Datos de la Solicitud ---
    // Extrae el código de idioma opcional enviado desde el frontend en el cuerpo de la solicitud.
    // Se asigna null si no se proporciona, para indicar auto-detección en Whisper.
    const language = req.body.language || null;
    console.log(`Idioma solicitado desde el cuerpo del formulario: ${language || 'Auto-detectar'}`);

    // Validación: Verifica si Multer procesó y adjuntó un archivo a la solicitud.
    if (!req.file) {
        console.error("No se subió ningún archivo.");
        // Responde con un error 400 (Bad Request) si no hay archivo.
        return res.status(400).json({ error: 'No se proporcionó archivo de audio.' });
    }

    // Ruta completa al archivo de audio subido y guardado temporalmente (en el sistema de archivos WSL2).
    const audioFilePath = req.file.path;
    console.log(`Archivo guardado temporalmente en: ${audioFilePath}`);

    // --- Ejecución del Script de Transcripción (Python) ---
    // Define la ruta al ejecutable de Python dentro del entorno virtual 'pyenv'.
    // NOTA: Podría ser necesario cambiar a 'python3' si el ejecutable se llama así en el venv.
    const pythonExecutable = path.join(__dirname, 'pyenv', 'bin', 'python');
    // Define la ruta al script Python que realiza la transcripción.
    const scriptPath = path.join(__dirname, 'transcribe.py');

    // Prepara el array de argumentos que se pasarán al script Python.
    const scriptArgs = [
        scriptPath,      // Argumento 0: La ruta del script a ejecutar.
        audioFilePath    // Argumento 1: La ruta requerida del archivo de audio.
    ];
    // Añade el argumento de idioma al comando Python solo si se proporcionó uno.
    if (language) {
        // Argumentos 2 y 3 (opcionales): Flag y código de idioma.
        scriptArgs.push('--language', language);
    }

    // Validación: Comprueba si el ejecutable de Python especificado realmente existe.
    if (!fs.existsSync(pythonExecutable)) {
         console.error(`Ejecutable de Python no encontrado en: ${pythonExecutable}`);
         console.error('Asegúrese de que el entorno virtual ("pyenv") existe en el directorio backend y contiene el ejecutable de Python.');
         // Intenta eliminar el archivo temporal incluso si falla la validación de Python.
         fs.unlink(audioFilePath, (unlinkErr) => { if (unlinkErr) console.error(`Error al eliminar archivo temporal ${audioFilePath}:`, unlinkErr); });
         // Responde con un error 500 (Internal Server Error) por configuración incorrecta.
         return res.status(500).json({ error: 'Error de configuración del backend: Entorno Python no encontrado.' });
    }

    // Registra en consola el comando exacto que se va a ejecutar (útil para depuración).
    console.log(`Ejecutando: "${pythonExecutable}" ${scriptArgs.map(arg => `"${arg}"`).join(' ')}`);

    // Inicia el script de Python como un proceso hijo.
    const pythonProcess = spawn(pythonExecutable, scriptArgs); // Pasa el array de argumentos.

    // Variables para acumular la salida del proceso hijo.
    let stdoutData = ''; // Salida estándar
    let stderrData = ''; // Salida de error estándar

    // --- Manejo de Eventos del Proceso Hijo ---

    // Evento 'data' para la salida estándar (stdout) del proceso Python.
    pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString(); // Concatena los fragmentos de datos recibidos.
    });

    // Evento 'data' para la salida de error estándar (stderr) del proceso Python.
    pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString(); // Concatena los fragmentos de datos recibidos.
    });

    // Evento 'close': Se dispara cuando el proceso Python finaliza.
    pythonProcess.on('close', (code) => {
        console.log(`Proceso Python finalizado con código ${code}`);
         // Intenta eliminar el archivo de audio temporal una vez que el proceso Python finaliza.
         fs.unlink(audioFilePath, (unlinkErr) => {
            if (unlinkErr) console.error(`Error al eliminar archivo temporal ${audioFilePath}:`, unlinkErr);
            else console.log(`Archivo temporal eliminado: ${audioFilePath}`);
        });

        // Evalúa el código de salida del proceso Python.
        if (code === 0) { // El proceso Python terminó correctamente.
            try {
                // Intenta interpretar la salida estándar (stdout) como un objeto JSON.
                const result = JSON.parse(stdoutData);
                // Verifica si el JSON contiene la clave esperada 'transcription'.
                if (result.transcription !== undefined) {
                    console.log("Transcripción exitosa.");
                    // Envía la transcripción extraída al cliente frontend.
                    res.json({ transcription: result.transcription });
                } else {
                    // Maneja el caso de éxito (código 0) pero salida inesperada (sin clave 'transcription').
                    console.error("Éxito del script Python (código 0), pero no se encontró la clave 'transcription':", stdoutData);
                    res.status(500).json({ error: 'El proceso de transcripción tuvo éxito pero devolvió datos inesperados.', details: stdoutData });
                }
            } catch (parseError) {
                // Maneja errores al parsear la salida estándar (stdout) si no es JSON válido.
                console.error('Error al parsear JSON del stdout de Python:', parseError);
                console.error('Datos stdout de Python:', stdoutData);
                res.status(500).json({ error: 'No se pudo parsear el resultado de la transcripción desde el proceso.', details: stdoutData });
            }
        } else { // El proceso Python terminó con un error (código de salida distinto de 0).
            console.error(`Falló el script Python (código ${code}).`);
            console.error('stderr de Python:', stderrData); // Registra la salida de error estándar (stderr) completa de Python.
            try {
                 // Intenta interpretar stderr como JSON (el script Python debería emitir errores JSON).
                const errorResult = JSON.parse(stderrData);
                res.status(500).json({ error: `Falló la transcripción: ${errorResult.error || 'Error desconocido de Python'}`, details: stderrData });
            } catch (parseError) {
                // Si stderr no es JSON, devuelve el contenido de stderr como texto plano.
                res.status(500).json({ error: 'Falló el script de transcripción.', details: stderrData || 'Sin salida de error estándar.' });
            }
        }
    });

    // Evento 'error': Se dispara si ocurre un error al intentar *iniciar* el proceso hijo.
    pythonProcess.on('error', (spawnError) => {
        console.error('No se pudo iniciar el proceso Python:', spawnError); // Ej. errores de permisos (EPERM), archivo no encontrado (ENOENT).
        // Intenta eliminar el archivo temporal si el proceso Python ni siquiera pudo iniciarse.
         fs.unlink(audioFilePath, (unlinkErr) => { if (unlinkErr) console.error(`Error al eliminar archivo temporal ${audioFilePath} tras error de spawn:`, unlinkErr); });
        res.status(500).json({ error: 'No se pudo iniciar el proceso de transcripción.', details: spawnError.message });
    });
});

// --- Inicio del Servidor ---
// Inicia el servidor Express y lo pone a escuchar en el puerto especificado.
app.listen(port, () => {
    console.log(`Servidor backend ejecutándose en http://localhost:${port}`);
});