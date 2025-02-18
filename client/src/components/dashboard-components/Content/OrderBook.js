import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OrderBook = () => {
  const [orders, setOrders] = useState([]);

  const getOrders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/upstox/getOrderBook`);
      setOrders(response.data.data || []); // Ensure orders is always an array
    } catch (err) {
      console.error("Error fetching order book:", err);
    }
  };

  useEffect(() => {
    getOrders(); // Fetch data on mount

    const interval = setInterval(() => {
      getOrders();
    }, 5000); // Fetch data every 60 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="container-fluid mt-3">
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Trading Symbol</th>
              <th>Transaction Type</th>
              <th>Order ID</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Status</th>
              <th>Trigger Price</th>
              <th>Average Price</th>
              <th>Order Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order, index) => (
                <tr key={index}>
                  <td>{order.tradingsymbol}</td>
                  <td>{order.transaction_type}</td>
                  <td>{order.order_id}</td>
                  <td>{order.quantity}</td>
                  <td>{order.price}</td>
                  <td>{order.status}</td>
                  <td>{order.trigger_price}</td>
                  <td>{order.average_price}</td>
                  <td>{order.order_timestamp}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center">No orders available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderBook;
