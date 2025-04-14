// workers/analytics-worker.ts
import { prisma } from '../lib/db';
import { getEmailAnalytics } from '../lib/brevo';

async function syncCampaignAnalytics() {
  try {
    console.log('Starting analytics sync job');
    
    // Get campaigns that were sent in the last 30 days
    const recentCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'SENT',
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        }
      },
      include: {
        brevoKey: true
      }
    });
    
    console.log(`Found ${recentCampaigns.length} recent campaigns to sync analytics`);
    
    for (const campaign of recentCampaigns) {
      if (!campaign.brevoKeyId) {
        console.log(`Campaign ${campaign.id} has no Brevo key, skipping`);
        continue;
      }
      
      try {
        console.log(`Syncing analytics for campaign ${campaign.id}`);
        await getEmailAnalytics(campaign.brevoKeyId, campaign.id);
        console.log(`Successfully synced analytics for campaign ${campaign.id}`);
      } catch (error) {
        console.error(`Error syncing analytics for campaign ${campaign.id}:`, error);
      }
      
      // Add a small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Analytics sync job completed');
  } catch (error) {
    console.error('Error in analytics sync job:', error);
  }
}

// Run the sync job every hour
const SYNC_INTERVAL = 60 * 60 * 1000; // 1 hour

async function startAnalyticsSyncJob() {
  // Run immediately on startup
  await syncCampaignAnalytics();
  
  // Then set up recurring interval
  setInterval(async () => {
    try {
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