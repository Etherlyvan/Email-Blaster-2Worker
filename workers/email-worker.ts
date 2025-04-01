// workers/email-worker.ts
import { connectToRabbitMQ, EMAIL_QUEUE } from '../lib/rabbitmq';
import { sendEmailViaSMTP } from '../lib/brevo';
import { prisma } from '../lib/db';
import type { Campaign, CampaignStatus } from '@prisma/client';
import * as amqplib from 'amqplib';

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('CRITICAL: Uncaught exception in email worker:', error);
  // Don't exit the process, just log the error
});

interface ContactData {
  email: string;
  additionalData?: Record<string, unknown>;
  id: string;
  [key: string]: unknown;
}

// Updated interface with all required properties
interface CampaignWithRelations extends Campaign {
  id: string; // Explicitly include id
  subject: string; // Explicitly include subject
  status: CampaignStatus; // Explicitly include status
  schedule: Date | null; // Explicitly include schedule
  group: {
    groupContacts: Array<{
      contact: ContactData;
    }>;
  };
  brevoKeyId: string;
  content: string;
  senderName: string;
  senderEmail: string;
}

/**
 * Process template variables in the HTML content or subject
 * @param content The HTML content or subject with template variables
 * @param contact The contact object with data to replace variables
 * @returns Processed content with variables replaced
 */
function processTemplateVariables(content: string, contact: ContactData): string {
  let processedContent = content;
  
  // Always replace email
  processedContent = processedContent.replace(/{{email}}/g, contact.email);
  processedContent = processedContent.replace(/{email}/g, contact.email);
  
  // Replace other variables from additionalData
  if (contact.additionalData) {
    Object.entries(contact.additionalData).forEach(([key, value]) => {
      // Handle both double-bracket and single-bracket formats
      const doubleRegex = new RegExp(`{{${key}}}`, 'g');
      const singleRegex = new RegExp(`{${key}}`, 'g');
      
      // Convert value to string safely, handling objects and other types
      const safeValue = typeof value === 'object' && value !== null 
        ? JSON.stringify(value) 
        : String(value || ''); // Use empty string instead of null/undefined
      
      processedContent = processedContent.replace(doubleRegex, safeValue);
      processedContent = processedContent.replace(singleRegex, safeValue);
    });
  }
  
  // Remove any remaining template variables with empty string
  processedContent = processedContent.replace(/{{[^}]+}}/g, '');
  processedContent = processedContent.replace(/{[^}]+}/g, '');
  
  return processedContent;
}

// Function to handle email sending for a single contact
async function sendEmailToContact(
  campaign: CampaignWithRelations, 
  contact: ContactData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Process template variables in content
    const personalizedHtml = processTemplateVariables(campaign.content, contact);
    
    // Process template variables in subject
    const personalizedSubject = processTemplateVariables(campaign.subject, contact);
    
    // Update delivery status to PENDING
    await prisma.emailDelivery.update({
      where: {
        campaignId_contactId: {
          campaignId: campaign.id,
          contactId: contact.id
        }
      },
      data: {
        status: 'PENDING'
      }
    });
    
    // Send the email with personalized subject
    const result = await sendEmailViaSMTP(
      campaign.brevoKeyId,
      contact.email,
      personalizedSubject,
      personalizedHtml,
      {
        name: campaign.senderName,
        email: campaign.senderEmail,
      }
    );
    
    console.log(`Email sent to ${contact.email}, message ID: ${result.messageId}`);
    
    // Update delivery status to SENT
    await prisma.emailDelivery.update({
      where: {
        campaignId_contactId: {
          campaignId: campaign.id,
          contactId: contact.id
        }
      },
      data: {
        status: 'SENT',
        messageId: result.messageId,
        sentAt: new Date()
      }
    });
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${contact.email}:`, error);
    
    // Get error message safely
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as { message: unknown }).message);
    }
    
    // Update delivery status to FAILED
    await prisma.emailDelivery.update({
      where: {
        campaignId_contactId: {
          campaignId: campaign.id,
          contactId: contact.id
        }
      },
      data: {
        status: 'FAILED',
        errorMessage: errorMessage
      }
    });
    
    return { success: false, error: errorMessage };
  }
}

// Function to determine final campaign status
function determineCampaignStatus(successCount: number, failureCount: number, totalCount: number): CampaignStatus {
  if (failureCount === totalCount) {
    return 'FAILED';
  }
  
  if (successCount === totalCount) {
    return 'SENT';
  }
  
  if (successCount > 0) {
    return 'SENT';
  }
  
  return 'FAILED';
}

// Split the main function to reduce complexity
async function processCampaign(
  campaignId: string, 
  typedChannel: amqplib.Channel, 
  msg: amqplib.ConsumeMessage
): Promise<void> {
  console.log('Processing email task:', campaignId);
  
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      group: {
        include: {
          groupContacts: {
            include: {
              contact: true,
            },
          },
        },
      },
    },
  }) as CampaignWithRelations | null;
  
  if (!campaign) {
    console.error(`Campaign ${campaignId} not found`);
    // Acknowledge anyway since retrying won't help if campaign doesn't exist
    typedChannel.ack(msg);
    return;
  }
  
  // Check if this is a scheduled campaign
  if (campaign.status === 'SCHEDULED' && campaign.schedule) {
    const now = new Date();
    const scheduleTime = new Date(campaign.schedule);
    
    console.log(`Campaign ${campaignId} is scheduled for ${scheduleTime.toISOString()}`);
    console.log(`Current time is ${now.toISOString()}`);
    
    // If the scheduled time is in the future, don't process it now
    if (scheduleTime > now) {
      console.log(`Campaign ${campaignId} is scheduled for future delivery. Not sending now.`);
      console.log(`It will be processed by the scheduler worker at the scheduled time.`);
      
      // Acknowledge the message but don't process it
      typedChannel.ack(msg);
      return;
    }
  }

  if (!campaign.brevoKeyId) {
    console.error(`Campaign ${campaignId} has no Brevo key assigned`);
    
    // Update campaign status to FAILED
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' as CampaignStatus },
    });
    
    typedChannel.ack(msg);
    return;
  }
  
  // Update campaign status to SENDING if not already
  if (campaign.status !== 'SENDING') {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' as CampaignStatus },
    });
  }
  
  // Get contacts in the group
  const contacts = campaign.group.groupContacts.map(gc => gc.contact);
  console.log(`Campaign ${campaignId} has ${contacts.length} contacts to process`);
  
  if (contacts.length === 0) {
    console.warn(`Campaign ${campaignId} has no contacts to send to`);
    
    // Update campaign status to SENT (since there's nothing to send)
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENT' as CampaignStatus },
    });
    
    typedChannel.ack(msg);
    return;
  }
  
  await sendEmailsToCampaignContacts(campaign, contacts, typedChannel, msg);
}

async function sendEmailsToCampaignContacts(
  campaign: CampaignWithRelations, 
  contacts: ContactData[], 
  typedChannel: amqplib.Channel, 
  msg: amqplib.ConsumeMessage
): Promise<void> {
  // Create delivery records for all contacts in the campaign
  await prisma.$transaction(
    contacts.map(contact => 
      prisma.emailDelivery.upsert({
        where: {
          campaignId_contactId: {
            campaignId: campaign.id,
            contactId: contact.id
          }
        },
        update: {
          status: 'PENDING'
        },
        create: {
          campaignId: campaign.id,
          contactId: contact.id,
          status: 'PENDING'
        }
      })
    )
  );

  // Track campaign progress
  let successCount = 0;
  let failureCount = 0;
  const totalCount = contacts.length;
  
  // Send emails to all contacts in the group
  for (const contact of contacts) {
    const result = await sendEmailToContact(campaign, contact);
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Update campaign progress
    const progress = Math.round(((successCount + failureCount) / totalCount) * 100);
    console.log(`Campaign ${campaign.id} progress: ${progress}% (${successCount} sent, ${failureCount} failed)`);
    
    // Add a small delay between emails to avoid overwhelming the SMTP server
    if (contacts.length > 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Update campaign status based on results
  const finalStatus = determineCampaignStatus(successCount, failureCount, totalCount);
  
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: finalStatus },
  });
  
  console.log(`Campaign ${campaign.id} completed with status: ${finalStatus}`);
  console.log(`Success: ${successCount}, Failed: ${failureCount}, Total: ${totalCount}`);
  
  typedChannel.ack(msg);
}

async function processEmailQueue() {
  try {
    const result = await connectToRabbitMQ();
    
    // Use unknown as an intermediate step to satisfy TypeScript
    const channelUnknown = result.channel as unknown;
    const connectionUnknown = result.connection as unknown;
    
    // Then cast to the expected type
    const typedChannel = channelUnknown as amqplib.Channel;
    const typedConnection = connectionUnknown as amqplib.Connection;
    
    console.log('Email worker started, waiting for messages...');
    
    typedChannel.consume(EMAIL_QUEUE, async (msg) => {
      if (!msg) return;
      
      try {
        const data = JSON.parse(msg.content.toString());
        await processCampaign(data.campaignId, typedChannel, msg);
      } catch (error) {
        console.error('Error processing email task:', error);
        
        try {
          // Update campaign status to FAILED
          const data = JSON.parse(msg.content.toString());
          await prisma.campaign.update({
            where: { id: data.campaignId },
            data: { status: 'FAILED' as CampaignStatus },
          });
        } catch (e) {
          console.error('Failed to update campaign status:', e);
        }
        
        // Determine if this is a transient error that should be retried
        const isTransientError = error instanceof Error && (
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('socket hang up')
        );
        
        // Requeue only for transient errors
        typedChannel.nack(msg, false, isTransientError);
      }
    });
    
    // Add reconnection logic
    typedConnection.on('close', async () => {
      console.error('RabbitMQ connection closed unexpectedly, reconnecting in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      processEmailQueue(); // Restart the process
    });
    
  } catch (error) {
    console.error('Fatal error in email worker:', error);
    // Wait before trying to reconnect
    await new Promise(resolve => setTimeout(resolve, 5000));
    processEmailQueue(); // Restart the process
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT signal, shutting down email worker gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal, shutting down email worker gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

console.log('Starting email worker...');
processEmailQueue().catch(error => {
  console.error('Fatal error in email worker:', error);
  process.exit(1);
});