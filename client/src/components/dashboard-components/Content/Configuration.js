import React, { useEffect, useState } from "react";
import axios from 'axios';
import { Modal, Button, Alert } from 'react-bootstrap';

const Configuration = ({ instrumentKeyData }) => {

    const [loading, setLoading] = useState(true);
    const [isQuanDisabled, setIsQuanDisabled] = useState(true);
    const [isConfigDisabled, setIsConfigDisabled] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [instrumentData, setInstrumentData] = useState([]);
    const [quantityCalculated, setQuantityCalculated] = useState(false);
    const [configData, setConfigData] = useState({
        totalTradingAmount: 0,
        product: "D",
        perScriptTradingAmount: 0,
        orderType: "LIMIT",
        transactionType: "BUY",
        validity: "DAY",
        instrumentKey: "",
        isAMO: false,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/configurations`);
                if (response.status === 200) {
                    delete response.data._id;
                    delete response.data.createdAt;
                    setConfigData(prevConfig => ({
                        ...prevConfig,
                        ...response.data,
                        instrumentKey: instrumentKeyData
                    }));
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchData();
    }, [instrumentKeyData]);

    useEffect(() => {
        setIsQuanDisabled(configData.totalTradingAmount <= 0 || !configData.instrumentKey);
        setIsConfigDisabled(configData.totalTradingAmount <= 0);
    }, [configData.totalTradingAmount, configData.instrumentKey]);

    const onChange = (e) => {
        const { name, value, type } = e.target;

        setConfigData((prev) => ({
            ...prev,
            [name]: type === "number" ? value : value
        }));
    };


    const calculateQuantity = async () => {
        try {
            if (configData.totalTradingAmount > 0 && configData.instrumentKey !== "") {
                const response = await axios.post(
                    `${process.env.REACT_APP_BASE_URL}/api/upstox/ltpQuotes`,
                    { instrument_key: configData.instrumentKey }
                );

                if (response.status === 200 && response.data !== null) {
                    const updatedInstrumentData = Object.entries(response.data).map(([symbol, instrument]) => {
                        const tradingAmount = configData.perScriptTradingAmount || (configData.totalTradingAmount / Object.keys(response.data).length);
                        return {
                            ...instrument,
                            symbol,
                            tradingAmount,
                            quantity: Math.floor(tradingAmount / instrument.last_price),
                            triggerPrice: configData.transactionType === "BUY" ? instrument.last_price + 1 : instrument.last_price - 1,
                        };
                    });
                    setInstrumentData(updatedInstrumentData);
                    setLoading(false);
                    setQuantityCalculated(true);
                }
            } else {
                Alert("Please enter Trading Amount and Instrument Key");
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    const updateInstrumentData = (index, field, value) => {
        setInstrumentData((prevData) => {
            const updatedData = [...prevData];

            if (!updatedData[index]) {
                updatedData[index] = { transactionType: "BUY", last_price: 0, quantity: 0, triggerPrice: 0, tradingAmount: 0 };
            }

            const currentItem = updatedData[index];
            const lastPrice = currentItem.last_price || 0;

            updatedData[index] = {
                ...currentItem,
                [field]: value,
                quantity: field === "tradingAmount" ? Math.floor(value / lastPrice) : currentItem.quantity,
                triggerPrice: field === "transactionType"
                    ? (value === "SELL" ? lastPrice - 1 : lastPrice + 1)
                    : (field === "triggerPrice" ? value : currentItem.triggerPrice),
                transactionType: field === "transactionType" ? value : currentItem.transactionType
            };

            setConfigData((prev) => ({
                ...prev,
                totalTradingAmount: updatedData.reduce((sum, item) => sum + (Number(item.tradingAmount) || 0), 0)
            }));

            return updatedData;
        });
    };




    const saveConfiguration = async (e) => {
        e.preventDefault();
        try {
            if (quantityCalculated) {
                console.log("instrumentData", instrumentData)
                const response = await axios.put(
                    `${process.env.REACT_APP_BASE_URL}/api/configurations`,
                    {
                        configData: configData,
                        instrumentData: instrumentData
                    }
                );
                if (response.status === 200) {
                    setShowModal(true);
                    sessionStorage.setItem('configSaved', true);
                }
            } else {
                alert("Please calculate quantity before saving configuration");
            }
        } catch (err) {
            console.error("Error updating configurations:", err);
        }
    };

    return (
        <>
            <div className="bg-light text-dark m-4">
                <form className="p-4" onSubmit={saveConfiguration}>
                    <div className="row px-4 py-2">
                        <div className="d flex">
                            <h4 className="row ms-0">Trading Parameters</h4>
                            <div className="d-flex justify-content-end gap-2 px-4 py-2">
                                <button type="button" className="btn btn-success" disabled={isQuanDisabled} onClick={calculateQuantity}>
                                    Calculate Quantity & Prices
                                </button>
                                <button type="submit"
                                    className="btn btn-primary"
                                    disabled={isConfigDisabled}>Save Configuration</button>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col mb-3">
                                <label className="form-label">Total Trading Amount</label>
                                <input type="number" className="form-control" name="totalTradingAmount" value={configData.totalTradingAmount} onChange={onChange} />
                            </div>
                            <div className="col mb-3">
                                <label className="form-label">Per Script Trading Amount</label>
                                <input type="number" className="form-control" name="perScriptTradingAmount" value={configData.perScriptTradingAmount} onChange={onChange} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col mb-3">
                                <label className="form-label">Order Type</label>
                                <select className="form-control"
                                    defaultValue="LIMIT"
                                    name="orderType"
                                    value={configData.orderType}
                                    onChange={onChange}>
                                    <option value="MARKET">MARKET</option>
                                    <option value="LIMIT">LIMIT</option>
                                    <option value="SL">SL</option>
                                    <option value="SL-M">SL-M</option>
                                </select>
                            </div>
                            <div className="col mb-3">
                                <label className="form-label">Transaction Type</label>
                                <select className="form-control"
                                    defaultValue="BUY"
                                    name="transactionType"
                                    value={configData.transactionType}
                                    onChange={onChange}>
                                    <option value="BUY">BUY</option>
                                    <option value="SELL">SELL</option>
                                </select>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col mb-3">
                                <label className="form-label">Validity</label>
                                <select className="form-control"
                                    defaultValue="DAY"
                                    name="validity"
                                    value={configData.validity}
                                    onChange={onChange}>
                                    <option value="DAY">DAY</option>
                                    <option value="IOC">IOC</option>
                                </select>
                            </div>
                            <div className="col mb-3">
                                <label className="form-label">Product</label>
                                <select
                                    className="form-control"
                                    defaultValue="D"
                                    name="product"
                                    value={configData.product}
                                    onChange={onChange}>
                                    <option value="D">D</option>
                                    <option value="I">I</option>
                                </select>
                            </div>
                        </div>

                        <div className="row">
                            <div className="mb-3">
                                <label className="form-label">Instrument Key</label>
                                <textarea
                                    className="form-control"
                                    required
                                    name="instrumentKey"
                                    value={configData.instrumentKey}
                                    rows={5}
                                    readOnly
                                    onChange={onChange} />
                            </div>
                        </div>
                    </div>
                </form>
                <div className="container-sm" style={{ padding: '0 10px' }}>
                    <div className="table-responsive">
                        <table className="table table-striped table-bordered">
                            <thead>
                                <tr>
                                    <th>Symbol Key</th>
                                    <th>Instrument Token</th>
                                    <th>Transaction Type</th>
                                    <th>Trading Amount / Scrip</th>
                                    <th>Last Price</th>
                                    <th>Quantity</th>
                                    <th>Trigger Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6">Press Calculate Button to get Details</td></tr>
                                ) : (
                                    instrumentData.map((instrument, index) => (
                                        <tr key={index}>
                                            <td>{instrument.symbol}</td>
                                            <td>{instrument.instrument_token}</td>
                                            <td>
                                                <select
                                                    className="form-control"
                                                    name="transactionType"
                                                    value={instrumentData[index]?.transactionType || "Please Select"}
                                                    onChange={(e) => updateInstrumentData(index, "transactionType", e.target.value)}
                                                >
                                                    <option value ="Please Select" disabled>Please Select</option>
                                                    <option value="BUY">BUY</option>
                                                    <option value="SELL">SELL</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={instrument.tradingAmount}
                                                    onChange={(e) => updateInstrumentData(index, "tradingAmount", e.target.value)}
                                                />
                                            </td>
                                            <td>{instrument.last_price}</td>
                                            <td>{instrument.quantity}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={instrument.triggerPrice}
                                                    onChange={(e) => updateInstrumentData(index, "triggerPrice", e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Success</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Configurations Saved Successfully!!</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setShowModal(false)}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Configuration;
