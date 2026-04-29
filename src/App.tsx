/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Activity, Cpu, ShieldAlert, Terminal, Settings, 
  Network, Hexagon, BarChart3, Wifi, WifiOff, Link2, Key, Database, Zap, Lock, Moon, Sun,
  Bot, Target, Users, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processSentimentAndTrade } from './lib/bridge';

interface Trade {
  id: number;
  internal_id: string;
  exchange_id: string;
  symbol: string;
  side: string;
  amount: number;
  price: number;
  hash: string;
  timestamp: string;
}

interface Strategy {
  id: number;
  name: string;
  type?: string;
  active: boolean;
  signals: number;
  performance: string;
  riskLevel: string;
  agents?: number;
  confidence?: number;
  history?: number[];
}

export default function App() {
  const [metrics, setMetrics] = useState({
    coherence: 0.87,
    activeAgents: 118,
    signalStrength: 0.92,
  });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [systemHealth, setSystemHealth] = useState<'ACTIVE' | 'CONNECTING' | 'ERROR'>('CONNECTING');
  const [botMode, setBotMode] = useState<'PAPER' | 'LIVE' | 'STANDBY'>('PAPER');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [alert, setAlert] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'Dashboard' | 'Strategies' | 'Artifacts' | 'Logs' | 'Admin'>('Dashboard');
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  // Bridge Engine Data
  const [bridgeRunning, setBridgeRunning] = useState(false);
  const [bridgeResult, setBridgeResult] = useState<any>(null);
  const [marketInput, setMarketInput] = useState("Bitcoin shows sudden surge in volume as institutional buyers step in. Retail sentiment remains cautious but whales are accumulating.");

  // Fetch metrics & trades
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/metrics');
        if (res.ok) {
          const data = await res.json();
          setSystemHealth('ACTIVE');
          setMetrics({
            coherence: data.coherence,
            activeAgents: data.activeAgents,
            signalStrength: data.signalStrength,
          });
          setTrades(data.trades);
        } else {
          setSystemHealth('ERROR');
        }
      } catch (err) {
        setSystemHealth('ERROR');
      }
    };

    const fetchStrategies = async () => {
      try {
        const res = await fetch('/api/strategies');
        if (res.ok) {
          const data = await res.json();
          setStrategies(data);
        }
      } catch (e) {
        console.error("Failed to load strategies", e);
      }
    };

    fetchData();
    fetchStrategies();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerTestSignal = async () => {
    try {
      const res = await fetch('/api/bridge/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'BTC/USDT',
          side: Math.random() > 0.5 ? 'BUY' : 'SELL',
          strength: 0.85 + (Math.random() * 0.15)
        })
      });
      const data = await res.json();
      if (data.status === 'EXECUTED') {
        setAlert(`Lighthouse Protocol Executed: ${data.order.side} ${data.order.symbol} @ ${data.order.price}`);
        setTimeout(() => setAlert(null), 5000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runBridgeAnalysis = async () => {
    if (!marketInput.trim() || bridgeRunning) return;
    setBridgeRunning(true);
    setBridgeResult(null);
    try {
      const data = await processSentimentAndTrade(marketInput);
      if (data.success) {
        setBridgeResult(data);
      } else {
        setAlert(data.error || 'Bridge analysis failed');
        setTimeout(() => setAlert(null), 5000);
      }
    } catch (e) {
      setAlert('Failed to connect to bridge API');
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setBridgeRunning(false);
    }
  };

  return (
    <div className={`${theme}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-700 dark:text-slate-300 font-sans selection:bg-orange-500/30 flex overflow-hidden transition-colors duration-150">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#08080a]/50 backdrop-blur-xl flex flex-col hidden md:flex z-10 shrink-0 shadow-[4px_0_24px_rgba(255,94,0,0.03)] transition-colors duration-150">
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center gap-3 transition-colors duration-300">
            <Hexagon className="text-orange-500 w-8 h-8 drop-shadow-[0_0_12px_rgba(255,94,0,0.4)] dark:drop-shadow-[0_0_12px_rgba(255,94,0,0.6)]" />
            <div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">AUREON</h1>
              <p className="text-[10px] text-orange-600 dark:text-orange-500/80 font-mono tracking-wider">HYBRID.QUANTUM</p>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 relative">
            <NavButton icon={<Activity size={18} />} label="Dashboard" active={currentView === 'Dashboard'} onClick={() => setCurrentView('Dashboard')} />
            <NavButton icon={<Network size={18} />} label="Strategies" active={currentView === 'Strategies'} onClick={() => setCurrentView('Strategies')} />
            <NavButton icon={<Database size={18} />} label="Artifacts" active={currentView === 'Artifacts'} onClick={() => setCurrentView('Artifacts')} />
            <NavButton icon={<Terminal size={18} />} label="Logs" active={currentView === 'Logs'} onClick={() => setCurrentView('Logs')} />
          </nav>
          
          <div className="p-4 border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
            <NavButton icon={<Settings size={18} />} label="Admin" active={currentView === 'Admin'} onClick={() => setCurrentView('Admin')} />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_rgba(255,94,0,0.1),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(255,94,0,0.05),_transparent_50%)] pb-[70px] md:pb-0 transition-colors duration-300">
          
          {/* Top Header */}
          <header className="h-16 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 bg-white/60 dark:bg-[#050505]/60 backdrop-blur-xl z-20 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{currentView}</h2>
              <div className="h-4 w-px bg-slate-300 dark:bg-white/10 transition-colors duration-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">CloddsBot Link</span>
                {systemHealth === 'ACTIVE' ? (
                  <Link2 size={14} className="text-green-600 dark:text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.4)] dark:drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                ) : (
                  <WifiOff size={14} className="text-red-500" />
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Theme Switcher */}
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Mode Switcher */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/40 p-1 block border border-slate-200 dark:border-white/10 rounded-md transition-colors duration-300">
                 <button 
                  onClick={() => setBotMode('PAPER')}
                  className={`px-3 text-xs py-1 rounded font-medium transition-colors ${botMode === 'PAPER' ? 'bg-orange-100/50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-300/50 dark:border-orange-500/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  PAPER
                 </button>
                 <button 
                  onClick={() => setBotMode('LIVE')}
                  className={`px-3 text-xs py-1 rounded font-medium transition-colors ${botMode === 'LIVE' ? 'bg-red-100/50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-300/50 dark:border-red-500/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  LIVE
                 </button>
              </div>
              
              {/* User Profile (Alex style) */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Alex.Q</p>
                  <p className="text-[10px] text-orange-600 dark:text-orange-500/80 font-mono">Quant Engineer</p>
                </div>
                <div className="w-8 h-8 rounded-full border border-orange-300 dark:border-orange-500/30 bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-500 shadow-[0_0_10px_rgba(255,94,0,0.1)] dark:shadow-[0_0_10px_rgba(255,94,0,0.2)]">
                  A
                </div>
              </div>
            </div>
          </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          
          {/* Dashboard View */}
          {currentView === 'Dashboard' && (
            <div className="animate-in fade-in duration-150">
              {/* Inject Test Signal Button */}
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100">Swarm Intelligence Overview</h3>
                  <p className="text-slate-500 text-sm mt-1">Real-time metrics from Aureon Nodes and CloddsBot signals.</p>
                </div>
                <button 
                  onClick={triggerTestSignal}
                  className="px-4 py-2 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-500 text-sm font-medium rounded border border-orange-200 dark:border-orange-500/30 transition-colors flex items-center gap-2 shadow-[0_2px_10px_rgba(255,94,0,0.05)] dark:shadow-[0_0_15px_rgba(255,94,0,0.1)] hover:shadow-[0_4px_15px_rgba(255,94,0,0.1)] dark:hover:shadow-[0_0_20px_rgba(255,94,0,0.2)]">
                  <Cpu size={16} />
                  Simulate Signal (Auris)
                </button>
              </div>

              {/* Critical Alert Area */}
              {alert && (
                <div className="mb-6 p-4 border border-orange-300 dark:border-orange-500/50 bg-orange-50 dark:bg-orange-950/30 backdrop-blur-md rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
                  <ShieldAlert className="text-orange-600 dark:text-orange-500 drop-shadow-[0_0_8px_rgba(255,94,0,0.3)] dark:drop-shadow-[0_0_8px_rgba(255,94,0,0.8)]" />
                  <p className="text-orange-800 dark:text-orange-100 font-mono text-sm">{alert}</p>
                </div>
              )}

              {/* Status Cards (Metrics) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
                <MetricCard 
                  title="Field Coherence" 
                  value={(metrics.coherence * 100).toFixed(1) + '%'} 
                  color="text-green-600 dark:text-green-500" 
                  progress={metrics.coherence * 100}
                  icon={<Activity size={16} className="text-green-600/70 dark:text-green-500/70" />}
                />
                <MetricCard 
                  title="Active Swarm Agents" 
                  value={metrics.activeAgents} 
                  color="text-orange-600 dark:text-orange-500" 
                  progress={(metrics.activeAgents / 150) * 100} 
                  subtitle="/ 150 Node"
                  icon={<Cpu size={16} className="text-orange-600/70 dark:text-orange-500/70" />}
                />
                <MetricCard 
                  title="Signal Strength (Λ5)" 
                  value={(metrics.signalStrength * 100).toFixed(1) + '%'} 
                  color="text-lime-600 dark:text-lime-400" 
                  progress={metrics.signalStrength * 100}
                  icon={<Zap size={16} className="text-lime-600/70 dark:text-lime-400/70" />}
                />
              </div>

              {/* Quantum Sentiment Bridge Visualizer */}
              <div className="mb-8 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-xl dark:shadow-black/50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500"></div>
                <div className="p-6 border-b border-slate-100 dark:border-white/5">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                         <Hexagon className="text-orange-500 w-5 h-5" /> 
                         AUREON Live Synthesizer
                       </h3>
                       <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                         Auris Node (NLP) ↔ Master Equation (Quantum 9-Dim)
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex gap-3">
                     <input 
                       type="text" 
                       value={marketInput}
                       onChange={(e) => setMarketInput(e.target.value)}
                       placeholder="Enter live market text..."
                       className="flex-1 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 font-mono focus:outline-none focus:border-orange-500/50 transition-colors"
                     />
                     <button 
                       onClick={runBridgeAnalysis}
                       disabled={bridgeRunning}
                       className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all flex items-center gap-2"
                     >
                       {bridgeRunning ? (
                         <>
                           <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                           Synthesizing...
                         </>
                       ) : (
                         <>
                           <Bot size={16} /> Ignite Bridge
                         </>
                       )}
                     </button>
                   </div>
                </div>
                
                <div className="p-6 bg-slate-50 dark:bg-[#050505] min-h-[220px] flex items-center justify-center relative overflow-hidden">
                  {!bridgeResult && !bridgeRunning && (
                     <div className="text-slate-400 dark:text-slate-600 font-mono text-sm flex flex-col items-center gap-3 animate-pulse">
                       <Network size={32} className="opacity-50" />
                       Awaiting Input Stream...
                     </div>
                  )}

                  {bridgeRunning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-48 h-48 flex items-center justify-center">
                         <div className="absolute inset-0 border border-orange-500/30 rounded-full animate-[ping_2s_ease-out_infinite]"></div>
                         <div className="absolute inset-4 border border-rose-500/30 rounded-full animate-[ping_2s_ease-out_infinite_0.5s]"></div>
                         <Hexagon size={48} className="text-orange-500 animate-[spin_4s_linear_infinite]" />
                      </div>
                    </div>
                  )}

                  {bridgeResult && !bridgeRunning && (
                    <div className="w-full flex justify-between items-center relative animate-in fade-in zoom-in-95 duration-500">
                      {/* Left: Auris Node Sentiment */}
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform ${
                           bridgeResult.sentimentScore > 0 ? 'bg-green-100 text-green-600 shadow-green-500/20' : 
                           bridgeResult.sentimentScore < 0 ? 'bg-red-100 text-red-600 shadow-red-500/20' : 
                           'bg-slate-200 text-slate-600 shadow-slate-500/20'
                        }`}>
                          <Bot size={32} />
                        </div>
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Auris Node Output</span>
                        <span className={`text-2xl font-mono ${
                           bridgeResult.sentimentScore > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                        }`}>
                          {bridgeResult.sentimentScore > 0 ? '+' : ''}{bridgeResult.sentimentScore.toFixed(3)}
                        </span>
                      </div>

                      {/* Center: The 9 Dimensions (Agents) */}
                      <div className="flex-1 flex justify-center relative">
                        {/* Connecting Line from Auris */}
                        <div className="absolute left-[-50%] top-1/2 w-1/2 h-0.5 bg-gradient-to-r from-orange-500/0 to-orange-500/50"></div>
                        {/* Connecting Line to Lighthouse */}
                        <div className="absolute right-[-50%] top-1/2 w-1/2 h-0.5 bg-gradient-to-l from-orange-500/0 to-orange-500/50"></div>
                        
                        <div className="grid grid-cols-3 gap-3 relative z-10 w-fit">
                           {bridgeResult.rawSignals.map((sig: any, idx: number) => (
                             <motion.div 
                               initial={{ scale: 0, opacity: 0 }}
                               animate={{ scale: 1, opacity: 1 }}
                               transition={{ delay: idx * 0.05 + 0.2, type: "spring" }}
                               key={sig.id} 
                               className={`w-10 h-10 rounded-full flex items-center justify-center text-[9px] font-bold shadow-inner ${
                                 sig.value > 0 ? 'bg-green-500 dark:bg-green-500/20 text-white dark:text-green-400 border border-green-400' : 
                                 sig.value < 0 ? 'bg-red-500 dark:bg-red-500/20 text-white dark:text-red-400 border border-red-400' : 
                                 'bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-400'
                               }`}
                               title={`Agent: ${sig.id}\nWeight: ${sig.weight}\nValue: ${sig.value.toFixed(2)}`}
                             >
                               {sig.value > 0 ? 'BUY' : sig.value < 0 ? 'SELL' : 'HLD'}
                             </motion.div>
                           ))}
                        </div>
                      </div>

                      {/* Right: Lighthouse Consensus */}
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <motion.div 
                           initial={{ rotateY: 90 }}
                           animate={{ rotateY: 0 }}
                           transition={{ delay: 0.8, type: "spring", damping: 12 }}
                           className={`p-1 rounded-2xl ${
                             bridgeResult.decision.passed ? 
                               (bridgeResult.decision.action === 'BUY' ? 'bg-gradient-to-br from-green-400 to-green-600 p-[2px]' : 'bg-gradient-to-br from-red-400 to-red-600 p-[2px]') : 
                               'bg-slate-300 dark:bg-slate-700 p-[2px]'
                           }`}
                        >
                          <div className="w-24 h-24 bg-white dark:bg-black rounded-xl flex flex-col items-center justify-center gap-1">
                             <Target size={24} className={bridgeResult.decision.action === 'BUY' ? 'text-green-500' : bridgeResult.decision.action === 'SELL' ? 'text-red-500' : 'text-slate-500'} />
                             <span className={`text-xl font-black tracking-tighter ${bridgeResult.decision.action === 'BUY' ? 'text-green-500' : bridgeResult.decision.action === 'SELL' ? 'text-red-500' : 'text-slate-500'}`}>
                               {bridgeResult.decision.action}
                             </span>
                          </div>
                        </motion.div>
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Lighthouse Output</span>
                        
                        <div className="flex gap-2">
                          <span className="text-xs font-mono text-slate-700 dark:text-slate-300">Γ: {bridgeResult.decision.coherence}%</span>
                          <span className="text-xs font-mono text-slate-700 dark:text-slate-300">Vote: {bridgeResult.decision.positiveVotes}/9</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Strategies Quick summary */}
                <div className="col-span-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-md transition-colors duration-300">
                   <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-4">
                     <Network size={16} className="text-slate-400" />
                     Top Strategies
                   </h3>
                   <div className="space-y-3">
                     {strategies.slice(0, 3).map(s => (
                       <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 transition-colors duration-300">
                         <div>
                           <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</p>
                           <p className="text-[10px] font-mono text-slate-500">{s.signals} signals</p>
                         </div>
                         <div className={`text-sm font-mono ${s.performance.startsWith('+') ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                           {s.performance}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* Activities / Executed Trades */}
                <div className="col-span-1 lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-xl dark:shadow-black/50 backdrop-blur-md transition-colors duration-300">
                  <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 transition-colors duration-300">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                      <Terminal size={16} className="text-slate-400" />
                      Executed Trades
                    </h3>
                  </div>
                  
                  <div className="w-full">
                    {trades.length === 0 ? (
                      <div className="px-6 py-12 text-center text-slate-500 font-mono text-xs">
                        Awaiting convergence of swarm nodes... No executions yet.
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {/* Desktop Table View */}
                        <div className="hidden md:block w-full overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-black/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
                                <th className="px-6 py-3 font-medium">Time (UTC)</th>
                                <th className="px-6 py-3 font-medium">Symbol</th>
                                <th className="px-6 py-3 font-medium">Side</th>
                                <th className="px-6 py-3 font-medium">Price</th>
                                <th className="px-6 py-3 font-medium">Verify Hash</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                              {trades.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                                    {new Date(t.timestamp).toLocaleTimeString()}
                                  </td>
                                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                    {t.symbol}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                                      t.side === 'BUY' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border border-green-200 dark:border-green-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-500 border border-red-200 dark:border-red-500/20'
                                    }`}>
                                      {t.side}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                                    ${t.price.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 max-w-[200px]">
                                      <div className="truncate font-mono text-xs text-orange-600 dark:text-orange-500/60 bg-orange-50 dark:bg-black/50 px-2 py-1 rounded border border-orange-200 dark:border-white/5 group-hover:bg-orange-100 dark:group-hover:bg-black transition-colors">
                                        {t.hash}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-white/5 transition-colors duration-300">
                          {trades.map((t) => (
                            <div key={t.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">{t.symbol}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                    t.side === 'BUY' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border border-green-200 dark:border-green-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-500 border border-red-200 dark:border-red-500/20'
                                  }`}>
                                    {t.side}
                                  </span>
                                </div>
                                <span className="font-mono text-slate-600 dark:text-slate-300">${t.price.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-mono text-slate-500">{new Date(t.timestamp).toLocaleTimeString()}</span>
                                <div className="truncate font-mono text-[10px] text-orange-600 dark:text-orange-500/60 bg-orange-50 dark:bg-black/50 px-1.5 py-0.5 rounded border border-orange-200 dark:border-white/5 max-w-[120px] transition-colors">
                                  {t.hash}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Strategies View */}
          {currentView === 'Strategies' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="mb-6">
                <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100">Swarm Strategies</h3>
                <p className="text-slate-500 text-sm">Manage interconnected NLP and Quantum models.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {strategies.map((s) => {
                  const isPositive = s.performance.startsWith('+');
                  const perfColor = isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
                  
                  return (
                    <motion.div 
                      layoutId={`strategy-${s.id}`}
                      key={s.id} 
                      onClick={() => setSelectedStrategy(s)}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md cursor-pointer transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 group overflow-hidden relative"
                    >
                      
                      {/* Glow */}
                      {s.active && <div className="absolute -top-12 -right-12 w-32 h-32 blur-[50px] bg-orange-500/10 dark:bg-orange-500/15 group-hover:bg-orange-500/20 dark:group-hover:bg-orange-500/25 transition-colors pointer-events-none"></div>}

                      <div className="flex justify-between items-start mb-5 relative z-10">
                        <div className="flex items-center gap-3">
                           <div className="bg-slate-50 dark:bg-black/30 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                             {s.type === 'quantum' && <Hexagon className={`w-5 h-5 ${s.active && 'text-orange-500'}`} />}
                             {s.type === 'nlp' && <Bot className={`w-5 h-5 ${s.active && 'text-orange-500'}`} />}
                             {s.type === 'swarm' && <Network className={`w-5 h-5 ${s.active && 'text-orange-500'}`} />}
                             {s.type === 'consensus' && <Target className={`w-5 h-5 ${s.active && 'text-orange-500'}`} />}
                             {!s.type && <Zap className={`w-5 h-5 ${s.active && 'text-orange-500'}`} />}
                           </div>
                           <div>
                             <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{s.name}</h4>
                             <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">ID: AUR-{s.id.toString().padStart(4, '0')}</p>
                           </div>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded uppercase transition-colors duration-300 flex items-center gap-1.5 ${
                          s.active ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border border-green-200 dark:border-green-500/20' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-transparent'
                        }`}>
                          {s.active && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                          {s.active ? 'Active' : 'Offline'}
                        </span>
                      </div>

                      <div className="flex items-end justify-between mb-6 relative z-10">
                         <div className="flex-1 pr-6">
                           <div className="h-[40px] w-full">
                             <Sparkline data={s.history || [0,0]} isPositive={isPositive} />
                           </div>
                         </div>
                         <div className="text-right shrink-0">
                           <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase mb-1">Return (24h)</p>
                           <p className={`text-2xl font-medium tracking-tight ${perfColor} drop-shadow-sm`}>
                             {s.performance}
                           </p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 dark:border-white/10 pt-4 relative z-10">
                         <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-mono text-slate-400 mb-1">Signals</span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.signals}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-mono text-slate-400 mb-1">Agents Link</span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <Users size={12} className="text-orange-500/70" /> {s.agents || 0}
                            </span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-mono text-slate-400 mb-1">Risk Profile</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${
                               s.riskLevel === 'CRITICAL' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                               s.riskLevel === 'HIGH' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                               s.riskLevel === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                               'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            }`}>
                              {s.riskLevel}
                            </span>
                         </div>
                         <div className="flex flex-col items-center">
                            <span className="text-[9px] uppercase font-mono text-slate-400 mb-1">Coherence</span>
                            <MiniCircleProgress progress={s.confidence || 0} colorClass="text-orange-500" />
                         </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin View */}
          {currentView === 'Admin' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-4xl max-w-3xl">
               <div className="mb-6">
                <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100">System Administration</h3>
                <p className="text-slate-500 text-sm">Configure API keys, risk limits, and bridge connections.</p>
               </div>
               
               <div className="space-y-6">
                 {/* API Vault */}
                 <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-md overflow-hidden transition-colors duration-300">
                   <div className="bg-slate-50 dark:bg-black/30 px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-3 transition-colors duration-300">
                     <Key className="text-orange-500 w-5 h-5" />
                     <h4 className="font-medium text-slate-800 dark:text-slate-200">API Vault</h4>
                   </div>
                   <div className="p-6 space-y-4">
                     <div>
                       <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">Binance Testnet API Key</label>
                       <div className="flex bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden focus-within:border-orange-400 dark:focus-within:border-orange-500/50 transition-colors duration-300">
                         <div className="px-3 py-2 text-slate-400 dark:text-slate-500 flex items-center bg-slate-100 dark:bg-black/50 border-r border-slate-200 dark:border-white/10 transition-colors duration-300">
                           <Lock size={14} />
                         </div>
                         <input type="password" defaultValue="************************" className="bg-transparent w-full px-3 py-2 text-slate-700 dark:text-slate-300 text-sm focus:outline-none font-mono placeholder-slate-400 dark:placeholder-slate-500" />
                       </div>
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">Binance Testnet Secret</label>
                       <div className="flex bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden focus-within:border-orange-400 dark:focus-within:border-orange-500/50 transition-colors duration-300">
                         <div className="px-3 py-2 text-slate-400 dark:text-slate-500 flex items-center bg-slate-100 dark:bg-black/50 border-r border-slate-200 dark:border-white/10 transition-colors duration-300">
                           <Lock size={14} />
                         </div>
                         <input type="password" defaultValue="************************" className="bg-transparent w-full px-3 py-2 text-slate-700 dark:text-slate-300 text-sm focus:outline-none font-mono placeholder-slate-400 dark:placeholder-slate-500" />
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Risk Management */}
                 <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-md overflow-hidden transition-colors duration-300">
                   <div className="bg-slate-50 dark:bg-black/30 px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-3 transition-colors duration-300">
                     <ShieldAlert className="text-orange-500 w-5 h-5" />
                     <h4 className="font-medium text-slate-800 dark:text-slate-200">Risk Management</h4>
                   </div>
                   <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">Max Drawdown (%)</label>
                       <input type="number" defaultValue="5.0" className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg w-full px-3 py-2 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:border-orange-400 dark:focus-within:border-orange-500/50 transition-colors duration-300 font-mono" />
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">Max Position Size (USDT)</label>
                       <input type="number" defaultValue="1000" className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg w-full px-3 py-2 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:border-orange-400 dark:focus-within:border-orange-500/50 transition-colors duration-300 font-mono" />
                     </div>
                   </div>
                   <div className="p-6 pt-0 flex justify-end">
                     <button className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white dark:text-black font-semibold rounded-lg text-sm transition-colors shadow-[0_4px_15px_rgba(255,94,0,0.2)] dark:shadow-[0_0_15px_rgba(255,94,0,0.3)]">
                       Save Configuration
                     </button>
                   </div>
                 </div>
               </div>
             </div>
          )}

          {/* Placeholder for Artifacts & Logs */}
          {(currentView === 'Artifacts' || currentView === 'Logs') && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 animate-in fade-in">
              <Terminal className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-mono text-sm">{currentView} Module Loading...</p>
              <p className="text-xs mt-2 opacity-60">Requires connection to Aureon remote nodes.</p>
            </div>
          )}
          
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full border-t border-slate-200 dark:border-white/5 bg-white/95 dark:bg-[#050505]/90 backdrop-blur-xl z-30 pb-safe transition-colors duration-300">
        <div className="flex items-center justify-around p-2">
          <MobileNavButton icon={<Activity size={20} />} label="Dash" active={currentView === 'Dashboard'} onClick={() => setCurrentView('Dashboard')} />
          <MobileNavButton icon={<Network size={20} />} label="Strats" active={currentView === 'Strategies'} onClick={() => setCurrentView('Strategies')} />
          <MobileNavButton icon={<Database size={20} />} label="Artifacts" active={currentView === 'Artifacts'} onClick={() => setCurrentView('Artifacts')} />
          <MobileNavButton icon={<Terminal size={20} />} label="Logs" active={currentView === 'Logs'} onClick={() => setCurrentView('Logs')} />
          <MobileNavButton icon={<Settings size={20} />} label="Admin" active={currentView === 'Admin'} onClick={() => setCurrentView('Admin')} />
        </div>
      </nav>

      {/* Expanded Strategy Detail Transition */}
      <AnimatePresence>
        {selectedStrategy && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedStrategy(null)}
          >
            <motion.div 
              layoutId={`strategy-${selectedStrategy.id}`}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-3xl shadow-[0_32px_96px_rgba(0,0,0,0.5)] p-6 sm:p-10 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedStrategy(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                <div className="flex items-center gap-4">
                  <div className="bg-white dark:bg-black/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    {selectedStrategy.type === 'quantum' && <Hexagon className="w-10 h-10 text-orange-500" />}
                    {selectedStrategy.type === 'nlp' && <Bot className="w-10 h-10 text-orange-500" />}
                    {selectedStrategy.type === 'swarm' && <Network className="w-10 h-10 text-orange-500" />}
                    {selectedStrategy.type === 'consensus' && <Target className="w-10 h-10 text-orange-500" />}
                    {!selectedStrategy.type && <Zap className="w-10 h-10 text-orange-500" />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">{selectedStrategy.name}</h2>
                    <div className="flex gap-3 items-center">
                       <span className="text-sm font-mono text-slate-500 dark:text-slate-400">ID: AUR-{selectedStrategy.id.toString().padStart(4, '0')}</span>
                       <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded uppercase flex items-center gap-1.5 ${
                          selectedStrategy.active ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {selectedStrategy.active && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                          {selectedStrategy.active ? 'Active' : 'Offline'}
                        </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                 <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                   <p className="text-xs uppercase font-mono text-slate-500 dark:text-slate-400 mb-2">Performance (24h)</p>
                   <p className={`text-3xl font-mono tracking-tight ${selectedStrategy.performance.startsWith('+') ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                     {selectedStrategy.performance}
                   </p>
                   <div className="h-12 w-full mt-4">
                     <Sparkline data={selectedStrategy.history || [0,0]} isPositive={selectedStrategy.performance.startsWith('+')} />
                   </div>
                 </div>

                 <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                   <div>
                     <p className="text-xs uppercase font-mono text-slate-500 dark:text-slate-400 mb-2">Linked Agents</p>
                     <p className="text-3xl font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                       <Users size={24} className="text-orange-500/70" /> {selectedStrategy.agents || 0}
                     </p>
                   </div>
                   <div className="mt-4">
                     <p className="text-xs font-mono text-slate-400 dark:text-slate-500">Total Signals Generated: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedStrategy.signals}</span></p>
                   </div>
                 </div>

                 <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-6">
                    <div className="flex-1">
                      <p className="text-xs uppercase font-mono text-slate-500 dark:text-slate-400 mb-2">Coherence</p>
                      <p className="text-2xl font-medium text-slate-800 dark:text-slate-200">{selectedStrategy.confidence}%</p>
                    </div>
                    <div className="shrink-0 scale-125 origin-right">
                       <MiniCircleProgress progress={selectedStrategy.confidence || 0} colorClass="text-orange-500" />
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                <div>
                   <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                     <Activity size={18} className="text-slate-400" /> Live Agent Log
                   </h3>
                   <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 shadow-inner h-48 overflow-y-auto space-y-2">
                     <p><span className="text-slate-500">[{new Date().toISOString().split('T')[1].slice(0,8)}]</span> [AUR-SYS] Strategy detail mounted.</p>
                     <p><span className="text-slate-500">[{new Date().toISOString().split('T')[1].slice(0,8)}]</span> [AGENT-01] Polling market depths...</p>
                     <p><span className="text-slate-500">[{new Date().toISOString().split('T')[1].slice(0,8)}]</span> [AGENT-14] Consensus protocol active.</p>
                     <p><span className="text-teal-500">[{new Date().toISOString().split('T')[1].slice(0,8)}]</span> <span className="text-white">Signal verified. Integrity Γ={selectedStrategy.confidence}.</span></p>
                   </div>
                </div>
                
                <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
                  <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all">
                    {selectedStrategy.active ? 'Force Stop Protocol' : 'Initialize Protocol'}
                  </button>
                  <button className="flex-1 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border border-transparent dark:border-white/10 font-medium py-3 px-4 rounded-xl transition-all">
                    View Sub-Agents
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
    </div>
  );
}

// Subcomponents
function MobileNavButton({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 focus:outline-none transition-colors ${
      active ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
    }`}>
      <div className={`${active ? 'drop-shadow-[0_2px_4px_rgba(255,94,0,0.2)] dark:drop-shadow-[0_0_8px_rgba(255,94,0,0.4)]' : ''}`}>{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
      {active && <div className="absolute top-0 w-8 h-0.5 bg-orange-500 rounded-b-full drop-shadow-[0_1px_2px_rgba(255,94,0,0.4)] dark:drop-shadow-[0_1px_4px_rgba(255,94,0,0.8)]" />}
    </button>
  );
}
function NavButton({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all focus:outline-none ${
      active 
        ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium border border-orange-200 dark:border-orange-500/30' 
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
    }`}>
      {icon}
      {label}
    </button>
  );
}

function Sparkline({ data, isPositive }: { data: number[], isPositive: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;
  const width = 120;
  const height = 40;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((d - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className={isPositive ? "text-green-500 dark:text-green-400 drop-shadow-[0_2px_4px_rgba(34,197,94,0.3)] dark:drop-shadow-[0_2px_4px_rgba(34,197,94,0.4)] transition-colors duration-300" : "text-red-500 dark:text-red-400 drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)] dark:drop-shadow-[0_2px_4px_rgba(239,68,68,0.4)] transition-colors duration-300"}
      />
    </svg>
  );
}

function MiniCircleProgress({ progress, colorClass }: { progress: number, colorClass: string }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle 
          cx="16" cy="16" r={radius} 
          className="stroke-slate-200 dark:stroke-white/10 fill-none transition-colors duration-300" 
          strokeWidth="2.5"
        />
        <circle 
          cx="16" cy="16" r={radius} 
          className={`${colorClass.replace('text-', 'stroke-')} fill-none transition-all duration-500 ease-out`}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-slate-700 dark:text-slate-300">{progress}</span>
    </div>
  );
}

function MetricCard({ title, value, color, progress, subtitle, icon }: { title: string, value: string | number, color: string, progress: number, subtitle?: string, icon?: React.ReactNode }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 p-4 sm:p-5 rounded-xl flex flex-row items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden group hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
      {/* Dynamic Background Glow */}
      <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 blur-[40px] opacity-[0.05] dark:opacity-10 ${color.replace('text-', 'bg-')} transition-opacity group-hover:opacity-[0.15] dark:group-hover:opacity-30 pointer-events-none`}></div>
      
      <div className="relative z-10 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-md bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 ${color} shadow-sm dark:shadow-[0_0_10px_currentColor] bg-opacity-[0.05] dark:bg-opacity-10 hidden sm:block`}>
            {icon}
          </div>
          <p className="text-[10px] sm:text-xs font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider leading-tight">{title}</p>
        </div>
        <div className="flex items-baseline gap-1 sm:gap-2">
          <h3 className={`text-2xl sm:text-3xl font-medium ${color} drop-shadow-sm dark:drop-shadow-[0_0_10px_currentColor] tracking-tight`}>{value}</h3>
          {subtitle && <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase max-w-[50px] truncate sm:max-w-none">{subtitle}</span>}
        </div>
      </div>

      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 z-10 drop-shadow-none dark:drop-shadow-[0_0_5px_currentColor] text-inherit ml-2">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[10px] font-bold font-mono ${color}`}>{Math.round(progress)}</span>
        </div>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
          <circle 
            cx="32" 
            cy="32" 
            r={radius} 
            className="stroke-slate-100 dark:stroke-white/5 fill-none transition-colors duration-300" 
            strokeWidth="4"
          />
          <circle 
            cx="32" 
            cy="32" 
            r={radius} 
            className={`${color.replace('text-', 'stroke-')} fill-none transition-all duration-500 ease-out`}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
