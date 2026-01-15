const express = require('express');
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Semua route butuh autentikasi
router.use(authMiddleware);

// Get semua transaksi user
router.get('/', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [req.userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get summary (total income, expense, balance)
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
      FROM transactions
      WHERE user_id = ?
    `;
    
    const params = [req.userId];
    
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Tambah transaksi
router.post('/', async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;

    if (!type || !amount || !category || !date) {
      return res.status(400).json({ error: 'Field wajib harus diisi' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type harus income atau expense' });
    }

    const [result] = await pool.query(
      'INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, type, amount, category, description || '', date]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: req.userId,
      type,
      amount,
      category,
      description,
      date
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update transaksi
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;

    // Cek ownership
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    await pool.query(
      'UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
      [type, amount, category, description, date, id, req.userId]
    );

    res.json({
      id,
      user_id: req.userId,
      type,
      amount,
      category,
      description,
      date
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hapus transaksi
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
