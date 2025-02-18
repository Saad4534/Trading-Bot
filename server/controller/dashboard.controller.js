const axios = require("axios");
const dashboardController = {
    getSymbolData: async (req, res) => {
        try {
            const response = await axios.post("http://localhost:3000/authenticateUpstox");
            return res.status(200).json(response);
        } catch (err) {
            throw err;
        }
    }
}

module.exports = dashboardController;