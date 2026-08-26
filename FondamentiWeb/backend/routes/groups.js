const express = require('express');
const User = require('../models/User'); // Ci serve il modello Utente per cercare i membri
const verifyToken = require('../middleware/autentication'); 

const router = express.Router();

// ==========================================
// API: OTTIENI I MEMBRI DEL GRUPPO (GET /api/groups/members)
// ==========================================
router.get('/members', verifyToken, async (req, res) => {
  try {
    // 1. Leggiamo il gruppo dell'utente connesso (direttamente dal suo token sicuro)
    const currentGroupId = req.user.groupId;

    // 2. Cerchiamo nel database tutti gli utenti che hanno quello stesso groupId.
    // L'istruzione .select('username _id') assicura che il backend invii SOLO i nomi e gli ID, 
    // nascondendo in automatico le password e i dati sensibili.
    const members = await User.find({ groupId: currentGroupId }).select('username _id');

    // Se non ci sono membri (impossibile perché ci deve essere almeno chi fa la richiesta), gestiamo l'errore
    if (!members) {
      return res.status(404).json({ message: 'Nessun membro trovato per questo gruppo' });
    }

    // 3. Inviamo la lista dei colleghi al frontend
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei membri del gruppo', error: error.message });
  }
});

module.exports = router;