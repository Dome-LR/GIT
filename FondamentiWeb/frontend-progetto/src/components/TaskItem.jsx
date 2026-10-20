import React, { useState } from 'react';
import { ListGroup, Form, Badge } from 'react-bootstrap';

export default function TaskItem({ title, isCompleted, type, time }) {
  
  const [checked, setChecked] = useState(isCompleted);

  const handleCheck = () => {
    setChecked(!checked);
    // "salva data e ora completamento"
  };

  return (
    <ListGroup.Item className="d-flex justify-content-between align-items-center mb-2 shadow-sm">
      <div className="d-flex align-items-center gap-3">
        <Form.Check.Input
          type="checkbox"
          checked={checked}
          onChange={handleCheck}
          className="mt-0"
        />

        {/* Titolo della task, che viene sbarrato se completata */}
        <span className={checked ? 'text-decoration-line-through text-muted' : ''}>
          {title}
        </span>
      </div>

      {/* Sezione destra del componente: varia in base al tipo di task */}
      <div className="d-flex align-items-center gap-2 small text-muted">
        {type === 'timer' && (
          <Badge bg="primary-subtle" text="primary-emphasis">
            [Timer]
          </Badge>
        )}
        {type === 'scheduled' && (
          <span> {time}</span>
        )}
      </div>
    </ListGroup.Item>
  );
}
