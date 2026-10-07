import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  // Optional: OpenRouter specific headers for rankings
  defaultHeaders: {
    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
    'X-Title': 'NovaWorks Hackathon CRM',
  },
});

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // 1. Fetch existing users to provide as context to the AI
    // The AI needs this to assign valid managerId and assigneeId
    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true, specialization: true, skills: true }
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found in the database. Please run the seeder first.' }, { status: 400 });
    }

    const systemPrompt = `You are an AI Project Manager Assistant for NovaWorks Technologies.
Your job is to read a meeting transcript and extract the projects and tasks discussed.

Here is the current team directory (JSON):
${JSON.stringify(users, null, 2)}

Instructions:
1. Extract all discussed projects. For each project, you must provide: name, clientName, description, managerId, and deadline (YYYY-MM-DD).
2. The managerId MUST exactly match the ID of a user with the role "MANAGER" from the team directory.
3. Extract all tasks for each project. For each task, you must provide: title, description, assigneeId, deadline (YYYY-MM-DD), and estimatedHours.
4. The assigneeId MUST exactly match the ID of a user with the role "AGENT" from the team directory.
5. If a person mentioned is not in the directory, do not assign them.
6. The current year is 2026. If a date is mentioned like "18 October", it means "2026-10-18".
7. Exclude rejected features (like payment gateways, live maps, cost calculation) from the tasks.
8. Only output the raw JSON conforming to the requested schema.`;

    // 2. Call OpenRouter API with Structured Outputs (JSON Mode)
    // We use a model that supports JSON schema natively, like claude-3.5-sonnet or gpt-4o via openrouter
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please parse this meeting transcript and return the JSON object:\n\n${transcript}` }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'project_extraction',
          schema: {
            type: 'object',
            properties: {
              projects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Extracted project name' },
                    clientName: { type: 'string', description: 'Extracted client name' },
                    description: { type: 'string', description: 'Extracted scope' },
                    managerId: { type: 'string', description: 'ID of the assigned MANAGER' },
                    deadline: { type: 'string', description: 'YYYY-MM-DD' },
                    tasks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string', description: 'Extracted task title' },
                          description: { type: 'string', description: 'Extracted task scope' },
                          assigneeId: { type: 'string', description: 'ID of the assigned AGENT' },
                          deadline: { type: 'string', description: 'YYYY-MM-DD' },
                          estimatedHours: { type: 'number' }
                        },
                        required: ['title', 'description', 'assigneeId', 'deadline', 'estimatedHours'],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ['name', 'clientName', 'description', 'managerId', 'deadline', 'tasks'],
                  additionalProperties: false
                }
              }
            },
            required: ['projects'],
            additionalProperties: false
          },
          strict: true
        }
      },
      temperature: 0,
    });

    const aiContent = completion.choices[0].message.content;
    if (!aiContent) {
      throw new Error('AI returned empty content');
    }

    const parsedData = JSON.parse(aiContent);

    // 3. Save the projects and tasks to the database in a transaction
    // This ensures either all data is saved, or none of it is (all-or-nothing save)
    const savedProjects = [];

    await prisma.$transaction(async (tx) => {
      for (const projectData of parsedData.projects) {
        const { tasks, ...projectFields } = projectData;
        
        const newProject = await tx.project.create({
          data: {
            ...projectFields,
            tasks: {
              create: tasks
            }
          },
          include: {
            tasks: true
          }
        });
        
        savedProjects.push(newProject);
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Projects and tasks successfully created from transcript',
      data: savedProjects 
    });

  } catch (error: any) {
    console.error('AI Parsing Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process transcript or save records',
      details: error.message 
    }, { status: 500 });
  }
}
