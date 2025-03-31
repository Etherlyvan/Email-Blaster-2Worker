// workers/email-worker.ts
import { connectToRabbitMQ, EMAIL_QUEUE } from '../lib/rabbitmq';
import { sendEmailViaSMTP } from '../lib/brevo';
import { prisma } from '../lib/db';
import type { Campaign, CampaignStatus } from '@prisma/client';

interface ContactData {
  email: string;
  additionalData?: Record<string, unknown>;
  id: string;
  [key: string]: unknown;
}

interface CampaignWithRelations extends Campaign {
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
        : String(value ?? '');
      
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
    
    // Process template variables in subject - NEW CODE HERE
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
      personalizedSubject, // Use personalized subject here
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
      errorMessage = String(error.message);
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

async function processEmailQueue() {
  const { channel, connection } = await connectToRabbitMQ();
  
  console.log('Email worker started, waiting for messages...');
  
  channel.consume(EMAIL_QUEUE, async (msg) => {
    if (!msg) return;
    
    try {
      const data = JSON.parse(msg.content.toString());
      console.log('Processing email task:', data.campaignId);
      
      const campaign = await prisma.campaign.findUnique({
        where: { id: data.campaignId },
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
        console.error(`Campaign ${data.campaignId} not found`);
        // Acknowledge anyway since retrying won't help if campaign doesn't exist
        channel.ack(msg);
        return;
      }
      
      // CRITICAL FIX: Check if this is a scheduled campaign
      if (campaign.status === 'SCHEDULED' && campaign.schedule) {
        const now = new Date();
        const scheduleTime = new Date(campaign.schedule);
        
        console.log(`Campaign ${data.campaignId} is scheduled for ${scheduleTime.toISOString()}`);
        console.log(`Current time is ${now.toISOString()}`);
        
        // If the scheduled time is in the future, don't process it now
        if (scheduleTime > now) {
          console.log(`Campaign ${data.campaignId} is scheduled for future delivery. Not sending now.`);
          console.log(`It will be processed by the scheduler worker at the scheduled time.`);
          
          // Acknowledge the message but don't process it
          channel.ack(msg);
          return;
        }
      }

      if (!campaign.brevoKeyId) {
        console.error(`Campaign ${data.campaignId} has no Brevo key assigned`);
        
        // Update campaign status to FAILED
        await prisma.campaign.update({
          where: { id: data.campaignId },
          data: { status: 'FAILED' as CampaignStatus },
        });
        
        channel.ack(msg);
        return;
      }
      
      // Update campaign status to SENDING if not already
      if (campaign.status !== 'SENDING') {
        await prisma.campaign.update({
          where: { id: data.campaignId },
          data: { status: 'SENDING' as CampaignStatus },
        });
      }
      
      // Get contacts in the group
      const contacts = campaign.group.groupContacts.map(gc => gc.contact);
      console.log(`Campaign ${data.campaignId} has ${contacts.length} contacts to process`);
      
      if (contacts.length === 0) {
        console.warn(`Campaign ${data.campaignId} has no contacts to send to`);
        
        // Update campaign status to SENT (since there's nothing to send)
        await prisma.campaign.update({
          where: { id: data.campaignId },
          data: { status: 'SENT' as CampaignStatus },
        });
        
        channel.ack(msg);
        return;
      }
      
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
        console.log(`Campaign ${data.campaignId} progress: ${progress}% (${successCount} sent, ${failureCount} failed)`);
        
        // Add a small delay between emails to avoid overwhelming the SMTP server
        if (contacts.length > 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Update campaign status based on results
      const finalStatus = determineCampaignStatus(successCount, failureCount, totalCount);
      
      await prisma.campaign.update({
        where: { id: data.campaignId },
        data: { status: finalStatus },
      });
      
      console.log(`Campaign ${data.campaignId} completed with status: ${finalStatus}`);
      console.log(`Success: ${successCount}, Failed: ${failureCount}, Total: ${totalCount}`);
      
      channel.ack(msg);
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
      
      // Requeue the message if it's a temporary error
      channel.nack(msg, false, true);
    }
  });
  
  // Handle application shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down email worker...');
    await channel.close();
    await connection.close();
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down email worker...');
    await channel.close();
    await connection.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

console.log('Starting email worker...');
processEmailQueue().catch(error => {
  console.error('Fatal error in email worker:', error);
  process.exit(1);
});