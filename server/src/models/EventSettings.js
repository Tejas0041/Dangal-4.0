import mongoose from 'mongoose';

const eventSettingsSchema = new mongoose.Schema(
  {
    eventDate: {
      type: Date,
      required: true,
    },
    eventName: {
      type: String,
      default: 'Dangal 4.0',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    registrationOpen: {
      type: Boolean,
      default: false,
    },
    matchesVisible: {
      type: Boolean,
      default: false,
    },
    scoresVisible: {
      type: Boolean,
      default: false,
    },
    kabaddiTimerRate: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('EventSettings', eventSettingsSchema);
