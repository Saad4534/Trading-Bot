const mongooose = require("mongoose");
const config = require("config");
require("dotenv").config();

const uri = config.get("mongo_uri");
const clientOptions = {
    serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true
    },
};

async function connectToMongo() {
    await mongooose
    .connect(uri,clientOptions)
    .then(() => {
        console.log("Connected to Mongo");
    })
    .catch((err) => {
        throw err;
    });
}

async function connectToDB() {
    try {
        await connectToMongo();
    } catch (err) {
        console.log(err);
    }
}

module.exports = { connectToDB }