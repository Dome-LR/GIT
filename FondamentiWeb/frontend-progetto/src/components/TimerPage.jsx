import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import RealtimeStatusBar from './RealtimeStatusBar';

export default function TimerPage() {
  const { socket, isConnected, joinList, leaveList } = useSocket();
  const [timers, setTimers] = useState([]);
  const [lists, setLists] = useState([]); 
  
  const [newTitle, setNewTitle] = useState('');
  const [newListId, setNewListId] = useState('');
  const [newMinutes, setNewMinutes] = useState(25);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetchDati = async () => {
    try {
      const [resLists, resTimers] = await Promise.all([
        fetch('http://localhost:5000/api/lists', { headers: getAuthHeaders() }),
        fetch('http://localhost:5000/api/tasks/timers', { headers: getAuthHeaders() })
      ]);

      if (resLists.ok && resTimers.ok) {
        const dataLists = await resLists.json();
        const dataTimers = await resTimers.json();
        
        setLists(dataLists);
        if (dataLists.length > 0 && !newListId) setNewListId(dataLists[0]._id); 

        setTimers(dataTimers.map(t => ({ ...t, isRunning: false })));

        // Unisciti alle stanze per ciascuna lista
        dataLists.forEach(l => joinList(l._id));
      }
    } catch (error) {
      console.error("Errore di caricamento", error);
    }
  };

  useEffect(() => {
    fetchDati();
  }, []);

  // Ascolto eventi Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      if (newTask.taskType === 'timer') {
        const listaTrovata = lists.find(l => l._id === newTask.listId);
        const enrichedTask = { ...newTask, listId: listaTrovata || newTask.listId, isRunning: false };
        setTimers(prev => {
          const exists = prev.some(t => t._id === newTask._id);
          return exists ? prev : [...prev, enrichedTask];
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      if (updatedTask.taskType === 'timer') {
        setTimers(prev => prev.map(t => {
          if (t._id === updatedTask._id) {
            // Se il timer sta girando sul nostro client, non sovrascrivere isRunning
            return {
              ...t,
              ...updatedTask,
              isRunning: t.isRunning && !updatedTask.isCompleted,
              timerData: t.isRunning ? t.timerData : (updatedTask.timerData || t.timerData)
            };
          }
          return t;
        }));
      }
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTimers(prev => prev.filter(t => t._id !== taskId));
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_deleted', handleTaskDeleted);

    return () => {
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_deleted', handleTaskDeleted);
    };
  }, [socket, lists]);

  // Assicura l'iscrizione alle stanze delle liste per i timer
  useEffect(() => {
    if (socket && lists.length > 0) {
      lists.forEach(l => joinList(l._id));
    }
  }, [lists.length, socket]);

  // Completamento automatico allo zero
  const completamentoAutomatico = async (taskId, elapsed, targetMin) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          isCompleted: true,
          timerData: { targetMinutes: targetMin, elapsedSeconds: elapsed }
        })
      });
    } catch (error) {
      console.error("Errore auto-completamento", error);
    }
  };

  // Orologio interno
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimers(prevTimers => 
        prevTimers.map(timer => {
          if (timer.isRunning) {
            const currentElapsed = timer.timerData?.elapsedSeconds || 0;
            const targetSeconds = (timer.timerData?.targetMinutes || 0) * 60;
            
            if (currentElapsed + 1 >= targetSeconds) {
              completamentoAutomatico(timer._id, targetSeconds, timer.timerData?.targetMinutes); 
              return { 
                ...timer, 
                isRunning: false, 
                isCompleted: true,
                timerData: { ...timer.timerData, elapsedSeconds: targetSeconds } 
              };
            }
            
            return { ...timer, timerData: { ...timer.timerData, elapsedSeconds: currentElapsed + 1 } };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, []); 

  const salvaProgressoDB = async (taskId, elapsed, targetMin) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          timerData: { targetMinutes: targetMin, elapsedSeconds: elapsed }
        })
      });
    } catch (error) {
      console.error("Errore salvataggio timer", error);
    }
  };

  const handleAddTimer = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newListId || newMinutes < 1) return;

    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newTitle,
          listId: newListId,
          taskType: 'timer',
          timerData: { targetMinutes: parseInt(newMinutes, 10), elapsedSeconds: 0 }
        })
      });

      if (response.ok) {
        const nuovoTask = await response.json();
        const listaTrovata = lists.find(l => l._id === newListId);
        nuovoTask.listId = listaTrovata; 
        
        setTimers(prev => [...prev, { ...nuovoTask, isRunning: false }]);
        setNewTitle('');
      }
    } catch (error) {
      console.error("Errore creazione timer", error);
    }
  };

  const toggleTimer = (timer) => {
    if (timer.isRunning) {
      salvaProgressoDB(timer._id, timer.timerData.elapsedSeconds, timer.timerData.targetMinutes);
    }
    setTimers(timers.map(t => t._id === timer._id ? { ...t, isRunning: !t.isRunning } : t));
  };

  const handleToggleTask = async (timer) => {
    const newStatus = !timer.isCompleted;
    
    setTimers(timers.map(t => 
      t._id === timer._id ? { 
        ...t, 
        isCompleted: newStatus, 
        isRunning: newStatus ? false : t.isRunning 
      } : t
    ));

    try {
      const payload = { isCompleted: newStatus };
      if (newStatus && timer.isRunning) {
        payload.timerData = { ...timer.timerData };
      }

      await fetch(`http://localhost:5000/api/tasks/${timer._id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Errore completamento manuale", error);
    }
  };

  const resetTimer = async (timer) => {
    setTimers(timers.map(t => t._id === timer._id ? { 
      ...t, 
      isRunning: false, 
      isCompleted: false, 
      timerData: { ...t.timerData, elapsedSeconds: 0 } 
    } : t));
    
    try {
      await fetch(`http://localhost:5000/api/tasks/${timer._id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          isCompleted: false,
          timerData: { targetMinutes: timer.timerData.targetMinutes, elapsedSeconds: 0 }
        })
      });
    } catch (error) {
      console.error("Errore reset", error);
    }
  };

  const deleteTimer = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setTimers(timers.filter(t => t._id !== id));
    } catch (error) {
      console.error("Errore eliminazione", error);
    }
  };

  const formatTimeLeft = (targetMinutes, elapsedSeconds) => {
    const target = (targetMinutes || 0) * 60;
    const elapsed = elapsedSeconds || 0;
    const remaining = Math.max(0, target - elapsed);

    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Row className="justify-content-center">
      <Col lg={10} xl={9}>
        {/* BARRA STATO SOCKET */}
        <RealtimeStatusBar
          label="Real-time Timer:"
          isConnected={isConnected}
          onReload={fetchDati}
          reloadLabel="Ricarica Timer"
        />

        <h1 className="h2 fw-bold mb-4">Focus Timer</h1>

        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Form onSubmit={handleAddTimer}>
              <Row className="g-2 align-items-center">
                <Col md>
                  <Form.Control
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="A cosa vuoi lavorare?"
                  />
                </Col>

                <Col md="auto">
                  <Form.Select value={newListId} onChange={(e) => setNewListId(e.target.value)}>
                    {lists.map(list => (
                      <option key={list._id} value={list._id}>{list.name}</option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md="auto">
                  <InputGroup>
                    <Form.Control
                      type="number"
                      min="1"
                      value={newMinutes}
                      onChange={(e) => setNewMinutes(e.target.value)}
                      className="text-center"
                      style={{ maxWidth: 90 }}
                    />
                    <InputGroup.Text>min</InputGroup.Text>
                  </InputGroup>
                </Col>

                <Col md="auto">
                  <Button type="submit" variant="primary" className="w-100 fw-semibold">
                    Crea Timer
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        <Row xs={1} md={2} className="g-4">
          {timers.map(timer => {
            const isCompleted = timer.isCompleted;
            const isMaxTimeReached = timer.timerData?.elapsedSeconds >= (timer.timerData?.targetMinutes * 60);

            const cardClasses = isCompleted
              ? 'bg-light border-secondary opacity-75'
              : timer.isRunning
                ? 'bg-primary-subtle border-primary'
                : 'bg-white border-secondary-subtle';

            const timeColor = isMaxTimeReached && isCompleted
              ? 'text-success'
              : isCompleted
                ? 'text-muted'
                : timer.isRunning
                  ? 'text-primary'
                  : '';

            return (
              <Col key={timer._id}>
                <Card
                  className={`h-100 shadow border-0 border-start border-4 ${cardClasses}`}
                  style={{ transition: 'transform 0.2s', transform: !isCompleted && timer.isRunning ? 'scale(1.02)' : 'none' }}
                >
                  <Card.Body className="d-flex flex-column p-4">

                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-start gap-3">
                        <Form.Check.Input
                          type="checkbox"
                          checked={isCompleted || false}
                          onChange={() => handleToggleTask(timer)}
                          className="mt-2 flex-shrink-0"
                        />
                        <div>
                          <h2 className={`h5 fw-bold mb-1 ${isCompleted ? 'text-muted text-decoration-line-through' : ''}`}>
                            {timer.title}
                          </h2>
                          <span className="badge bg-secondary-subtle text-secondary-emphasis fw-normal">
                            [Lista: {timer.listId?.name || 'Lista'}]
                          </span>
                        </div>
                      </div>
                      <Button variant="outline-danger" size="sm" className="fw-bold" onClick={() => deleteTimer(timer._id)}>
                        X
                      </Button>
                    </div>

                    <div className={`display-3 font-monospace text-center my-4 ${timeColor}`}>
                      {formatTimeLeft(timer.timerData?.targetMinutes, timer.timerData?.elapsedSeconds)}
                    </div>

                    <div className="d-flex gap-2 mt-auto">
                      <Button
                        variant={isCompleted ? 'secondary' : timer.isRunning ? 'warning' : 'success'}
                        className="flex-fill fw-bold"
                        onClick={() => toggleTimer(timer)}
                        disabled={isCompleted}
                      >
                        {isCompleted ? 'Completato' : timer.isRunning ? 'Pausa' : 'Avvia'}
                      </Button>
                      <Button variant="outline-secondary" className="fw-bold" onClick={() => resetTimer(timer)}>
                        Reset
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {timers.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted fs-5 mb-0">Nessun timer attivo.</p>
            <p className="text-muted small mt-2">Crea un nuovo task di tipo Timer per iniziare a focalizzarti.</p>
          </div>
        )}
      </Col>
    </Row>
  );
}
