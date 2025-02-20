import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv"
import fs from "fs-extra";

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
    if (!data ) {
      return res.status(400).json({ message: "Invalid form data provided" });
    }

    // Verify transporter configuration
    const transporterVerified = await verifyTransporter();
    if (!transporterVerified) {
      return res.status(500).json({ message: "Email transporter is not ready" });
    }

    const emailResult = await sendMail(data.recipientEmail,data);
    const senderEmailResult = await sendMail(data.senderEmail, data);

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

    const userMail = email == data.recipientEmail ? data.senderEmail : data.recipientEmail
    const fromOrTo = email == data.recipientEmail ? "From" : "To"

    const htmlContent = `

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Consent Agreement</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 10px;
            line-height: 1.4;
        }
        h1, h2 {
            text-align: center;
        }
        .section {
            margin-bottom: 10px;
        }
        .signature {
            margin-top: 30px;
        }
    </style>
</head>
    <body>
    <h1>USER CONSENT AGREEMENT</h1>
    <p>This Agreement (hereinafter referred to as the "Agreement") is entered into between the parties ("Consenting Party" ${data.consentingPartyName} and "Partner: ${data.partnerName}") and is facilitated by the App (ICONSENT) (hereinafter referred to as the "App"). By entering into this Agreement, both parties acknowledge and agree to the terms set forth herein. The App (ICONSENT) serves solely as a medium to facilitate communication of mutual consent.</p>

     <h2>RECITALS</h2>
    <p>WHEREAS, the App (ICONSENT) is a digital tool designed to facilitate mutual consent communication;</p>
    <p>WHEREAS, the App (ICONSENT) intends to ensure clarity and respect regarding consent but disclaims any responsibility for the actions, behavior, or misconduct of Users;</p>
    <p>WHEREAS, the Users acknowledge that this Agreement is binding and agree to abide by the terms herein;</p>
    <p>WHEREAS, the App (ICONSENT) functions solely as a neutral facilitator and does not engage in arbitration or enforcement of consent agreements;</p>
    <p>WHEREAS, this Agreement outlines the rights, responsibilities, and liabilities of all parties involved.</p>
    <p>NOW, THEREFORE, in consideration of the foregoing and the mutual covenants contained herein, the Parties agree as follows:</p>
    
    <h2>Section 1: DEFINITIONS</h2>

     <ul>
        <li><b>Consent:</b> A clear, voluntary, and revocable agreement to engage in specified acts.</li>
        <li><b>Revocation of Consent:</b> The process of retracting previously granted consent.</li>
        <li><b>Misconduct:</b> Any act violating consent boundaries.</li>
    </ul>
    
    <h2>Section 2: SCOPE OF CONSENT</h2>
    <p>Consent applies only to specified acts and must be re-established for future interactions.</p>
    
    <h2>Section 3: ACTIVITIES CONSENT</h2>
    <p>TICK TO AGREE TO PARTICIPATION IN EACH ACTIVITY:</p>

     <ul>
        <li>Physical contact:${data.physicalContact ? "Yes" : "No"}</li>
        <li>Sexual penetration (Vagina, Anus, Both): ${data.selectedPenetration === "anus" ? "Anus" : data.selectedPenetration === "vagina" ? "Vagina" : "Both"}</li>
        <li>Oral sex (Giving, Receiving): ${data.selectedOral === "receiving" ? "Receiving" : "Giving"}</li>
        <li>Sexual intercourse (With or Without Condom): ${data.selectedIntercourse === "withCondom" ? "With FDA-approved condom" : data.selectedIntercourse === "withoutCondom" ? "Without condom (specific terms apply)" : data.selectedIntercourse === "ejaculationInside" ? "Ejaculation inside vagina" : data.otherActsDetails}</li>
    </ul>

    <h2>Section 4: CONFIDENTIALITY</h2>
    <p>
      4.1 Both parties agree to maintain the confidentiality of all interactions
      and communications related to this Agreement.
    </p>
    <p>
      4.2 Neither party shall disclose details of this Agreement or related
      activities to any third party without prior mutual consent, except when
      required by law.
    </p>
    <p>
      4.3 The App (ICONSENT) will not share any data or information related to
      the parties, except as required by legal authorities.
    </p>

    <h2>Section 5: APP (ICONSENT) DISCLAIMER</h2>
    <p>
      5.1 The App (ICONSENT) serves solely as a tool to facilitate consensual
      agreements between parties.
    </p>
    <p>
      5.2 The App (ICONSENT) is not liable for any disputes, damages, or
      circumstances arising from the use of this Agreement.
    </p>
    <p>
      5.3 The App (ICONSENT) cannot be held responsible or named in any legal
      actions initiated by either party or their representatives in connection
      with this Agreement except wherein it is required by law.
    </p>

    <h2>Section 6: ASSUMPTION OF RISK AND INDEMNITY</h2>

    <p>
      6.1 Acknowledgment of Risk: Both parties acknowledge the inherent risks
      associated with sexual activities, including but not limited to physical
      injury, emotional distress, and transmission of sexually transmitted
      infections (STIs).
    </p>
    <p>
      6.2 Voluntary Assumption of Risk: Each party voluntarily assumes these
      risks and agrees to proceed with full awareness of potential consequences.
    </p>
    <p>
      6.3 Indemnity: Each party agrees to indemnify and hold harmless the App
      (ICONSENT) from any claims, damages, or liabilities arising from the
      activities covered by this Agreement.
    </p>
    <p>
      6.4 No Warranty: The App (ICONSENT) does not provide any warranties
      regarding the safety, legality, or enforceability of this Agreement or the
      actions of the parties.
    </p>

    <h2>Section 7: RESPONSIBILITIES OF PARTIES</h2>
    <p>7.1 Both parties agree to:</p>
    <ul>
      <li>Respect autonomy and communicate openly.</li>
      <li>Violations will be governed by applicable laws.</li>
    </ul>

    <p>7.2 Both parties acknowledge that:</p>
    <ul>
      <li>Consent does not waive personal rights or legal protections.</li>
      <li>
        Any violations of consent or misconduct will be governed by applicable
        laws.
      </li>
    </ul>

    <p>Users must:</p>
    <ul>
      <li>
        Report any technical issues, suspected breaches, or misconduct observed
        on the App (ICONSENT)
      </li>
      <li>Comply with local laws and regulations governing consent.</li>
    </ul>

    <h2>Section 8: DISPUTE RESOLUTION</h2>

    <p>
      8.1 The App (ICONSENT) will not mediate, arbitrate, or intervene in any
      disputes between the parties.
    </p>
    <p>
      8.2 Any disputes must be resolved independently by the parties through the
      measures decided by them.
    </p>
    <p>
      8.3 The App (ICONSENT) is not a party to disputes and will not bear any
      costs or responsibilities related to resolution.
    </p>


    <h2>Section 9: DATA SECURITY AND PRIVACY</h2>
   <p>9.1 The App (ICONSENT) implements encryption and security measures to safeguard User data.</p>
   <p>9.2 Data collected is used solely for facilitating the functionality of the App (ICONSENT).</p>
   <p>9.3 Users retain the right to request access to, correction of, or deletion of their personal information stored within the App (ICONSENT).</p>
   <p>9.4 The App (ICONSENT) shall not engage in the sale, lease, or unauthorized sharing of User data.</p>
   <p>9.5 The App (ICONSENT) disclaims liability for unauthorized access resulting from User negligence or third-party actions.</p>

    <h2>Section 10: REVOCATION OF CONSENT</h2>

    <p>10.1 Right to Revoke: Either party retains the right to revoke consent at any time, irrespective of the stage of activity.</p>
    <p>10.2 Methods of Revocation: Revocation can be communicated through:</p>

    <ul>
        <li>Verbal communication using clear phrases such as "I withdraw consent" or "Time-Out"</li>
        <li>Non-verbal communication by indicating a gesture of “Time-Out” by using hands and making a “T”</li>
        <li>Written communication in the form of a text, email, or similar method if activities have not yet commenced.</li>
    </ul>
    <p>10.3 Acknowledgment of Revocation: The receiving party must immediately acknowledge the revocation and cease all activities within three (3) seconds for verbal or non-verbal communication or upon receipt of written communication.</p>
    <p>10.4 Good Faith Compliance: Both parties agree to act in good faith in recognizing and respecting revocation.</p>
<h2>Section 11: SIGNATURES</h2>
<p>
By signing, each party confirms understanding, acceptance, and voluntary agreement to the terms stated above.
</p>
    <div class="signature">

      <p>
        Consenting Party:<br />
        Name: ${data.consentingPartyName} Signature: <img src="${data.consentPartySignature}" alt="consentPartySignature" style="height: 50px; width: 200px;">
 Date: ${data.consetingPartyDate}
      </p>
      <p>
        Partner:<br />
        Name: ${data.partnerName} Signature: <img src=${data.partnerSignature} alt="consentPartySignature" style="height: 50px; width: 200px;"> Date: ${data.partnerDate}
      </p>
    </div>

    </body>

</html>
    `


    const mailOptions = {
      from: "appforms183@gmail.com", // Sender's email
      to: email, // Recipient's email
      subject: "Nda form submission files", // Email subject
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);

  
    return { success: true, info };
  } catch (error) {
    console.error("Error sending email:", error.message);
    return { success: false, error: error.message };
  }
};


app.post("/test", (req, res) => {
  const data = req.body

  console.log(data)

  return res.status(200).json({ message: "okay" })
})