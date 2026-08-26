import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ModuleProvider } from "./context/ModuleContext.jsx";

import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 
      Avvolgiamo App nel ModuleProvider. 
      In questo modo tutti i componenti dentro App (e i loro figli) 
      potranno usare l'hook useModules()
    */}
    <ModuleProvider>
      <App />
    </ModuleProvider>
  </React.StrictMode>
);