import mongoose from 'mongoose';

const CodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  usedBy: { type: String, default: null },
  usedAt: { type: Date, default: null },
});

// Aby Next.js nevytvářel model víckrát při HMR:
export default mongoose.models.Code || mongoose.model('Code', CodeSchema);