const express = require('express');
const router = express.Router();
// const authController = require('../controller/auth.controller');
// const { validateSingUpCredentials, 
// validateLogInCredentials } = require("../middleware/validations");
const upstoxController = require("../controller/upstox.controller");

router.get('/getAccessToken', upstoxController.getAccessToken);
router.post('/generateAccessToken', upstoxController.generateAccessToken);
router.get('/fullMarketQuote', upstoxController.fullMarketQuote);
router.get('/getOrderBook', upstoxController.getOrderBook);
router.post('/ltpQuotes', upstoxController.ltpQuotes);
router.post('/ohlcQuotes', upstoxController.ohlcQuote);
router.post('/placeOrder', upstoxController.placeOrder);
router.post('/cancelOrder', upstoxController.cancelOrder);
router.get('/getTodayTrades', upstoxController.getTrades);
router.get('/getActiveTrades', upstoxController.getActiveTrades);

module.exports = router;