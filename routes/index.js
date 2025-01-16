const express = require('express');
const router = express.Router();
const { router: bigScreenRouter, initWebSocket } = require('./big-screen');

router.use('/api/big-screen', bigScreenRouter);

module.exports = { router, initWebSocket }; 