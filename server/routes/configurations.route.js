const express = require('express');
const router = express.Router();
const configurationsController = require('../controller/configurations.controller');

router.get("",configurationsController.getConfigurations);
router.put("",configurationsController.updateConfigurations);
router.get("/instruments",configurationsController.getInstruments);

module.exports = router;