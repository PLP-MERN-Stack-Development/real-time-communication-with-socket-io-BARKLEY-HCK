const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.get('/room/:room', async (req, res) => {
  const messages = await Message.find({ room: req.params.room }).populate('sender', 'username');
  res.json(messages);
});

router.get('/private/:userA/:userB', async (req, res) => {
  const { userA, userB } = req.params;
  const messages = await Message.find({
    $or: [{ sender: userA, recipient: userB }, { sender: userB, recipient: userA }]
  }).populate('sender', 'username');
  res.json(messages);
});

module.exports = router;
