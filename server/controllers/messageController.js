const PrivateMessage = require('../models/PrivateMessage');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.sendPrivateMessage = async (req, res) => {
    try {
        const { docId } = req.params;
        const { receiverId, text } = req.body;

        const message = new PrivateMessage({
            documentId: docId,
            senderId: req.user.id,
            receiverId,
            text
        });

        await message.save();

        // Create Notification
        const sender = await User.findById(req.user.id);
        await Notification.create({
            recipient: receiverId,
            sender: req.user.id,
            message: `${sender.name} sent you a private message regarding a document.`
        });

        res.status(201).json(message);
    } catch (err) {
        console.error('Send private message error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPrivateMessages = async (req, res) => {
    try {
        const { docId, peerId } = req.params;
        const userId = req.user.id;

        // Security check: only sender or receiver can fetch
        if (userId !== req.user.id && userId !== peerId) {
             return res.status(403).json({ message: 'Access denied' });
        }

        const messages = await PrivateMessage.find({
            documentId: docId,
            $or: [
                { senderId: userId, receiverId: peerId },
                { senderId: peerId, receiverId: userId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('senderId', 'name designation');

        res.json(messages);
    } catch (err) {
        console.error('Get private messages error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
