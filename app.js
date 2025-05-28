const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware to parse incoming JSON data
app.use(bodyParser.json());

// Middleware to handle CORS preflight requests
app.options("/submit-form", cors());

// Allow requests from specific origins
app.use(cors({
  origin: "https://wearedaisy.eu" // Update with your frontend origin
}));

const sslOptions = {
    privateKey: fs.readFileSync('./certificates/private_key.pem'),
    sslCertificate: fs.readFileSync('./certificates/ssl_certificate.pem'),
}; 


function isValidInput(input) {
  // Trim input to remove leading and trailing spaces
  const trimmedInput = input.trim();

  // Check if the trimmed input is not empty
  return trimmedInput.length > 0;
}

// POST endpoint to receive post data
app.post("/submit-form", (req, res) => {
  const postData = req.body;
           console.error(postData);

  const email_valid = isValidInput(postData.email);
  const name_valid = isValidInput(postData.name);

  if (email_valid && name_valid) {
    const source = fs
      .readFileSync("templates/contact-form.html", "utf-8")
      .toString();
    const template = handlebars.compile(source);

    const replacements = {
      data: postData,
    };
    const htmlToSend = template(replacements);

    var mailConfig;
    if (process.env.NODE_ENV === "production") {
      
      mailConfig = {
        host: "mail.wearedaisy.eu",
        port: 465,
        secure: true,
        auth: {
          user: process.env.AUTH_USERNAME,
          pass: process.env.AUTH_PASSWORD,
        },
        tls: {
            key: sslOptions.privateKey,
            cert: sslOptions.sslCertificate,
            rejectUnauthorized: false 
        },
      };
    } else {
      // if in development, mailtrap
      mailConfig = {
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "ebc15e2a55bd68",
          pass: "80e19564d681eb",
        },
      };
    }

    let transporter = nodemailer.createTransport(mailConfig);

    const mail_option = {
      from: postData.email,
      to: process.env.AUTH_USERNAME,
      subject: "Contact Request",
      text: JSON.stringify(postData),
      html: htmlToSend,
    };

    transporter.sendMail(mail_option, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        response.statusCode(200);
      }
    });
  } else {
    res.json({ message: "error" });
  }

  res.json({ message: "success" });
});

app.get('/',(req,res) =>{
    res.redirect('https://wearedaisy.eu');
});

app.listen(PORT, function(error){
    if (error) console.log("Error in server setup")
    console.log("Server listening on Port", PORT);
});


