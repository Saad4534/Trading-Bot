import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { PnLContext } from '../Essentials/PnLContext';

const ActiveTrades = () => {
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { setCurrentPnL, setNetPnL } = useContext(PnLContext);
    const [lastCpValues, setLastCpValues] = useState({}); // State to store last valid cp values

    // Fetch Holdings
    const getActiveTrades = async () => {
        try {
            const holdingsResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/upstox/getActiveTrades`);
            setHoldings(holdingsResponse.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    // Fetch holdings initially and every 30 seconds
    useEffect(() => {
        getActiveTrades();
        const interval = setInterval(getActiveTrades, 30000);
        return () => clearInterval(interval);
    }, []);

    // Process Holdings only when `holdings` changes
    useEffect(() => {
        if (holdings.length === 0) return;

        let totalCurrentPnL = 0;
        let totalNetPnL = 0;

        const updatedHoldings = holdings.map(holding => {
            let updatedHolding = { ...holding };
            let holdingUpdated = false;

            // Update lastCpValues if cp is not null
            if (holding.cp !== null) {
                setLastCpValues(prev => ({ ...prev, [holding.instrument_token]: holding.cp }));
            }

            // Use last valid cp value if current cp is null
            updatedHolding.cp = holding.cp !== null ? holding.cp : lastCpValues[holding.instrument_token] || 'N/A';

            // Find matching position
            const position = holdings.find(pos => pos.instrument_token === holding.instrument_token && pos.hasOwnProperty('day_buy_price') && !holding.hasOwnProperty('day_buy_price'));

            if (position) {
                const totalQuantity = (holding.quantity || 0) + (position.day_buy_quantity || 0);
                const remainingQuantity = totalQuantity - (position.day_sell_quantity || 0);
                const entryPrice = ((holding.average_price * holding.quantity) + position.day_buy_value) / (holding.quantity + position.day_buy_quantity);

                updatedHolding.totalQuantity = totalQuantity;
                updatedHolding.remaingingQuantity = remainingQuantity;
                updatedHolding.entryPice = isNaN(entryPrice) ? 0 : entryPrice;
                updatedHolding.current_pnl = remainingQuantity * ((updatedHolding.cp || 0) - updatedHolding.entryPice);
                updatedHolding.net_pnl = (totalQuantity - remainingQuantity) * (position.day_sell_price - updatedHolding.entryPice);
                holdingUpdated = true;
            }

            if (!holdingUpdated) {
                updatedHolding.totalQuantity = holding.quantity || 0;
                updatedHolding.remaingingQuantity = holding.quantity || 0;
                updatedHolding.entryPice = holding.average_price || 0;
                updatedHolding.current_pnl = holding.pnl || 0;
                updatedHolding.net_pnl = 0;
            }

            totalCurrentPnL += updatedHolding.current_pnl;
            totalNetPnL += updatedHolding.net_pnl;

            return updatedHolding;
        });

        setHoldings(prevHoldings => (JSON.stringify(prevHoldings) === JSON.stringify(updatedHoldings) ? prevHoldings : updatedHoldings));
        setCurrentPnL(totalCurrentPnL);
        setNetPnL(totalNetPnL);
    }, [holdings]);

    return (
        <div className="container-fluid mt-3" style={{ padding: '0 10px' }}>
            <div className="table-responsive">
                <table className="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Direction</th>
                            <th>Quantity</th>
                            <th>Entry Price</th>
                            <th>CMP</th>
                            <th>Current P/L</th>
                            <th>Net P/L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7">Fetching...</td></tr>
                        ) : (
                            holdings.length > 0 ? holdings.map((trade, index) => (
                                <tr key={index}>
                                    <td>{trade.trading_symbol}</td>
                                    <td>{trade.quantity >= 0 ? "Long" : "Short"}</td>
                                    <td>{`${trade.totalQuantity}/${trade.remaingingQuantity}`}</td>
                                    <td>{trade.entryPice?.toFixed(2) || "N/A"}</td>
                                    <td>{trade.cp}</td>
                                    <td>{trade.current_pnl?.toFixed(2) || "N/A"}</td>
                                    <td>{trade.net_pnl?.toFixed(2) || "0.00"}%</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7">No active trades</td></tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActiveTrades;
