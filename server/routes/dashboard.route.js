const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const dashboardController = require("../controller/dashboard.controller");

router.get('/getSymbols', authenticateToken , dashboardController.getSymbolData);

module.exports = router;