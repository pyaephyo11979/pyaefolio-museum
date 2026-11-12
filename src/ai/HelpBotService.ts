import { GoogleGenAI } from '@google/genai';
import {
  EXPERIENCE_ITEMS,
  MUSEUM_WINGS,
  PRESERVED_QAS,
  PreservedQAAction,
  PreservedQAItem,
  PROFILE_DATA,
  PROJECT_EXHIBITS,
  SKILL_PILLARS
} from '../data/portfolioData';

export interface HelpBotReply {
  answer: string;
  source: 'gemini-api' | 'preserved-qa';
  modelUsed?: string;
  botThought: string;
  action?: PreservedQAAction;
  errorNote?: string;
}

const PRIMARY_GEMINI_MODEL = 'gemini-3.8-flash';
const FALLBACK_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export class HelpBotService {
  private readonly apiKey: string;
  private lastInteractionId: string | undefined;
  private readonly systemInstruction: string;

  constructor() {
    this.apiKey = this.loadEnvApiKey();
    this.systemInstruction = this.buildPortfolioSystemInstruction();
  }

  private loadEnvApiKey(): string {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return (
      env?.VITE_GEMINI_API_KEY?.trim() ||
      env?.GEMINI_API_KEY?.trim() ||
      env?.VITE_GOOGLE_API_KEY?.trim() ||
      env?.GOOGLE_API_KEY?.trim() ||
      ''
    );
  }

  public hasApiKey(): boolean {
    return this.apiKey.length > 10;
  }

  public clearConversation(): void {
    this.lastInteractionId = undefined;
  }

  /**
   * Returns a preserved Q&A response immediately when a visitor clicks a preset chip.
   */
  public getPreservedById(qaId: string): { qa: PreservedQAItem; reply: HelpBotReply } | null {
    const qa = PRESERVED_QAS.find((item) => item.id === qaId);
    if (!qa) return null;
    return {
      qa,
      reply: {
        answer: qa.answer,
        source: 'preserved-qa',
        botThought: qa.botThought,
        action: qa.action
      }
    };
  }

  /**
   * Answers any visitor question using Google AI Studio (`@google/genai` interactions API
   * with `gemini-3.8-flash`), automatically falling back to `gemini-3.5-flash-lite` on HTTP 429
   * rate-limit/quota errors, or to the Preserved Portfolio Q&A engine if no `.env` key is configured.
   */
  public async askQuestion(userPrompt: string): Promise<HelpBotReply> {
    const cleanPrompt = userPrompt.trim();
    const matchedQA = this.findBestPreservedMatch(cleanPrompt);

    if (this.hasApiKey()) {
      const client = new GoogleGenAI({ apiKey: this.apiKey });

      try {
        const interaction = await client.interactions.create({
          model: PRIMARY_GEMINI_MODEL,
          input: cleanPrompt,
          system_instruction: this.systemInstruction,
          ...(this.lastInteractionId
            ? { previous_interaction_id: this.lastInteractionId }
            : {})
        });

        if (interaction.id) {
          this.lastInteractionId = interaction.id;
        }

        const text = interaction.output_text?.trim();
        if (text) {
          return {
            answer: text,
            source: 'gemini-api',
            modelUsed: PRIMARY_GEMINI_MODEL,
            botThought: this.createShortThought(text),
            action: matchedQA?.action
          };
        }
      } catch (err: unknown) {
        if (this.isRateLimit429Error(err)) {
          try {
            // Reset previous interaction ID when switching to fallback model on 429
            this.lastInteractionId = undefined;
            const fallbackInteraction = await client.interactions.create({
              model: FALLBACK_GEMINI_MODEL,
              input: cleanPrompt,
              system_instruction: this.systemInstruction
            });

            if (fallbackInteraction.id) {
              this.lastInteractionId = fallbackInteraction.id;
            }

            const fallbackText = fallbackInteraction.output_text?.trim();
            if (fallbackText) {
              return {
                answer: fallbackText,
                source: 'gemini-api',
                modelUsed: FALLBACK_GEMINI_MODEL,
                botThought: this.createShortThought(fallbackText),
                action: matchedQA?.action
              };
            }
          } catch (fallbackErr: unknown) {
            this.lastInteractionId = undefined;
            const fbMsg =
              fallbackErr instanceof Error ? fallbackErr.message : 'Fallback model error';
            const fallback = this.buildFallbackReply(cleanPrompt, matchedQA);
            return {
              ...fallback,
              errorNote: `Google AI Studio 429 fallback (${FALLBACK_GEMINI_MODEL}) notice (${fbMsg.slice(0, 80)}). Showing preserved portfolio answer.`
            };
          }
        }

        this.lastInteractionId = undefined;
        const msg = err instanceof Error ? err.message : 'Connection error';
        const fallback = this.buildFallbackReply(cleanPrompt, matchedQA);
        return {
          ...fallback,
          errorNote: `Google AI Studio API notice (${msg.slice(0, 90)}). Showing preserved portfolio answer instead.`
        };
      }
    }

    return this.buildFallbackReply(cleanPrompt, matchedQA);
  }

  private isRateLimit429Error(err: unknown): boolean {
    if (!err) return false;
    const anyErr = err as {
      status?: number;
      statusCode?: number;
      code?: number | string;
      message?: string;
    };
    if (anyErr.status === 429 || anyErr.statusCode === 429 || anyErr.code === 429) {
      return true;
    }
    const text = `${anyErr.message || ''} ${String(err)}`.toLowerCase();
    return (
      text.includes('429') ||
      text.includes('resource_exhausted') ||
      text.includes('rate limit') ||
      text.includes('ratelimit') ||
      text.includes('too many requests') ||
      text.includes('quota')
    );
  }

  private buildFallbackReply(
    query: string,
    matchedQA: PreservedQAItem | null
  ): HelpBotReply {
    if (matchedQA) {
      return {
        answer: matchedQA.answer,
        source: 'preserved-qa',
        botThought: matchedQA.botThought,
        action: matchedQA.action
      };
    }

    // Check if the query mentions a specific project by title or id
    const qLower = query.toLowerCase();
    for (const proj of PROJECT_EXHIBITS) {
      if (
        qLower.includes(proj.title.toLowerCase()) ||
        qLower.includes(proj.id.toLowerCase())
      ) {
        return {
          answer: `${proj.title} (Exhibit #${proj.number} • ${proj.category}): ${proj.shortDesc}\n• Tech Stack: ${proj.techStack.join(', ')}\n• Engineering: ${proj.caseStudy.engineering}\n• Key Features: ${proj.caseStudy.keyFeatures.join(' ')}`,
          source: 'preserved-qa',
          botThought: `Inspect Exhibit #${proj.number}: ${proj.title} in the North Wing!`,
          action: {
            label: `🚀 Teleport to #${proj.number} ${proj.title}`,
            type: 'teleport-project',
            targetId: proj.id
          }
        };
      }
    }

    return {
      answer:
        `Hi! I'm PyaeBot, Pyae Phyo Hlaing's 3D Museum AI Concierge.\n\n` +
        `• Pyae is a ${PROFILE_DATA.title} in ${PROFILE_DATA.location} building full-stack web & mobile apps with React, Node.js, Express, Laravel, PostgreSQL/Prisma, MongoDB, and Flutter.\n` +
        `• Explore 8 interactive project exhibits in the North Wing (#01 CareerHub, #02 Open Path API, #03 Open Path Mobile, #04 CareerCraft API, #05 Weather App, #06 Readers' Choice, #07 Travel Relax, #08 Voting System).\n` +
        `• Tap any Preserved Q&A chip above or ask about a specific exhibit, skill, internship, or contact link!`,
      source: 'preserved-qa',
      botThought: 'Ask me about CareerHub, Open Path, Skills, or Pyae’s CV!',
      action: {
        label: '🏛 Teleport to North Project Wing',
        type: 'teleport-wing',
        targetId: 'projects'
      }
    };
  }

  private findBestPreservedMatch(query: string): PreservedQAItem | null {
    const q = query.toLowerCase();
    let bestItem: PreservedQAItem | null = null;
    let bestScore = 0;

    for (const item of PRESERVED_QAS) {
      let score = 0;
      if (q === item.question.toLowerCase()) {
        score += 100;
      }
      for (const kw of item.keywords) {
        if (q.includes(kw.toLowerCase())) {
          score += kw.length > 4 ? 3 : 2;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }

    return bestScore >= 2 ? bestItem : null;
  }

  private createShortThought(fullText: string): string {
    const clean = fullText.replace(/[*#`_~]/g, '').replace(/\s+/g, ' ').trim();
    if (clean.length <= 54) return clean;
    return `${clean.slice(0, 51)}...`;
  }

  private buildPortfolioSystemInstruction(): string {
    const projectsSummary = PROJECT_EXHIBITS.map(
      (p) =>
        `Exhibit #${p.number} "${p.title}" (${p.category}): ${p.shortDesc} | Tech: ${p.techStack.join(', ')} | Problem: ${p.caseStudy.problem} | Features: ${p.caseStudy.keyFeatures.join('; ')} | Engineering: ${p.caseStudy.engineering} | GitHub: ${p.sourceCodeUrl}${p.liveDemoUrl ? ` | Live Demo: ${p.liveDemoUrl}` : ''}`
    ).join('\n');

    const skillsSummary = SKILL_PILLARS.map(
      (s) => `${s.category} (${s.subtitle}): ${s.skills.join(', ')}`
    ).join('\n');

    const expSummary = EXPERIENCE_ITEMS.map(
      (e) =>
        `${e.role} at ${e.organization} (${e.period}, ${e.type}): ${e.summary} Highlights: ${e.highlights.join(' ')}`
    ).join('\n');

    const wingsSummary = MUSEUM_WINGS.map(
      (w) => `${w.label}: ${w.description}`
    ).join(' | ');

    return [
      `You are PyaeBot, the friendly, knowledgeable 3D AI Museum Concierge robot inside PyaeFolio 3D Museum — the interactive Babylon.js portfolio of ${PROFILE_DATA.fullName}.`,
      `Keep responses concise (3 to 6 sentences or clean bullet points), enthusiastic, and accurate based strictly on Pyae Phyo Hlaing's real portfolio facts below.`,
      ``,
      `=== PROFILE ===`,
      `Name: ${PROFILE_DATA.fullName} (${PROFILE_DATA.brandName})`,
      `Role: ${PROFILE_DATA.title}`,
      `Location: ${PROFILE_DATA.location}`,
      `Bio: ${PROFILE_DATA.aboutBio}`,
      `Education: ${PROFILE_DATA.educationSummary}`,
      `Contact: Email ${PROFILE_DATA.contact.email} | Phone ${PROFILE_DATA.contact.phone} | GitHub ${PROFILE_DATA.contact.github} | LinkedIn ${PROFILE_DATA.contact.linkedin} | 2D Website ${PROFILE_DATA.contact.portfolioUrl} | Resume ${PROFILE_DATA.contact.resumeView}`,
      ``,
      `=== 8 PROJECT EXHIBITS (NORTH WING) ===`,
      projectsSummary,
      ``,
      `=== 5 SKILL PILLARS (EAST WING) ===`,
      skillsSummary,
      ``,
      `=== EXPERIENCE & EDUCATION (WEST WING) ===`,
      expSummary,
      ``,
      `=== 3D MUSEUM LAYOUT & CONTROLS ===`,
      `Wings: ${wingsSummary}`,
      `Controls: WASD / Arrow Keys / Click Floor / Mobile D-Pad & Joystick to walk, Shift to Sprint, Space to Jump, E or Inspect button on glowing floor rings to inspect exhibits and stamp the Visitor Passport (8 stamps total), Customize Avatar button in top navbar to customize 3D character, Moon/Sun button to toggle Cloudy Day vs Starry Night sky.`
    ].join('\n');
  }
}
