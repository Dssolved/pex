const { Router } = require('express');
const User = require('../models/User');
const Holding = require('../models/Holding');
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');

const router = Router();

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const holdings = await Holding.find({ user: req.user.id, shares: { $gt: 0 } }).lean();
    const tickers = holdings.map((holding) => holding.ticker);
    const stocks = await Stock.find({ ticker: { $in: tickers } }).lean();

    const priceByTicker = new Map(stocks.map((stock) => [stock.ticker, stock.price]));

    res.json({
      user,
      holdings: holdings.map((holding) => ({
        ticker: holding.ticker,
        shares: holding.shares,
        price: priceByTicker.get(holding.ticker) || 0,
      })),
    });
  } catch (err) {
    console.error('[PORTFOLIO] Load error:', err.message);
    res.status(500).json({ message: 'Failed to load portfolio' });
  }
});

module.exports = router;
