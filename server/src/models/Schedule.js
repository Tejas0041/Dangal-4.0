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
      tacklePoints: { type: Number, default: 0 },
      bonusPoints: { type: Number, default: 0 },
      allOutPoints: { type: Number, default: 0 },
      extraPoints: { type: Number, default: 0 }
    },
    teamBScore: {
      raidPoints: { type: Number, default: 0 },
      tacklePoints: { type: Number, default: 0 },
      bonusPoints: { type: Number, default: 0 },
      allOutPoints: { type: Number, default: 0 },
      extraPoints: { type: Number, default: 0 }
    },
    // Table Tennis specific scoring
    tableTennis: {
      games: [{
        type: { 
          type: String, 
          enum: ['Single', 'Double'],
          required: true 
        },
        teamAScore: { type: Number, default: 0 },
        teamBScore: { type: Number, default: 0 },
        maxScore: { type: Number, default: 11 }, // 11 for Single, 15 for Double
        winner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Team'
        }
       }],
      gamesWonA: { type: Number, default: 0 },
      gamesWonB: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('Schedule', scheduleSchema);
