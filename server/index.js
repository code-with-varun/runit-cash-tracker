import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Category from './models/Category.js';
import Transaction from './models/Transaction.js';
import Settings from './models/Settings.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashtracker';

app.use(cors());
app.use(express.json());

// Initial Seed Data
const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: 'Salary', type: 'Cr' },
  { id: 'cat_2', name: 'Freelance & Consulting', type: 'Cr' },
  { id: 'cat_3', name: 'Investments & Returns', type: 'Cr' },
  { id: 'cat_4', name: 'Rental Income', type: 'Cr' },
  { id: 'cat_5', name: 'Food & Dining', type: 'Dr' },
  { id: 'cat_6', name: 'Rent & Housing', type: 'Dr' },
  { id: 'cat_7', name: 'Utilities & Bills', type: 'Dr' },
  { id: 'cat_8', name: 'Shopping & Electronics', type: 'Dr' },
  { id: 'cat_9', name: 'Transportation & Fuel', type: 'Dr' },
  { id: 'cat_10', name: 'Healthcare & Insurance', type: 'Dr' },
  { id: 'cat_11', name: 'Entertainment & Leisure', type: 'Dr' },
];

const todayStr = new Date().toISOString().slice(0, 10);
const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx_101',
    date: todayStr,
    categoryId: 'cat_1',
    categoryName: 'Salary',
    type: 'Cr',
    amount: 75000.0,
    notes: 'Monthly salary credited',
  },
  {
    id: 'tx_102',
    date: todayStr,
    categoryId: 'cat_6',
    categoryName: 'Rent & Housing',
    type: 'Dr',
    amount: 22000.0,
    notes: 'Apartment monthly rent',
  },
  {
    id: 'tx_103',
    date: todayStr,
    categoryId: 'cat_5',
    categoryName: 'Food & Dining',
    type: 'Dr',
    amount: 1450.0,
    notes: 'Grocery store restocking',
  },
];

// Database Connection & Seeding
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB Atlas / Database: ${mongoose.connection.name}`);

    // Seed default categories if empty
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log('Seeded default categories to MongoDB Atlas');
    }

    // Seed default transactions if empty
    const txCount = await Transaction.countDocuments();
    if (txCount === 0) {
      await Transaction.insertMany(DEFAULT_TRANSACTIONS);
      console.log('Seeded default transactions to MongoDB Atlas');
    }
  } catch (err) {
    console.error('MongoDB Atlas Connection Error:', err.message);
    console.log('Running server with memory fallback until MongoDB URI is configured in .env');
  }
}

connectDB();

// API Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    message: 'Cash Tracker Express API is running',
  });
});

// Authentication Endpoints (MongoDB Atlas User Sync)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, password } = req.body;
    const trimmedUsername = String(username).trim().toLowerCase();

    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.json({ success: false, error: 'Username is already registered.' });
    }

    const newUser = new User({
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: String(name).trim(),
      username: trimmedUsername,
      password: String(password),
    });

    await newUser.save();
    res.status(201).json({ success: true, user: { id: newUser.id, name: newUser.name, username: newUser.username } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const trimmedUsername = String(username).trim().toLowerCase();

    const user = await User.findOne({ username: trimmedUsername, password: String(password) });
    if (!user) {
      return res.json({ success: false, error: 'Invalid username or password.' });
    }

    res.json({ success: true, user: { id: user.id, name: user.name, username: user.username } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Category Endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, type } = req.body;
    const newCat = new Category({
      id: `cat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      type,
    });
    await newCat.save();
    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories/bulk', async (req, res) => {
  try {
    const categories = req.body; // Array of categories
    const results = [];
    for (const cat of categories) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        const newCat = new Category({
          id: `cat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: cat.name,
          type: cat.type,
        });
        await newCat.save();
        results.push(newCat);
      }
    }
    res.status(201).json({ message: 'Bulk categories added', added: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await Category.deleteOne({ id: req.params.id });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transaction Endpoints
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { date, categoryId, categoryName, type, amount, notes } = req.body;
    const newTx = new Transaction({
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      date,
      categoryId,
      categoryName,
      type,
      amount,
      notes: notes || '',
    });
    await newTx.save();
    res.status(201).json(newTx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions/bulk', async (req, res) => {
  try {
    const transactionsList = req.body;
    const formatted = transactionsList.map((tx, idx) => ({
      id: `tx_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
      date: tx.date,
      categoryId: tx.categoryId,
      categoryName: tx.categoryName,
      type: tx.type,
      amount: tx.amount,
      notes: tx.notes || '',
    }));

    await Transaction.insertMany(formatted);
    res.status(201).json({ message: 'Bulk transactions inserted', count: formatted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const updated = await Transaction.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await Transaction.deleteOne({ id: req.params.id });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings & PIN Endpoints
app.get('/api/settings/pin', async (req, res) => {
  try {
    const doc = await Settings.findOne({ key: 'security_pin' });
    res.json({ pin: doc ? doc.value : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/pin', async (req, res) => {
  try {
    const { pin } = req.body;
    await Settings.findOneAndUpdate(
      { key: 'security_pin' },
      { value: pin },
      { upsert: true, new: true }
    );
    res.json({ message: 'PIN updated', pin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    await Category.deleteMany({});
    await Transaction.deleteMany({});
    await Category.insertMany(DEFAULT_CATEGORIES);
    await Transaction.insertMany(DEFAULT_TRANSACTIONS);
    res.json({ message: 'Reset to default sample data' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cash Tracker Express Server listening on http://0.0.0.0:${PORT}`);
});
