const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  listId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'List',
    required: true 
  },
  
  taskType: { 
    type: String, 
    enum: ['simple', 'timer', 'periodic'], 
    default: 'simple' 
  },
  
  targetDate: { 
    type: Date, 
    required: false 
  },
  
  isCompleted: { 
    type: Boolean, 
    default: false 
  },
  completedAt: { 
    type: Date, 
    default: null 
  }, 
  
  recurrence: {
    frequency: { 
      type: String, 
      enum: ['none', 'daily', 'weekly', 'monthly'], 
      default: 'none' 
    }
  },

  timerData: {
    targetMinutes: { type: Number, default: 0 },
    elapsedSeconds: { type: Number, default: 0 } // Utile per fermare e riprendere il timer
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Task', taskSchema);