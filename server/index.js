const express = require("express");
const config = require("config");
const { connectToDB } = require("./startup/dbConnection");
require("dotenv").config();

const app = express();
require("./startup/routes")(app);
connectToDB();

app.get("/", (req,res) => {
    res.send("API is running...");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})