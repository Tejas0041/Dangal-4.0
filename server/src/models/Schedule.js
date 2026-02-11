import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  matchNumber: {
    type: Number,
    required: true,
    unique: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  teamA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  teamB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  round: {
    type: String,
    enum: ['Preliminary', 'Quarter Final', 'Semi Final', 'Final'],
    default: 'Preliminary'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Live', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  result: {
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    scoreA: Number,
    scoreB: Number
  }
}, {
  timestamps: true
});

export default mongoose.model('Schedule', scheduleSchema);
