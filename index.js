import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv"

dotenv.config();
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start server
app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});

// Root route
app.get("/", (req, res) => {
  res.end("Hello world");
});

// Email sending route
app.post("/send", async (req, res) => {
  const data = req.body;

  try {
    // Validate input data
    if (!data || !data.contact || !data.name || !data.reciepentEmail || !data.signatureUrl || !data.senderEmail ) {
      return res.status(400).json({ message: "Invalid form data provided" });
    }

    // Verify transporter configuration
    const transporterVerified = await verifyTransporter();
    if (!transporterVerified) {
      return res.status(500).json({ message: "Email transporter is not ready" });
    }

    const emailResult = await sendMail(data.reciepentEmail, data);
    const senderEmailResult = await sendMail(data.senderEmail,data);

    if (emailResult.success && senderEmailResult.success) {
      return res.status(200).json({ message: "Email sent successfully" });
    } else {
      throw new Error(emailResult.error || senderEmailResult.error || "Failed to send email");
    }
  } catch (error) {
    console.error("Error in /send route:", error.message);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.mainEmail,
    pass: process.env.password, // Ensure this is stored securely, e.g., in environment variables
  },
});

// Verify transporter configuration
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log("Email transporter is ready");
    return true;
  } catch (error) {
    console.error("Error verifying transporter:", error.message);
    return false;
  }
};

// Send email function
const sendMail = async (email, data) => {
  try {

    const userMail = email == data.reciepentEmail ? data.senderEmail : data.reciepentEmail
    const fromOrTo = email == data.reciepentEmail ? "From" : "To"
    const mailOptions = {
      from: "appforms183@gmail.com", // Sender's email
      to: email, // Recipient's email
      subject: "Nda form submission files", // Email subject
      html: `
      <h3>Nda form title</h3>
      <h3>${data.name}</h3>
      <h3>${fromOrTo} : ${userMail}</h3>
      <img src="${data.signatureUrl}" alt="Image" style="max-width:100%; height:"50%";"/>
      `, // Email body
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return { success: true, info };
  } catch (error) {
    console.error("Error sending email:", error.message);
    return { success: false, error: error.message };
  }
};
