const express = require('express');
const router = express.Router();
const bigScreenRouter = require('./big-screen');

router.use('/api/big-screen', bigScreenRouter);

module.exports = router; 