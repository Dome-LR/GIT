import React, { useState } from 'react';

export default function TaskItem({ title, isCompleted, type, time }) {
  
  const [checked, setChecked] = useState(isCompleted);

  const handleCheck = () => {
    setChecked(!checked);
    // "salva data e ora completamento"
  };

  return (
    <div className="flex items-center justify-between p-3 mb-2 bg-white rounded shadow-sm border">
      <div className="flex items-center gap-3">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={handleCheck}
          className="w-5 h-5 cursor-pointer"
        />
        
        {/* Titolo della task, che viene sbarrato se completata */}
        <span className={checked ? "line-through text-gray-400" : "text-black"}>
          {title}
        </span>
      </div>

      {/* Sezione destra del componente: varia in base al tipo di task */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {type === 'timer' && (
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
            ⏱ Timer
          </span>
        )}
        {type === 'scheduled' && (
          <span> {time}</span>
        )}
      </div>
    </div>
  );
}