const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['standard', 'habit'],
    default: 'standard' 
  },
  isFavorite: { 
    type: Boolean, 
    default: false 
  },
  groupId: { 
    type: String, 
    required: true // Solo gli utenti con questo groupId potranno vedere la lista
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('List', listSchema);