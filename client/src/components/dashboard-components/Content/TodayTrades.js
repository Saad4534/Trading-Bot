import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TodayTrades = () => {
    const [todayTrades, setTodayTrades] = useState([]);
    const [loading, setLoading] = useState(true);

    const getTrades = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/upstox/getTodayTrades`);
            if (response.data.status !== "success") {
                return;
            }

            // Process trades to merge by instrument_token
            const trades = response.data.data;
            const groupedTrades = trades.reduce((acc, trade) => {
                const key = trade.instrument_token;
                if (!acc[key]) {
                    acc[key] = { ...trade };
                } else {
                    // Sum up quantity
                    acc[key].quantity += trade.quantity;
                    // Keep the latest trade based on order_timestamp
                    if (new Date(trade.order_timestamp) > new Date(acc[key].order_timestamp)) {
                        acc[key] = { ...trade, quantity: acc[key].quantity }; // Keep summed quantity
                    }
                }
                return acc;
            }, {});

            setTodayTrades(Object.values(groupedTrades)); // Convert object back to array
            setLoading(false);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getTrades();
        const interval = setInterval(getTrades, 5000); // Fetch data every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container-fluid mt-3" style={{ padding: '0 10px' }}>
            <div className="table-responsive">
                <table className="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th>Trading Symbol</th>
                            <th>Instrument Token</th>
                            <th>Order Type</th>
                            <th>Transaction Type</th>
                            <th>Quantity</th>
                            <th>Order ID</th>
                            <th>Average Price</th>
                            <th>Trade ID</th>
                            <th>Order Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="text-center">Fetching...</td>
                            </tr>
                        ) : todayTrades.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center">No Trades for today available</td>
                            </tr>
                        ) : (
                            todayTrades.map((trade, index) => (
                                <tr key={index}>
                                    <td>{trade.trading_symbol}</td>
                                    <td>{trade.instrument_token}</td>
                                    <td>{trade.order_type}</td>
                                    <td>{trade.transaction_type}</td>
                                    <td>{trade.quantity}</td>
                                    <td>{trade.order_id}</td>
                                    <td>{trade.average_price}</td>
                                    <td>{trade.trade_id}</td>
                                    <td>{trade.order_timestamp}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TodayTrades;
