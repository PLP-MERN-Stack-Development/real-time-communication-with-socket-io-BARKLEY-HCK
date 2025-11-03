import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { socket } from '../socket/socket';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
    login(res.data.user, res.data.token);
    socket.auth = { token: res.data.token, userId: res.data.user.id };
    socket.connect();
    socket.emit('user_connected', res.data.user.id);
    navigate('/chat');
  };

  return (
    <form onSubmit={submit}>
      <h2>Login</h2>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email"/>
      <br/>
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password"/>
      <br/>
      <button>Login</button>
    </form>
  );
}
