import { GoogleGenAI } from '@google/genai';
import { LighthouseProtocol } from '../../aureon-core/lighthouseProtocol';
import { AgentSignal } from '../../aureon-core/masterEquation';

const lighthouse = new LighthouseProtocol();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export async function processSentimentAndTrade(marketText: string) {
  try {
    const ai = getAiClient();
    
    // 1. Get sentiment score from Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        `You are the Auris Node for a quantum trading swarm. 
         Analyze the following market summary and return ONLY a float number between -1.0 (extremely bearish/panic) and 1.0 (extremely bullish/euphoria).
         Provide no other text.
         Market summary: ${marketText}`
      ],
    });
    
    const scoreText = response.text?.trim() || "0";
    let sentimentScore = parseFloat(scoreText);
    
    if (isNaN(sentimentScore)) {
      sentimentScore = 0;
    }
    // Clamp between -1 and 1
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

    // 2. Generate 9 mock signals for the other agents (since we don't have real agent models yet)
    // We bias them slightly towards the sentiment to simulate swarm behavior
    const agentSignals: AgentSignal[] = Array.from({ length: 9 }, (_, i) => ({
      id: `AGENT-${i+1}`,
      weight: 1.0,
      value: Math.max(-1, Math.min(1, ((Math.random() * 2) - 1) + (sentimentScore * 0.5)))
    }));
    
    // 3. Evaluate via Lighthouse Protocol
    const decision = lighthouse.evaluate(agentSignals, sentimentScore);
    
    return {
      success: true,
      sentimentScore,
      decision,
      rawSignals: agentSignals
    };
  } catch (error) {
    console.error('Error in bridge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process sentiment'
    };
  }
}
