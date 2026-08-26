import React from 'react';
import { useModules } from '../context/ModuleContext';

export default function SettingsPage() {
  const { activeModules, toggleModule } = useModules();

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border mt-6">
      <h1 className="text-3xl font-bold mb-2">Impostazioni Moduli</h1>
      <p className="text-gray-500 mb-8">Personalizza la tua esperienza attivando solo ciò che ti serve.</p>

      <div className="space-y-4">
        
        {/* Modulo Calendario */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded border">
          <div>
            <h3 className="font-semibold text-lg"> Calendario</h3>
            <p className="text-sm text-gray-500">Pianifica le task nei giorni futuri</p>
          </div>
          <button 
            onClick={() => toggleModule('calendar')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              activeModules.calendar 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {activeModules.calendar ? 'Disattiva' : 'Attiva'}
          </button>
        </div>

        {/* Modulo Liste Spesa/Preferite */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded border">
          <div>
            <h3 className="font-semibold text-lg">🛒 Liste Aggiuntive</h3>
            <p className="text-sm text-gray-500">Gestisci la spesa e altre liste personalizzate</p>
          </div>
          <button 
            onClick={() => toggleModule('shoppingList')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              activeModules.shoppingList 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {activeModules.shoppingList ? 'Disattiva' : 'Attiva'}
          </button>
        </div>

        {/* Modulo Habit Tracker */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded border">
          <div>
            <h3 className="font-semibold text-lg"> Tracker Abitudini</h3>
            <p className="text-sm text-gray-500">Monitora le tue routine nel tempo</p>
          </div>
          <button 
            onClick={() => toggleModule('habits')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              activeModules.habits 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {activeModules.habits ? 'Disattiva' : 'Attiva'}
          </button>
        </div>

      </div>
    </div>
  );
}