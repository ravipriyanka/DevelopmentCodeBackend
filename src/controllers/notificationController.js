const sendNotification = async (req, res) => {
  try {
    const { title, message, userId } = req.body;
    // Add your notification logic here (Firebase, email, etc.)
    console.log('Notification sent:', { title, message, userId });
    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendNotification };

