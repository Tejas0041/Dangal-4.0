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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('EventSettings', eventSettingsSchema);
