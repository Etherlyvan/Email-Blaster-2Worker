// lib/rabbitmq.ts
import amqp from 'amqplib';

const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

export const EMAIL_QUEUE = 'email_queue';
export const SCHEDULER_QUEUE = 'scheduler_queue';

export interface QueueMessage {
  campaignId?: string;
  scheduledTime?: string;
  [key: string]: unknown;
}

// Kembalikan ke nilai TTL yang asli (60000) untuk menghindari konflik
const queueOptions = {
  durable: true,
  arguments: {
    'x-message-ttl': 60000  // Pastikan nilai ini 60000, bukan 86400000
  }
};

export async function connectToRabbitMQ() {
  try {
    console.log(`Connecting to RabbitMQ at ${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`);
    const connection = await amqp.connect(RABBITMQ_URL);
    console.log('RabbitMQ connection established successfully');
    
    const channel = await connection.createChannel();
    console.log('RabbitMQ channel created successfully');
    
    // Gunakan passive: true untuk memeriksa queue yang sudah ada tanpa mencoba mengubah propertinya
    try {
      await channel.checkQueue(EMAIL_QUEUE);
      console.log(`Queue ${EMAIL_QUEUE} already exists, skipping assertion`);
    } catch {
      // Queue belum ada, kita buat (menghilangkan parameter dari catch)
      await channel.assertQueue(EMAIL_QUEUE, queueOptions);
      console.log(`Queue ${EMAIL_QUEUE} created successfully`);
    }
    
    try {
      await channel.checkQueue(SCHEDULER_QUEUE);
      console.log(`Queue ${SCHEDULER_QUEUE} already exists, skipping assertion`);
    } catch {
      // Queue belum ada, kita buat (menghilangkan parameter dari catch)
      await channel.assertQueue(SCHEDULER_QUEUE, queueOptions);
      console.log(`Queue ${SCHEDULER_QUEUE} created successfully`);
    }
    
    // Set prefetch to 1 to avoid overwhelming the worker
    await channel.prefetch(1);
    
    return { connection, channel };
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    throw error;
  }
}

export async function sendToQueue(queueName: string, data: QueueMessage) {
  try {
    console.log(`Sending message to queue ${queueName}:`, data);
    const { channel, connection } = await connectToRabbitMQ();
    
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
    
    // Close channel and connection
    await channel.close();
    await connection.close();
    
    return result;
  } catch (error) {
    console.error(`Error sending to queue ${queueName}:`, error);
    throw error;
  }
}