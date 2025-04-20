// frontend/src/App.jsx
import React, { useState } from 'react'; // Importa React y el hook useState.

/**
 * Define las opciones de idioma disponibles para la selección del usuario en la UI.
 * Cada objeto contiene:
 * - `code`: El código de idioma ISO 639-1 (o cadena vacía para auto-detección) que se enviará a Whisper. **Esencial que sea válido.**
 * - `name`: El nombre del idioma mostrado al usuario en el menú desplegable (traducido).
 */
const supportedLanguages = [
    { code: '', name: 'Detectar Automáticamente' }, // Opción para auto-detección, usa cadena vacía como valor.
    { code: 'en', name: 'Inglés' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Francés' },
    { code: 'de', name: 'Alemán' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: 'Japonés' },
    { code: 'zh', name: 'Chino' },
    { code: 'ko', name: 'Coreano' },
    { code: 'pt', name: 'Portugués' },
    { code: 'ru', name: 'Ruso' },
  // Se pueden agregar más códigos de idioma válidos según la documentación de Whisper.
];

/**
 * Componente principal de la aplicación.
 * Gestiona la interfaz de usuario para cargar archivos de audio, seleccionar el idioma (opcional),
 * enviar la solicitud de transcripción al backend y mostrar los resultados o errores.
 */
function App() {
    // --- Definición de Estados del Componente ---

    // Almacena el objeto File del archivo de audio seleccionado por el usuario.
    const [selectedFile, setSelectedFile] = useState(null);
    // Almacena el texto de la transcripción recibida del backend.
    const [transcription, setTranscription] = useState('');
    // Controla la visualización del indicador de carga durante la transcripción.
    const [isLoading, setIsLoading] = useState(false);
    // Almacena mensajes de error para mostrarlos en la UI.
    const [error, setError] = useState('');
    // Almacena el código del idioma seleccionado ('', 'en', 'es', etc.). Vacío implica auto-detección.
    const [selectedLanguage, setSelectedLanguage] = useState('');

    // --- Constantes y Configuraciones ---

    // URL del endpoint en el backend responsable de procesar la transcripción.
    const API_ENDPOINT = 'http://localhost:5001/api/transcribe';

    // --- Manejadores de Eventos ---

    /**
     * Callback ejecutado cuando el usuario selecciona un archivo en el input.
     * Actualiza el estado `selectedFile` y resetea los estados de transcripción y error.
     * @param {React.ChangeEvent<HTMLInputElement>} event - El evento de cambio del input.
     */
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        // Limpia resultados/errores previos al seleccionar un nuevo archivo.
        setTranscription('');
        setError('');
        if (file) {
            // Opcional: Registrar detalles del archivo seleccionado en consola.
            console.log(`Archivo seleccionado: ${file.name}, Tamaño: ${file.size}`);
        }
    };

    /**
     * Callback ejecutado al cambiar la selección en el menú desplegable de idioma.
     * Actualiza el estado `selectedLanguage` con el código del idioma elegido.
     * @param {React.ChangeEvent<HTMLSelectElement>} event - El evento de cambio del select.
     */
    const handleLanguageChange = (event) => {
        setSelectedLanguage(event.target.value);
        // Opcional: Registrar el idioma seleccionado en consola.
        console.log(`Idioma seleccionado: ${event.target.value || 'Auto-Detectar'}`);
    };

    /**
     * Gestiona el envío del formulario de transcripción.
     * Se ejecuta al presionar el botón 'Iniciar Transcripción'.
     * Prepara y envía la solicitud POST al backend con el archivo y el idioma seleccionado.
     * @param {React.FormEvent<HTMLFormElement>} event - El evento de envío del formulario.
     */
    const handleSubmit = async (event) => {
        // Previene el comportamiento por defecto del formulario (recarga de página).
        event.preventDefault();
        // Validación simple: no continuar si no hay archivo seleccionado.
        if (!selectedFile) {
            setError('Por favor, selecciona primero un archivo de audio.');
            return;
        }

        // Opcional: Registrar inicio del proceso en consola.
        console.log('Iniciando envío para transcripción...');
        // Actualiza la UI para indicar estado de carga y limpiar resultados previos.
        setIsLoading(true);
        setError('');
        setTranscription('');

        // Construye el objeto FormData para enviar datos multipart (archivo + campos de texto).
        const formData = new FormData();
        // Adjunta el archivo. La clave 'audioFile' debe coincidir con la esperada por Multer en el backend.
        formData.append('audioFile', selectedFile);

        // Adjunta el código de idioma si se seleccionó uno específico (no 'Auto-Detectar').
        // La clave 'language' debe coincidir con la esperada en req.body en el backend.
        if (selectedLanguage) {
            formData.append('language', selectedLanguage);
        }

        // Opcional: Registrar los datos que se envían en consola.
        console.log(`Enviando con código de idioma: ${selectedLanguage || 'No especificado (Auto)'}`);

        // Bloque try/catch para manejar la llamada asíncrona y posibles errores.
        try {
            // Realiza la petición POST asíncrona al endpoint definido.
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                body: formData,
                // Nota: El navegador establece automáticamente el 'Content-Type' a 'multipart/form-data' con FormData.
            });

            // Intenta parsear la respuesta como JSON, incluso si el status no es 2xx,
            // ya que el backend puede enviar detalles del error en formato JSON.
            const data = await response.json();

            // Verifica si la respuesta HTTP indica éxito (ej: status code 200-299).
            if (!response.ok) {
                // Si no es exitosa, lanza un error. Prioriza el mensaje de error del backend.
                throw new Error(data.error || `Error del servidor: ${response.status} ${response.statusText}`);
            }

            // Si la respuesta es exitosa, verifica que contenga la propiedad 'transcription'.
            if (data.transcription !== undefined) {
                // Opcional: Registrar éxito en consola.
                console.log('Transcripción recibida con éxito.');
                // Actualiza el estado para mostrar la transcripción en la UI.
                setTranscription(data.transcription);
            } else {
                // Maneja un caso inesperado: respuesta OK pero sin datos de transcripción.
                console.error('Respuesta OK, pero no se encontraron datos de transcripción:', data);
                throw new Error('Se recibió estado de éxito, pero faltan datos de transcripción en la respuesta.');
            }

        } catch (err) {
            // Captura cualquier error ocurrido durante el fetch o el procesamiento de la respuesta.
            console.error('Falló la solicitud de transcripción:', err);
            // Actualiza el estado de error para mostrar un mensaje al usuario.
            setError(`Falló la transcripción: ${err.message}`);
            // Limpia cualquier transcripción residual en caso de error.
            setTranscription('');
        } finally {
            // Este bloque se ejecuta siempre, después del try o del catch.
            // Asegura que el estado de carga se restablezca para habilitar la UI nuevamente.
            setIsLoading(false);
            // Opcional: Registrar finalización del proceso en consola.
            console.log('Procesamiento finalizado.');
        }
    };

    // --- Renderizado del Componente ---
    // Define la estructura JSX que se mostrará en el navegador.
    return (
        <div className="container mt-4 mb-5">
            <div className="row justify-content-center">
                <div className="col-lg-8 col-md-10">

                    {/* Encabezado principal de la aplicación */}
                    <header className="text-center mb-5">
                        <h1 className="display-5">Transcriptor de Audio</h1>
                        <p className="lead text-muted">Sube un archivo de audio para transcribirlo localmente usando Whisper</p>
                    </header>

                    {/* Tarjeta que contiene el formulario de carga */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>

                                {/* Sección para seleccionar el archivo de audio */}
                                <div className="mb-3">
                                    <label htmlFor="audioFileInput" className="form-label fw-bold">
                                        Selecciona el Archivo de Audio
                                    </label>
                                    <input
                                        type="file"
                                        className="form-control" // Estilo Bootstrap
                                        id="audioFileInput"
                                        accept="audio/*" // Filtra para mostrar solo archivos de audio
                                        onChange={handleFileChange} // Llama al manejador al cambiar
                                        disabled={isLoading} // Deshabilita mientras carga
                                        aria-describedby="fileHelp"
                                        required // Campo obligatorio
                                    />
                                    {/* Texto de ayuda */}
                                    <div id="fileHelp" className="form-text">
                                        Admite varios formatos como mp3, wav, m4a, ogg a través de FFmpeg.
                                    </div>
                                </div>

                                {/* Sección para seleccionar el idioma (opcional) */}
                                <div className="mb-3">
                                    <label htmlFor="languageSelect" className="form-label fw-bold">
                                        Especificar idioma (opcional)
                                    </label>
                                    <select
                                        className="form-select" // Estilo Bootstrap
                                        id="languageSelect"
                                        value={selectedLanguage} // Vinculado al estado
                                        onChange={handleLanguageChange} // Llama al manejador al cambiar
                                        disabled={isLoading} // Deshabilita mientras carga
                                        aria-describedby="langHelp"
                                    >
                                        {/* Genera las opciones del menú desplegable desde el array `supportedLanguages` */}
                                        {supportedLanguages.map(lang => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.name} ({lang.code || 'Auto'}) {/* Muestra nombre y código */}
                                            </option>
                                        ))}
                                    </select>
                                     {/* Texto de ayuda */}
                                    <div id="langHelp" className="form-text">
                                        Mejora la precisión para audio ruidoso, acentos o clips cortos.
                                    </div>
                                </div>

                                {/* Botón para iniciar la transcripción */}
                                <button
                                    type="submit"
                                    className="btn btn-success w-100" // Estilo Bootstrap
                                    disabled={isLoading || !selectedFile} // Deshabilitado si está cargando o no hay archivo
                                >
                                    {/* Muestra texto diferente y spinner si está cargando */}
                                    {isLoading ? (
                                        <>
                                            {/* Spinner de Bootstrap */}
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Transcribiendo...
                                        </>
                                    ) : (
                                        'Iniciar Transcripción' // Texto por defecto
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Sección del Indicador de Carga (se muestra condicionalmente) */}
                    {isLoading && (
                        <div className="text-center my-4">
                            {/* Spinner animado de Bootstrap */}
                            <div className="spinner-grow text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                            <p className="mt-2 text-muted fs-5">Procesando, por favor espere...</p>
                            <p className="text-muted small">(Esto puede tardar un poco para archivos de audio largos o modelos más grandes)</p>
                        </div>
                    )}

                    {/* Sección de Visualización de Errores (se muestra condicionalmente) */}
                    {error && !isLoading && ( // Muestra solo si hay un error y no se está cargando
                        <div className="alert alert-danger mt-4" role="alert">
                            <h5 className="alert-heading">¡Error de Transcripción!</h5>
                            <p>{error}</p> {/* Muestra el mensaje de error del estado */}
                            <hr />
                            <p className="mb-0">Por favor, verifica el archivo, el idioma seleccionado o los registros del servidor backend.</p>
                        </div>
                    )}

                    {/* Sección de Resultado de Transcripción (se muestra condicionalmente) */}
                    {transcription && !isLoading && !error && ( // Muestra solo si hay transcripción, no está cargando y no hay error
                        <div className="card shadow-sm mt-4">
                            <div className="card-header bg-light">
                                <h2 className="h5 mb-0">Resultado de la Transcripción</h2>
                            </div>
                            <div className="card-body">
                                {/* Contenedor para el texto transcrito con scroll y formato pre */}
                                <div
                                    className="bg-white p-3 rounded border"
                                    style={{ maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace' }}
                                >
                                    {transcription} {/* Muestra la transcripción del estado */}
                                </div>
                            </div>
                        </div>
                    )}

                </div> {/* Cierre de la columna principal */}
            </div> {/* Cierre de la fila */}
        </div> // Cierre del contenedor principal
    );
}

// Exporta el componente App para ser usado en otras partes de la aplicación (ej: main.jsx).
export default App;