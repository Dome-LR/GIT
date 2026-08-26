import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import CalendarPage from './components/CalendarPage';
import SettingsPage from './components/SettingsPage';
import { useModules } from './context/ModuleContext';

function App() {
  const { activeModules } = useModules(); // Possiamo leggere i moduli anche qui!

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        
        {/* NAVBAR - visibile su tutte le pagine */}
        <nav className="bg-white p-4 shadow-sm flex gap-4">
          <Link to="/" className="text-blue-600 font-bold hover:underline">Home</Link>
          
          {/* Se il calendario è attivo, mostra il link, altrimenti nascondilo! */}
          {activeModules.calendar && (
            <Link to="/calendar" className="text-gray-700 hover:underline">Calendario</Link>
          )}
          
          <Link to="/settings" className="text-gray-700 hover:underline">Impostazioni</Link>
        </nav>

        {/* CONTENUTO DELLA PAGINA */}
        <main className="flex-grow p-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* <Route path="/calendar" element={<CalendarPage />} /> */}
            {/* <Route path="/settings" element={<SettingsPage />} /> */}
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;