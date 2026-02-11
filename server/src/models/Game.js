import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  icon: {
    type: String, // 64x64px icon URL
    default: ''
  },
  rulebook: {
    type: String, // PDF URL
    required: true
  },
  registrationAmount: {
    type: Number,
    required: true
  },
  minPlayersPerTeam: {
    type: Number,
    required: true
  },
  maxPlayersPerTeam: {
    type: Number,
    required: true
  },
  maxTeams: {
    type: Number,
    required: true
  },
  qrCodeImage: {
    type: String, // QR code image URL
    required: true
  },
  venue: {
    type: String,
    default: ''
  },
  dateTime: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Game', gameSchema);
