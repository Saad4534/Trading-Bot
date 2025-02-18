const httpStatus = require("http-status-codes").StatusCodes;

const validateSingUpCredentials = (req, res, next) => {
    const {username, password, email} = req.body;
    if (!username || !password || !email) {
        return res.status(httpStatus.FORBIDDEN).json({error: "all fields are required!"});
    }
    next();
}

const validateLogInCredentials = (req, res, next) => {
    const {username, password} = req.body;
    if (!username || !password) {
        return res.status(httpStatus.FORBIDDEN).json({error: "all fields are required!"});
    }
    next();
}



module.exports = {
    validateSingUpCredentials,
    validateLogInCredentials
};
