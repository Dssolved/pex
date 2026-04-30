const { Router } = require('express');
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');
const { broadcastTickerUpdate } = require('../ws/handler');

const router = Router();

function normalizeTicker(ticker) {
  return String(ticker || '').trim().replace(/^\$/, '').toUpperCase();
}

function serializeStock(stock, currentUserId) {
  const owner = stock.owner || {};
  const ownerId = owner._id ? owner._id.toString() : String(owner);

  return {
    id: stock._id.toString(),
    ticker: stock.ticker,
    name: stock.name,
    price: stock.price,
    owner: {
      id: ownerId,
      username: owner.username || 'Unknown',
    },
    isOwner: ownerId === currentUserId,
    createdAt: stock.createdAt,
  };
}

router.get('/', auth, async (req, res) => {
  try {
    const stocks = await Stock.find().populate('owner', 'username').sort({ createdAt: -1 });
    res.json(stocks.map((stock) => serializeStock(stock, req.user.id)));
  } catch (err) {
    console.error('[STOCKS] List error:', err.message);
    res.status(500).json({ message: 'Failed to load stocks' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const ticker = normalizeTicker(req.body.ticker);
    const name = String(req.body.name || '').trim();
    const price = Number(req.body.price);

    if (!/^[A-Z0-9]{2,8}$/.test(ticker)) {
      return res.status(400).json({ message: 'Ticker must be 2-8 letters or numbers' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const stock = await Stock.create({
      ticker,
      name,
      price,
      owner: req.user.id,
    });

    const populated = await stock.populate('owner', 'username');
    res.status(201).json(serializeStock(populated, req.user.id));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Ticker already exists or you already created a stock' });
    }

    console.error('[STOCKS] Create error:', err.message);
    res.status(500).json({ message: 'Failed to create stock' });
  }
});

router.patch('/:ticker/price', auth, async (req, res) => {
  try {
    const ticker = normalizeTicker(req.params.ticker);
    const price = Number(req.body.price);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const stock = await Stock.findOne({ ticker }).populate('owner', 'username');
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    if (stock.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the stock owner can change this price' });
    }

    stock.price = price;
    await stock.save();

    broadcastTickerUpdate(stock.ticker, stock.price);

    res.json(serializeStock(stock, req.user.id));
  } catch (err) {
    console.error('[STOCKS] Price update error:', err.message);
    res.status(500).json({ message: 'Failed to update price' });
  }
});

module.exports = router;
