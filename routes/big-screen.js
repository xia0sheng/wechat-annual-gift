const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.json({ message: 'Big Screen API endpoint' });
  } catch (error) {
    console.error('Big Screen error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router; 