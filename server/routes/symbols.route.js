const express = require('express');
const router = express.Router();
const symbolController = require("../controller/symbol.controller");

router.get("", symbolController.getSymbol);
router.get("/count", symbolController.countSymbols);
router.post("/add", symbolController.addSymbol);
router.delete("/remove/:key", symbolController.deleteSymbol);


module.exports = router;