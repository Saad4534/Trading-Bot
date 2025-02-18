const config = require("config");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const httpStatus = require("http-status-codes").StatusCodes;
require("dotenv").config();
const JWT_SECRET = config.get("jwt_secret");

const authController = {
    signUp: async (req, res) => {
        try {
            const { username, password, email } = req.body;
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(httpStatus.BAD_REQUEST).json({ error: 'Username already exists' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username,
                password: hashedPassword,
                email,
            });
            await newUser.save();
            res.status(httpStatus.CREATED).json({ message: 'User registered successfully' });
        } catch (err) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to register user' });
        }
    },

    logIn: async (req, res) => {
        const { username, password } = req.body;
        try {
            const user = await User.findOne({ username });
            if (!user) return res.status(httpStatus.NOT_FOUND)
                .json({ error: 'User not found' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(httpStatus.UNAUTHORIZED)
                .json({ error: 'Invalid credentials' });

            const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
            res.status(httpStatus.ACCEPTED)
                .json({
                    token: token,
                    username: username
                });
        } catch (err) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Login failed',
                    error: err
                });
        }
    }
   
}

module.exports = authController;