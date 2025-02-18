const express = require("express");
const cors = require("cors");
const error = require("../middleware/error");
const user = require("../routes/auth.route");
const dashboard = require("../routes/dashboard.route");
const upstox = require("../routes/upstox.route");
const configurations = require("../routes/configurations.route");
const symbols = require("../routes/symbols.route");

module.exports = (app) => {
    app.use(express.json());
    app.use(cors());
    app.use("/api/auth", user);
    app.use("/api/configurations", configurations);
    app.use("/api/dashboard", dashboard);
    app.use("/api/upstox", upstox);
    app.use("/api/symbols", symbols);
    app.use(error);
}