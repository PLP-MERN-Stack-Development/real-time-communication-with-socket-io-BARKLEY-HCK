import React, { useEffect, useState, useContext } from 'react';
import { socket } from '../socket/socket';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Chat() {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [room, setRoom] = useState('general');
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(()=> {
    axios.get(`http://localhost:5000/api/messages/room/${room}`).then(r => setMessages(r.data));
    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on('online_users', (users) => setOnlineUsers(users));
    socket.on('typing', (data) => {
      console.log('typing:', data);
    });
    socket.on('message_read', (data) => {
      console.log('message read', data);
    });
    return () => {
      socket.off('receive_message');
      socket.off('online_users');
      socket.off('typing');
      socket.off('message_read');
    };
  }, [room]);

  const send = () => {
    if (!text) return;
    const payload = { sender: user.id, room, text };
    socket.emit('send_message', payload);
    setText('');
  };

  const joinRoom = (r) => {
    setRoom(r);
    socket.emit('join_room', r);
    axios.get(`http://localhost:5000/api/messages/room/${r}`).then(r=>setMessages(r.data));
  };

  const typing = () => {
    socket.emit('typing', { sender: user.id, room });
  };

  return (
    <div>
      <h3>Room: {room}</h3>
      <button onClick={()=>joinRoom('general')}>General</button>
      <button onClick={()=>joinRoom('sports')}>Sports</button>

      <div>
        <h4>Online: {onlineUsers.length}</h4>
        <ul>{onlineUsers.map(u => <li key={u}>{u}</li>)}</ul>
      </div>

      <div style={{height:300, overflow:'auto', border:'1px solid #ddd', padding:8}}>
        {messages.map(m => <div key={m._id}><b>{m.sender.username || m.sender}</b>: {m.text}</div>)}
      </div>

      <input value={text} onChange={e=>{setText(e.target.value); typing();}} placeholder="Type..." />
      <button onClick={send}>Send</button>
    </div>
  );
}
