// LLM client abstraction for Anthropic API

import Anthropic from '@anthropic-ai/sdk';

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  systemPrompt?: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface LLMStreamOptions extends LLMCompletionOptions {
  onContent?: (delta: string) => void;
  onComplete?: (fullContent: string) => void;
}

export interface LLMClient {
  complete(options: LLMCompletionOptions): Promise<string>;
  stream(options: LLMStreamOptions): Promise<string>;
}

export class AnthropicClient implements LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model = 'claude-sonnet-4-20250514') {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    this.client = new Anthropic({ apiKey: key });
    this.model = model;
  }

  async complete(options: LLMCompletionOptions): Promise<string> {
    const { systemPrompt, messages, maxTokens = 4096, temperature = 0 } = options;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.text ?? '';
  }

  async stream(options: LLMStreamOptions): Promise<string> {
    const {
      systemPrompt,
      messages,
      maxTokens = 4096,
      temperature = 0,
      onContent,
      onComplete,
    } = options;

    let fullContent = '';

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        const delta = event.delta.text;
        fullContent += delta;
        onContent?.(delta);
      }
    }

    onComplete?.(fullContent);
    return fullContent;
  }
}

// Factory function for creating LLM client
export function createLLMClient(apiKey?: string): LLMClient {
  return new AnthropicClient(apiKey);
}
