import React, { useEffect, useState } from "react";
import Configuration from "../Content/Configuration";
import Symbol from "../Content/Symbol";
import ActiveTrades from "../Content/ActiveTrades";
import TodayTrades from "../Content/TodayTrades";
import SelectedSymbols from "../Content/SelectedSymbols";
import OrderBook from "../Content/OrderBook";

const Header = () => {
  const user = sessionStorage.getItem("user");
  const [instrumentKeyData, setInstrumentKeyData] = useState("");

  const chunkArray = (arr, size) => {
    let result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const handleAddSelectedSymbols = async (selectedSymbols) => {
    try {
      const existingResponse = await fetch(`${process.env.REACT_APP_BASE_URL}/api/symbols/count`);
      const { count } = await existingResponse.json();

      if (count >= 25) {
        alert("You cannot add more symbols!");
        return;
      }

      selectedSymbols = selectedSymbols.slice(0, 25 - count); // Restrict to remaining slots
      const chunks = chunkArray(selectedSymbols, 10); // Send in batches of 10

      // Use `Promise.all()` for parallel execution
      const responses = await Promise.all(
        chunks.map((chunk) =>
          fetch(`${process.env.REACT_APP_BASE_URL}/api/symbols/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbols: chunk }),
          })
        )
      );

      if (responses.some((res) => res.status !== 201)) {
        alert("Some symbols failed to add!");
        return;
      }

      alert("Symbols added successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error adding symbols:", error);
    }
  };
    

    return (
        <>
            <div className='me-4'>
                <div className="container-fluid mt-5 pt-5 ms-4 me-4">
                    <ul className="nav nav-tabs" id="myTab" role="tablist">
                        {user === 'admin' &&
                            <li className="nav-item" role="presentation">
                                <a className="nav-link active" id="config-tab" data-bs-toggle="tab" href="#config" role="tab" aria-controls="config" aria-selected="true">Configuration</a>
                            </li>
                        }
                        <li className="nav-item" role="presentation">
                            <a className="nav-link" id="symbol-stat-tab" data-bs-toggle="tab" href="#symbol-stat" role="tab" aria-controls="symbol-stat" aria-selected="false">Symbol Stat</a>
                        </li>
                        <li className="nav-item" role="presentation">
                            <a className="nav-link" id="selected-symbol-stat-tab" data-bs-toggle="tab" href="#selected-symbol-stat" role="tab" aria-controls="symbol-stat" aria-selected="false">Selected Symbols</a>
                        </li>
                        <li className="nav-item" role="presentation">
                            <a className="nav-link" id="active-trades-tab" data-bs-toggle="tab" href="#active-trades" role="tab" aria-controls="active-trades" aria-selected="false">Active Trades</a>
                        </li>
                        <li className="nav-item" role="presentation">
                            <a className="nav-link" id="today-trade-tab" data-bs-toggle="tab" href="#today-trade" role="tab" aria-controls="today-trade" aria-selected="false">Today Trade</a>
                        </li>
                        <li className="nav-item" role="presentation">
                            <a className="nav-link" id="order-book-tab" data-bs-toggle="tab" href="#order-book" role="tab" aria-controls="order-book" aria-selected="false">Order Book</a>
                        </li>
                    </ul>

                    {/* Tab Content */}
                    <div className="tab-content" id="myTabContent">
                        {/* Configuration Tab */}
                        {user === 'admin' &&
                            <div className="tab-pane fade show active mt-4" id="config" role="tabpanel" aria-labelledby="config-tab">
                                <Configuration 
                                instrumentKeyData={instrumentKeyData} 
                                />
                            </div>
                        }

                        {/* Symbol Stat Tab */}
                        <div className="tab-pane fade" id="selected-symbol-stat" role="tabpanel" aria-labelledby="symbol-stat-tab">
                            <SelectedSymbols  
                            setInstrumentKeyData={setInstrumentKeyData} 
                            />
                        </div>
                        <div className="tab-pane fade" id="symbol-stat" role="tabpanel" aria-labelledby="symbol-stat-tab">
                            <Symbol onAddSelected={handleAddSelectedSymbols} />
                        </div>

                        {/* Active Trades Tab */}
                        <div className="tab-pane fade" id="active-trades" role="tabpanel" aria-labelledby="active-trades-tab">
                            <ActiveTrades />
                        </div>

                        {/* Today Trade Tab */}
                        <div className="tab-pane fade" id="today-trade" role="tabpanel" aria-labelledby="today-trade-tab">
                            <TodayTrades />
                        </div>
                        {/* Order Book Tab */}
                        <div className="tab-pane fade" id="order-book" role="tabpanel" aria-labelledby="order-book-tab">
                            <OrderBook />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Header