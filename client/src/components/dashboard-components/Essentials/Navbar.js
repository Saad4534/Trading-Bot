import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import { PnLContext } from '../Essentials/PnLContext';

const Navbar = () => {
    const [orderPlaced, setOrderPlaced] = useState(false);
    
    // Add message listener for auth completion
    useEffect(() => {
      const handleAuthComplete = (event) => {
        if (event.data === 'authComplete') {
          window.location.reload();
        }
      };
      
      window.addEventListener('message', handleAuthComplete);
      
      return () => {
        window.removeEventListener('message', handleAuthComplete);
      };
    }, []);
    const [orderPlacedMessage, setOrderPlacedMessage] = useState('');
    const { currentPnL, netPnL } = useContext(PnLContext);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [isTokenChecking, setIsTokenChecking] = useState(false);

    const placeOrder = async () => {
        try {
            if (sessionStorage.getItem('configSaved') !== null && sessionStorage.getItem('configSaved') === 'true') {
                const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/upstox/placeOrder`);
                if (response.status === 202) {
                    setOrderPlaced(true);
                    let message = 'Order Placed Successfully\n';

                    if (!Array.isArray(response.data)) {
                        response.data = [response.data];
                    }

                    response.data.forEach((data) => {
                        message += `Order ID: ${data.order_id}\n`;
                    });

                    setOrderPlacedMessage(message);
                } else {
                    setOrderPlaced(true);
                    setOrderPlacedMessage('Order Placement Failed, Retry Again!');
                }
            } else {
                alert('Please save the configuration before placing the order');
            }

        } catch (err) {
            if (err.response && err.response.status !== 500) {
                console.log(err);
            }
        }
    }

    const navigate = useNavigate();
    const handleLogout = () => {
        // Clear the session storage and navigate to login
        sessionStorage.removeItem('token');
        navigate('/');
    };

const generateToken = () => {
    const authUrl = `${process.env.REACT_APP_UPSTOX_BASE_URL}/login/authorization/dialog?client_id=${process.env.REACT_APP_UPSTOX_CLIENT_ID}&redirect_uri=${process.env.REACT_APP_UPSTOX_REDIRECT_URI}&response_type=${process.env.REACT_APP_UPSTOX_RESPONSE_TYPE}`;
    
    // Open auth window and store reference
    const authWindow = window.open(
      authUrl,
      'authWindow',
      'width=1000,height=600,left=100,top=100'
    );
    
    // Check if window was opened successfully
    if (!authWindow) {
      alert('Please allow popups for this site');
      return;
    }

    };

    const verifyToken = async () => {
        setIsTokenChecking(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/upstox/getOrderBook`);
            if (response.status === 202) {
                setIsTokenValid(true);
            } else {
                setIsTokenValid(false);
            }
        } catch (err) {
            setIsTokenValid(false);
            if (err.response && err.response.status !== 500) {
                console.log(err);
            }
        }
        setIsTokenChecking(false);
        
    }

    useEffect(() => {
        verifyToken();
    }, [])



    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
                <div className="container-fluid">
                    {/* Brand */}
                    <h1 className="navbar-brand ms-4 me-4">Trading Bot</h1>

                    {/* Toggle Button for Mobile View */}
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* Navbar Items */}
                    <div className="collapse navbar-collapse justify-content-between mt-3" id="navbarNav">
                        <ul className="navbar-nav ms-4 me-4 me-lg-2 mr-2">
                            <li className="nav-item mb-2 me-lg-2">
                                <button className="btn btn-success w-100 w-sm-auto mb-2" onClick={placeOrder}>Place Order</button>
                            </li>
                           
                            
                            <li className="nav-item mb-2 me-lg-2">
                                <button className="btn btn-info w-100 w-sm-auto mb-2">Current PnL: {currentPnL.toFixed(2)}</button>
                            </li>
                            <li className="nav-item mb-2 me-lg-2">
                                <button className="btn btn-info w-100 w-sm-auto mb-2">Net PnL: {netPnL.toFixed(2)}</button>
                            </li>
                        </ul>
                        <div className="text-center flex me-lg-4 d-flex flex-column flex-lg-row w-5">
                            <button className="btn btn-primary w-100 w-lg-auto mb-2 m-2" style={{ minWidth: '160px' }} onClick={generateToken} disabled={isTokenValid }>
                            {isTokenChecking ? 'Checking...' : 'Generate Token'}
                            </button>
                            <button className="btn btn-outline-light w-100 w-lg-auto mb-2 m-2" style={{ minWidth: '160px' }} onClick={handleLogout}>
                                Logout
                            </button>
                        </div>

                    </div>
                </div>
            </nav>
            <Modal show={orderPlaced} onHide={() => setOrderPlaced(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Success</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {orderPlacedMessage.split('\n').map((line, index) => (
                        <span key={index}>
                            {line}
                            <br />
                        </span>
                    ))}
                </Modal.Body>
                <Modal.Footer>
                    <p>*Save the order IDs before clicking OK*</p>
                    <Button variant="primary" onClick={() => setOrderPlaced(false)}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default Navbar
