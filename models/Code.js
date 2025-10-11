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

// Explicitní indexy pro rychlé vyhledávání
CodeSchema.index({ code: 1 }); // Index na code
CodeSchema.index({ used: 1, isUsed: 1 }); // Compound index pro hledání nepoužitých kódů
CodeSchema.index({ shopifyOrderId: 1 }); // Index na Shopify objednávky

// Aby Next.js nevytvářel model víckrát při HMR:
export default mongoose.models.Code || mongoose.model('Code', CodeSchema);