import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  categoryId: { type: String, required: true },
  categoryName: { type: String, required: true },
  type: { type: String, required: true, enum: ['Cr', 'Dr'] },
  amount: { type: Number, required: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Transaction', TransactionSchema);
