import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "./dashboard-components/Essentials/Navbar";
import Header from "./dashboard-components/Essentials/Header";
import { PnLProvider } from '../components/dashboard-components/Essentials/PnLContext';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div>
      <PnLProvider>
        <Navbar />
        <Header />
      </PnLProvider>
    </div>
  );
};

export default Dashboard;
