import * as amqplib from 'amqplib';
import {
  Channel,
  Connection,
  ConsumeMessage,
} from 'amqplib';

import { RABBITMQ_URL } from 'config';
import RabbitQueuesExchangesSetup from './RabbitQueuesExchangesSetup';
type ConsumerHandler = (
  message: any,
  routingKey: string,
  exchange: string
) => Promise<void>;

class RabbitMQService {
  private static instance: RabbitMQService;

  private connection: Connection | null = null;

  // producer channel
  private producerChannel: Channel | null = null;

  // consumer channels by queue
  private consumerChannels: Map<string, Channel> = new Map();

  // track actual connection object for channel creation
  private channelConnection: any | null = null;

  private reconnectTimeout: NodeJS.Timeout | null = null;

  private readonly reconnectInterval = 5000;

  private isInitializing = false;

  private isReconnecting = false;

  private consumers: Array<{
    queue: string;
    handler: ConsumerHandler;
  }> = [];

  private constructor() {}

  static getInstance(): RabbitMQService {
    if (!RabbitMQService.instance) {
      RabbitMQService.instance = new RabbitMQService();
    }

    return RabbitMQService.instance;
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitializing) {
        return;
      }

      this.isInitializing = true;

      // already connected
      if (this.connection && this.producerChannel) {
        return;
      }

      console.log('🔌 Connecting to RabbitMQ...');

      this.channelConnection = await amqplib.connect(
        RABBITMQ_URL as string,
        {
          heartbeat: 30,
        }
      );

      this.connection = this.channelConnection;

      if (this.channelConnection) {
        this.channelConnection.on(
          'error',
          this.handleConnectionError.bind(this)
        );

        this.channelConnection.on(
          'close',
          this.handleConnectionClose.bind(this)
        );
      }

      // producer channel
      this.producerChannel =
        await this.channelConnection!.createChannel();

      if (this.producerChannel) {
        this.producerChannel.on('error', (err: Error) => {
          console.error(
            '❌ Producer channel error:',
            err
          );
        });

        this.producerChannel.on('close', () => {
          console.warn('⚠️ Producer channel closed');
        });
      }

      await RabbitQueuesExchangesSetup.setupExchanges(this.producerChannel!);
      await RabbitQueuesExchangesSetup.setupQueues(this.producerChannel!);

      // restore consumers after reconnect
      for (const consumer of this.consumers) {
        await this.createConsumer(
          consumer.queue,
          consumer.handler
        );
      }

      console.log(
        '✅ RabbitMQ connected and initialized successfully'
      );
    } catch (error) {
      console.error(
        '❌ Failed to initialize RabbitMQ:',
        error
      );

      this.scheduleReconnect();
    } finally {
      this.isInitializing = false;
    }
  }

 

 

  private handleConnectionError(error: Error): void {
    console.error(
      '❌ RabbitMQ connection error:',
      error
    );

    this.cleanup();

    this.scheduleReconnect();
  }

  private handleConnectionClose(): void {
    console.warn('⚠️ RabbitMQ connection closed');

    this.cleanup();

    this.scheduleReconnect();
  }

  private cleanup(): void {
    this.connection = null;
    this.channelConnection = null;
    this.producerChannel = null;
    this.consumerChannels.clear();
  }

  private scheduleReconnect(): void {
    if (this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(async () => {
      try {
        console.log(
          '🔄 Attempting RabbitMQ reconnect...'
        );

        await this.initialize();
      } catch (error) {
        console.error(
          '❌ Reconnect failed:',
          error
        );
      } finally {
        this.isReconnecting = false;
      }
    }, this.reconnectInterval);
  }

  // PRODUCER
  async produceMessage(
    exchange: string,
    routingKey: string,
    message: any
  ): Promise<boolean> {
    try {
      if (!this.producerChannel) {
        await this.initialize();
      }

      if (!this.producerChannel) {
        throw new Error(
          'Producer channel not initialized'
        );
      }

      const published =
        this.producerChannel.publish(
          exchange,
          routingKey,
          Buffer.from(JSON.stringify(message)),
          {
            persistent: true,
          }
        );

      if (published) {
        console.log(
          `✅ Message published to ${exchange} (${routingKey})`
        );
      } else {
        console.warn(
          '⚠️ Publish buffer full'
        );
      }

      return published;
    } catch (error) {
      console.error(
        '❌ Failed to publish message:',
        error
      );

      return false;
    }
  }

  // PUBLIC CONSUMER METHOD
  async consumeMessages(
    queue: string,
    handler: ConsumerHandler
  ): Promise<void> {
    const exists = this.consumers.find(
      (c) => c.queue === queue
    );

    if (!exists) {
      this.consumers.push({
        queue,
        handler,
      });
    }

    await this.createConsumer(queue, handler);
  }

  // INTERNAL CONSUMER CREATOR
  private async createConsumer(
    queue: string,
    handler: ConsumerHandler
  ): Promise<void> {
    try {
      if (!this.channelConnection) {
        await this.initialize();
      }

      if (!this.channelConnection) {
        throw new Error(
          'RabbitMQ connection unavailable'
        );
      }

      // close old channel if exists
      const existingChannel =
        this.consumerChannels.get(queue);

      if (existingChannel) {
        try {
          await existingChannel.close();
        } catch {}
      }

      // create dedicated channel per consumer
      const channel =
        await this.channelConnection!.createChannel();

      this.consumerChannels.set(queue, channel);

      channel.on('error', (err: Error) => {
        console.error(
          `❌ Consumer channel error (${queue}):`,
          err
        );
      });

      channel.on('close', () => {
        console.warn(
          `⚠️ Consumer channel closed (${queue})`
        );
      });

      await channel.prefetch(5);

      console.log(
        `👂 Starting consumer for queue: ${queue}`
      );

      await channel.consume(
        queue,
        async (msg: ConsumeMessage | null) => {
          if (!msg) {
            return;
          }

          try {
            const content = JSON.parse(
              msg.content.toString()
            );

            console.log(
              `📨 Message received from ${queue}`
            );

            // prevent hanging forever
            const timeoutPromise = new Promise(
              (_, reject) => {
                setTimeout(() => {
                  reject(
                    new Error(
                      'Message handler timeout'
                    )
                  );
                }, 30000);
              }
            );

            await Promise.race([
              handler(
                content,
                msg.fields.routingKey,
                msg.fields.exchange
              ),
              timeoutPromise,
            ]);

            // IMPORTANT:
            // ack using SAME channel
            channel.ack(msg);

            console.log(
              `✅ Message acknowledged (${queue})`
            );
          } catch (error) {
            console.error(
              `❌ Consumer error (${queue}):`,
              error
            );

            try {
              // remove bad message
              channel.nack(msg, false, false);

              console.log(
                `❌ Message rejected (${queue})`
              );
            } catch (ackError) {
              console.error(
                '❌ Failed to nack message:',
                ackError
              );
            }
          }
        },
        {
          noAck: false,
        }
      );

      console.log(
        `✅ Consumer attached (${queue})`
      );
    } catch (error) {
      console.error(
        `❌ Failed to create consumer (${queue}):`,
        error
      );
    }
  }

  async closeConnection(): Promise<void> {
    try {
      const channels = Array.from(this.consumerChannels.values());
      for (const channel of channels) {
        await channel.close();
      }

      this.consumerChannels.clear();

      if (this.producerChannel) {
        await this.producerChannel.close();
      }

      if (this.channelConnection) {
        await this.channelConnection.close();
      }

      console.log(
        '✅ RabbitMQ connection closed'
      );
    } catch (error) {
      console.error(
        '❌ Error closing RabbitMQ:',
        error
      );
    }
  }
}

export const rabbitMQService =
  RabbitMQService.getInstance();