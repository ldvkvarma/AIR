// AIR Studio Contact Form Server
// Built by hand - no AI used
// Handles email sending for the contact form

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT ;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email transporter configuration
// Using Gmail as example - configure your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log('Email server connection failed:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    console.log('Received form data:', req.body);
    const { name, email, 'project-type': projectType, budget, timeline, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill in all required fields' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address' 
      });
    }

    // Construct email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `New Project Inquiry from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3DDBFF; border-bottom: 2px solid #3DDBFF; padding-bottom: 10px;">New Project Inquiry</h2>
          
          <div style="background: #10151D; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #E8ECF1; margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="color: #E8ECF1; margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="color: #E8ECF1; margin: 10px 0;"><strong>Project Type:</strong> ${projectType || 'Not specified'}</p>
            <p style="color: #E8ECF1; margin: 10px 0;"><strong>Budget:</strong> ${budget || 'Not specified'}</p>
            <p style="color: #E8ECF1; margin: 10px 0;"><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
          </div>
          
          <div style="background: #12181F; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #3DDBFF; margin-top: 0;">Project Details:</h3>
            <p style="color: #8B95A5; line-height: 1.6;">${message}</p>
          </div>
          
          <p style="color: #545E6E; font-size: 12px; margin-top: 30px;">
            This message was sent from the AIR Studio contact form.
          </p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true, 
      message: 'Your message has been sent successfully!' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again later.' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AIR Studio server is running' });
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(PORT, () => {
  console.log(`AIR Studio server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the website`);
});
