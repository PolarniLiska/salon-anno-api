import mongoose from 'mongoose';

const CodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false }, // Zachováváme pro zpětnou kompatibilitu
  isUsed: { type: Boolean, default: false }, // Nový název pro konzistenci
  usedBy: { type: String, default: null },
  usedAt: { type: Date, default: null },
  // Nová pole pro Shopify integraci
  shopifyOrderId: { type: String, default: null },
  customerEmail: { type: String, default: null },
  assignedAt: { type: Date, default: null },
}, {
  timestamps: true // Automaticky přidá createdAt a updatedAt
});

// Aby Next.js nevytvářel model víckrát při HMR:
export default mongoose.models.Code || mongoose.model('Code', CodeSchema);