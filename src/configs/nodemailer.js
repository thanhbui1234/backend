// config.js
import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();

const { GMAIL_USER, GMAIL_PASS } = process.env;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

export default transporter;
