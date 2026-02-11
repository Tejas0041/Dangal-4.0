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
  matchType: {
    type: String,
    enum: ['Singles', 'Doubles']
  },
  round: {
    type: String,
    enum: ['League Stage', 'Semi Final', 'Final'],
    default: 'League Stage'
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
    scoreB: Number,
    teamAScore: {
      raidPoints: { type: Number, default: 0 },
      bonusPoints: { type: Number, default: 0 },
      allOutPoints: { type: Number, default: 0 },
      extraPoints: { type: Number, default: 0 }
    },
    teamBScore: {
      raidPoints: { type: Number, default: 0 },
      bonusPoints: { type: Number, default: 0 },
      allOutPoints: { type: Number, default: 0 },
      extraPoints: { type: Number, default: 0 }
    },
    // Table Tennis specific scoring
    tableTennis: {
      sets: [{
        teamAScore: { type: Number, default: 0 },
        teamBScore: { type: Number, default: 0 },
        winner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Team'
        }
      }],
      setsWonA: { type: Number, default: 0 },
      setsWonB: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('Schedule', scheduleSchema);
