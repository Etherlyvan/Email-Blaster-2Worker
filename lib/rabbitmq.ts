// lib/rabbitmq.ts
import * as amqplib from 'amqplib';

const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

export const EMAIL_QUEUE = 'email_queue';
export const SCHEDULER_QUEUE = 'scheduler_queue';

export interface QueueMessage {
  campaignId?: string;
  scheduledTime?: string;
  [key: string]: unknown;
}

// Queue options with a 60-second message TTL
const queueOptions = {
  durable: true,
  arguments: {
    'x-message-ttl': 60000
  }
};

// Declare simplified wrapper types to avoid TypeScript issues
interface RabbitMQConnection {
  createChannel(): Promise<RabbitMQChannel>;
  close(): Promise<void>;
  on(event: string, callback: () => void): void;
}

interface RabbitMQChannel {
  checkQueue(name: string): Promise<unknown>;
  assertQueue(name: string, options?: unknown): Promise<unknown>;
  prefetch(count: number): Promise<void>;
  sendToQueue(queue: string, content: Buffer, options?: unknown): boolean;
  close(): Promise<void>;
  consume(queue: string, callback: (msg: unknown) => void, options?: unknown): Promise<unknown>;
}

// Global connection state
let connectionState = {
  connection: null as unknown as RabbitMQConnection | null,
  channel: null as unknown as RabbitMQChannel | null,
  isOpen: false
};

export async function connectToRabbitMQ(): Promise<{
  connection: RabbitMQConnection;
  channel: RabbitMQChannel;
}> {
  // If we already have a connection, return it
  if (connectionState.isOpen && connectionState.connection && connectionState.channel) {
    return {
      connection: connectionState.connection,
      channel: connectionState.channel
    };
  }

  // Connection retry logic
  let retries = 0;
  const maxRetries = 5;
  
  while (retries < maxRetries) {
    try {
      console.log(`Connecting to RabbitMQ at ${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT} (attempt ${retries + 1}/${maxRetries})`);
      
      // Connect to RabbitMQ
      const connection = await amqplib.connect(RABBITMQ_URL) as unknown as RabbitMQConnection;
      console.log('RabbitMQ connection established successfully');
      
      // Create channel
      const channel = await connection.createChannel();
      console.log('RabbitMQ channel created successfully');
      
      // Set up the queues
      await setupQueues(channel);
      
      // Handle connection errors and auto-reconnect
      connection.on('error', () => {
        console.error('RabbitMQ connection error');
        connectionState.isOpen = false;
        connectionState.connection = null;
        connectionState.channel = null;
      });
      
      connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        connectionState.isOpen = false;
        connectionState.connection = null;
        connectionState.channel = null;
      });
      
      // Store connection state
      connectionState = {
        connection,
        channel,
        isOpen: true
      };
      
      return { connection, channel };
    } catch (error) {
      console.error(`RabbitMQ connection attempt ${retries + 1} failed:`, error);
      retries++;
      
      if (retries < maxRetries) {
        const backoffTime = Math.pow(2, retries) * 1000;
        console.log(`Retrying in ${backoffTime/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      } else {
        console.error('Max retries reached, giving up');
        throw error;
      }
    }
  }
  
  throw new Error('Failed to connect to RabbitMQ after multiple attempts');
}

// Helper function to set up queues
async function setupQueues(channel: RabbitMQChannel): Promise<void> {
  try {
    await channel.checkQueue(EMAIL_QUEUE);
    console.log(`Queue ${EMAIL_QUEUE} already exists, skipping assertion`);
  } catch {
    await channel.assertQueue(EMAIL_QUEUE, queueOptions);
    console.log(`Queue ${EMAIL_QUEUE} created successfully`);
  }
  
  try {
    await channel.checkQueue(SCHEDULER_QUEUE);
    console.log(`Queue ${SCHEDULER_QUEUE} already exists, skipping assertion`);
  } catch {
    await channel.assertQueue(SCHEDULER_QUEUE, queueOptions);
    console.log(`Queue ${SCHEDULER_QUEUE} created successfully`);
  }
  
  // Set prefetch to 1 to avoid overwhelming the worker
  await channel.prefetch(1);
}

export async function sendToQueue(queueName: string, data: QueueMessage): Promise<boolean> {
  try {
    console.log(`Sending message to queue ${queueName}:`, data);
    
    // Get the connection and channel
    const { channel } = await connectToRabbitMQ();
    
    // Convert message to Buffer
    const messageBuffer = Buffer.from(JSON.stringify(data));
    
    // Send to queue with persistent flag
    const result = channel.sendToQueue(queueName, messageBuffer, { 
      persistent: true,
      contentType: 'application/json'
    });
    
    if (!result) {
      console.warn(`Queue ${queueName} is full or cannot accept messages at the moment`);
    } else {
      console.log(`Message sent to queue ${queueName} successfully`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error sending to queue ${queueName}:`, error);
    throw error;
  }
}

// Safely close connection
export async function closeConnection(): Promise<void> {
  if (connectionState.isOpen && connectionState.channel && connectionState.connection) {
    try {
      // Close channel first
      await connectionState.channel.close();
      
      // Then close connection
      await connectionState.connection.close();
      
      connectionState.isOpen = false;
      connectionState.connection = null;
      connectionState.channel = null;
      console.log('RabbitMQ connection closed successfully');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}