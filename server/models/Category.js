import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['Cr', 'Dr'] },
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);
