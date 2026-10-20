import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Card, Badge, Button, ButtonGroup, Form, Row, Col, Table, ProgressBar } from 'react-bootstrap';
import RealtimeStatusBar from './RealtimeStatusBar';

export default function HabitTrackerPage() {
  const { socket, isConnected, joinList, leaveList } = useSocket();

  // Data di riferimento per scorrere i mesi
  const [referenceDate, setReferenceDate] = useState(new Date());
  
  const currentYear = referenceDate.getFullYear();
  const currentMonthIndex = referenceDate.getMonth();
  
  const currentMonthName = referenceDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Stati
  const [habits, setHabits] = useState([]);
  const [lists, setLists] = useState([]);
  
  // Stati del form
  const [newTitle, setNewTitle] = useState('');
  const [newListId, setNewListId] = useState('');
  const [newRecurrence, setNewRecurrence] = useState('daily');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetchDati = async () => {
    try {
      const [resLists, resHabits] = await Promise.all([
        fetch('http://localhost:5000/api/lists', { headers: getAuthHeaders() }),
        fetch('http://localhost:5000/api/tasks/habits', { headers: getAuthHeaders() })
      ]);

      if (resLists.ok && resHabits.ok) {
        const dataLists = await resLists.json();
        const dataHabits = await resHabits.json();
        
        setLists(dataLists);
        if (dataLists.length > 0 && !newListId) setNewListId(dataLists[0]._id);

        setHabits(dataHabits.map(h => ({ ...h, completedDates: h.completedDates || [] })));

        // Unisciti alle stanze socket
        dataLists.forEach(l => joinList(l._id));
      }
    } catch (error) {
      console.error("Errore caricamento tracker", error);
    }
  };

  useEffect(() => {
    fetchDati();
  }, []);

  // Ascolto eventi Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      if (newTask.taskType === 'habit') {
        const listaTrovata = lists.find(l => l._id === newTask.listId);
        const enriched = { 
          ...newTask, 
          listId: listaTrovata || newTask.listId, 
          completedDates: newTask.completedDates || [] 
        };
        setHabits(prev => {
          const exists = prev.some(h => h._id === newTask._id);
          return exists ? prev : [...prev, enriched];
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      if (updatedTask.taskType === 'habit') {
        setHabits(prev => prev.map(h => {
          if (h._id === updatedTask._id) {
            return {
              ...h,
              ...updatedTask,
              completedDates: updatedTask.completedDates || h.completedDates || []
            };
          }
          return h;
        }));
      }
    };

    const handleTaskDeleted = ({ taskId }) => {
      setHabits(prev => prev.filter(h => h._id !== taskId));
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

  // Assicura l'iscrizione alle stanze delle liste per le abitudini
  useEffect(() => {
    if (socket && lists.length > 0) {
      lists.forEach(l => joinList(l._id));
    }
  }, [lists.length, socket]);

  // Navigazione mesi
  const spostaMese = (direzione) => {
    const nuovaData = new Date(referenceDate);
    nuovaData.setMonth(nuovaData.getMonth() + direzione);
    setReferenceDate(nuovaData);
  };

  const vaiAdOggi = () => {
    setReferenceDate(new Date());
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newListId) return;

    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newTitle,
          listId: newListId,
          taskType: 'habit',
          recurrence: newRecurrence,
          completedDates: [] 
        })
      });

      if (response.ok) {
        const nuovoTask = await response.json();
        const listaTrovata = lists.find(l => l._id === newListId);
        nuovoTask.listId = listaTrovata;
        nuovoTask.completedDates = [];
        
        setHabits(prev => [...prev, nuovoTask]);
        setNewTitle('');
      }
    } catch (error) {
      console.error("Errore creazione", error);
    }
  };

  const toggleDay = async (habit, dayNumber) => {
    const dateString = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const isCompleted = habit.completedDates.includes(dateString);
    
    const newCompletedDates = isCompleted
      ? habit.completedDates.filter(d => d !== dateString)
      : [...habit.completedDates, dateString];

    setHabits(habits.map(h => h._id === habit._id ? { ...h, completedDates: newCompletedDates } : h));

    try {
      await fetch(`http://localhost:5000/api/tasks/${habit._id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ completedDates: newCompletedDates })
      });
    } catch (error) {
      console.error("Errore aggiornamento data", error);
    }
  };

  const handleToggleHabitCompletion = async (habit) => {
    const newStatus = !habit.isCompleted;
    setHabits(habits.map(h => h._id === habit._id ? { ...h, isCompleted: newStatus } : h));

    try {
      await fetch(`http://localhost:5000/api/tasks/${habit._id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isCompleted: newStatus })
      });
    } catch (error) {
      console.error("Errore completamento abitudine", error);
    }
  };

  const deleteHabit = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setHabits(habits.filter(h => h._id !== id));
    } catch (error) {
      console.error("Errore eliminazione", error);
    }
  };

  const calculateProgress = (habit) => {
    const currentMonthPrefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
    const spunteMensili = (habit.completedDates || []).filter(d => d.startsWith(currentMonthPrefix)).length;

    let target = daysInMonth; 
    if (habit.recurrence === 'weekly') target = 4; 
    if (habit.recurrence === 'monthly') target = 1; 

    const percentuale = Math.min(100, Math.round((spunteMensili / target) * 100));
    return { percentuale, spunteMensili, target };
  };

  const traduciRecurrence = (rec) => {
    if (rec === 'weekly') return 'Settimanale';
    if (rec === 'monthly') return 'Mensile';
    return 'Giornaliera';
  };

  return (
    <div>
      {/* BARRA STATO REALTIME */}
      <RealtimeStatusBar
        label="Real-time Abitudini:"
        isConnected={isConnected}
        onReload={fetchDati}
        reloadLabel="Ricarica Abitudini"
      />

      {/* SEZIONE HEADER CON SELETTORE MESE */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-4">
        <h1 className="h2 fw-bold mb-0">Tracker Abitudini</h1>

        <ButtonGroup>
          <Button variant="outline-secondary" className="fw-bold" onClick={() => spostaMese(-1)}>
            &lt;&lt;
          </Button>

          <Button variant="outline-primary" className="fw-bold text-capitalize" style={{ minWidth: 160 }} onClick={vaiAdOggi}>
            {currentMonthName}
          </Button>

          <Button variant="outline-secondary" className="fw-bold" onClick={() => spostaMese(1)}>
            &gt;&gt;
          </Button>
        </ButtonGroup>
      </div>

      {/* FORM DI AGGIUNTA */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={handleAddHabit}>
            <Row className="g-2">
              <Col md>
                <Form.Control
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nuova abitudine da monitorare..."
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
                <Form.Select value={newRecurrence} onChange={(e) => setNewRecurrence(e.target.value)}>
                  <option value="daily">Giornaliera</option>
                  <option value="weekly">Settimanale</option>
                  <option value="monthly">Mensile</option>
                </Form.Select>
              </Col>

              <Col md="auto">
                <Button type="submit" variant="primary" className="w-100 fw-semibold">
                  Aggiungi
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* GRIGLIA ABITUDINI */}
      <Card className="shadow-sm">
        <Table responsive bordered hover className="mb-0 align-middle">
          <thead>
            <tr>
              <th className="table-light p-3" style={{ minWidth: 280 }}>Abitudine</th>
              {daysArray.map(day => (
                <th key={day} className="table-light text-center small fw-semibold" style={{ width: 40 }}>
                  {day}
                </th>
              ))}
              <th className="table-light text-center small fw-semibold p-3">Progresso</th>
              <th className="table-light"></th>
            </tr>
          </thead>
          <tbody>
            {habits.map(habit => {
              const { percentuale, spunteMensili, target } = calculateProgress(habit);

              return (
                <tr key={habit._id} className={habit.isCompleted ? 'table-light opacity-75' : ''}>

                  {/* Cella Titolo e Info */}
                  <td className="p-3">
                    <div className="d-flex align-items-start gap-3">
                      <Form.Check.Input
                        type="checkbox"
                        checked={habit.isCompleted || false}
                        onChange={() => handleToggleHabitCompletion(habit)}
                        className="mt-1 flex-shrink-0"
                      />
                      <div className="d-flex flex-column">
                        <span className={`fw-bold ${habit.isCompleted ? 'text-muted text-decoration-line-through' : ''}`}>
                          {habit.title}
                        </span>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          <Badge bg="secondary-subtle" text="secondary-emphasis" className="fw-normal">
                            [Lista: {habit.listId?.name || 'Lista'}]
                          </Badge>
                          <Badge bg="info-subtle" text="info-emphasis" className="fw-semibold">
                            [Abitudine: {traduciRecurrence(habit.recurrence)}]
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Celle dei Giorni */}
                  {daysArray.map(day => {
                    const dateString = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isDone = (habit.completedDates || []).includes(dateString);

                    return (
                      <td key={day} className="p-1 text-center" role="button" onClick={() => toggleDay(habit, day)}>
                        <div
                          className={`mx-auto rounded d-flex align-items-center justify-content-center small fw-bold ${isDone ? 'bg-success text-white' : 'bg-secondary-subtle'}`}
                          style={{ width: 28, height: 28 }}
                        >
                          {isDone ? 'OK' : ''}
                        </div>
                      </td>
                    );
                  })}

                  {/* Cella Progresso */}
                  <td className="p-3 text-center">
                    <div className="d-flex flex-column align-items-center">
                      <span className={`small fw-bold ${percentuale >= 100 ? 'text-success' : ''}`}>
                        {percentuale}%
                      </span>
                      <ProgressBar
                        now={percentuale}
                        variant={percentuale >= 100 ? 'success' : 'primary'}
                        className="mt-1"
                        style={{ width: 64, height: 8 }}
                      />
                      <span className="text-muted text-uppercase mt-1" style={{ fontSize: '0.6rem' }}>
                        {spunteMensili} / {target}
                      </span>
                    </div>
                  </td>

                  {/* Cella Elimina */}
                  <td className="p-3 text-center">
                    <Button variant="outline-danger" size="sm" className="fw-bold" onClick={() => deleteHabit(habit._id)}>
                      X
                    </Button>
                  </td>
                </tr>
              );
            })}

            {habits.length === 0 && (
              <tr>
                <td colSpan={daysInMonth + 3} className="p-5 text-center text-muted fst-italic">
                  Nessuna abitudine inserita. Inizia a costruire una nuova routine!
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
