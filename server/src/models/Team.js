import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: true
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  secondTeamName: {
    type: String,
    trim: true,
    default: ''
  },
  players: [{
    name: {
      type: String,
      required: true,
      trim: true
    }
  }],
  paymentScreenshot: {
    type: String,
    required: true
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique team names per game per hall
teamSchema.index({ hallId: 1, gameId: 1, teamName: 1 }, { unique: true });

export default mongoose.model('Team', teamSchema);
