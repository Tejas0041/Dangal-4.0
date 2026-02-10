import mongoose from 'mongoose';

const hallSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['boys', 'girls'],
    required: true
  },
  image: {
    type: String,
    default: null
  },
  jmcr: {
    name: {
      type: String,
      default: ''
    },
    gsuite: {
      type: String,
      default: '',
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty string
          return /^[a-zA-Z0-9._-]+@students\.iiests\.ac\.in$/.test(v);
        },
        message: 'GSuite email must be in format: username@students.iiests.ac.in'
      }
    },
    contact: {
      type: String,
      default: '',
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty string
          return /^[0-9]{10}$/.test(v);
        },
        message: 'Contact must be a 10-digit number'
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Hall', hallSchema);
