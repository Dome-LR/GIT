import React, { useState, useEffect, useRef } from 'react';
import { useModules } from '../context/ModuleContext';
import { useSocket } from '../context/SocketContext';
import { Row, Col, Card, Alert, Badge, Button, ListGroup, Form } from 'react-bootstrap';

export default function HomePage() {
  const { activeModules, toggleModule } = useModules();
  const { socket, isConnected, joinList, leaveList } = useSocket();
  
  const [tasksOggi, setTasksOggi] = useState([]);
  const [listePreferite, setListePreferite] = useState([]); 

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const formattaData = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString('it-IT');
    } catch (e) { return ''; }
  };

  const formattaTimer = (timerData) => {
    if (!timerData) return 0;
    if (typeof timerData === 'object') return timerData.targetMinutes !== undefined ? timerData.targetMinutes : 0;
    return timerData;
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    try {
      return new Date(dateString).toDateString() === new Date().toDateString();
    } catch (e) {
      return false;
    }
  };

  const fetchHomeData = async () => {
    try {
      const [resTasks, resLists] = await Promise.all([
        fetch('http://localhost:5000/api/tasks', { headers: getAuthHeaders() }),
        fetch('http://localhost:5000/api/lists', { headers: getAuthHeaders() })
      ]);

      if (resTasks.ok && resLists.ok) {
        const allTasks = await resTasks.json();
        const allLists = await resLists.json();

        // Filtro: Solo le scadenze con data odierna
        const filtratiOggi = allTasks.filter(task => {
          if (task.taskType === 'calendar' && task.targetDate) {
            return isToday(task.targetDate);
          }
          return false; 
        });
        setTasksOggi(filtratiOggi);

        const stellate = allLists
          .filter(list => list.isFavorite === true)
          .map(list => ({
            ...list,
            tasks: allTasks.filter(task => task.listId === list._id)
          }));
        setListePreferite(stellate);

        // Entra nelle stanze socket per ricevere aggiornamenti in tempo reale
        allLists.forEach(l => joinList(l._id));
      }
    } catch (error) {
      console.error("Errore nel caricamento della dashboard", error);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Ascolto eventi Socket.IO per aggiornamenti in tempo reale
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      // Se e un task di oggi, aggiungilo
      if (newTask.taskType === 'calendar' && isToday(newTask.targetDate)) {
        setTasksOggi(prev => {
          const exists = prev.some(t => t._id === newTask._id);
          return exists ? prev : [...prev, newTask];
        });
      }

      // Se appartiene a una lista preferita, aggiungilo
      setListePreferite(prev => prev.map(list => {
        if (list._id === newTask.listId) {
          const exists = (list.tasks || []).some(t => t._id === newTask._id);
          return exists ? list : { ...list, tasks: [...(list.tasks || []), newTask] };
        }
        return list;
      }));
    };

    const handleTaskUpdated = (updatedTask) => {
      // Aggiorna nei task di oggi
      setTasksOggi(prev => {
        const exists = prev.some(t => t._id === updatedTask._id);
        const shouldBeInToday = updatedTask.taskType === 'calendar' && isToday(updatedTask.targetDate);

        if (exists && shouldBeInToday) {
          return prev.map(t => t._id === updatedTask._id ? updatedTask : t);
        } else if (exists && !shouldBeInToday) {
          return prev.filter(t => t._id !== updatedTask._id);
        } else if (!exists && shouldBeInToday) {
          return [...prev, updatedTask];
        }
        return prev;
      });

      // Aggiorna nelle liste preferite
      setListePreferite(prev => prev.map(list => {
        if (list._id === updatedTask.listId) {
          return {
            ...list,
            tasks: (list.tasks || []).map(t => t._id === updatedTask._id ? updatedTask : t)
          };
        }
        return list;
      }));
    };

    const handleTaskDeleted = ({ taskId, listId }) => {
      setTasksOggi(prev => prev.filter(t => t._id !== taskId));
      setListePreferite(prev => prev.map(list => {
        if (list._id === listId) {
          return {
            ...list,
            tasks: (list.tasks || []).filter(t => t._id !== taskId)
          };
        }
        return list;
      }));
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

  // Assicura l'iscrizione alle stanze delle liste preferite
  useEffect(() => {
    if (socket && listePreferite.length > 0) {
      listePreferite.forEach(l => joinList(l._id));
    }
  }, [listePreferite.length, socket]);

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isCompleted: !currentStatus })
      });
      
      if (response.ok) {
        const taskAggiornato = await response.json();
        setTasksOggi(tasksOggi.map(t => t._id === taskId ? taskAggiornato : t));
        setListePreferite(listePreferite.map(list => ({
          ...list,
          tasks: list.tasks.map(t => t._id === taskId ? taskAggiornato : t)
        })));
      }
    } catch (error) {
      console.error("Errore aggiornamento task", error);
    }
  };

  const tuttiCompletati = tasksOggi.length > 0 && tasksOggi.every(task => task.isCompleted);

  return (
    <Row className="justify-content-center">
      <Col lg={9} xl={8}>

        {/* BARRA SVILUPPATORE E TEST MODULI */}
        <Alert variant="warning" className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h3 className="h6 fw-bold text-uppercase mb-0">Pannello Sviluppatore</h3>
            <small>Realtime: {isConnected ? 'Connesso' : 'Disconnesso'}</small>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button size="sm" variant={activeModules.calendar ? 'success' : 'danger'} onClick={() => toggleModule('calendar')}>
              Calendario: {activeModules.calendar ? 'ON' : 'OFF'}
            </Button>
            <Button size="sm" variant={activeModules.timer ? 'success' : 'danger'} onClick={() => toggleModule('timer')}>
              Timer: {activeModules.timer ? 'ON' : 'OFF'}
            </Button>
            <Button size="sm" variant={activeModules.habits ? 'success' : 'danger'} onClick={() => toggleModule('habits')}>
              Abitudini: {activeModules.habits ? 'ON' : 'OFF'}
            </Button>
            <Button size="sm" variant="outline-dark" onClick={fetchHomeData}>
              Ricarica
            </Button>
          </div>
        </Alert>

        <h1 className="h2 fw-bold mb-4">La tua Giornata</h1>

        <Card as="section" className="mb-4 shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center bg-white">
            <h2 className="h5 fw-bold text-primary mb-0">Task di Oggi</h2>
            <Badge pill bg="secondary-subtle" text="secondary-emphasis">
              {tasksOggi.filter(t => t.isCompleted).length} / {tasksOggi.length}
            </Badge>
          </Card.Header>
          <Card.Body>
            {tuttiCompletati && (
              <Alert variant="success" className="text-center">
                <strong>Ottimo lavoro!</strong> Hai completato tutti gli impegni di oggi!
              </Alert>
            )}

            {tasksOggi.length === 0 ? (
              <p className="text-muted fst-italic text-center py-3 mb-0">Nessuna scadenza programmata per oggi.</p>
            ) : (
              <ListGroup>
                {tasksOggi.map(task => (
                  <ListGroup.Item
                    key={task._id}
                    className={`d-flex align-items-center gap-3 ${task.isCompleted ? 'bg-light opacity-75' : ''}`}
                  >
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
                      <div className="mt-1">
                        <Badge bg="primary-subtle" text="primary-emphasis" className="text-uppercase">[Scadenza]</Badge>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>

        <Card as="section" className="mb-4 shadow-sm">
          <Card.Header className="bg-white">
            <h2 className="h5 fw-bold text-warning-emphasis mb-0">Liste Preferite</h2>
          </Card.Header>
          <Card.Body>
            {listePreferite.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted fst-italic mb-2">Non hai ancora nessuna lista preferita.</p>
                <p className="small text-muted mb-0">Aggiungi il contrassegno preferito alle liste dalla pagina "Le mie Liste" per vederle qui.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {listePreferite.map(lista => (
                  <Card key={lista._id} className="bg-light">
                    <Card.Body>
                      <h3 className="h6 fw-bold border-bottom pb-2 mb-3">{lista.name}</h3>

                      {lista.tasks.length === 0 ? (
                        <p className="small text-muted fst-italic mb-0">Lista vuota.</p>
                      ) : (
                        <ListGroup>
                          {lista.tasks.map(task => (
                            <ListGroup.Item key={task._id} className="d-flex align-items-center gap-2">
                              <Form.Check.Input
                                type="checkbox"
                                checked={task.isCompleted || false}
                                onChange={() => handleToggleTask(task._id, task.isCompleted)}
                                className="mt-0 flex-shrink-0"
                              />
                              <span className={`small d-flex align-items-center flex-wrap gap-1 ${task.isCompleted ? 'text-decoration-line-through text-muted' : ''}`}>
                                {task.title}

                                {task.taskType === 'calendar' && (
                                  <Badge bg="primary-subtle" text="primary-emphasis" className="fw-normal">[Scadenza: {formattaData(task.targetDate)}]</Badge>
                                )}
                                {task.taskType === 'timer' && (
                                  <Badge bg="warning-subtle" text="warning-emphasis" className="fw-normal">[Timer: {formattaTimer(task.timerData)} min]</Badge>
                                )}
                              </span>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
