export interface AgentSignal {
  id: string;
  weight: number;
  value: number; // -1.0 to 1.0
}

export class MasterEquation {
  private baseDimensions = 9;
  
  // Weights for different mathematical/quantum states in the 9-dimensional field
  private weights = [0.15, 0.1, 0.1, 0.1, 0.1, 0.15, 0.1, 0.1, 0.1];

  /**
   * Calculates field coherence (Γ).
   * Incorporates signals from quantum agents and the 10th sensor (Auris Node/Sentiment).
   */
  public calculateCoherence(signals: AgentSignal[], sentimentScore: number): number {
    let coherence = 0;
    
    // Sum weighted signals for the 9 dimensions
    for (let i = 0; i < Math.min(signals.length, this.baseDimensions); i++) {
        coherence += signals[i].value * this.weights[i] * signals[i].weight;
    }
    
    // 10th sensor: Auris Node (Sentiment from CloddsBot/LLM) 
    // Acts as a massive gravitational pull on the coherence
    const sentimentWeight = 0.25;
    coherence = (coherence * (1 - sentimentWeight)) + (sentimentScore * sentimentWeight);
    
    // Normalize and return between -1 and 1
    return Math.max(-1, Math.min(1, coherence));
  }
}
