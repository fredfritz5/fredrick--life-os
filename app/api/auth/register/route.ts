import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Single-user guard
    const existingCount = await prisma.user.count();
    if (existingCount > 0) {
      return NextResponse.json(
        { error: 'This system is configured for one user only.' },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'Fredrick Ochieng',
        profile: {
          create: {
            displayName: name || 'Fredrick Ochieng',
            currentFocus: 'Building the future of AI in Africa',
          },
        },
        alertSettings: {
          create: {},
        },
      },
    });

    // Seed default sectors
    const defaultSectors = [
      { name: 'Spiritual Life', icon: 'pray', color: '#8b5cf6', description: 'Faith, prayer, and spiritual growth', verificationCriteria: 'A journal entry, scripture note, or photo of your prayer/devotion space', visionRequired: false, sectorType: null, order: 0 },
      { name: 'Agentic AI Build', icon: 'code', color: '#6366f1', description: 'Building the AI ops platform for African restaurants', verificationCriteria: 'A screenshot of code written, commits made, or features built today', visionRequired: true, sectorType: 'ai-build', order: 1 },
      { name: 'AI Sales & Market Fit', icon: 'chart', color: '#06b6d4', description: 'Sales research, customer discovery, and market fit validation', verificationCriteria: 'A screenshot of outreach sent, notes from a customer conversation, or research completed', visionRequired: true, sectorType: 'ai-sales', order: 2 },
      { name: 'POS Sales', icon: 'money', color: '#22c55e', description: 'Point of sale system sales and customer acquisition', verificationCriteria: 'A screenshot of a lead contacted, demo completed, or deal progress', visionRequired: true, sectorType: 'pos-sales', order: 3 },
      { name: 'Academics', icon: 'book', color: '#eab308', description: 'University coursework, assignments, and study', verificationCriteria: 'A photo of notes taken, assignment submitted, or study material completed', visionRequired: true, sectorType: 'academics', order: 4 },
      { name: 'Health', icon: 'health', color: '#ef4444', description: 'Exercise, nutrition, and sleep', verificationCriteria: 'A photo of workout completed, meal eaten, or sleep tracker showing hours', visionRequired: true, sectorType: null, order: 5 },
    ];

    await prisma.sector.createMany({
      data: defaultSectors.map((s) => ({ ...s, userId: user.id })),
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
