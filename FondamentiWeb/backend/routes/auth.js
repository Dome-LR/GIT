const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importiamo lo schema creato prima

const router = express.Router();

// ==========================================
// API 1: REGISTRAZIONE (POST /api/auth/register)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { username, password, groupId } = req.body;

    // 1. Controllo se l'utente esiste già
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Nome utente già in uso' });
    }

    // 2. Sicurezza: Criptiamo la password
    // Il "salt" (10) aggiunge casualità per evitare attacchi hacker
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Creiamo l'utente con la password nascosta
    const newUser = new User({
      username,
      password: hashedPassword,
      groupId
    });

    await newUser.save();
    res.status(201).json({ message: 'Utente registrato con successo!' });
    
  } catch (error) {
    res.status(500).json({ message: 'Errore interno del server', error: error.message });
  }
});

// ==========================================
// API 2: LOGIN (POST /api/auth/login)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Cerchiamo l'utente
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // 2. Verifichiamo la password confrontandola con l'hash salvato
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password errata' });
    }

    // 3. Generiamo il Token JWT
    // Mettiamo nel token l'ID e il Gruppo: così le prossime API sapranno in automatico in che gruppo si trova!
    const token = jwt.sign(
      { userId: user._id, groupId: user.groupId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' } // Il token scade dopo 24 ore per sicurezza
    );

    // 4. Risposta al frontend (che salverà il token per usarlo)
    res.status(200).json({
      message: 'Login effettuato con successo',
      token,
      user: {
        id: user._id,
        username: user.username,
        groupId: user.groupId
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Errore interno del server', error: error.message });
  }
});

module.exports = router;