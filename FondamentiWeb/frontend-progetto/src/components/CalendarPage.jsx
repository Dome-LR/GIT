import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Row, Col, Card, Badge, Button, ListGroup, Form } from 'react-bootstrap';
import RealtimeStatusBar from './RealtimeStatusBar';

export default function CalendarPage() {
  const { socket, isConnected, joinList, leaveList } = useSocket();
  const [referenceDate, setReferenceDate] = useState(new Date());
  
  const daysWindow = React.useMemo(() => {
    const days = [];
    for (let i = -2; i <= 2; i++) {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [referenceDate]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    setSelectedDate(daysWindow[2]);
  }, [referenceDate]);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetchCalendarTasks = async () => {
    try {
      const startDate = new Date(daysWindow[0]);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(daysWindow[4]);
      endDate.setHours(23, 59, 59, 999);

      const response = await fetch(
        `http://localhost:5000/api/tasks/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: getAuthHeaders() }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data);

        // Join room per ciascuna lista rappresentata
        data.forEach(t => {
          const lId = t.listId?._id || t.listId;
          if (lId) joinList(lId);
        });
      }
    } catch (error) {
      console.error("Errore di connessione", error);
    }
  };

  useEffect(() => {
    fetchCalendarTasks();
  }, [daysWindow]);

  // Ascolto eventi Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      if (newTask.taskType === 'calendar' && newTask.targetDate) {
        setTasks(prev => {
          const exists = prev.some(t => t._id === newTask._id);
          return exists ? prev : [...prev, newTask];
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? { ...t, ...updatedTask } : t));
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_deleted', handleTaskDeleted);

    return () => {
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_deleted', handleTaskDeleted);
    };
  }, [socket]);

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isCompleted: !currentStatus })
      });
      const taskAggiornato = await response.json();
      setTasks(tasks.map(t => t._id === taskId ? taskAggiornato : t));
    } catch (error) {
      console.error("Errore aggiornamento", error);
    }
  };

  const getDayLabel = (dateObj) => {
    const oggi = new Date();
    if (dateObj.toDateString() === oggi.toDateString()) return 'Oggi';
    
    const giorni = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const nomeGiorno = giorni[dateObj.getDay()];
    return `${nomeGiorno} ${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
  };

  const spostaSettimana = (giorni) => {
    const nuovaData = new Date(referenceDate);
    nuovaData.setDate(nuovaData.getDate() + giorni);
    setReferenceDate(nuovaData);
  };

  const vaiAdOggi = () => {
    setReferenceDate(new Date());
  };

  const handleSceltaData = (e) => {
    if (e.target.value) {
      setReferenceDate(new Date(e.target.value));
    }
  };

  const tasksForSelectedDay = tasks.filter(task => {
    if (!task.targetDate) return false;
    const taskDate = new Date(task.targetDate);
    return taskDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <Row className="justify-content-center">
      <Col lg={10} xl={8}>
        {/* BARRA STATO SOCKET */}
        <RealtimeStatusBar
          label="Real-time Calendario:"
          isConnected={isConnected}
          onReload={fetchCalendarTasks}
          reloadLabel="Ricarica Scadenze"
        />

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <h1 className="h2 fw-bold mb-0">Calendario</h1>

          {/* LA BARRA DEGLI STRUMENTI DEL CALENDARIO */}
          <div className="d-flex align-items-center gap-2">
            <Button variant="outline-secondary" size="sm" className="fw-bold" onClick={() => spostaSettimana(-5)}>
              &lt;&lt;
            </Button>

            <Button variant="outline-primary" size="sm" className="fw-semibold" onClick={vaiAdOggi}>
              Oggi
            </Button>

            {/* Il Date Picker per saltare a date arbitrarie */}
            <Form.Control
              type="date"
              size="sm"
              style={{ width: 'auto' }}
              onChange={handleSceltaData}
              value={referenceDate.toISOString().split('T')[0]}
            />

            <Button variant="outline-secondary" size="sm" className="fw-bold" onClick={() => spostaSettimana(5)}>
              &gt;&gt;
            </Button>
          </div>
        </div>

        <Card className="shadow-sm mb-4">
          <Card.Body className="d-flex gap-2">
            {daysWindow.map((dateObj, index) => {
              const isSelected = selectedDate.toDateString() === dateObj.toDateString();
              return (
                <Button
                  key={index}
                  variant={isSelected ? 'primary' : 'light'}
                  size="sm"
                  className="flex-fill fw-medium"
                  onClick={() => setSelectedDate(dateObj)}
                >
                  {getDayLabel(dateObj)}
                </Button>
              );
            })}
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Body className="p-4">
            <h2 className="h5 fw-semibold mb-4">
              Impegni per: <span className="text-primary">{getDayLabel(selectedDate)}</span>
            </h2>

            {tasksForSelectedDay.length === 0 ? (
              <p className="text-muted fst-italic mb-0">Nessuna scadenza programmata per questo giorno.</p>
            ) : (
              <ListGroup>
                {tasksForSelectedDay.map(task => (
                  <ListGroup.Item key={task._id} className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <Form.Check.Input
                        type="checkbox"
                        checked={task.isCompleted || false}
                        onChange={() => handleToggleTask(task._id, task.isCompleted)}
                        className="mt-0 flex-shrink-0"
                      />
                      <div className="d-flex flex-column">
                        <span className={task.isCompleted ? 'text-decoration-line-through text-muted' : 'fw-medium'}>
                          {task.title}
                        </span>
                        <small className="text-muted">
                          [Lista: {task.listId?.name || 'Lista'}]
                        </small>
                      </div>
                    </div>

                    <Badge bg="primary-subtle" text="primary-emphasis">
                      Scadenza
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
