// lib/brevo.ts - Complete file with all fixes

import axios from 'axios';
import nodemailer from 'nodemailer';
import { prisma } from './db';
import { EmailStatus } from '@prisma/client';

// Define types for Brevo API responses
interface BrevoSender {
  email: string;
  active: boolean;
  id?: number;
  name?: string;
}

// Define a type for update data instead of using any
interface EmailDeliveryUpdateData {
  status?: EmailStatus;
  openedAt?: Date | null;
  clickedAt?: Date | null;
  errorMessage?: string | null;
}

// Define interfaces for analytics
interface BrevoEvent {
  event: string;
  date: string;
  [key: string]: unknown;
}

interface AnalyticsResult {
  contactId: string;
  messageId: string;
  events: BrevoEvent[];
  status: EmailStatus;
}

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

// Refactored getEmailAnalytics function with reduced complexity
export async function getEmailAnalytics(brevoKeyId: string, campaignId: string) {
  // Validate inputs
  const brevoKey = await findAndValidateBrevoKey(brevoKeyId);
  const campaign = await findAndValidateCampaign(campaignId);
  
  // Process each delivery
  const analyticsResults = await processDeliveries(brevoKey.apiKey, campaign.EmailDelivery);
  
  // Calculate campaign stats
  const stats = await calculateCampaignStats(campaignId);
  
  // Return the full analytics data
  return formatAnalyticsResponse(campaign, stats, analyticsResults);
}

// Helper functions to reduce complexity in getEmailAnalytics
async function findAndValidateBrevoKey(brevoKeyId: string) {
  const brevoKey = await prisma.brevoKey.findUnique({
    where: { id: brevoKeyId },
  });

  if (!brevoKey) {
    throw new Error('Brevo key not found');
  }
  
  return brevoKey;
}

async function findAndValidateCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      EmailDelivery: true
    }
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  return campaign;
}

// Type for delivery with all necessary fields
interface EmailDelivery {
  id: string;
  messageId?: string | null;
  contactId: string;
  status: EmailStatus;
}

async function processDeliveries(apiKey: string, deliveries: EmailDelivery[]) {
  // Filter deliveries with messageId
  const deliveriesWithMessageId = deliveries.filter(delivery => delivery.messageId);
  
  // Process each delivery in parallel
  const analyticsPromises = deliveriesWithMessageId.map(delivery => 
    processDelivery(apiKey, delivery)
  );
  
  const results = await Promise.all(analyticsPromises);
  return results.filter(Boolean) as AnalyticsResult[];
}

async function processDelivery(apiKey: string, delivery: EmailDelivery) {
  try {
    // Fetch events for this delivery
    const events = await fetchDeliveryEvents(apiKey, delivery.messageId ?? '');
    
    // Process events to determine status
    const { newStatus, updateData } = processDeliveryEvents(events, delivery.status);
    
    // Update delivery if needed
    if (shouldUpdateDelivery(delivery.status, newStatus, updateData)) {
      await updateDeliveryStatus(delivery.id, { ...updateData, status: newStatus });
    }
    
    return {
      contactId: delivery.contactId,
      messageId: delivery.messageId ?? '',
      events,
      status: newStatus
    };
  } catch (error) {
    console.error(`Error processing delivery ${delivery.id}:`, error);
    return null;
  }
}

async function fetchDeliveryEvents(apiKey: string, messageId: string, retryCount = 0) {
  try {
    const response = await axios.get(`https://api.brevo.com/v3/smtp/statistics/events`, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      params: {
        messageId,
      },
    });
    
    return response.data.events ?? [];
  } catch (error) {
    // Check if it's a rate limit error (429)
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      // Get reset time from headers, or use default of 10 seconds
      const resetTime = parseInt(error.response.headers['x-sib-ratelimit-reset'] ?? '10', 10);
      console.log(`Rate limited. Waiting ${resetTime} seconds before retry for messageId ${messageId}`);
      
      // Wait for the reset time plus a small jitter
      const jitter = Math.random() * 1000; // Add random 0-1000ms
      await new Promise(resolve => setTimeout(resolve, (resetTime * 1000) + jitter));
      
      // Retry with incremented retry count (max 3 retries)
      if (retryCount < 3) {
        console.log(`Retrying request for messageId ${messageId} (attempt ${retryCount + 1})`);
        return fetchDeliveryEvents(apiKey, messageId, retryCount + 1);
      }
    }
    
    console.error(`Error fetching events for message ${messageId}:`, error);
    return [];
  }
}

function processDeliveryEvents(events: BrevoEvent[], currentStatus: EmailStatus) {
  let hasOpened = false;
  let hasClicked = false;
  let hasBounced = false;
  let latestOpenedAt = null;
  let latestClickedAt = null;
  
  // Process each event
  for (const event of events) {
    if (event.event === 'opened' && (!hasOpened || new Date(event.date) > new Date(latestOpenedAt ?? 0))) {
      hasOpened = true;
      latestOpenedAt = event.date;
    }
    if (event.event === 'clicked' && (!hasClicked || new Date(event.date) > new Date(latestClickedAt ?? 0))) {
      hasClicked = true;
      latestClickedAt = event.date;
    }
    if (event.event === 'bounced') {
      hasBounced = true;
    }
  }
  
  // Determine new status and update data
  const updateData: EmailDeliveryUpdateData = {};
  let newStatus = currentStatus;
  
  if (hasClicked) {
    newStatus = 'CLICKED';
    updateData.clickedAt = latestClickedAt ? new Date(latestClickedAt) : null;
  } else if (hasOpened) {
    newStatus = 'OPENED';
    updateData.openedAt = latestOpenedAt ? new Date(latestOpenedAt) : null;
  } else if (hasBounced) {
    newStatus = 'BOUNCED';
  }
  
  return { newStatus, updateData };
}

function shouldUpdateDelivery(
  currentStatus: EmailStatus, 
  newStatus: EmailStatus, 
  updateData: EmailDeliveryUpdateData
): boolean {
  return newStatus !== currentStatus || 
         !!updateData.clickedAt || 
         !!updateData.openedAt;
}

async function updateDeliveryStatus(deliveryId: string, updateData: EmailDeliveryUpdateData) {
  await prisma.emailDelivery.update({
    where: { id: deliveryId },
    data: updateData
  });
}

async function calculateCampaignStats(campaignId: string) {
  const stats = await prisma.emailDelivery.groupBy({
    by: ['status'],
    where: { campaignId },
    _count: true
  });
  
  return stats.reduce((acc, stat) => {
    acc[stat.status] = stat._count;
    return acc;
  }, {} as Record<string, number>);
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  [key: string]: unknown;
}

function formatAnalyticsResponse(campaign: Campaign, stats: Record<string, number>, deliveries: AnalyticsResult[]) {
  return {
    success: true,
    campaign: {
      id: campaign.id,
      name: campaign.name,
      subject: campaign.subject,
      stats
    },
    deliveries
  };
}

// Refactored to reduce complexity
export async function getBrevoSenders(apiKey: string) {
  try {
    console.log('[Brevo] Fetching all senders');
    const response = await axios.get('https://api.brevo.com/v3/senders', {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      success: true,
      senders: response.data.senders ?? []
    };
  } catch (error) {
    return handleBrevoApiError(error, 'Error fetching senders');
  }
}

// Helper function to handle errors consistently
function handleBrevoApiError(error: unknown, message: string) {
  console.error(`[Brevo] ${message}:`, error);
  
  if (axios.isAxiosError(error)) {
    console.error('[Brevo] API Response:', error.response?.data);
  }
  
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error',
    senders: []
  };
}

// Refactored createBrevoSender to reduce complexity
export async function createBrevoSender(apiKey: string, name: string, email: string) {
  try {
    console.log(`[Brevo] Creating new sender: ${name} <${email}>`);
    
    // Check if sender already exists
    const status = await checkBrevoSenderStatus(apiKey, email);
    
    if (status.exists) {
      return handleExistingSender(apiKey, status, name, email);
    }
    
    // Create new sender
    return await createNewSender(apiKey, name, email);
  } catch (error) {
    console.error('[Brevo] Error creating sender:', error);
    
    // Return consistent error format
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

interface SenderStatus {
  exists: boolean;
  isVerified?: boolean;
  status?: string;
  id?: number | null;
  error?: string;
}

async function handleExistingSender(apiKey: string, status: SenderStatus, name: string, email: string) {
  console.log(`[Brevo] Sender with email ${email} already exists in Brevo with ID ${status.id}`);
  
  try {
    console.log(`[Brevo] Attempting to create as a new sender anyway`);
    const response = await createSenderRequest(apiKey, name, email);
    
    console.log(`[Brevo] Sender creation response: ${response.status}`, response.data);
    
    return {
      success: true,
      sender: response.data
    };
  } catch {
    console.log(`[Brevo] Could not create duplicate sender, but will proceed as it exists in Brevo`);
    return {
      success: true,
      sender: { id: status.id, email, name },
      message: "Sender already exists in Brevo"
    };
  }
}

async function createNewSender(apiKey: string, name: string, email: string) {
  const response = await createSenderRequest(apiKey, name, email);
  console.log(`[Brevo] Sender creation response: ${response.status}`, response.data);
  
  return {
    success: true,
    sender: response.data
  };
}

async function createSenderRequest(apiKey: string, name: string, email: string) {
  return axios.post(
    'https://api.brevo.com/v3/senders',
    { name, email },
    {
      headers: {
        'api-key': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      timeout: 30000,
    }
  );
}

// Refactored checkBrevoSenderStatus to reduce complexity
export async function checkBrevoSenderStatus(apiKey: string, email: string) {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < maxRetries) {
    try {
      console.log(`[Brevo] Checking sender status for ${email} (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Get all senders
      const senders = await fetchBrevoSenders(apiKey);
      
      // Find the matching sender
      const sender = findSenderByEmail(senders, email);
      
      if (!sender) {
        console.log(`[Brevo] Sender ${email} not found in Brevo`);
        return { exists: false, isVerified: false, id: null };
      }
      
      console.log(`[Brevo] Sender ${email} found with status: active=${sender.active}, id=${sender.id}`);
      return { 
        exists: true, 
        isVerified: sender.active ?? false,
        status: sender.active ? 'VERIFIED' : 'PENDING',
        id: sender.id
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount++;
      
      // Handle specific error types
      if (shouldRetryRequest(error)) {
        const delayMs = 1000 * retryCount;
        console.log(`[Brevo] Retrying in ${delayMs}ms...`);
        await delay(delayMs);
        continue;
      }
      
      // If not retryable or reached max retries, break
      if (retryCount >= maxRetries) {
        console.error(`[Brevo] Max retries reached. Giving up.`);
        break;
      }
    }
  }
  
  // Return default response if all retries failed
  console.error('[Brevo] All attempts failed when checking sender status');
  return { 
    exists: false, 
    isVerified: false, 
    id: null, 
    error: lastError ? lastError.message : 'Unknown error'
  };
}

async function fetchBrevoSenders(apiKey: string) {
  const response = await axios.get('https://api.brevo.com/v3/senders', {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    timeout: 30000,
  });
  
  return response.data.senders ?? [];
}

function findSenderByEmail(senders: BrevoSender[], email: string) {
  // Normalize email to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase().trim();
  return senders.find(s => s.email.toLowerCase().trim() === normalizedEmail);
}

function shouldRetryRequest(error: unknown) {
  if (axios.isAxiosError(error)) {
    // Retry on rate limiting or server errors
    if (error.response?.status === 429 || (error.response?.status ?? 0) >= 500) {
      return true;
    }
    
    // Retry on connection errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return true;
    }
  }
  
  return false;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Request verification for a sender
 * This completely revised function uses multiple methods to try to trigger verification
 */
export async function requestBrevoSenderVerification(apiKey: string, name: string, email: string) {
  try {
    console.log(`[Brevo] Requesting verification for sender: ${email}`);
    
    // First check if sender exists
    const status = await checkBrevoSenderStatus(apiKey, email);
    
    // Handle status error
    if ('error' in status) {
      return { 
        success: false, 
        error: `Unable to check sender status: ${status.error}`
      };
    }
    
    // If sender already exists and is verified, return success
    if (status.exists && status.isVerified) {
      console.log(`[Brevo] Sender ${email} is already verified`);
      return { 
        success: true, 
        exists: true, 
        isVerified: true,
        message: "Sender is already verified"
      };
    }
    
    // If sender doesn't exist, create it first
    if (!status.exists) {
      const createResult = await createSenderIfNotExists(apiKey, name, email);
      if (!createResult.success) {
        return createResult;
      }
      
      // Update status with the new info after creation
      const updatedStatus = await checkBrevoSenderStatus(apiKey, email);
      if (!updatedStatus.exists) {
        return {
          success: false,
          error: "Failed to create sender - not found after creation"
        };
      }
      
      Object.assign(status, updatedStatus);
    }
    
    // For verification, send a custom email with instructions
    return await sendVerificationEmail(apiKey, email);
  } catch (error) {
    console.error('[Brevo] Error requesting verification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function createSenderIfNotExists(apiKey: string, name: string, email: string) {
  try {
    console.log(`[Brevo] Sender doesn't exist, creating it first`);
    const createResult = await createBrevoSender(apiKey, name, email);
    
    if (!createResult.success) {
      return {
        success: false,
        error: 'error' in createResult ? createResult.error : "Failed to create sender"
      };
    }
    
    return { success: true };
  } catch (error) {
    if (axios.isAxiosError(error) && 
        error.response?.status === 400 && 
        error.response?.data?.code === 'duplicate_parameter') {
      // This is fine - the sender already exists
      console.log(`[Brevo] Sender already exists in Brevo, continuing with validation`);
      return { success: true };
    } else {
      // Some other error occurred
      throw error;
    }
  }
}

async function sendVerificationEmail(apiKey: string, email: string) {
  try {
    console.log(`[Brevo] Sending verification instructions to: ${email}`);
    
    // Send a custom email with instructions and verification link
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { 
          email: "noreply@brevo.com", 
          name: "Brevo Verification" 
        },
        to: [{ email }],
        subject: "Verify your sender email for Brevo",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #0055a4; margin-bottom: 20px;">Verify Your Sender Email</h2>
            
            <p>Hello,</p>
            
            <p>You've requested to verify the email address <strong>${email}</strong> as a sender in Brevo.</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #0055a4; padding: 15px; margin: 20px 0;">
              <p style="margin-top: 0;"><strong>Important:</strong> You should receive a separate verification email directly from Brevo within a few minutes. Please check your inbox and spam folder for that email and click the verification link.</p>
            </div>
            
            <p>If you don't receive the verification email, please follow these steps:</p>
            
            <ol style="margin-bottom: 20px;">
              <li>Log in to your <a href="https://app.brevo.com/senders" style="color: #0055a4; text-decoration: underline;">Brevo account</a></li>
              <li>Navigate to "Senders &amp; IP" in the settings menu</li>
              <li>Find this email address in the list</li>
              <li>Click on the "Verify" button next to your email</li>
            </ol>
            
            <p>Verification is required to ensure that you're authorized to send emails from this address and helps maintain good deliverability.</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't request this verification, please ignore this email.</p>
          </div>
        `,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000,
      }
    );
    
    console.log(`[Brevo] Transactional email response: ${response.status}`, response.data);
    
    // Also try triggering verification through the API
    await triggerVerificationThroughAPI(apiKey, email);
    
    return { 
      success: true,
      needsVerification: true, 
      message: "Verification instructions have been sent to your email. Please check your inbox and spam folder for a verification email from Brevo and follow the instructions to complete verification."
    };
  } catch (error) {
    console.error('[Brevo] Error sending verification instructions:', error);
    
    return {
      success: false,
      error: "Failed to send verification instructions. Please try again later or verify directly through the Brevo web interface."
    };
  }
}

async function triggerVerificationThroughAPI(apiKey: string, email: string) {
  try {
    console.log(`[Brevo] Additionally attempting direct API verification for: ${email}`);
    await axios.post(
      'https://api.brevo.com/v3/senders',
      { name: email.split('@')[0], email },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
      }
    );
  } catch {  
    console.log(`[Brevo] Supplementary API call resulted in expected error (likely duplicate sender)`);
  }
}

/**
 * Confirm sender verification with OTP code
 */
export async function confirmBrevoSenderVerification(apiKey: string, email: string, code: string) {
  try {
    console.log(`[Brevo] Confirming verification for sender: ${email} with code: ${code}`);
    
    // First check if the sender is already verified
    const status = await checkBrevoSenderStatus(apiKey, email);
    
    if (status.isVerified) {
      console.log(`[Brevo] Sender ${email} is already verified`);
      return { 
        success: true, 
        verified: true,
        message: "Sender has been successfully verified" 
      };
    }

    // If we have a sender ID, try the official Brevo validation endpoint with OTP
    if (status.id) {
      return await validateSenderWithOTP(apiKey, status.id, code, email);
    } else {
      return {
        success: false,
        verified: false,
        error: "Sender ID not found. Please try recreating the sender."
      };
    }
  } catch (error) {
    console.error("Error confirming sender verification:", error);
    
    return { 
      success: false, 
      error: "Failed to verify the sender. Please try again or verify directly in the Brevo web interface."
    };
  }
}

async function validateSenderWithOTP(apiKey: string, senderId: number, code: string, email: string) {
  try {
    console.log(`[Brevo] Using official Brevo validation endpoint for sender ID: ${senderId} with OTP: ${code}`);
    
    // Using the exact format from the example you provided
    const response = await axios({
      method: 'PUT',
      url: `https://api.brevo.com/v3/senders/${senderId}/validate`,
      headers: {
        'api-key': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      data: {
        otp: parseInt(code, 10) // Convert the code to a number as shown in the example
      }
    });
    
    console.log(`[Brevo] Validation response: ${response.status}`, response.data);
    
    // Check if verification was successful
    const updatedStatus = await checkBrevoSenderStatus(apiKey, email);
    if (updatedStatus.isVerified) {
      return { 
        success: true, 
        verified: true,
        message: "Sender has been successfully verified" 
      };
    }
    
    // If the API call was successful but the sender is still not verified,
    // it might take a moment for Brevo to update the status
    return {
      success: true,
      verified: false,
      message: "Verification request was accepted. It may take a few moments for verification to complete. Please check status again."
    };
  } catch (error) {
    console.error("[Brevo] Error validating sender:", error);
    
    // If the API call failed, return an error message
    if (axios.isAxiosError(error) && error.response) {
      console.error("[Brevo] API Response:", error.response.data);
      
      // Check for specific error messages
      if (error.response.status === 400) {
        return {
          success: false,
          verified: false,
          error: "Invalid verification code. Please check and try again."
        };
      }
    }
    
    return {
      success: false,
      verified: false,
      error: "Failed to verify sender. Please try again or verify directly through the Brevo website."
    };
  }
}


/**
 * Delete a sender from Brevo
 */
export async function deleteBrevoSender(apiKey: string, senderId: number | string) {
  try {
    console.log(`[Brevo] Deleting sender with ID: ${senderId}`);
    
    // Using the exact format as in the Brevo example
    const response = await axios({
      method: 'DELETE',
      url: `https://api.brevo.com/v3/senders/${senderId}`,
      headers: {
        'api-key': apiKey,
        'accept': 'application/json'
      }
    });
    
    console.log(`[Brevo] Delete response: ${response.status}`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Brevo] Error deleting sender:', error);
    if (axios.isAxiosError(error)) {
      console.error('[Brevo] API Response:', error.response?.data);
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a sender from Brevo by email
 */
export async function deleteBrevoSenderByEmail(apiKey: string, email: string) {
  try {
    console.log(`[Brevo] Deleting sender with email: ${email}`);
    
    // First check if the sender exists and get its ID
    const status = await checkBrevoSenderStatus(apiKey, email);
    
    if (!status.exists) {
      console.log(`[Brevo] Sender with email ${email} not found in Brevo`);
      return { success: false, error: "Sender not found in Brevo" };
    }
    
    if (!status.id) {
      console.log(`[Brevo] Sender ID for email ${email} not found`);
      return { success: false, error: "Sender ID not found" };
    }
    
    console.log(`[Brevo] Found sender ID for ${email}: ${status.id}`);
    
    // Now delete the sender using its ID
    return await deleteBrevoSender(apiKey, status.id);
  } catch (error) {
    console.error('[Brevo] Error deleting sender by email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}