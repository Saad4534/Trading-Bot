const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');
const { validateSingUpCredentials, 
validateLogInCredentials } = require("../middleware/validations");

router.post('/signup', validateSingUpCredentials, authController.signUp);
router.post('/login', validateLogInCredentials, authController.logIn);

module.exports = router;