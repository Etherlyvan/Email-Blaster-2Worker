// workers/scheduler-worker.ts
import { connectToRabbitMQ, EMAIL_QUEUE, SCHEDULER_QUEUE, sendToQueue } from '../lib/rabbitmq';
import { prisma } from '../lib/db';

async function processSchedulerQueue() {
  try {
    const { channel, connection } = await connectToRabbitMQ();
    
    console.log('Scheduler worker started, waiting for messages...');
    
    // Process messages from SCHEDULER_QUEUE
    channel.consume(SCHEDULER_QUEUE, async (msg) => {
      if (!msg) return;
      
      try {
        const data = JSON.parse(msg.content.toString());
        const { campaignId, scheduledTime } = data;
        console.log(`Received scheduler task for campaign ${campaignId}, scheduled for ${scheduledTime}`);
        
        if (!scheduledTime) {
          console.warn(`Campaign ${campaignId} has no scheduledTime, acknowledging without action`);
          channel.ack(msg);
          return;
        }
        
        // Verify campaign exists and status is SCHEDULED
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId }
        });
        
        if (!campaign) {
          console.warn(`Campaign ${campaignId} not found, acknowledging message`);
          channel.ack(msg);
          return;
        }
        
        // If campaign is not yet SCHEDULED, update its status
        if (campaign.status !== 'SCHEDULED') {
          console.log(`Setting campaign ${campaignId} status to SCHEDULED`);
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { 
              status: 'SCHEDULED',
              schedule: new Date(scheduledTime)
            }
          });
        }
        
        // Make sure schedule is stored correctly
        if (!campaign.schedule) {
          console.log(`Updating campaign ${campaignId} schedule to ${scheduledTime}`);
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { schedule: new Date(scheduledTime) }
          });
        }
        
        console.log(`Campaign ${campaignId} verified as SCHEDULED for ${scheduledTime}`);
        console.log(`It will be sent automatically at the scheduled time`);
        
        // Acknowledge message - campaign will be checked by periodic function
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing scheduler task:', error);
        // Requeue if temporary error
        channel.nack(msg, false, true);
      }
    });
    
    // Check scheduled campaigns periodically
    const checkScheduledCampaigns = async () => {
      try {
        const now = new Date();
        console.log(`[Scheduler] Checking for scheduled campaigns at ${now.toISOString()}`);
        
        // Find campaigns that are scheduled to be sent now or in the past
        const scheduledCampaigns = await prisma.campaign.findMany({
          where: {
            status: 'SCHEDULED',
            schedule: {
              lte: now,
            },
          },
        });
        
        console.log(`[Scheduler] Found ${scheduledCampaigns.length} campaigns ready to be sent`);
        
        // Process each scheduled campaign
        for (const campaign of scheduledCampaigns) {
          console.log(`[Scheduler] Processing scheduled campaign: ${campaign.id}, scheduled for: ${campaign.schedule?.toISOString()}`);
          
          try {
            // Update campaign status to SENDING
            await prisma.campaign.update({
              where: { id: campaign.id },
              data: { status: 'SENDING' },
            });
            
            console.log(`[Scheduler] Updated campaign ${campaign.id} status to SENDING`);
            
            // Send to email queue for processing
            await sendToQueue(EMAIL_QUEUE, { 
              campaignId: campaign.id,
              fromScheduler: true,  // Add a flag to indicate this came from the scheduler
            });
            
            console.log(`[Scheduler] Campaign ${campaign.id} sent to EMAIL_QUEUE for processing`);
          } catch (updateError) {
            console.error(`[Scheduler] Error processing scheduled campaign ${campaign.id}:`, updateError);
          }
        }
      } catch (error) {
        console.error('[Scheduler] Error checking scheduled campaigns:', error);
      }
      
      // Schedule next check (every 30 seconds for more precise scheduling)
      setTimeout(checkScheduledCampaigns, 30000);
    };
    
    // Start periodic check immediately
    console.log('Starting periodic check for scheduled campaigns');
    checkScheduledCampaigns();
    
    // Handle application shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down scheduler worker...');
      await channel.close();
      await connection.close();
      await prisma.$disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Shutting down scheduler worker...');
      await channel.close();
      await connection.close();
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Fatal error in scheduler worker:', error);
    process.exit(1);
  }
}

console.log('Starting scheduler worker...');
processSchedulerQueue().catch(error => {
  console.error('Fatal error in scheduler worker:', error);
  process.exit(1);
});