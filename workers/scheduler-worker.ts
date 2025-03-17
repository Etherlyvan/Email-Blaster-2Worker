// workers/scheduler-worker.ts
import { connectToRabbitMQ, EMAIL_QUEUE, SCHEDULER_QUEUE,sendToQueue } from '../lib/rabbitmq';
import { prisma } from '../lib/db';

async function processSchedulerQueue() {
  const { channel, connection } = await connectToRabbitMQ();
  
  console.log('Scheduler worker started, waiting for messages...');
  
  // Process scheduler tasks (for newly scheduled campaigns)
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
      
      // Verify the campaign exists and is in SCHEDULED status
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      });
      
      if (!campaign) {
        console.warn(`Campaign ${campaignId} not found, acknowledging message`);
        channel.ack(msg);
        return;
      }
      
      if (campaign.status !== 'SCHEDULED') {
        console.warn(`Campaign ${campaignId} is not in SCHEDULED status (current: ${campaign.status}), acknowledging message`);
        channel.ack(msg);
        return;
      }
      
      console.log(`Campaign ${campaignId} verified as SCHEDULED for ${scheduledTime}`);
      
      // Simply acknowledge the message - we'll check for scheduled campaigns in the periodic task
      channel.ack(msg);
    } catch (error) {
      console.error('Error processing scheduler task:', error);
      // Requeue the message if it's a temporary error
      channel.nack(msg, false, true);
    }
  });
  
  // Check for scheduled campaigns periodically
  const checkScheduledCampaigns = async () => {
    try {
      const now = new Date();
      console.log(`Checking for scheduled campaigns at ${now.toISOString()}`);
      
      // Find campaigns that are scheduled to be sent now or in the past
      const scheduledCampaigns = await prisma.campaign.findMany({
        where: {
          status: 'SCHEDULED',
          schedule: {
            lte: now,
          },
        },
      });
      
      console.log(`Found ${scheduledCampaigns.length} campaigns ready to be sent`);
      
      // Process each scheduled campaign
      for (const campaign of scheduledCampaigns) {
        console.log(`Processing scheduled campaign: ${campaign.id}, scheduled for: ${campaign.schedule}`);
        
        try {
          // Update campaign status to SENDING
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'SENDING' },
          });
          
          console.log(`Updated campaign ${campaign.id} status to SENDING`);
          
          // Send to email queue for processing
          await sendToQueue(EMAIL_QUEUE, { campaignId: campaign.id });
          
          console.log(`Campaign ${campaign.id} sent to EMAIL_QUEUE for processing`);
        } catch (updateError) {
          console.error(`Error processing scheduled campaign ${campaign.id}:`, updateError);
        }
      }
    } catch (error) {
      console.error('Error checking scheduled campaigns:', error);
    }
    
    // Schedule next check (every minute)
    setTimeout(checkScheduledCampaigns, 60000);
  };
  
  // Start the periodic check immediately
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
}

console.log('Starting scheduler worker...');
processSchedulerQueue().catch(error => {
  console.error('Fatal error in scheduler worker:', error);
  process.exit(1);
});