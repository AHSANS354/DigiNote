const express = require('express');
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Semua route butuh autentikasi
router.use(authMiddleware);

// Get summary (total income, expense, balance) - MUST be before /:id route
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
      query += ' AND transaction_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND transaction_date <= ?';
      params.push(endDate);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get semua transaksi user
router.get('/', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon 
      FROM transactions t 
      LEFT JOIN categories c ON t.category_id = c.id 
      WHERE t.user_id = ?
    `;
    const params = [req.userId];

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    if (startDate) {
      query += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Tambah transaksi
router.post('/', async (req, res) => {
  try {
    const { type, amount, category_id, description, date } = req.body;
    
    console.log('Request body:', req.body);
    console.log('Parsed values:', { type, amount, category_id, description, date });

    if (!type || !amount || !category_id || !date) {
      console.log('Missing fields - type:', !!type, 'amount:', !!amount, 'category_id:', !!category_id, 'date:', !!date);
      return res.status(400).json({ error: 'Field wajib harus diisi' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type harus income atau expense' });
    }

    const [result] = await pool.query(
      'INSERT INTO transactions (user_id, type, amount, category_id, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, type, amount, category_id, description || '', date]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: req.userId,
      type,
      amount,
      category_id,
      description,
      transaction_date: date
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
    const { type, amount, category_id, description, date } = req.body;

    // Cek ownership
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    await pool.query(
      'UPDATE transactions SET type = ?, amount = ?, category_id = ?, description = ?, transaction_date = ? WHERE id = ? AND user_id = ?',
      [type, amount, category_id, description, date, id, req.userId]
    );

    res.json({
      id,
      user_id: req.userId,
      type,
      amount,
      category_id,
      description,
      transaction_date: date
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
