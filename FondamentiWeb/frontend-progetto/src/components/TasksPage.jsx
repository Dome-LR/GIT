import React, { useState, useEffect, useRef } from 'react';
import { useModules } from '../context/ModuleContext';
import { useSocket } from '../context/SocketContext';
import { Row, Col, Card, Badge, Button, Form, InputGroup, ListGroup } from 'react-bootstrap';
import RealtimeStatusBar from './RealtimeStatusBar';

export default function TasksPage() {
  const { activeModules } = useModules();
  const { socket, isConnected, joinList, leaveList } = useSocket();
  
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  
  const [newTaskTexts, setNewTaskTexts] = useState({});
  const [newTaskTypes, setNewTaskTypes] = useState({});
  const [newTaskDates, setNewTaskDates] = useState({}); 
  const [newTaskFrequencies, setNewTaskFrequencies] = useState({});
  const [newTaskDurations, setNewTaskDurations] = useState({});

  // Stato per la condivisione liste
  const [shareInputListId, setShareInputListId] = useState(null);
  const [shareUsername, setShareUsername] = useState('');
  const [shareError, setShareError] = useState('');

  const currentUsername = localStorage.getItem('username') || '';

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const formattaData = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString('it-IT');
    } catch (e) {
      return '';
    }
  };

  const formattaTimer = (timerData) => {
    if (!timerData) return 0;
    if (typeof timerData === 'object') {
      return timerData.targetMinutes !== undefined ? timerData.targetMinutes : 0;
    }
    return timerData;
  };

  const getLabelAbitudine = (recurrence) => {
    if (!recurrence) return 'Giornaliera';
    const rec = String(recurrence).toLowerCase().trim();
    if (rec === 'weekly') return 'Settimanale';
    if (rec === 'monthly') return 'Mensile';
    return 'Giornaliera';
  };

  const fetchDati = async () => {
    try {
      const resLists = await fetch('http://localhost:5000/api/lists', { headers: getAuthHeaders() });
      const dataLists = await resLists.json();

      const resTasks = await fetch('http://localhost:5000/api/tasks', { headers: getAuthHeaders() });
      const dataTasks = await resTasks.json();

      if (!Array.isArray(dataLists) || !Array.isArray(dataTasks)) {
        console.error("Il server ha restituito un errore al posto dei dati.");
        return;
      }

      const listeComplete = dataLists.map(lista => ({
        ...lista,
        tasks: dataTasks.filter(task => task.listId === lista._id)
      }));

      setLists(listeComplete);

      // Entra automaticamente nelle stanze socket di tutte le liste caricate
      dataLists.forEach(l => joinList(l._id));
    } catch (error) {
      console.error("Errore di comunicazione", error);
    }
  };

  useEffect(() => {
    fetchDati();
  }, []);

  // Ascolto in tempo reale degli eventi socket
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      setLists(prevLists => prevLists.map(list => {
        if (list._id === newTask.listId) {
          const exists = (list.tasks || []).some(t => t._id === newTask._id);
          if (exists) return list;
          return { ...list, tasks: [...(list.tasks || []), newTask] };
        }
        return list;
      }));
    };

    const handleTaskUpdated = (updatedTask) => {
      setLists(prevLists => prevLists.map(list => {
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
      setLists(prevLists => prevLists.map(list => {
        if (list._id === listId) {
          return {
            ...list,
            tasks: (list.tasks || []).filter(t => t._id !== taskId)
          };
        }
        return list;
      }));
    };

    const handleListShared = (sharedList) => {
      setLists(prevLists => {
        const exists = prevLists.some(l => l._id === sharedList._id);
        if (exists) return prevLists;
        return [...prevLists, { ...sharedList, tasks: [] }];
      });
      joinList(sharedList._id);
    };

    const handleListUnshared = ({ listId }) => {
      leaveList(listId);
      setLists(prevLists => prevLists.filter(l => l._id !== listId));
    };

    const handleListUpdated = (updatedList) => {
      setLists(prevLists => prevLists.map(l => {
        if (l._id === updatedList._id) {
          return {
            ...updatedList,
            tasks: l.tasks || []
          };
        }
        return l;
      }));
    };

    const handleListDeleted = ({ listId }) => {
      leaveList(listId);
      setLists(prevLists => prevLists.filter(l => l._id !== listId));
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_deleted', handleTaskDeleted);
    socket.on('list_shared', handleListShared);
    socket.on('list_unshared', handleListUnshared);
    socket.on('list_updated', handleListUpdated);
    socket.on('list_deleted', handleListDeleted);

    return () => {
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_deleted', handleTaskDeleted);
      socket.off('list_shared', handleListShared);
      socket.off('list_unshared', handleListUnshared);
      socket.off('list_updated', handleListUpdated);
      socket.off('list_deleted', handleListDeleted);
    };
  }, [socket]);

  // Assicura l'iscrizione a tutte le stanze delle liste visualizzate
  useEffect(() => {
    if (socket && lists.length > 0) {
      lists.forEach(l => joinList(l._id));
    }
  }, [lists.length, socket]);

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const response = await fetch('http://localhost:5000/api/lists', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newListName })
      });
      const nuovaLista = await response.json();
      setLists([...lists, { ...nuovaLista, tasks: [] }]);
      joinList(nuovaLista._id);
      setNewListName('');
    } catch (error) {
      console.error("Errore lista", error);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa lista e tutti i suoi task?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/lists/${listId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json();
        return alert(err.message || "Errore durante l'eliminazione");
      }
      leaveList(listId);
      setLists(lists.filter(list => list._id !== listId));
    } catch (error) {
      console.error("Errore eliminazione lista", error);
    }
  };

  // Condividi lista con un altro utente tramite username
  const handleShareList = async (listId) => {
    if (!shareUsername.trim()) return;
    setShareError('');
    try {
      const res = await fetch(`http://localhost:5000/api/lists/${listId}/share`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username: shareUsername.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setShareError(data.message || 'Errore durante la condivisione');
        return;
      }
      setLists(lists.map(l => l._id === listId ? { ...l, users: data.list.users } : l));
      setShareUsername('');
      setShareInputListId(null);
    } catch (error) {
      setShareError('Errore di connessione');
    }
  };

  // Rimuovi utente dalla lista (o abbandona lista)
  const handleRemoveUserFromList = async (listId, userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/lists/${listId}/share/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchDati();
      }
    } catch (error) {
      console.error("Errore rimozione utente", error);
    }
  };

  // Gestione del toggle Preferiti
  const handleToggleFavoriteList = async (listId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/lists/${listId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isFavorite: !currentStatus })
      });
      if (response.ok) {
        const updatedList = await response.json();
        setLists(lists.map(list => 
          list._id === listId ? { ...list, isFavorite: updatedList.isFavorite } : list
        ));
      }
    } catch (error) {
      console.error("Errore aggiornamento preferiti", error);
    }
  };

  const handleTaskInputChange = (listId, text) => {
    setNewTaskTexts({ ...newTaskTexts, [listId]: text });
  };

  const handleAddTask = async (e, listId) => {
    e.preventDefault();
    const text = newTaskTexts[listId];
    if (!text || !text.trim()) return;

    const selectedType = newTaskTypes[listId] || 'simple';
    
    const payload = { 
      title: text, 
      listId: listId, 
      taskType: selectedType 
    };

    if (selectedType === 'calendar') {
      if (!newTaskDates[listId]) return alert("Inserisci una data per la scadenza!");
      payload.targetDate = newTaskDates[listId];
    } else if (selectedType === 'habit') {
      payload.recurrence = newTaskFrequencies[listId] || 'daily'; 
    } else if (selectedType === 'timer') {
      if (!newTaskDurations[listId]) return alert("Inserisci i minuti per il timer!");
      
      payload.timerData = {
        targetMinutes: parseInt(newTaskDurations[listId], 10),
        elapsedSeconds: 0
      };
    }

    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return alert(`Errore server: ${errorData.message || 'Dati non validi'}`);
      }

      const nuovoTask = await response.json();

      setLists(lists.map(list => {
        if (list._id === listId) {
          const alreadyIn = (list.tasks || []).some(t => t._id === nuovoTask._id);
          return alreadyIn ? list : { ...list, tasks: [...(list.tasks || []), nuovoTask] };
        }
        return list;
      }));
      
      setNewTaskTexts({ ...newTaskTexts, [listId]: '' });
      setNewTaskDates({ ...newTaskDates, [listId]: '' });
      setNewTaskDurations({ ...newTaskDurations, [listId]: '' });
      
    } catch (error) {
      console.error("Errore task", error);
    }
  };

  const handleToggleTask = async (listId, taskId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isCompleted: !currentStatus })
      });
      const taskAggiornato = await response.json();
      setLists(lists.map(list => {
        if (list._id === listId) return { ...list, tasks: list.tasks.map(t => t._id === taskId ? taskAggiornato : t) };
        return list;
      }));
    } catch (error) {
      console.error("Errore aggiornamento", error);
    }
  };

  const handleDeleteTask = async (listId, taskId) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, { method: 'DELETE', headers: getAuthHeaders() });
      setLists(lists.map(list => {
        if (list._id === listId) return { ...list, tasks: list.tasks.filter(t => t._id !== taskId) };
        return list;
      }));
    } catch (error) {
      console.error("Errore", error);
    }
  };

  // Ordinamento: le liste preferite vanno in alto
  const sortedLists = [...lists].sort((a, b) => {
    if (a.isFavorite === b.isFavorite) return 0;
    return a.isFavorite ? -1 : 1;
  });

  return (
    <div>
      {/* BARRA SUPERIORE DI TEST E STATO */}
      <RealtimeStatusBar
        label="Stato Real-time:"
        isConnected={isConnected}
        extra={`(Liste caricate: ${lists.length})`}
        onReload={fetchDati}
        reloadLabel="Ricarica Dati"
      />

      <h1 className="h2 fw-bold mb-4">Gestione Liste e Task</h1>

      <Form onSubmit={handleAddList} className="mb-4">
        <InputGroup>
          <Form.Control
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Nome della nuova lista..."
          />
          <Button type="submit" variant="primary" className="fw-semibold">
            Aggiungi Lista
          </Button>
        </InputGroup>
      </Form>

      <Row xs={1} md={2} lg={3} className="g-4">
        {sortedLists?.map(list => {
          const isOwner = list.adminId?.username ? list.adminId.username === currentUsername : true;
          const ownerName = list.adminId?.username || 'Tu';

          return (
            <Col key={list._id}>
              <Card className="h-100 shadow">
                <Card.Body className="d-flex flex-column">

                  {/* HEADER LISTA */}
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        size="sm"
                        variant={list.isFavorite ? 'warning' : 'outline-secondary'}
                        className="fw-bold"
                        onClick={() => handleToggleFavoriteList(list._id, list.isFavorite)}
                        title={list.isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                      >
                        {list.isFavorite ? '[Preferito]' : '[Non preferito]'}
                      </Button>
                      <h2 className="h5 fw-bold mb-0">{list.name}</h2>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {isOwner ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger fw-semibold p-0 text-decoration-none"
                          onClick={() => handleDeleteList(list._id)}
                        >
                          Elimina
                        </Button>
                      ) : (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-warning fw-semibold p-0 text-decoration-none"
                          onClick={() => handleRemoveUserFromList(list._id, 'me')}
                          title="Abbandona questa lista condivisa"
                        >
                          Abbandona
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* BADGE PROPRIETA E COLLABORATORI */}
                  <div className="d-flex flex-wrap align-items-center gap-1 mb-3 small">
                    {isOwner ? (
                      <Badge bg="primary-subtle" text="primary-emphasis" className="fw-medium">[Tua lista]</Badge>
                    ) : (
                      <Badge bg="success-subtle" text="success-emphasis" className="fw-medium">Condivisa da @{ownerName}</Badge>
                    )}

                    {list.users && list.users.length > 0 && (
                      <Badge bg="secondary-subtle" text="secondary-emphasis" className="fw-normal">
                        [Membri: {list.users.map(u => typeof u === 'object' ? u.username : u).join(', ')}]
                      </Badge>
                    )}

                    {/* BOTTONE CONDIVIDI (per il proprietario) */}
                    {isOwner && (
                      <Button
                        variant="link"
                        size="sm"
                        className="ms-auto p-0 fw-semibold"
                        onClick={() => {
                          setShareInputListId(shareInputListId === list._id ? null : list._id);
                          setShareError('');
                        }}
                      >
                        + Condividi
                      </Button>
                    )}
                  </div>

                  {/* FORM INLINE DI CONDIVISIONE */}
                  {shareInputListId === list._id && (
                    <div className="mb-3 p-2 bg-primary-subtle border border-primary-subtle rounded small">
                      <p className="fw-semibold mb-1">Condividi con un altro utente:</p>
                      <InputGroup size="sm">
                        <Form.Control
                          type="text"
                          placeholder="Username utente..."
                          value={shareUsername}
                          onChange={(e) => setShareUsername(e.target.value)}
                        />
                        <Button variant="primary" className="fw-bold" onClick={() => handleShareList(list._id)}>
                          Invia
                        </Button>
                      </InputGroup>
                      {shareError && <p className="text-danger mt-1 mb-0">{shareError}</p>}
                    </div>
                  )}

                  {/* LISTA DEI TASK */}
                  <ListGroup className="flex-grow-1 mb-3">
                    {!list.tasks || list.tasks.length === 0 ? (
                      <ListGroup.Item className="text-muted small fst-italic">Nessun task presente.</ListGroup.Item>
                    ) : (
                      list.tasks.map(task => (
                        <ListGroup.Item key={task._id} className="d-flex justify-content-between align-items-center gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <Form.Check.Input
                              type="checkbox"
                              checked={task.isCompleted || false}
                              onChange={() => handleToggleTask(list._id, task._id, task.isCompleted)}
                              className="mt-0 flex-shrink-0"
                            />

                            <span className={`small d-flex align-items-center flex-wrap gap-1 ${task.isCompleted ? 'text-decoration-line-through text-muted' : ''}`}>
                              {task.title}

                              {task.taskType === 'calendar' && (
                                <Badge bg="primary-subtle" text="primary-emphasis" className="fw-normal">[Scadenza: {formattaData(task.targetDate)}]</Badge>
                              )}
                              {task.taskType === 'timer' && (
                                <Badge bg="warning-subtle" text="warning-emphasis" className="fw-normal">
                                  [Timer: {formattaTimer(task.timerData)} min]
                                </Badge>
                              )}
                              {task.taskType === 'habit' && (
                                <Badge bg="info-subtle" text="info-emphasis" className="fw-normal">
                                  [Abitudine: {getLabelAbitudine(task.recurrence)}]
                                </Badge>
                              )}
                            </span>
                          </div>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger fw-bold p-0 text-decoration-none"
                            onClick={() => handleDeleteTask(list._id, task._id)}
                            title="Elimina task"
                          >
                            X
                          </Button>
                        </ListGroup.Item>
                      ))
                    )}
                  </ListGroup>

                  {/* FORM AGGIUNTA TASK */}
                  <Form onSubmit={(e) => handleAddTask(e, list._id)} className="mt-auto bg-light p-2 rounded border">
                    <Form.Control
                      type="text"
                      size="sm"
                      value={newTaskTexts[list._id] || ''}
                      onChange={(e) => handleTaskInputChange(list._id, e.target.value)}
                      placeholder="Nuovo task..."
                      className="mb-2"
                    />

                    <div className="d-flex flex-wrap gap-2">
                      <Form.Select
                        size="sm"
                        className="flex-grow-1 w-auto"
                        value={newTaskTypes[list._id] || 'simple'}
                        onChange={(e) => setNewTaskTypes({ ...newTaskTypes, [list._id]: e.target.value })}
                      >
                        <option value="simple">Semplice</option>
                        {activeModules?.calendar && <option value="calendar">Scadenza</option>}
                        {activeModules?.timer && <option value="timer">Timer</option>}
                        {activeModules?.habits && <option value="habit">Abitudine</option>}
                      </Form.Select>

                      {newTaskTypes[list._id] === 'calendar' && (
                        <Form.Control
                          type="date"
                          size="sm"
                          style={{ width: 'auto' }}
                          value={newTaskDates[list._id] || ''}
                          onChange={(e) => setNewTaskDates({ ...newTaskDates, [list._id]: e.target.value })}
                        />
                      )}

                      {newTaskTypes[list._id] === 'habit' && (
                        <Form.Select
                          size="sm"
                          style={{ width: 'auto' }}
                          value={newTaskFrequencies[list._id] || 'daily'}
                          onChange={(e) => setNewTaskFrequencies({ ...newTaskFrequencies, [list._id]: e.target.value })}
                        >
                          <option value="daily">Giornaliera</option>
                          <option value="weekly">Settimanale</option>
                          <option value="monthly">Mensile</option>
                        </Form.Select>
                      )}

                      {newTaskTypes[list._id] === 'timer' && (
                        <Form.Control
                          type="number"
                          size="sm"
                          min="1"
                          placeholder="Min"
                          style={{ width: 70 }}
                          value={newTaskDurations[list._id] || ''}
                          onChange={(e) => setNewTaskDurations({ ...newTaskDurations, [list._id]: e.target.value })}
                        />
                      )}

                      <Button type="submit" variant="success" size="sm" className="fw-bold px-3">
                        +
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
