import React, { useState, useEffect } from "react";
import axios from "axios";

const SelectedSymbols = ({ setInstrumentKeyData }) => {
  const [selectedSymbols, setSelectedSymbols] = useState([]);

  useEffect(() => {
    fetchSelectedSymbols();
  }, []);

  const fetchSelectedSymbols = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/symbols`);
      const instruments = response.data.map(item => item.key).join(",");
      const instrumentData = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/upstox/fullMarketQuote?instruments=${instruments}`);
      setInstrumentKeyData(instruments);
      setSelectedSymbols(instrumentData.data.fullMarketDataArray);
    } catch (error) {
      console.error("Error fetching selected symbols:", error);
    }
  };

  const handleRemove = async (key) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/symbols/remove/${key}`);
      setSelectedSymbols((prev) => prev.filter((symbol) => symbol.key !== key));
    } catch (error) {
      console.error("Error removing symbol:", error);
    }
  };

  return (
    <div className="container-fluid mt-3">
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Key</th>
              <th>Symbol</th>
              <th>Open</th>
              <th>High</th>
              <th>Low</th>
              <th>High Interval</th>
              <th>Low Interval</th>
              <th>LTP</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {selectedSymbols.map((symbol) => (
              <tr key={symbol.key}>
                <td>{symbol.key}</td>
                <td>{symbol.symbol}</td>
                <td>{symbol.open}</td>
                <td>{symbol.high}</td>
                <td>{symbol.low}</td>
                <td>{symbol.high_interval}</td>
                <td>{symbol.low_interval}</td>
                <td>{symbol.ltp}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemove(symbol.key)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SelectedSymbols;
