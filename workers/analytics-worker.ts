// workers/analytics-worker.ts
import { prisma } from '../lib/db';
import { EmailStatus } from '@prisma/client'; // Add Prisma import
import axios from 'axios';

// Interface for Brevo event
interface BrevoEvent {
  event: string;
  date: string;
  [key: string]: unknown;
}

// Interface for email delivery
interface EmailDelivery {
  id: string;
  messageId: string | null;
  contactId: string;
  campaignId: string;
  status: EmailStatus;
  openedAt?: Date | null;
  clickedAt?: Date | null;
  errorMessage?: string | null;
}

// Interface for update data
interface EmailDeliveryUpdateData {
  status?: EmailStatus;
  openedAt?: Date | null;
  clickedAt?: Date | null;
  errorMessage?: string | null;
}

// Maximum number of campaigns to process in one batch
const MAX_CAMPAIGNS_PER_BATCH = 5;

// Maximum number of message IDs to batch in a single request
const MAX_MESSAGES_PER_BATCH = 10;

// Delay between campaigns in milliseconds
const DELAY_BETWEEN_CAMPAIGNS = 10000; // 10 seconds

// Delay between API requests in milliseconds
const DELAY_BETWEEN_REQUESTS = 500; // 0.5 seconds

// Sync interval in milliseconds (default: 1 hour)
const SYNC_INTERVAL = 60 * 60 * 1000;

async function syncCampaignAnalytics() {
  try {
    console.log('Starting analytics sync job');
    
    // Get campaigns that were sent in the last 30 days and have status SENT or SENDING
    const recentCampaigns = await prisma.campaign.findMany({
      where: {
        status: { in: ['SENT', 'SENDING'] },
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        }
      },
      include: {
        brevoKey: true
      },
      orderBy: {
        updatedAt: 'desc' // Process most recent campaigns first
      },
      take: 20 // Limit to 20 campaigns per run
    });
    
    console.log(`Found ${recentCampaigns.length} recent campaigns to sync analytics`);
    
    // Process campaigns in smaller batches
    for (let i = 0; i < recentCampaigns.length; i += MAX_CAMPAIGNS_PER_BATCH) {
      const campaignBatch = recentCampaigns.slice(i, i + MAX_CAMPAIGNS_PER_BATCH);
      
      console.log(`Processing batch of ${campaignBatch.length} campaigns (${i+1} to ${Math.min(i+MAX_CAMPAIGNS_PER_BATCH, recentCampaigns.length)} of ${recentCampaigns.length})`);
      
      // Process each campaign in the batch
      for (const campaign of campaignBatch) {
        if (!campaign.brevoKeyId) {
          console.log(`Campaign ${campaign.id} has no Brevo key, skipping`);
          continue;
        }
        
        try {
          console.log(`Syncing analytics for campaign ${campaign.id}`);
          await processCampaignAnalytics(campaign.brevoKeyId, campaign.id);
          console.log(`Successfully synced analytics for campaign ${campaign.id}`);
        } catch (error) {
          console.error(`Error syncing analytics for campaign ${campaign.id}:`, error);
        }
        
        // Add a delay between campaigns
        console.log(`Waiting ${DELAY_BETWEEN_CAMPAIGNS/1000} seconds before processing next campaign...`);
        await delay(DELAY_BETWEEN_CAMPAIGNS);
      }
    }
    
    console.log('Analytics sync job completed');
  } catch (error) {
    console.error('Error in analytics sync job:', error);
  }
}

// Main function to process a single campaign's analytics
async function processCampaignAnalytics(brevoKeyId: string, campaignId: string) {
  // Get the Brevo key
  const brevoKey = await findAndValidateBrevoKey(brevoKeyId);
  
  // Get all deliveries for this campaign that have message IDs
  const deliveries = await prisma.emailDelivery.findMany({
    where: {
      campaignId: campaignId,
      messageId: { not: null },
      status: { notIn: ['BOUNCED', 'FAILED'] } // Skip already failed/bounced messages
    }
  });
  
  console.log(`Processing ${deliveries.length} deliveries for campaign ${campaignId}`);
  
  if (deliveries.length === 0) {
    console.log(`No deliveries to sync for campaign ${campaignId}`);
    return;
  }
  
  // Process deliveries in batches to avoid rate limiting
  for (let i = 0; i < deliveries.length; i += MAX_MESSAGES_PER_BATCH) {
    const deliveryBatch = deliveries.slice(i, i + MAX_MESSAGES_PER_BATCH);
    
    if (i > 0 && i % 20 === 0) {
      console.log(`Processed ${i} of ${deliveries.length} deliveries for campaign ${campaignId}`);
    }
    
    // Process each delivery in the batch
    for (const delivery of deliveryBatch) {
      await processDelivery(brevoKey.apiKey, delivery);
      
      // Add a short delay between API requests to avoid rate limiting
      await delay(DELAY_BETWEEN_REQUESTS);
    }
  }
  
  // Calculate campaign stats after processing all deliveries
  const stats = await calculateCampaignStats(campaignId);
  console.log(`Campaign ${campaignId} stats:`, stats);
}

// Helper function to find and validate Brevo key
async function findAndValidateBrevoKey(brevoKeyId: string) {
  const brevoKey = await prisma.brevoKey.findUnique({
    where: { id: brevoKeyId },
  });

  if (!brevoKey) {
    throw new Error('Brevo key not found');
  }
  
  return brevoKey;
}

// Process a single delivery
async function processDelivery(apiKey: string, delivery: EmailDelivery) {
  try {
    if (!delivery.messageId) {
      return null;
    }
    
    // Fetch events for this delivery with retry logic
    const events = await fetchDeliveryEvents(apiKey, delivery.messageId);
    
    // Process events to determine status
    const { newStatus, updateData } = processDeliveryEvents(events, delivery.status);
    
    // Update delivery if needed
    if (shouldUpdateDelivery(delivery.status, newStatus, updateData)) {
      await updateDeliveryStatus(delivery.id, { ...updateData, status: newStatus });
    }
    
    return {
      contactId: delivery.contactId,
      messageId: delivery.messageId,
      events,
      status: newStatus
    };
  } catch (error) {
    console.error(`Error processing delivery ${delivery.id}:`, error);
    return null;
  }
}

// Fetch events with retry logic and improved error handling
async function fetchDeliveryEvents(apiKey: string, messageId: string, retryCount = 0): Promise<BrevoEvent[]> {
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
      await delay((resetTime * 1000) + jitter);
      
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

// Process events to determine email status
function processDeliveryEvents(events: BrevoEvent[], currentStatus: EmailStatus): {
  newStatus: EmailStatus; 
  updateData: EmailDeliveryUpdateData;
} {
  let hasOpened = false;
  let hasClicked = false;
  let hasBounced = false;
  let latestOpenedAt: string | null = null;
  let latestClickedAt: string | null = null;
  
  // Process each event
  for (const event of events) {
    if (event.event === 'opened') {
      if (!hasOpened || !latestOpenedAt || new Date(event.date) > new Date(latestOpenedAt)) {
        hasOpened = true;
        latestOpenedAt = event.date;
      }
    }
    
    if (event.event === 'clicked') {
      if (!hasClicked || !latestClickedAt || new Date(event.date) > new Date(latestClickedAt)) {
        hasClicked = true;
        latestClickedAt = event.date;
      }
    }
    
    if (event.event === 'bounced') {
      hasBounced = true;
    }
  }
  
  // Determine new status and update data
  const updateData: EmailDeliveryUpdateData = {};
  let newStatus = currentStatus;
  
  // Status progression: SENT -> OPENED -> CLICKED
  // Only update to a "higher" status, never downgrade
  if (hasClicked && currentStatus !== 'CLICKED') {
    newStatus = 'CLICKED';
    updateData.clickedAt = latestClickedAt ? new Date(latestClickedAt) : null;
  } else if (hasOpened && currentStatus !== 'CLICKED' && currentStatus !== 'OPENED') {
    newStatus = 'OPENED';
    updateData.openedAt = latestOpenedAt ? new Date(latestOpenedAt) : null;
  } else if (hasBounced && currentStatus !== 'BOUNCED') {
    newStatus = 'BOUNCED';
  }
  
  return { newStatus, updateData };
}

// Check if delivery needs to be updated
function shouldUpdateDelivery(
  currentStatus: EmailStatus, 
  newStatus: EmailStatus, 
  updateData: EmailDeliveryUpdateData
): boolean {
  return newStatus !== currentStatus || 
         !!updateData.clickedAt || 
         !!updateData.openedAt;
}

// Update delivery status in database
async function updateDeliveryStatus(deliveryId: string, updateData: EmailDeliveryUpdateData) {
  await prisma.emailDelivery.update({
    where: { id: deliveryId },
    data: updateData
  });
}

// Calculate campaign stats
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

// Helper function for delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the sync job according to schedule
async function startAnalyticsSyncJob() {
  console.log('Starting initial analytics sync...');
  
  // Run immediately on startup
  await syncCampaignAnalytics();
  
  // Then set up recurring interval
  console.log(`Setting up recurring analytics sync every ${SYNC_INTERVAL / 1000 / 60} minutes`);
  
  setInterval(async () => {
    try {
      console.log('Running scheduled analytics sync...');
      await syncCampaignAnalytics();
    } catch (error) {
      console.error('Error in scheduled analytics sync:', error);
    }
  }, SYNC_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down analytics worker...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down analytics worker...');
  await prisma.$disconnect();
  process.exit(0);
});

console.log('Starting analytics sync worker...');
startAnalyticsSyncJob().catch(error => {
  console.error('Fatal error in analytics sync worker:', error);
  process.exit(1);
});