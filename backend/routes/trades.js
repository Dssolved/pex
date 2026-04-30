const { Router } = require("express");
const User = require("../models/User");
const Stock = require("../models/Stock");
const Holding = require("../models/Holding");
const Trade = require("../models/Trade");
const auth = require("../middleware/auth");

const router = Router();

function normalizeTicker(ticker) {
  return String(ticker || "")
    .trim()
    .replace(/^\$/, "")
    .toUpperCase();
}

function normalizeShares(value) {
  const shares = Number(value);
  if (!Number.isInteger(shares) || shares <= 0) return null;
  return shares;
}

router.post("/buy", auth, async (req, res) => {
  try {
    const ticker = normalizeTicker(req.body.ticker);
    const shares = normalizeShares(req.body.shares);

    if (!shares) {
      return res
        .status(400)
        .json({ message: "Shares must be a positive whole number" });
    }

    const user = await User.findById(req.user.id);
    const stock = await Stock.findOne({ ticker });

    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    const total = stock.price * shares;

    if (user.walletBalance < total) {
      return res.status(400).json({ message: "Not enough cash in wallet" });
    }

    user.walletBalance = Number((user.walletBalance - total).toFixed(2));

    let holding = await Holding.findOne({
      user: user._id,
      ticker: stock.ticker,
    });
    if (!holding) {
      holding = new Holding({
        user: user._id,
        ticker: stock.ticker,
        shares: 0,
      });
    }
    holding.shares += shares;

    await user.save();
    await holding.save();
    await Trade.create({
      user: user._id,
      ticker: stock.ticker,
      type: "BUY",
      shares,
      price: stock.price,
      total,
    });

    res.json({
      message: "Stock bought successfully",
      walletBalance: user.walletBalance,
      holding: {
        ticker: holding.ticker,
        shares: holding.shares,
        price: stock.price,
      },
    });
  } catch (err) {
    console.error("[TRADES] Buy error:", err.message);
    res.status(500).json({ message: "Failed to buy stock" });
  }
});

router.post("/sell", auth, async (req, res) => {
  try {
    const ticker = normalizeTicker(req.body.ticker);
    const shares = normalizeShares(req.body.shares);

    if (!shares) {
      return res
        .status(400)
        .json({ message: "Shares must be a positive whole number" });
    }

    const user = await User.findById(req.user.id);
    const stock = await Stock.findOne({ ticker });
    const holding = await Holding.findOne({ user: user._id, ticker });

    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    if (!holding || holding.shares < shares) {
      return res.status(400).json({ message: "Not enough shares to sell" });
    }

    const total = stock.price * shares;

    holding.shares -= shares;
    user.walletBalance = Number((user.walletBalance + total).toFixed(2));

    await user.save();
    await holding.save();
    await Trade.create({
      user: user._id,
      ticker: stock.ticker,
      type: "SELL",
      shares,
      price: stock.price,
      total,
    });

    res.json({
      message: "Stock sold successfully",
      walletBalance: user.walletBalance,
      holding: {
        ticker: holding.ticker,
        shares: holding.shares,
        price: stock.price,
      },
    });
  } catch (err) {
    console.error("[TRADES] Sell error:", err.message);
    res.status(500).json({ message: "Failed to sell stock" });
  }
});

module.exports = router;
