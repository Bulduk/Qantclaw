import { AgentSignal, MasterEquation } from './masterEquation';

export interface DecisionResult {
  action: 'BUY' | 'SELL' | 'HOLD';
  coherence: number;
  positiveVotes: number;
  totalVotes: number;
  passed: boolean;
  timestamp: string;
}

export class LighthouseProtocol {
  private masterEquation: MasterEquation;
  
  constructor() {
    this.masterEquation = new MasterEquation();
  }

  /**
   * Evaluates the quantum field state using the 6/9 vote mechanism.
   * "Lighthouse" demands a strict consensus to illuminate a trade path.
   */
  public evaluate(signals: AgentSignal[], sentimentScore: number): DecisionResult {
    const coherence = this.masterEquation.calculateCoherence(signals, sentimentScore);
    
    // Calculate 6/9 vote mechanism
    const positiveVotes = signals.filter(s => s.value > 0).length;
    const negativeVotes = signals.filter(s => s.value < 0).length;
    const totalVotes = signals.length;
    
    // Minimum 6 out of 9 agents must agree
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let isConsensusPassed = false;
    
    if (positiveVotes >= 6 && coherence > 0.3) {
      action = 'BUY';
      isConsensusPassed = true;
    } else if (negativeVotes >= 6 && coherence < -0.3) {
      action = 'SELL';
      isConsensusPassed = true;
    }
    
    return {
      action,
      coherence: Number((coherence * 100).toFixed(2)), // as percentage for metrics
      positiveVotes: action === 'SELL' ? negativeVotes : positiveVotes,
      totalVotes,
      passed: isConsensusPassed,
      timestamp: new Date().toISOString()
    };
  }
}
