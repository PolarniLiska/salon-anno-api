import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  activated: { type: Boolean, default: false },
  activationCode: { type: String, default: null },

  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);