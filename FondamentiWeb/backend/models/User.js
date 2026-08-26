const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true
  },
  groupId: {
    type: String,
    required: true
  }
}, { 
  timestamps: true // Aggiunge in automatico "createdAt" e "updatedAt"
});

// Esportiamo il modello per poterlo usare nelle API
module.exports = mongoose.model('User', userSchema);