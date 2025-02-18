import React, { useState, useEffect } from "react";

const Symbol = ({ onAddSelected }) => {
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbols, setSelectedSymbols] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchSymbols = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/upstox/fullMarketQuote?page=${page}&limit=500`
      );
      const data = await response.json();

      if (data.fullMarketDataArray.length > 0) {
        setSymbols((prev) => [...prev, ...data.fullMarketDataArray]);
        setPage((prev) => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching symbols:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSymbols();
  }, []);

  const handleCheckboxChange = (symbol) => {
    setSelectedSymbols((prev) => {
      const newSet = new Set(prev);
      newSet.has(symbol.key) ? newSet.delete(symbol.key) : newSet.add(symbol.key);
      return newSet;
    });
  };

  const handleAddSelected = () => {
    if (selectedSymbols.size === 0) return;
    const selectedData = symbols.filter((symbol) => selectedSymbols.has(symbol.key));
    onAddSelected(selectedData);
    setSelectedSymbols(new Set()); // Clear selection after adding
  };

  return (
    <div className="container-fluid mt-3" style={{ padding: "0 10px" }}>
      <div className="d-flex align-items-center mb-3 mt-2">
        <button className="btn btn-success me-2" onClick={handleAddSelected} disabled={selectedSymbols.size === 0}>
          Add Selected Symbols
        </button>
        <p className="m-0">Up to 25 Symbols Only!</p>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Select</th>
              <th>Key</th>
              <th>Symbol</th>
              <th>Open</th>
              <th>High</th>
              <th>Low</th>
              <th>High Interval</th>
              <th>Low Interval</th>
              <th>LTP</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((symbol, index) => (
              <tr key={symbol.key || index}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSymbols.has(symbol.key)}
                    onChange={() => handleCheckboxChange(symbol)}
                  />
                </td>
                <td>{symbol.key}</td>
                <td>{symbol.symbol}</td>
                <td>{symbol.open}</td>
                <td>{symbol.high}</td>
                <td>{symbol.low}</td>
                <td>{symbol.high_interval}</td>
                <td>{symbol.low_interval}</td>
                <td>{symbol.ltp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="text-center mt-3 mb-3">
          <button className="btn btn-primary" onClick={fetchSymbols} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Symbol;
