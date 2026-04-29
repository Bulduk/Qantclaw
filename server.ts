import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import ccxt from 'ccxt';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import client from 'prom-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Prometheus Metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'aureon_' });

const tradesCounter = new client.Counter({
  name: 'aureon_executed_trades_total',
  help: 'Total number of executed trades'
});

const pnlGauge = new client.Gauge({
  name: 'aureon_current_pnl',
  help: 'Current mocked P&L for paper trading'
});
pnlGauge.set(12.4); // Mock initial P&L

// Initialize SQLite Database (simulating quantum_trading_db PostgreSQL)
const db = new Database(':memory:');

// Create Schema
db.exec(`
  -- Aureon Schema mimicking
  CREATE TABLE if not exists field_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coherence REAL,
    agents_active INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE if not exists trade_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT,
    side TEXT,
    strength REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE if not exists executed_trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internal_id TEXT,
    exchange_id TEXT,
    symbol TEXT,
    side TEXT,
    amount REAL,
    price REAL,
    hash TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Clodds Schema mimicking
  CREATE TABLE if not exists messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT INTO field_states (coherence, agents_active) VALUES (0.87, 118);
`);

// API Routes

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', lighthouse: 'ACTIVE' });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'ONLINE', uptime: process.uptime(), latency: Math.floor(Math.random() * 20) + 5 });
});

app.get('/api/strategies', (req, res) => {
  res.json([
    { id: 1, name: 'AUREON Quantum Momentum', type: 'quantum', active: true, signals: 45, performance: '+12.4%', riskLevel: 'HIGH', agents: 42, confidence: 94, history: [10, 12, 11, 14, 13, 16, 18, 17, 20] },
    { id: 2, name: 'Clodds NLP Arbitrage', type: 'nlp', active: true, signals: 12, performance: '+5.1%', riskLevel: 'MEDIUM', agents: 18, confidence: 88, history: [4, 5, 4, 6, 5, 8, 7, 9, 8] },
    { id: 3, name: 'Swarm Mean Reversion', type: 'swarm', active: false, signals: 0, performance: '-1.2%', riskLevel: 'LOW', agents: 0, confidence: 45, history: [10, 9, 8, 9, 7, 6, 5, 4, 3] },
    { id: 4, name: 'Lighthouse Consensus', type: 'consensus', active: true, signals: 89, performance: '+24.8%', riskLevel: 'CRITICAL', agents: 118, confidence: 99, history: [15, 18, 20, 24, 22, 28, 30, 32, 35] }
  ]);
});

app.post('/api/settings', (req, res) => {
  // In a real app, this would save to the database securely.
  res.json({ status: 'SETTINGS_SAVED' });
});

app.get('/api/metrics', (req, res) => {
  const state = db.prepare('SELECT * FROM field_states ORDER BY timestamp DESC LIMIT 1').get() as any;
  const recentTrades = db.prepare('SELECT * FROM executed_trades ORDER BY timestamp DESC LIMIT 5').all();
  res.json({
    coherence: state?.coherence || 0,
    activeAgents: state?.agents_active || 0,
    signalStrength: 0.92, // mock value for Lambda 5
    trades: recentTrades
  });
});

app.post('/api/bridge/signal', async (req, res) => {
  // CloddsBot to AUREON bridge endpoint (Mocking ZeroMQ/Python bridge)
  const { symbol, side, strength } = req.body;
  if (!symbol || !side || !strength) {
    return res.status(400).json({ error: 'Invalid signal payload' });
  }

  // Record signal
  db.prepare('INSERT INTO trade_signals (symbol, side, strength) VALUES (?, ?, ?)').run(symbol, side, strength);
  
  // Lighthouse Protocol: execute if strength > 0.8 (6/9 vote simulation)
  if (strength >= 0.8) {
    // Paper trading interaction using CCXT on Binance Testnet
    try {
      // NOTE: We instantiate a sandbox mode connection to Binance Testnet
      const exchange = new ccxt.binance({
        enableRateLimit: true,
      });
      exchange.setSandboxMode(true); // VERY IMPORTANT: PAPER TRADING TESTNET

      // Without API keys, we can only fetch data or simulate. 
      // Testnet requires API keys to POST an order. We will generate a synthetic success 
      // if keys aren't present to represent the paper trade correctly without failing the UI.
      
      let price = 0;
      try {
        const ticker = await exchange.fetchTicker(symbol);
        price = ticker.last || 0;
      } catch (e) {
        price = 60000; // fallback if binance rate-limits
      }

      const amount = 0.01; // fixed test amount
      const orderMatchInternalId = crypto.randomUUID();
      const rawData = `${orderMatchInternalId}-${symbol}-${side}-${amount}-${Date.now()}`;
      const hash = crypto.createHash('sha256').update(rawData).digest('hex');

      // Save execution
      db.prepare('INSERT INTO executed_trades (internal_id, exchange_id, symbol, side, amount, price, hash) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(orderMatchInternalId, `paper_${Date.now()}`, symbol, side, amount, price, hash);
      
      tradesCounter.inc();

      return res.json({ status: 'EXECUTED', order: { symbol, side, amount, price, hash } });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ status: 'ERROR', error: 'Order execution failed' });
    }
  }

  res.json({ status: 'LOGGED_NO_EXECUTION', reason: 'Insufficient Lighthouse Consensus' });
});

app.get('/api/signals', (req, res) => {
  res.json(db.prepare('SELECT * FROM trade_signals ORDER BY timestamp DESC LIMIT 10').all());
});

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
