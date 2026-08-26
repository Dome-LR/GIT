import React from 'react';
import TaskItem from './TaskItem';
import { useModules } from '../context/ModuleContext';

export default function HomePage() {
  const { activeModules, toggleModule } = useModules();

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-50 min-h-screen">
      
      <div className="mb-6 p-4 bg-yellow-100 rounded border border-yellow-300">
        <h3 className="text-sm font-bold mb-2 uppercase">Gestione Moduli (Test)</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => toggleModule('shoppingList')}
            className={`px-3 py-1 rounded text-white ${activeModules.shoppingList ? 'bg-green-500' : 'bg-red-500'}`}
          >
            Liste Spesa: {activeModules.shoppingList ? 'ON' : 'OFF'}
          </button>
          <button 
            onClick={() => toggleModule('calendar')}
            className={`px-3 py-1 rounded text-white ${activeModules.calendar ? 'bg-green-500' : 'bg-red-500'}`}
          >
            Calendario: {activeModules.calendar ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">Home</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-600">Task di Oggi</h2>
        <TaskItem title="Rispondere alle email" isCompleted={false} type="simple" />
      </section>

      {activeModules.shoppingList && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-600 mb-4">Altre Liste</h2>
          <div className="bg-white p-4 rounded border shadow-sm">
            <h3 className="font-bold mb-3 border-b pb-2">🛒 Spesa</h3>
            <TaskItem title="Latte" isCompleted={false} type="simple" />
            <TaskItem title="Pane" isCompleted={true} type="simple" />
          </div>
        </section>
      )}

      {activeModules.calendar && (
        <section className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="text-xl font-semibold text-blue-800">📅 Calendario Prossimi Giorni</h2>
          <p className="text-gray-600">Qui in futuro metteremo il componente Calendario come da PDF...</p>
        </section>
      )}

    </div>
  );
}