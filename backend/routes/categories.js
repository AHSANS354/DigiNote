const express = require('express');
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Semua route butuh autentikasi
router.use(authMiddleware);

// Get semua kategori user
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC',
      [req.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Tambah kategori
router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Nama dan tipe kategori harus diisi' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Tipe harus income atau expense' });
    }

    // Cek duplikat
    const [exists] = await pool.query(
      'SELECT * FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?) AND type = ?',
      [req.userId, name, type]
    );

    if (exists.length > 0) {
      return res.status(400).json({ error: 'Kategori sudah ada' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
      [req.userId, name, type]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: req.userId,
      name,
      type
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hapus kategori
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah kategori digunakan di transaksi
    const [used] = await pool.query(
      'SELECT COUNT(*) as count FROM transactions t JOIN categories c ON LOWER(t.category) = LOWER(c.name) WHERE c.id = ? AND c.user_id = ?',
      [id, req.userId]
    );

    if (used[0].count > 0) {
      return res.status(400).json({ error: 'Kategori masih digunakan di transaksi' });
    }

    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
