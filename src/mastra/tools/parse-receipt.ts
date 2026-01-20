import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { CATEGORIES } from '../lib/types.js';

const parsedReceiptSchema = z.object({
  vendor: z.string().describe('Merchant/store name'),
  vendorConfidence: z.number().min(0).max(1),
  totalAmount: z.number().describe('Total amount on receipt'),
  amountConfidence: z.number().min(0).max(1),
  date: z.string().describe('Date in YYYY-MM-DD format, empty if not visible'),
  dateConfidence: z.number().min(0).max(1),
  category: z.enum(CATEGORIES).describe('Inferred expense category'),
  categoryConfidence: z.number().min(0).max(1),
  lineItems: z
    .array(
      z.object({
        description: z.string(),
        amount: z.number(),
      })
    )
    .describe('Individual items if visible'),
  rawText: z.string().describe('Raw text extracted from receipt'),
});

export const parseReceiptTool = createTool({
  id: 'parse-receipt',
  description:
    'Parse a receipt image to extract expense details. Use when user shares a receipt image. Accepts image URL or base64 data URI.',
  inputSchema: z.object({
    image: z
      .string()
      .describe(
        'Receipt image as URL (https://...) or base64 data URI (data:image/jpeg;base64,...)'
      ),
  }),
  outputSchema: parsedReceiptSchema,
  execute: async ({ context }) => {
    const result = await generateObject({
      model: google('gemini-3-flash-preview'),
      schema: parsedReceiptSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: context.image },
            {
              type: 'text',
              text: `Extract expense details from this receipt image.

For each field, provide a confidence score from 0 to 1:
- 1.0 = completely certain, text is crystal clear
- 0.7-0.9 = fairly confident, minor ambiguity
- 0.4-0.6 = uncertain, text partially visible or blurry
- 0.0-0.3 = guessing or cannot read

Extract:
- vendor: The store/merchant name
- totalAmount: The final total (not subtotal)
- date: In YYYY-MM-DD format (use empty string if not visible)
- category: Infer from merchant type (food, transport, shopping, etc.)
- lineItems: Individual items with prices if visible
- rawText: All readable text from the receipt`,
            },
          ],
        },
      ],
    });

    return result.object;
  },
});
