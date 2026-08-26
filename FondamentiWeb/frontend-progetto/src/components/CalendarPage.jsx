import React, { useState } from 'react';
import TaskItem from './TaskItem';

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState('Oggi');

  const days = ['24/3', '25/3', 'Oggi', '27/3', '28/3'];

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <h1 className="text-3xl font-bold mb-6">Calendario</h1>

      {/* Timeline */}
      <div className="flex justify-between bg-white p-4 rounded-lg shadow-sm border mb-6">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-1 py-2 text-center rounded-md transition-colors mx-1 font-medium ${
              selectedDay === day 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* lista task */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Impegni per: <span className="text-blue-600">{selectedDay}</span>
        </h2>
        
        {selectedDay === 'Oggi' ? (
          <div>
            <TaskItem title="Riunione di progetto" isCompleted={false} type="scheduled" time="10:00" />
            <TaskItem title="Andare in palestra" isCompleted={false} type="simple" />
            <TaskItem title="Finire l'interfaccia React" isCompleted={true} type="timer" />
          </div>
        ) : (
          <div>
            <TaskItem title={`Task programmata per il ${selectedDay}`} isCompleted={false} type="scheduled" time="09:00" />
            <TaskItem title="Scadenza consegna" isCompleted={false} type="simple" />
          </div>
        )}
      </div>
    </div>
  );
}