import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface MetaSendTextPayload {
  to: string;
  body: string;
  replyToWamId?: string;
}

export interface MetaSendMediaPayload {
  to: string;
  type: 'image' | 'audio' | 'video' | 'document';
  mediaId?: string;
  mediaUrl?: string;
  caption?: string;
  filename?: string;
}

export interface MetaSendTemplatePayload {
  to: string;
  templateName: string;
  languageCode: string;
  components?: MetaTemplateComponent[];
}

export interface MetaTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: MetaTemplateParameter[];
}

export interface MetaTemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
}

export interface MetaSendResult {
  messageId: string;
  status: string;
}

@Injectable()
export class MetaWhatsAppAdapter {
  private readonly logger = new Logger(MetaWhatsAppAdapter.name);
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v20.0',
      timeout: 30_000,
    });
  }

  private getAuthHeaders(accessToken: string) {
    return { Authorization: `Bearer ${accessToken}` };
  }

  async sendText(
    phoneNumberId: string,
    accessToken: string,
    payload: MetaSendTextPayload,
  ): Promise<MetaSendResult> {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: payload.to,
      type: 'text',
      text: { body: payload.body, preview_url: false },
    };

    if (payload.replyToWamId) {
      body.context = { message_id: payload.replyToWamId };
    }

    return this.sendRequest(phoneNumberId, accessToken, body);
  }

  async sendMedia(
    phoneNumberId: string,
    accessToken: string,
    payload: MetaSendMediaPayload,
  ): Promise<MetaSendResult> {
    const mediaObj: Record<string, string> = {};
    if (payload.mediaId) mediaObj.id = payload.mediaId;
    if (payload.mediaUrl) mediaObj.link = payload.mediaUrl;
    if (payload.caption) mediaObj.caption = payload.caption;
    if (payload.filename) mediaObj.filename = payload.filename;

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: payload.to,
      type: payload.type,
      [payload.type]: mediaObj,
    };

    return this.sendRequest(phoneNumberId, accessToken, body);
  }

  async sendTemplate(
    phoneNumberId: string,
    accessToken: string,
    payload: MetaSendTemplatePayload,
  ): Promise<MetaSendResult> {
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: payload.to,
      type: 'template',
      template: {
        name: payload.templateName,
        language: { code: payload.languageCode },
        components: payload.components ?? [],
      },
    };

    return this.sendRequest(phoneNumberId, accessToken, body);
  }

  async markAsRead(
    phoneNumberId: string,
    accessToken: string,
    messageId: string,
  ): Promise<void> {
    try {
      await this.client.post(
        `/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        { headers: this.getAuthHeaders(accessToken) },
      );
    } catch (err) {
      this.logger.warn(`Failed to mark message ${messageId} as read: ${String(err)}`);
    }
  }

  async uploadMedia(
    phoneNumberId: string,
    accessToken: string,
    buffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<string> {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    form.append('file', buffer, { filename, contentType: mimeType });

    const response = await this.client.post(
      `/${phoneNumberId}/media`,
      form,
      {
        headers: {
          ...this.getAuthHeaders(accessToken),
          ...form.getHeaders(),
        },
      },
    );

    return response.data.id as string;
  }

  async downloadMedia(mediaId: string, accessToken: string): Promise<{ url: string }> {
    const response = await this.client.get(`/${mediaId}`, {
      headers: this.getAuthHeaders(accessToken),
    });
    return { url: response.data.url as string };
  }

  async getTemplates(
    businessAccountId: string,
    accessToken: string,
  ): Promise<unknown[]> {
    const response = await this.client.get(
      `/${businessAccountId}/message_templates`,
      {
        headers: this.getAuthHeaders(accessToken),
        params: { limit: 100 },
      },
    );
    return (response.data.data as unknown[]) ?? [];
  }

  private async sendRequest(
    phoneNumberId: string,
    accessToken: string,
    body: Record<string, unknown>,
  ): Promise<MetaSendResult> {
    try {
      const response = await this.client.post(
        `/${phoneNumberId}/messages`,
        body,
        { headers: this.getAuthHeaders(accessToken) },
      );
      
      const msgId = (response.data?.messages?.[0]?.id as string) ?? '';
      this.logger.debug(`✅ Message sent: ${msgId} → ${String(body.to)}`);
      return { messageId: msgId, status: 'sent' };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data;
        const errorStatus = err.response?.status;
        const detail = JSON.stringify(errorData);
        
        this.logger.error(`❌ Meta API error (Status ${errorStatus}):`, detail);
        
        // Extract specific error message from Meta
        let userMessage = 'WhatsApp API error';
        if (errorData && typeof errorData === 'object') {
          const metaError = (errorData as any).error;
          if (metaError) {
            userMessage = `Meta Error ${metaError.code || ''}: ${metaError.message || 'Unknown error'}`;
            
            // Common error messages
            if (metaError.message?.includes('access token')) {
              userMessage = 'Invalid access token. Please update your WhatsApp credentials in settings.';
            } else if (metaError.message?.includes('phone number')) {
              userMessage = 'Invalid phone number or Phone Number ID. Check your WhatsApp configuration.';
            } else if (metaError.message?.includes('template')) {
              userMessage = 'Template message required for first contact. Use a template or wait for customer to message first.';
            } else if (metaError.code === 131047) {
              userMessage = 'Cannot send message. Customer needs to message you first within 24 hours, or use a template message.';
            }
          }
        }
        
        throw new ServiceUnavailableException(userMessage);
      }
      throw err;
    }
  }
}
