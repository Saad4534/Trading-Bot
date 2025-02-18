const config = require("config");
const Configuration = require('../models/configuration.model');
const Instrument = require('../models/instrument.model');
const httpStatus = require("http-status-codes").StatusCodes;
require("dotenv").config();

const configurationsController = {
    getConfigurations: async (req, res) => {
        try {
            let configs = await Configuration.findById("config");
            if (configs === null) {
                configs = new Configuration({
                    _id: "config",
                    totalTradingAmount: 10,
                    perScriptTradingAmount: 10,
                    is_amo: false,
                    product: "D",
                    order_type: "LIMIT",
                    transactionType: "BUY",
                    validity: "DAY",
                    instrumentKey: "NSE_EQ"
                });
                await configs.save().catch(err => console.error("Save error:", err));

            }
            res.status(httpStatus.OK).json(configs);
        } catch (err) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to get configurations' });
        }
    },

    getInstruments: async (req, res) => {
        try {
            const instruments = await Instrument.find();
            res.status(httpStatus.OK).json(instruments);
        } catch (err) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to get instruments' });
        }
    },

    updateConfigurations: async (req, res) => {
        try {
            const updatedConfig = await Configuration.findByIdAndUpdate("config", req.body.configData, { new: true, upsert: true });
            if (await Instrument.countDocuments() > 0) {
                await Instrument.deleteMany();
            }

            for (const data of req.body.instrumentData) {
                const newInstrument = new Instrument({
                    symbol_key: data.symbol,
                    last_price: data.last_price,
                    instrument_token: data.instrument_token,
                    transaction_type: data.transactionType,
                    quantity: data.quantity,
                    trigger_price: data.triggerPrice,
                    trading_amount: data.tradingAmount
                });

                // Save each record
                const response = await newInstrument.save();
            }
            res.status(httpStatus.OK).json(updatedConfig);

        } catch (err) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Failed to Update Configs',
                    error: err
                });
        }
    }
}

module.exports = configurationsController;