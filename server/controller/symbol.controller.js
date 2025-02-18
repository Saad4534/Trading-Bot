const config = require("config");
const SelectedSymbol = require("../models/selectedSymbol.model")
const httpStatus = require("http-status-codes").StatusCodes;
require("dotenv").config();

const symbolController = {
    getSymbol: async (req, res) => {
        try {
            const symbols = await SelectedSymbol.find();
            if (!symbols) {
                res.status(httpStatus.OK).json({message: "No Symbols Found!"});
             }
            res.status(httpStatus.OK).json(symbols);
        } catch (error) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error fetching selected symbols' });
        }
    },

    countSymbols: async (req, res) => {
        try {
            const count = await SelectedSymbol.countDocuments();
            res.status(httpStatus.OK).json({ count });
          } catch (error) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Error fetching symbol count" });
          }
    },

    addSymbol: async (req, res) => {
        const { symbols } = req.body;
        if (symbols.length === 0) {
            return res.status(httpStatus.BAD_REQUEST).json({ error: 'Invalid or empty symbols array' });
        }
        if(!Array.isArray(symbols)) {
            symbols = [symbols];
        }
        try {
            const keys = symbols.map((symbol) => symbol.key);
            const existingSymbols = await SelectedSymbol.find({ key: { $in: keys } });
            // Filter out already existing symbols
            const newSymbols = symbols.filter(
              (symbol) => !existingSymbols.some((existing) => existing.key === symbol.key)
            );
            if (newSymbols.length === 0) {
              return res.status(httpStatus.BAD_REQUEST).json({ error: 'All symbols are already selected' });
            }
            // Use bulkWrite for better performance and to avoid duplicates
            const bulkOps = newSymbols.map((symbol) => ({
              updateOne: {
                filter: { key: symbol.key },
                update: { $setOnInsert: symbol },  // Insert only if not present
                upsert: true,  // Avoid duplicate errors
              },
            }));
            const result = await SelectedSymbol.bulkWrite(bulkOps);
            res.status(httpStatus.CREATED).json({ message: 'Symbols added successfully', result });
          } catch (error) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error adding symbols' });
          }

    },

    deleteSymbol: async (req, res) => {
        try {
            await SelectedSymbol.deleteOne({ key: req.params.key });
            res.status(httpStatus.OK).json({ message: 'Symbol removed' });
        } catch (error) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error removing symbol' });
        }
    }

}

module.exports = symbolController;