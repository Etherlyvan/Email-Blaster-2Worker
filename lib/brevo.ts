// lib/brevo.ts - Fixed version

import axios from 'axios';
import nodemailer from 'nodemailer';
import { prisma } from './db';
import { EmailStatus } from '@prisma/client';

// Define types for Brevo API responses
interface BrevoSender {
  email: string;
  name?: string;
  active?: boolean;
  id?: number ;
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
interface BrevoSenderResponse {
  id: number;
  name: string;
  email: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type CreateBrevoSenderResult = 
| { success: true; sender: BrevoSenderResponse; message?: string }
| { success: false; error: string };

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
    
    // Use the exact format specified in the Brevo documentation
    const response = await axios.get('https://api.brevo.com/v3/senders', {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    // The response should contain a "senders" array
    if (response.data && Array.isArray(response.data.senders)) {
      return {
        success: true,
        senders: response.data.senders
      };
    } else {
      console.error('[Brevo] Unexpected response format:', response.data);
      return { 
        success: false, 
        error: 'Unexpected response format from Brevo API',
        senders: []
      };
    }
  } catch (error) {
    console.error(`[Brevo] Error fetching senders:`, error);
    
    if (axios.isAxiosError(error)) {
      console.error('[Brevo] API Response:', error.response?.data);
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        senders: []
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      senders: []
    };
  }
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

async function handleExistingSender(
  apiKey: string, 
  status: SenderStatus, 
  name: string, 
  email: string
): Promise<CreateBrevoSenderResult> {
  if (!status.id) {
    return {
      success: false,
      error: "Invalid sender ID"
    };
  }

  console.log(`[Brevo] Sender with email ${email} exists in Brevo with ID ${status.id}`);
  
  try {
    console.log(`[Brevo] Attempting to create as a new sender anyway`);
    const senderResponse = await createSenderRequest(apiKey, name, email);
    const senderData = senderResponse.data;
    
    if (!senderData.id) {
      throw new Error("Sender created without ID");
    }
    
    console.log(`[Brevo] Sender creation successful:`, senderData);
    
    return {
      success: true,
      sender: senderData,
      message: "Sender already exists in Brevo"
    };
  } catch {
    console.log(`[Brevo] Could not create duplicate sender, but will proceed as it exists in Brevo`);
    return {
      success: true,
      sender: {
        id: status.id,
        name,
        email
      },
      message: "Sender already exists in Brevo"
    };
  }
}

async function createNewSender(
  apiKey: string, 
  name: string, 
  email: string
): Promise<CreateBrevoSenderResult> {
  try {
    const senderResponse = await createSenderRequest(apiKey, name, email);
    const senderData = senderResponse.data;
    
    if (!senderData.id) {
      throw new Error("Sender created without ID");
    }

    console.log(`[Brevo] Sender creation response: ${senderResponse.status}`, senderData);
    
    return {
      success: true,
      sender: senderData
    };
  } catch (err) {
    console.error('[Brevo] Error creating new sender:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create sender'
    };
  }
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
  try {
    console.log(`[Brevo] Checking sender status for ${email}`);
    
    // Get all senders from Brevo
    const response = await axios.get('https://api.brevo.com/v3/senders', {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data || !response.data.senders || !Array.isArray(response.data.senders)) {
      console.log(`[Brevo] Unexpected response format from Brevo API`);
      return { exists: false, isVerified: false, id: null };
    }
    
    // Find the matching sender (case-insensitive)
    const sender = response.data.senders.find((s: BrevoSender) => 
      s.email && s.email.toLowerCase() === email.toLowerCase()
    );
    
    if (!sender) {
      console.log(`[Brevo] Sender ${email} not found in Brevo`);
      return { exists: false, isVerified: false, id: null };
    }
    
    console.log(`[Brevo] Sender ${email} found with status: active=${sender.active}, id=${sender.id}`);
    return { 
      exists: true, 
      isVerified: sender.active === true,
      status: sender.active ? 'VERIFIED' : 'PENDING',
      id: sender.id
    };
  } catch (error) {
    console.error("Error checking sender status:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error("Brevo API error response:", error.response.data);
    }
    
    return { 
      exists: false, 
      isVerified: false, 
      id: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}


/**
 * Request verification for a sender
 * This completely revised function uses direct API calls to trigger verification
 */

export async function requestBrevoSenderVerification(apiKey: string, name: string, email: string) {
  try {
    console.log(`[Brevo] Requesting verification for sender: ${email}`);
    
    // First check if sender exists
    const status = await checkBrevoSenderStatus(apiKey, email);
    
    // If sender already exists and is verified, return success
    if (status.exists && status.isVerified) {
      return { 
        success: true, 
        isVerified: true,
        message: "Sender is already verified"
      };
    }

    // If the sender doesn't exist, create it first
    if (!status.exists) {
      const createResult = await createBrevoSender(apiKey, name, email);
      if (!createResult.success) {
        return {
          success: false,
          error: createResult.error || "Failed to create sender"
        };
      }
      
      // Wait for sender creation to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the new sender ID
      const newStatus = await checkBrevoSenderStatus(apiKey, email);
      if (!newStatus.exists || !newStatus.id) {
        return {
          success: false,
          error: "Sender not found after creation"
        };
      }
      
      status.id = newStatus.id;
    }

    // Direct API call to request verification
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await axios.post(
        `https://api.brevo.com/v3/senders/${status.id}/send-activation`,
        {},
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return { 
        success: true,
        needsVerification: true,
        message: "Verification email has been sent. Please check your inbox."
      };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // If direct API call fails, try alternative method
      console.log("Direct verification request failed, trying alternative method");
      
      // Update the sender to trigger verification
      try {
        await axios.put(
          `https://api.brevo.com/v3/senders/${status.id}`,
          { 
            name: `${name}_${Date.now()}`,  // Force update with timestamp
            email: email 
          },
          {
            headers: {
              'api-key': apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return { 
          success: true,
          needsVerification: true,
          message: "Verification request sent. Please check your email for the verification code."
        };
      } catch (updateError) {
        console.error("Failed to trigger verification:", updateError);
        return {
          success: false,
          error: "Failed to trigger verification process"
        };
      }
    }
  } catch (error) {
    console.error('[Brevo] Error in verification process:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}





/**
 * Confirm sender verification with OTP code - Using native HTTPS module
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

    // If we have a sender ID, try to validate it
    if (status.exists && status.id) {
      try {
        const senderId = status.id;
        console.log(`[Brevo] Using Brevo validation endpoint for sender ID: ${senderId} with OTP: ${code}`);
        
        // Convert code to a number (Brevo API requires numeric OTP)
        const numericCode = parseInt(code, 10);
        if (isNaN(numericCode)) {
          return {
            success: false,
            verified: false,
            error: "Verification code must be a number"
          };
        }
        
        // Log the exact request we're about to make
        console.log(`[Brevo] Sending PUT request to https://api.brevo.com/v3/senders/${senderId}/validate`);
        console.log(`[Brevo] Request payload:`, { otp: numericCode });
        
        // Make the request using fetch instead of axios to ensure exact format
        const response = await fetch(`https://api.brevo.com/v3/senders/${senderId}/validate`, {
          method: 'PUT',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({ otp: numericCode })
        });
        
        console.log(`[Brevo] Response status: ${response.status}`);
        
        // Check if response is successful
        if (response.ok) {
          let data = {};
          try {
            data = await response.json();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_) { // Using underscore for unused variable
            // It's possible there's no JSON response body for a successful request
            console.log("[Brevo] No JSON response body or empty response");
          }
          
          console.log(`[Brevo] Response data:`, data);
          
          return { 
            success: true, 
            verified: true,
            message: "Sender has been successfully verified" 
          };
        } else {
          // Handle error response
          interface ErrorResponse {
            message?: string;
            [key: string]: unknown;
          }
          
          let errorData: ErrorResponse = {};
          try {
            errorData = await response.json() as ErrorResponse;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_) { // Using underscore for unused variable
            console.log("[Brevo] Error response has no JSON body");
          }
          
          console.error("[Brevo] Error response:", errorData);
          
          // Extract error message
          const errorMessage = errorData.message || `API returned status ${response.status}`;
          
          if (typeof errorMessage === 'string') {
            if (errorMessage.includes('exhausted')) {
              return {
                success: false,
                verified: false,
                error: "Verification attempts exhausted. Please request a new verification code."
              };
            } else if (errorMessage.includes('invalid')) {
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
            error: typeof errorMessage === 'string' ? errorMessage : "Unknown error"
          };
        }
      } catch (error) {
        console.error("[Brevo] Error in verification request:", error);
        
        return {
          success: false,
          verified: false,
          error: error instanceof Error ? error.message : "Failed to verify sender"
        };
      }
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
export async function listAllBrevoSenders(apiKey: string) {
  try {
    console.log('[Brevo] Fetching all senders for debugging');
    
    const response = await axios.get('https://api.brevo.com/v3/senders', {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });
    
    if (response.data && Array.isArray(response.data.senders)) {
      // Log all senders for debugging
      console.log('[Brevo] All senders:', JSON.stringify(response.data.senders, null, 2));
      
      return {
        success: true,
        senders: response.data.senders
      };
    } else {
      console.error('[Brevo] Unexpected response format:', response.data);
      return { 
        success: false, 
        error: 'Unexpected response format from Brevo API',
        senders: []
      };
    }
  } catch (error) {
    console.error(`[Brevo] Error fetching senders:`, error);
    
    if (axios.isAxiosError(error)) {
      console.error('[Brevo] API Response:', error.response?.data);
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        senders: []
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      senders: []
    };
  }
}

/**
 * Delete a sender from Brevo
 */

export async function deleteBrevoSender(apiKey: string, senderId: number | string) {
  try {
    console.log(`[Brevo] Deleting sender with ID: ${senderId}`);
    
    // Use the correct DELETE request format
    const response = await axios({
      method: 'DELETE',
      url: `https://api.brevo.com/v3/senders/${senderId}`,
      headers: {
        'api-key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    // A 204 response means success
    console.log(`[Brevo] Delete response status: ${response.status}`);
    
    if (response.status === 204) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: `Unexpected response status: ${response.status}`
      };
    }
  } catch (error) {
    console.error('[Brevo] Error deleting sender:', error);
    
    if (axios.isAxiosError(error)) {
      // If it's a 404, the sender doesn't exist in Brevo, consider it a success
      if (error.response?.status === 404) {
        console.log(`[Brevo] Sender ${senderId} not found in Brevo, considering deletion successful`);
        return { success: true, message: "Sender not found in Brevo" };
      }
      
      // Log the error details
      console.error('[Brevo] API Response Status:', error.response?.status);
      console.error('[Brevo] API Response Data:', error.response?.data);
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message
      };
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