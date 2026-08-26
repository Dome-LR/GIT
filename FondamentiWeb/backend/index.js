// 1. IMPORTAZIONE DEI MODULI
require('dotenv').config(); // Legge le variabili segrete dal file .env
const express = require('express'); // Il framework per creare il server
const mongoose = require('mongoose'); // Il ponte tra il server e MongoDB
const cors = require('cors'); // Permette al frontend di comunicare col backend senza essere bloccato

// 2. INIZIALIZZAZIONE
const app = express();
const PORT = process.env.PORT || 5000;

// 3. MIDDLEWARE GLOBALI
app.use(cors()); // Abilita le richieste da altri domini (es. il frontend React)
app.use(express.json()); // Permette al server di capire i dati in formato JSON che riceverà

const authRoutes = require('./routes/auth');
const listRoutes = require('./routes/lists');
const taskRoutes = require('./routes/tasks');
const groupRoutes = require('./routes/groups');

app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupRoutes);
// 4. CONNESSIONE AL DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connesso a MongoDB Atlas con successo!');
  })
  .catch((errore) => {
    console.error('Errore critico di connessione al database:', errore);
  });

// 5. ROTTA DI TEST (Per vedere se il server risponde)
app.get('/', (req, res) => {
  res.send('Il server backend è acceso e funzionante!');
});

// 6. AVVIO DEL SERVER
app.listen(PORT, () => {
  console.log(`Il server è in ascolto sulla porta http://localhost:${PORT}`);
});