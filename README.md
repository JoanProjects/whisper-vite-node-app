# Prototipo de Transcriptor de Audio con Whisper (Análisis de Capacidades)

[![React](https://img.shields.io/badge/React-v18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org/) [![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/) [![Express.js](https://img.shields.io/badge/Express.js-v4+-000000?logo=express&logoColor=white)](https://expressjs.com/) [![Python](https://img.shields.io/badge/Python-v3.7+-3776AB?logo=python&logoColor=white)](https://www.python.org/) [![Bootstrap](https://img.shields.io/badge/Bootstrap-v5+-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/) [![Whisper](https://img.shields.io/badge/OpenAI_Whisper-Modelo_IA-412991?logo=openai&logoColor=white)](https://github.com/openai/whisper)

Este proyecto es un prototipo funcional desarrollado con fines investigativos y de prueba. Su objetivo principal es explorar e ilustrar la implementación y las capacidades del modelo de reconocimiento de voz Whisper de OpenAI en una aplicación web simple.

## Objetivo del Prototipo

El propósito fundamental de esta aplicación es servir como un entorno controlado para:

1.  **Evaluar la integración:** Demostrar una forma de integrar el modelo Whisper (ejecutado localmente vía Python) con un frontend en React y un backend en Node.js.
2.  **Analizar capacidades:** Observar el rendimiento de Whisper en tareas de transcripción con diferentes archivos de audio y explorar el impacto de la especificación explícita del idioma versus la detección automática.
3.  **Comprender el flujo de datos:** Visualizar el proceso completo, desde la carga del archivo por el usuario hasta la recepción y visualización del texto transcrito a través de una API básica.

Este prototipo no implementa una arquitectura web completa o robusta y no está diseñado para producción. Puede carecer de optimizaciones de rendimiento, manejo exhaustivo de errores o características de seguridad avanzadas.

## Tecnologías Utilizadas

Para la construcción de este prototipo se emplearon las siguientes tecnologías clave:

*   **Frontend (Interfaz de Usuario):**
    *   **React (v18+):** Biblioteca JavaScript para construir el componente interactivo principal.
    *   **Vite:** Herramienta de desarrollo frontend para la gestión del entorno y el build.
    *   **Bootstrap (v5+):** Framework CSS para estilización básica.
*   **Backend (Servidor y API):**
    *   **Node.js (v18+):** Entorno de ejecución JavaScript.
    *   **Express.js (v4+):** Framework para crear la API simple y gestionar las rutas del backend.
    *   **Multer:** Middleware para manejar la carga de archivos.
*   **Núcleo de Transcripción:**
    *   **Python (v3.7+):** Lenguaje para ejecutar el modelo Whisper.
    *   **OpenAI Whisper:** Biblioteca y modelo de IA para el reconocimiento de voz.
    *   **FFmpeg:** Dependencia externa (requerida por Whisper) para el procesamiento de audio.
