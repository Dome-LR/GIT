const express = require('express');
const List = require('../models/List');
const verifyToken = require('../middleware/autentication'); // Importiamo il nostro buttafuori

const router = express.Router();

// ==========================================
// API 1: OTTIENI LE LISTE DEL GRUPPO (GET /api/lists)
// ==========================================
// Inserendo 'verifyToken' come secondo parametro, proteggiamo la rotta!
router.get('/', verifyToken, async (req, res) => {
  try {
    // Il backend sa a quale gruppo appartiene l'utente leggendo il token!
    const userGroupId = req.user.groupId; 
    
    // Cerchiamo solo le liste di quel gruppo
    const lists = await List.find({ groupId: userGroupId });
    
    res.status(200).json(lists);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle liste', error: error.message });
  }
});

// ==========================================
// API 2: CREA UNA NUOVA LISTA (POST /api/lists)
// ==========================================
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, type } = req.body;

    // Creiamo la lista assegnandola forzatamente al gruppo dell'utente connesso
    const newList = new List({
      name,
      type: type || 'standard',
      groupId: req.user.groupId // Iniezione sicura dal token
    });

    const savedList = await newList.save();
    res.status(201).json(savedList);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione della lista', error: error.message });
  }
});

// ==========================================
// API 3: MODIFICA GENERICA DI UNA LISTA (PATCH /api/lists/:id)
// ==========================================
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const listId = req.params.id;
    const updates = req.body; // Prende qualsiasi campo inviato (es. { "isFavorite": true })

    // Troviamo la lista e la aggiorniamo, assicurandoci che appartenga al gruppo giusto
    const updatedList = await List.findOneAndUpdate(
      { _id: listId, groupId: req.user.groupId }, // Doppio filtro di sicurezza
      updates,
      { new: true } // Restituisce il documento aggiornato
    );

    if (!updatedList) {
      return res.status(404).json({ message: 'Lista non trovata o non autorizzata' });
    }

    res.status(200).json(updatedList);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella modifica della lista', error: error.message });
  }
});

module.exports = router;