import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// POST /api/attachments - Upload a file and create an attachment
const createAttachmentSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  url: z.string().url('Valid URL is required'),
  type: z.string().min(1, 'File type is required'),
  size: z.number().min(1, 'File size must be greater than 0'),
  taskId: z.string().min(1, 'Task ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAttachmentSchema.parse(body);

    const attachment = await prisma.attachment.create({
      data: validatedData,
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error creating attachment:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create attachment' },
      { status: 500 }
    );
  }
}
