// frontend/src/main.jsx

// --- Importaciones de Módulos y Estilos ---

// Importa la biblioteca principal de React.
import React from 'react';
// Importa el módulo ReactDOM para interactuar con el DOM, específicamente la API para crear raíces concurrentes.
import ReactDOM from 'react-dom/client';
// Importa los estilos CSS globales de Bootstrap para aplicar su sistema de diseño y componentes.
// Es crucial importarlo aquí para que esté disponible en toda la aplicación.
import 'bootstrap/dist/css/bootstrap.min.css';
// Importa el componente raíz de la aplicación React.
import App from './App.jsx';
// Importa estilos CSS globales personalizados. Puede contener resets, fuentes o estilos base.
// Su contenido puede ser modificado o eliminado si Bootstrap cubre todas las necesidades.
import './index.css';

// --- Renderizado de la Aplicación ---

// Obtiene el elemento raíz del DOM (usualmente un <div id="root"> en index.html) donde se montará la aplicación React.
// Utiliza `createRoot` para habilitar el modo concurrente de React, recomendado para nuevas aplicaciones.
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderiza el componente principal `App` dentro del elemento raíz del DOM.
// `React.StrictMode` es un componente auxiliar que activa verificaciones y advertencias adicionales
// en modo de desarrollo para ayudar a detectar posibles problemas en la aplicación. No afecta el build de producción.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);