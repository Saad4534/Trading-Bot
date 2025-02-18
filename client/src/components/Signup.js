import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/signup`, { username, password, email });
      if (response.status === 201) {
        alert(response.data.message);
        navigate('/');
      } else {
        alert("Something went wrong! Please try again");
      }
    } catch (err) {
      alert('Something went wrong while creating User! Please try again with new Credentials');
    }
  };

  return (
    <div className="container mt-5 justify-center w-50">
      <h1 className='text-center' style={{
        marginBottom: "30px"
      }}>Trading Bot</h1>
      <form onSubmit={handleSignup} className="justify-center items-center p-4 border rounded bg-light mt-10">
        <h2 className='text-center'>Sign Up</h2>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary w-100">Signup</button>
        <p className="mt-3">Already have an account? <a href="/login">Login</a></p>
      </form>
    </div>
  );
};

export default Signup;