import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, unauthorized } from '@/lib/auth';

const DEFAULT_STAGES = [
  { name: 'Contacted', sortOrder: 0, color: '#94a3b8', isDefault: true },
  { name: 'Discovery Done', sortOrder: 1, color: '#3b82f6', isDefault: false },
  { name: 'Demo Done', sortOrder: 2, color: '#8b5cf6', isDefault: false },
  { name: 'Proposal Sent', sortOrder: 3, color: '#f97316', isDefault: false },
  { name: 'Negotiating', sortOrder: 4, color: '#eab308', isDefault: false },
  { name: 'Won', sortOrder: 5, color: '#22c55e', isDefault: false },
  { name: 'Lost', sortOrder: 6, color: '#ef4444', isDefault: false },
];

const DEFAULT_QUESTIONS = [
  { category: 'orders', questionText: 'How many orders do you receive in a typical day? How does this vary weekday vs. weekend?', sortOrder: 0 },
  { category: 'orders', questionText: 'What is your current order process — do customers call in, walk in, use WhatsApp, or a mix?', sortOrder: 1 },
  { category: 'orders', questionText: 'How often do you lose an order because a customer could not get through or had to wait?', sortOrder: 2 },
  { category: 'inventory', questionText: 'How do you currently track what is in stock? Is this done manually or with a system?', sortOrder: 3 },
  { category: 'inventory', questionText: 'Have you ever run out of a key ingredient during a busy period? How did you handle it?', sortOrder: 4 },
  { category: 'finance', questionText: 'How does payment currently work — mostly M-Pesa, cash, or a mix?', sortOrder: 5 },
  { category: 'finance', questionText: 'Do you ever have trouble tracking exactly how much you made at end of day?', sortOrder: 6 },
  { category: 'staff', questionText: 'How many staff do you have managing orders, and how do you coordinate between them?', sortOrder: 7 },
  { category: 'staff', questionText: 'Have you had situations where orders get mixed up or delayed because of miscommunication?', sortOrder: 8 },
  { category: 'growth', questionText: 'Are you looking to open more branches or scale in the next 12 months?', sortOrder: 9 },
  { category: 'growth', questionText: 'Do you have any kind of customer loyalty program or way of keeping regulars coming back?', sortOrder: 10 },
  { category: 'growth', questionText: 'If you could automate one thing in your restaurant today, what would it be?', sortOrder: 11 },
];

const DEFAULT_OBJECTIONS = [
  { name: "It's too expensive", standardResponse: 'Our Starter plan is KSh 10,000/month — equivalent to 2–3 lost orders. Most restaurants recover that in the first week.' },
  { name: "I'm not sure I need this", standardResponse: "Let me show you the numbers: at your order volume, the average restaurant using our system saves hours per week and reduces errors significantly." },
  { name: "I'll think about it", standardResponse: 'Totally understand. When would be a good time to follow up? I would love to come back with specific numbers based on your setup.' },
  { name: 'I already have a system', standardResponse: 'That is great — what system are you using? Many clients came to us because we integrate WhatsApp ordering natively, which most systems do not handle well.' },
  { name: "My staff won't adopt it", standardResponse: 'We handle onboarding and training. Most restaurants are fully live within 48 hours, and staff love it because it means fewer missed orders.' },
];

const DEFAULT_FOLLOWUP_TEMPLATES = [
  { touchNumber: 1, daysAfterPrevious: 0, channel: 'WhatsApp', suggestedContent: 'Hey [Name], it was great meeting you! I would love to share how we have helped restaurants like yours. Are you free for a quick 15-min call this week?' },
  { touchNumber: 2, daysAfterPrevious: 2, channel: 'WhatsApp', suggestedContent: 'Hi [Name], just checking in! I put together a quick breakdown of what the system looks like for a restaurant your size. Mind if I share it?' },
  { touchNumber: 3, daysAfterPrevious: 4, channel: 'LinkedIn', suggestedContent: 'Hi [Name], I would love to connect and share some insights on WhatsApp ordering for restaurants in your area.' },
  { touchNumber: 4, daysAfterPrevious: 7, channel: 'in-person', suggestedContent: 'Hey [Name], I was in the area and thought I would stop by! Is now a good time to show you a 10-minute demo?' },
  { touchNumber: 5, daysAfterPrevious: 10, channel: 'WhatsApp', suggestedContent: 'Hi [Name], I spoke with a restaurant owner nearby who faced the same challenges — they are now seeing great results. Would love to show you the same.' },
  { touchNumber: 6, daysAfterPrevious: 14, channel: 'WhatsApp', suggestedContent: 'Hi [Name], I wanted to share a case study from a similar restaurant. They saw results within 2 weeks of going live. Happy to answer any questions!' },
  { touchNumber: 7, daysAfterPrevious: 21, channel: 'WhatsApp', suggestedContent: 'Hi [Name], this is my final check-in for now! If the timing is not right, no worries — I will circle back in 2 months. But if you are ready, I would love to get you started this week!' },
];

const DEFAULT_THEMES = [
  { themeName: 'WhatsApp Ordering Pain', description: 'Quotes about challenges with WhatsApp-based ordering', color: '#3b82f6' },
  { themeName: 'M-Pesa Friction', description: 'Payment tracking and M-Pesa pain points', color: '#22c55e' },
  { themeName: 'Staff Coordination', description: 'Order miscommunication and staff management issues', color: '#f97316' },
  { themeName: 'Growth Ambition', description: 'Scaling plans, new branches, growth goals', color: '#8b5cf6' },
  { themeName: 'System Readiness', description: 'Digital comfort level and openness to automation', color: '#06b6d4' },
];

const DEFAULT_PHASES = [
  { phaseNumber: 1, phaseName: 'Environment & LangGraph Basics', description: 'Set up dev environment, understand LangGraph fundamentals and graph-based agent architecture' },
  { phaseNumber: 2, phaseName: 'Agent Architecture & Memory', description: 'Design multi-agent systems, implement memory strategies (short-term, long-term, episodic)' },
  { phaseNumber: 3, phaseName: 'MCP Server Integration', description: 'Build and integrate Model Context Protocol servers for tool access' },
  { phaseNumber: 4, phaseName: 'Tool Use & Function Calling', description: 'Implement tool use patterns, structured outputs, and function calling with Claude' },
  { phaseNumber: 5, phaseName: 'Supabase & Database Integration', description: 'Integrate Supabase for persistent storage, realtime updates, and RLS' },
  { phaseNumber: 6, phaseName: 'WhatsApp Integration', description: 'Connect WhatsApp Business API for restaurant order handling and customer interactions' },
  { phaseNumber: 7, phaseName: 'M-Pesa Payment Integration', description: 'Integrate Daraja API for M-Pesa payments, STK push, and payment verification' },
  { phaseNumber: 8, phaseName: 'Production Deployment & Scale', description: 'Deploy to production, set up monitoring, multi-tenant architecture, and first customer onboarding' },
];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const [stageCount, questionCount, themeCount, phaseCount] = await Promise.all([
    prisma.pipelineStage.count({ where: { userId: user.id } }),
    prisma.discoveryQuestion.count({ where: { userId: user.id } }),
    prisma.researchTheme.count({ where: { userId: user.id } }),
    prisma.coursePhase.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    seeded: {
      pipelineStages: stageCount,
      discoveryQuestions: questionCount,
      researchThemes: themeCount,
      coursePhases: phaseCount,
    },
  });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const results: Record<string, number> = {};

  // Pipeline stages
  const existingStages = await prisma.pipelineStage.count({ where: { userId: user.id } });
  if (existingStages === 0) {
    const created = await prisma.pipelineStage.createMany({
      data: DEFAULT_STAGES.map((s) => ({ ...s, userId: user.id })),
    });
    results.pipelineStages = created.count;
  }

  // Discovery questions
  const existingQs = await prisma.discoveryQuestion.count({ where: { userId: user.id } });
  if (existingQs === 0) {
    const created = await prisma.discoveryQuestion.createMany({
      data: DEFAULT_QUESTIONS.map((q) => ({ ...q, userId: user.id, isDefault: true })),
    });
    results.discoveryQuestions = created.count;
  }

  // Objections
  const existingObj = await prisma.objection.count({ where: { userId: user.id } });
  if (existingObj === 0) {
    const created = await prisma.objection.createMany({
      data: DEFAULT_OBJECTIONS.map((o) => ({ ...o, userId: user.id, isDefault: true })),
    });
    results.objections = created.count;
  }

  // Follow-up templates
  const existingTemplates = await prisma.followUpTemplate.count({ where: { userId: user.id } });
  if (existingTemplates === 0) {
    const created = await prisma.followUpTemplate.createMany({
      data: DEFAULT_FOLLOWUP_TEMPLATES.map((t) => ({ ...t, userId: user.id })),
    });
    results.followUpTemplates = created.count;
  }

  // Research themes
  const existingThemes = await prisma.researchTheme.count({ where: { userId: user.id } });
  if (existingThemes === 0) {
    const created = await prisma.researchTheme.createMany({
      data: DEFAULT_THEMES.map((t) => ({ ...t, userId: user.id })),
    });
    results.researchThemes = created.count;
  }

  // Course phases
  const existingPhases = await prisma.coursePhase.count({ where: { userId: user.id } });
  if (existingPhases === 0) {
    const created = await prisma.coursePhase.createMany({
      data: DEFAULT_PHASES.map((p) => ({ ...p, userId: user.id })),
    });
    results.coursePhases = created.count;
  }

  // Update sector types based on name
  await Promise.all([
    prisma.sector.updateMany({
      where: { userId: user.id, name: 'POS Sales', sectorType: null },
      data: { sectorType: 'pos-sales' },
    }),
    prisma.sector.updateMany({
      where: { userId: user.id, name: { in: ['AI Sales & Market Fit', 'Agentic AI Sales Research'] }, sectorType: null },
      data: { sectorType: 'ai-sales' },
    }),
    prisma.sector.updateMany({
      where: { userId: user.id, name: 'Agentic AI Build', sectorType: null },
      data: { sectorType: 'ai-build' },
    }),
    prisma.sector.updateMany({
      where: { userId: user.id, name: 'Academics', sectorType: null },
      data: { sectorType: 'academics' },
    }),
  ]);

  return NextResponse.json({ success: true, created: results });
}
