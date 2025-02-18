import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/api/auth/login`,
        { username, password }
      );
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", data.username);
      navigate("/dashboard");
    } catch (err) {
      alert("Something went wrong! Please try again");
    }
  };

  return (
    <div className="container mt-5 items-center justify-center w-50">
      <h1
        className="text-center"
        style={{
          marginBottom: "30px",
        }}
      >
        Trading Bot
      </h1>
      <form
        onSubmit={handleLogin}
        className="justify-center items-center p-4 border rounded bg-light mt-10"
      >
        <h2 className="text-center">Login</h2>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>
        <p className="mt-3">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
