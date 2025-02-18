const axios = require("axios");
const WebSocket = require("ws");
const config = require("config");
const httpStatus = require("http-status-codes").StatusCodes;
const UpstoxClient = require("upstox-js-sdk");
const _ = require('lodash');
require("dotenv").config();
const segment = require("../config/NSE_EQ.json");
const redisClient = require("../config/redis");
const protobuf = require("protobufjs");

const UPSTOX_BASE_URL = config.get("upstox_base_url");
const UPSTOX_PLACE_ORDER_URL = config.get("upstox_place_order_url");

const OHLC_INTERVAL = config.get("ohlc_interval");

let protobufRoot = null;
let webSocketFeed = null;
let ws, wsUrl;

const getMarketFeedUrl = async () => {
  const accessToken = await redisClient.get("access_token");
  const url = "https://api.upstox.com/v3/feed/market-data-feed/authorize";
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };
  const response = await axios.get(url, { headers });
  return response.data.data.authorizedRedirectUri;
};

const connectWebSocket = async (wsUrl) => {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(wsUrl, {
      followRedirects: true,
    });

    ws.on("open", () => {
      console.log("connected");
      resolve(ws); // Resolve once connected
    });

    ws.on("close", () => {
      console.log("disconnected");
    });

    ws.on("message", async (data) => {
      try {
        webSocketFeed = null;
        webSocketFeed = await decodeProfobuf(data);
      } catch (err) {
        console.error("Protobuf decoding error:", err);
      }
    });


    ws.on("error", (error) => {
      console.log("error:", error);
      reject(error);
    });
  });
};

const subscribeToInstruments = (instrumentKeys) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.log("WebSocket is not connected");
    return;
  }

  const data = {
    guid: "13syxu852ztodyqncwt0",
    method: "sub",
    data: {
      mode: "full",
      instrumentKeys: instrumentKeys, // Dynamic instrument keys
    },
  };

  ws.send(Buffer.from(JSON.stringify(data)));
};

// Function to initialize the protobuf part
const initProtobuf = async () => {
  protobufRoot = await protobuf.load(__dirname + "/../config/MarketDataFeed.proto");
};

// Function to decode protobuf message
const decodeProfobuf = async (buffer) => {
  if (!protobufRoot) {
    console.warn("Protobuf part not initialized yet!");
    return null;
  }

  const FeedResponse = protobufRoot.lookupType(
    "com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse"
  );
  return FeedResponse.decode(buffer);
};



const initializeWebSocket = async () => {
  try {
    // Clean up existing connection if any
    if (ws) {
      ws.removeAllListeners();
      ws.close();
    }

    await initProtobuf(); // Initialize protobuf
    wsUrl = await getMarketFeedUrl(); // Get the market feed URL
    ws = await connectWebSocket(wsUrl); // Connect to the WebSocket
    console.log('WebSocket connection established');
  } catch (error) {
    console.error("WebSocket initialization error:", error);
    // Retry after 5 seconds
    setTimeout(initializeWebSocket, 5000);
  }
};

// Initialize WebSocket on application start
initializeWebSocket();


const upstoxController = {

  getAccessToken: async (req, res) => {
    try {
      const token = await redisClient.get("access_token");
      if (!token) {
        return res.status(httpStatus.NOT_FOUND).json({ message: "No token found" });
      }
      res.status(httpStatus.OK).json({ access_token: token });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error retrieving token", error });
    }
  },

  generateAccessToken: async (req, res) => {
    try {
      const url = `${UPSTOX_BASE_URL}/login/authorization/token`;
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      };
      const data = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: req.body.code,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/callback",
      };

      const response = await axios.post(url, data, { headers });
      await redisClient.set("access_token", response.data.access_token, "EX", 86400);
      // Reinitialize WebSocket with new access token
      await initializeWebSocket();
      res.status(httpStatus.ACCEPTED).json({
        message: "Access Token Generated Successfully!",
        data: response.data,
      });
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  },

  fullMarketQuote: async (req, res) => {
    const ACCESS_TOKEN = await redisClient.get("access_token");
    let page = 1, limit = 100;
    let instrument_key = "";
    if (req.query.hasOwnProperty("page")) {
      page = req.query.page;
      limit = req.query.limit;
    } else {
      instrument_key = req.query.instruments
    }
    try {
      let fullMarketDataArray = [];
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedData = segment.slice(startIndex, endIndex);
      if (!Array.isArray(paginatedData)) {
        paginatedData = [paginatedData];
      }
      if (req.query.hasOwnProperty("page")) {
        let len = paginatedData.length;
        for (let i = 0; i < len; i++) {
          if (i + 1 === len) {
            instrument_key += paginatedData[i].instrument_key;
          } else {
            instrument_key += `${paginatedData[i].instrument_key},`;
          }
        }
      }
      const url = `${UPSTOX_BASE_URL}/market-quote/quotes?instrument_key=${instrument_key}`;
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      };

      await axios
        .get(url, { headers })
        .then((response) => {
          if (
            response.data.status === "success" &&
            response.data.data !== null
          ) {
            for (const instrument_key in response.data.data) {
              const instrumentData = response.data.data[instrument_key];
              if (instrumentData.last_price !== 0) {
                let tempObject = {
                  key: instrumentData.instrument_token,
                  symbol: instrumentData.symbol,
                  open: instrumentData.ohlc != null ? instrumentData.ohlc.open : 0,
                  high: instrumentData.ohlc != null ? instrumentData.ohlc.high : 0,
                  low: instrumentData.ohlc != null ? instrumentData.ohlc.low : 0,
                  high_interval: 0,
                  low_interval: 0,
                  ltp: instrumentData.last_price
                };
                fullMarketDataArray.push(tempObject);
              }
            }
          }
        })
        .catch((error) => {
          // console.log(error);
          throw error;
        });

      const ohlcQuoteResponse = await axios.post(
        "http://localhost:8000/api/upstox/ohlcQuotes",
        { instrument_key }
      );
      fullMarketDataArray.forEach((element) => {
        ohlcQuoteResponse.data[`NSE_EQ:${element.symbol}`].ohlc != null ?
          element.high_interval =
          ohlcQuoteResponse.data[`NSE_EQ:${element.symbol}`].ohlc.high
          : element.high_interval = 0;
        ohlcQuoteResponse.data[`NSE_EQ:${element.symbol}`].ohlc != null ?
          element.low_interval =
          ohlcQuoteResponse.data[`NSE_EQ:${element.symbol}`].ohlc.low :
          element.low_interval = 0;
      });
      res.status(httpStatus.ACCEPTED).json({ fullMarketDataArray });
    } catch (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something Went Wrong!",
        error: err
      })
    }
  },

  ltpQuotes: async (req, res) => {
    const ACCESS_TOKEN = await redisClient.get("access_token");
    let instrument_key = req.body.instrument_key;
    try {
      const url = `${UPSTOX_BASE_URL}/market-quote/ltp?instrument_key=${instrument_key}`;
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      };
      axios
        .get(url, { headers })
        .then((response) => {
          if (
            response.data.status === "success" &&
            response.data.data !== null
          ) {
            res.status(200).json(response.data.data);
          }
        })
        .catch((error) => {
          throw error;
        });
    } catch (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something Went Wrong!",
        error: err
      })
    }
  },

  ohlcQuote: async (req, res) => {
    const ACCESS_TOKEN = await redisClient.get("access_token");
    const instrument_key = req.body.instrument_key;
    try {
      const url = `${UPSTOX_BASE_URL}/market-quote/ohlc`;
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      };
      const params = {
        instrument_key: instrument_key,
        interval: OHLC_INTERVAL,
      };
      axios
        .get(url, { headers, params })
        .then((response) => {
          if (
            response.data.status === "success" &&
            response.data.data !== null
          ) {
            res.status(200).json(response.data.data);
          }
        })
        .catch((error) => {
          throw error;
        });
    } catch (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something Went Wrong!",
        error: err
      })
    }
  },

  placeOrder: async (req, res) => {
    const ACCESS_TOKEN = process.env.NODE_ENV === 'development' 
        ? config.get("access_token") 
        : await redisClient.get("access_token");
    try {
      const configs = await axios.get("http://localhost:8000/api/configurations");
      if (configs.data.length === 0) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: "Please configure the bot first!",
        });
      } else {
        const instruments = await axios.get("http://localhost:8000/api/configurations/instruments");
        if (instruments.data.length === 0) {
          res.status(httpStatus.BAD_REQUEST).json({
            message: "Please configure the instruments first!",
          });
        }

        const url = `${UPSTOX_PLACE_ORDER_URL}/order/multi/place`;
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        };
        const data = [];
        if (!Array.isArray(instruments.data)) {
          instruments.data = [instruments.data];
        }
        let key = 1;
        instruments.data.forEach((instrument) => {
          data.push({
            correlation_id: `${key}`,
            quantity: instrument.quantity,
            product: configs.data.product,
            validity: configs.data.validity,
            price: instrument.last_price,
            tag: "string",
            instrument_token: instrument.instrument_token,
            order_type: configs.data.order_type,
            transaction_type: instrument.transaction_type,
            disclosed_quantity: Math.ceil(0.75 * instrument.quantity),
            trigger_price: instrument.trigger_price,
            "is_amo": false,
            "slice": false
          });
          key++;
        });

        const config = {
          method: "POST",
          url: url,
          headers: headers,
          data: data
        }

        const response = await axios(config);
        if (response.status === 200) {
          res.status(httpStatus.ACCEPTED).json(response.data.data);
        } else {
          res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Something Went Wrong!",
            error: response.data
          })
        }
      }
    } catch (err) {
      console.log("err", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something Went Wrong!",
        error: err
      })
    }
  },

  cancelOrder: async (req, res) => {
    const ACCESS_TOKEN = await redisClient.get("access_token");
    const order_id = req.body.order_ids;
    try {
      const url = `${UPSTOX_BASE_URL}/order/cancel?order_id=`;
      const headers = {
        Accept: "application/json",
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      };
      order_id.forEach(async (id) => {
        const response = await axios.delete(url + id, { headers });
        if (response.status !== "success") {
          res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Something Went Wrong!",
            error: response.data
          });
        }
      });
      res.status(httpStatus.ACCEPTED).json(response.data);
    } catch (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something Went Wrong!",
        error: err
      })
    }
  },

  getTrades: async (req, res) => {
    const ACCESS_TOKEN = await redisClient.get("access_token");
    try {
      const url = `${UPSTOX_BASE_URL}/order/trades/get-trades-for-day`;
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      };
      const response = await axios.get(url, { headers });
      res.status(httpStatus.ACCEPTED).json(response.data);
    } catch (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something Went Wrong!",
        error: err
      })
    }
  },

  getOrderBook: async (req, res) => {
    const ACCESS_TOKEN = await redisClient.get("access_token");
    try {
      const url = `${UPSTOX_BASE_URL}/order/retrieve-all`;
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      };
      const response = await axios.get(url, { headers });
      res.status(httpStatus.ACCEPTED).json(response.data);
    } catch (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something Went Wrong!",
        error: err
      })
    }
  },

  getActiveTrades: async (req, res) => {
    try {
      let activeTrades = [];
      const ACCESS_TOKEN = await redisClient.get("access_token");
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      };
      let url = `${UPSTOX_BASE_URL}/portfolio/short-term-positions`;
      let response = await axios.get(url, { headers });
      if (response.data.data.length !== 0) {
        response.data.data.map(object => activeTrades.push(object));
      }
      url = `${UPSTOX_BASE_URL}/portfolio/long-term-holdings`;
      response = await axios.get(url, { headers });
      if (response.data.data.length !== 0) {
        response.data.data.map(object => activeTrades.push(object));
      }
      if (activeTrades.length !== 0) {
        let instruments = [];
        activeTrades.map(key => {
          instruments.push(key.instrument_token)
        })
        subscribeToInstruments(instruments); // Send dynamically
        setTimeout(() => {
        }, 3000);
        for (const key of activeTrades) {
          key.cp = webSocketFeed?.feeds?.[key.instrument_token]?.fullFeed?.marketFF?.ltpc?.cp || null;
        }
        if (!webSocketFeed || !webSocketFeed.feeds) {
          console.error("WebSocket feed is not ready yet!");
          return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "WebSocket data is not available yet",
          });
        }
        res.status(httpStatus.ACCEPTED).json(activeTrades)
      } else {
        res.status(httpStatus.ACCEPTED).json(activeTrades);
      }
    } catch (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something Went Wrong!",
        error: err
      })
    }
  }
};

module.exports = upstoxController;
