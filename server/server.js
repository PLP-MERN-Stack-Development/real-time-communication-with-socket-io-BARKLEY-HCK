require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', require('./routes/messages'));

// Connect DB
mongoose.connect(process.env.MONGODB_URI)
  .then(()=> console.log('Mongo connected'))
  .catch(err=> console.error(err));

// In-memory mapping socketId <-> userId (simple approach)
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('user_connected', async (userId) => {
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { online: true });
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('send_message', async (msg) => {
    const message = new Message({
      sender: msg.sender,
      recipient: msg.recipient || null,
      room: msg.room || null,
      text: msg.text
    });
    await message.save();
    if (msg.room) {
      io.to(msg.room).emit('receive_message', await message.populate('sender', 'username'));
    } else if (msg.recipient) {
      const recipientSocket = onlineUsers.get(msg.recipient);
      if (recipientSocket) io.to(recipientSocket).emit('receive_message', await message.populate('sender', 'username'));
      socket.emit('receive_message', await message.populate('sender', 'username'));
    }
  });

  socket.on('typing', (data) => {
    if (data.room) socket.to(data.room).emit('typing', data);
    else {
      const toSocket = onlineUsers.get(data.recipient);
      if (toSocket) socket.to(toSocket).emit('typing', data);
    }
  });

  socket.on('mark_read', async ({ messageId, userId }) => {
    const message = await Message.findById(messageId);
    if (!message) return;
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
      const senderSocket = onlineUsers.get(String(message.sender));
      if (senderSocket) io.to(senderSocket).emit('message_read', { messageId, userId });
    }
  });

  socket.on('disconnect', async () => {
    for (const [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, { online: false });
        io.emit('online_users', Array.from(onlineUsers.keys()));
        break;
      }
    }
    console.log('socket disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
