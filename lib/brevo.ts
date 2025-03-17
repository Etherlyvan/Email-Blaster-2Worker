// lib/brevo.ts
import axios from 'axios';
import nodemailer from 'nodemailer';
import { prisma } from './db';

export async function getBrevoKeys(userId: string) {
  return prisma.brevoKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createBrevoKey(userId: string, data: {
  name: string;
  apiKey: string;
  smtpUsername: string;
  smtpPassword: string;
}) {
  return prisma.brevoKey.create({
    data: {
      ...data,
      user: {
        connect: { id: userId },
      },
    },
  });
}

export async function sendEmailViaSMTP(
  brevoKeyId: string,
  to: string,
  subject: string,
  html: string,
  from: { name: string; email: string }
) {
  const brevoKey = await prisma.brevoKey.findUnique({
    where: { id: brevoKeyId },
  });

  if (!brevoKey) {
    throw new Error('Brevo key not found');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: brevoKey.smtpUsername,
      pass: brevoKey.smtpPassword,
    },
  });

  return transporter.sendMail({
    from: `"${from.name}" <${from.email}>`,
    to,
    subject,
    html,
  });
}

export async function getEmailAnalytics(brevoKeyId: string, messageId: string) {
  const brevoKey = await prisma.brevoKey.findUnique({
    where: { id: brevoKeyId },
  });

  if (!brevoKey) {
    throw new Error('Brevo key not found');
  }

  try {
    const response = await axios.get(`https://api.brevo.com/v3/smtp/statistics/events`, {
      headers: {
        'api-key': brevoKey.apiKey,
        'Content-Type': 'application/json',
      },
      params: {
        messageId,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Brevo analytics:', error);
    throw error;
  }
}