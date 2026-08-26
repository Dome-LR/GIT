const express = require('express');
const Task = require('../models/Task');
const List = require('../models/List'); // <-- IMPORTANTE: Ci serve il modello List!
const verifyToken = require('../middleware/autentication');

const router = express.Router();

// ==========================================
// API 1: OTTIENI I TASK (GET /api/tasks)
// ==========================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const { listId, date, isCompleted } = req.query;
    
    // NUOVA LOGICA DI LETTURA:
    // 1. Troviamo prima tutte le liste che appartengono al gruppo dell'utente
    const userLists = await List.find({ groupId: req.user.groupId });
    
    // 2. Estraiamo solo gli ID di queste liste
    const userListIds = userLists.map(list => list._id);

    // 3. Diciamo al database: "Cerca i task la cui listId è INCLUSA tra quelle dell'utente"
    let query = { listId: { $in: userListIds } };

    if (listId) {
      // Sicurezza extra: se l'utente richiede una lista specifica, 
      // verifichiamo che faccia parte del suo gruppo
      if (!userListIds.some(id => id.toString() === listId)) {
        return res.status(403).json({ message: 'Accesso negato a questa lista' });
      }
      query.listId = listId;
    }
    
    if (isCompleted !== undefined) query.isCompleted = isCompleted === 'true';
    
    if (date === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      query.targetDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const tasks = await Task.find(query).sort({ targetDate: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei task', error: error.message });
  }
});

// ==========================================
// API 2: CREA UN NUOVO TASK (POST /api/tasks)
// ==========================================
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, listId, taskType, targetDate, recurrence, timerData } = req.body;

    // NUOVA LOGICA DI CREAZIONE:
    // Dobbiamo assicurarci che la lista in cui vogliamo inserire il task appartenga a noi
    const targetList = await List.findOne({ _id: listId, groupId: req.user.groupId });
    
    if (!targetList) {
      return res.status(403).json({ message: 'La lista specificata non esiste o non appartiene al tuo gruppo' });
    }

    const newTask = new Task({
      title,
      listId,
      // groupId non c'è più! Il task è "figlio" della lista, che è "figlia" del gruppo.
      taskType: taskType || 'simple',
      targetDate,
      recurrence,
      timerData
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione del task', error: error.message });
  }
});

// ==========================================
// API 3: MODIFICA GENERICA E COMPLETAMENTO (PATCH /api/tasks/:id)
// ==========================================
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;

    // NUOVA LOGICA DI MODIFICA:
    // 1. Troviamo il task e diciamo a Mongoose di "popolare" i dati della lista associata
    const taskToUpdate = await Task.findById(taskId).populate('listId');

    // 2. Controlliamo l'esistenza del task e verifichiamo la sicurezza sulla sua lista genitore
    if (!taskToUpdate) {
      return res.status(404).json({ message: 'Task non trovato' });
    }
    if (taskToUpdate.listId.groupId !== req.user.groupId) {
      return res.status(403).json({ message: 'Non autorizzato a modificare questo task' });
    }

    if (updates.isCompleted === true) {
      updates.completedAt = new Date();
    } else if (updates.isCompleted === false) {
      updates.completedAt = null;
    }

    // 3. Ora che sappiamo che è sicuro, facciamo l'aggiornamento
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId }, // Non serve più il groupId qui
      updates,
      { returnDocument: 'after' }
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella modifica del task', error: error.message });
  }
});

// ==========================================
// API 4: ELIMINA TASK (DELETE /api/tasks/:id)
// ==========================================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Stessa logica della PATCH per la sicurezza
    const taskToDelete = await Task.findById(req.params.id).populate('listId');

    if (!taskToDelete) {
      return res.status(404).json({ message: 'Task non trovato' });
    }
    if (taskToDelete.listId.groupId !== req.user.groupId) {
      return res.status(403).json({ message: 'Non autorizzato a eliminare questo task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione del task', error: error.message });
  }
});

module.exports = router;