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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('EventSettings', eventSettingsSchema);
