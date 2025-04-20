# backend/transcribe.py

# --- Importaciones de Módulos ---
import whisper                      # Biblioteca principal de OpenAI Whisper para la transcripción.
import sys                          # Módulo del sistema para acceder a argumentos y funciones de salida/error.
import os                           # Módulo del sistema operativo para interactuar con archivos (ej. verificar existencia).
import json                         # Módulo para trabajar con datos en formato JSON (para la salida estructurada).
import argparse                     # Módulo para el análisis robusto de argumentos de línea de comandos.

# --- Configuración del Modelo Whisper ---
# Define el tamaño del modelo Whisper a utilizar. Opciones comunes: "tiny", "base", "small", "medium", "large".
# Modelos más grandes ofrecen mayor precisión a costa de mayores recursos (CPU/GPU, RAM) y tiempo de procesamiento.
MODEL_SIZE = "base"
# Habilita/deshabilita el uso de precisión de punto flotante de 16 bits (FP16).
# Establecer a True puede acelerar significativamente la transcripción en GPUs NVIDIA compatibles (CUDA),
# pero requiere hardware y configuración adecuados. Mantener en False para compatibilidad general (CPU) o si se encuentran problemas.
USE_FP16 = False
# ------------------------------------

def transcribe_audio(file_path, language_code=None):
    """
    Realiza la transcripción de un archivo de audio utilizando el modelo Whisper especificado.

    Carga el modelo, procesa el archivo de audio y emite el resultado de la transcripción
    o un mensaje de error en formato JSON. La salida exitosa se envía a stdout,
    mientras que los errores se envían a stderr.

    Args:
        file_path (str): Ruta al archivo de audio que se desea transcribir.
        language_code (str, optional): Código de idioma ISO 639-1 (ej. 'es', 'en').
                                       Si se proporciona, guía al modelo para una mayor precisión.
                                       Si es None, Whisper intentará detectar el idioma automáticamente.
                                       Defaults to None.

    Raises:
        SystemExit: El script finaliza con código 1 en caso de error (ej. archivo no encontrado,
                    error durante la carga del modelo o la transcripción). La información del error
                    se imprime en formato JSON a stderr antes de salir.
    """
    # Validación: Comprueba si el archivo de audio especificado existe en la ruta proporcionada.
    if not os.path.exists(file_path):
        # Si el archivo no existe, imprime un error JSON en la salida de error estándar (stderr).
        print(json.dumps({"error": f"Archivo de audio no encontrado: {file_path}"}), file=sys.stderr)
        # Finaliza la ejecución del script con un código de salida de error (1).
        sys.exit(1)

    try:
        # Carga el modelo Whisper. La primera vez que se usa un tamaño de modelo,
        # puede tardar tiempo en descargarse.
        # print(f"Cargando modelo Whisper '{MODEL_SIZE}'...", file=sys.stderr) # Mensaje de depuración (opcional)
        model = whisper.load_model(MODEL_SIZE)
        # print(f"Iniciando transcripción para {file_path} (Idioma: {language_code or 'Auto'})...", file=sys.stderr) # Mensaje de depuración (opcional)

        # Ejecuta la función de transcripción principal de Whisper.
        # Se pasa la ruta del archivo, la configuración de FP16 y el código de idioma opcional.
        # Si `language_code` es None, Whisper realizará la detección automática del idioma.
        result = model.transcribe(file_path, fp16=USE_FP16, language=language_code)

        # print("Transcripción finalizada.", file=sys.stderr) # Mensaje de depuración (opcional)

        # Si la transcripción es exitosa, imprime el resultado como un objeto JSON
        # en la salida estándar (stdout). El backend Node.js leerá esta salida.
        # Solo se incluye el texto transcrito para simplificar.
        print(json.dumps({"transcription": result["text"]}))

    except Exception as e:
        # Captura cualquier excepción que ocurra durante la carga o transcripción del modelo.
        # Formatea el mensaje de error.
        error_message = f"Error durante el proceso de transcripción: {str(e)}"
        # Imprime el error como un objeto JSON en la salida de error estándar (stderr).
        print(json.dumps({"error": error_message}), file=sys.stderr)
        # Finaliza la ejecución del script indicando un fallo.
        sys.exit(1)

# --- Punto de Entrada Principal del Script ---
# El bloque `if __name__ == "__main__":` asegura que este código solo se ejecute
# cuando el script es llamado directamente (no cuando es importado como módulo).
if __name__ == "__main__":
    # Configura el analizador de argumentos de línea de comandos usando argparse.
    parser = argparse.ArgumentParser(
        description="Transcribe un archivo de audio utilizando OpenAI Whisper."
    )
    # Define el argumento posicional obligatorio: la ruta al archivo de audio.
    parser.add_argument(
        "audio_file",
        help="Ruta al archivo de audio a transcribir."
    )
    # Define el argumento opcional para especificar el idioma.
    # Se puede usar la forma corta (-l) o larga (--language).
    parser.add_argument(
        "-l", "--language",
        help="Opcional: Código de idioma (ej. 'en', 'es') para guiar la transcripción. Si se omite, el idioma se auto-detecta."
    )

    # Validación simple: Si solo se pasa el nombre del script (len=1), muestra la ayuda.
    # argparse maneja -h/--help automáticamente, pero esto cubre la falta total de argumentos.
    if len(sys.argv) == 1:
        parser.print_help(sys.stderr)
        sys.exit(1)

    # Parsea los argumentos proporcionados en la línea de comandos.
    # Los valores estarán disponibles en el objeto `args` (ej. args.audio_file, args.language).
    args = parser.parse_args()

    # Llama a la función principal de transcripción, pasando los argumentos parseados.
    # `args.language` será `None` si el usuario no especificó la opción -l/--language.
    transcribe_audio(args.audio_file, args.language)