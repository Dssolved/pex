"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function MarketPage() {
  const router = useRouter();
  const wsRef = useRef(null);

  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [buyShares, setBuyShares] = useState({});
  const [sellShares, setSellShares] = useState({});
  const [priceInputs, setPriceInputs] = useState({});
  const [newStock, setNewStock] = useState({ ticker: "", name: "", price: "" });

  const priceByTicker = useMemo(() => {
    const map = {};
    stocks.forEach((stock) => {
      map[stock.ticker] = stock.price;
    });
    return map;
  }, [stocks]);

  const valuation = useMemo(() => {
    const holdingsValue = holdings.reduce((sum, holding) => {
      const currentPrice = priceByTicker[holding.ticker] ?? holding.price ?? 0;
      return sum + holding.shares * currentPrice;
    }, 0);

    return Number(user?.walletBalance || 0) + holdingsValue;
  }, [holdings, priceByTicker, user]);

  const myStock = stocks.find((stock) => stock.isOwner);

  useEffect(() => {
    const savedToken = localStorage.getItem("pex_token");

    if (!savedToken) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    loadAll(savedToken);
    connectWebSocket(savedToken);

    return () => {
      wsRef.current?.close();
    };
  }, [router]);

  async function request(path, options = {}, authToken = token) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function loadAll(authToken = token) {
    try {
      setError("");
      const [stocksData, portfolioData] = await Promise.all([
        request("/api/stocks", {}, authToken),
        request("/api/portfolio", {}, authToken),
      ]);

      setStocks(stocksData);
      setUser(portfolioData.user);
      setHoldings(portfolioData.holdings);
    } catch (err) {
      setError(err.message);
    }
  }

  function connectWebSocket(authToken) {
    const ws = new WebSocket(WS_URL, authToken);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "TICKER_UPDATE") {
          const { ticker, price } = data.payload;
          setStocks((current) =>
            current.map((stock) =>
              stock.ticker === ticker ? { ...stock, price } : stock,
            ),
          );
          setMessage(`${ticker} updated to ${money(price)}`);
        }
      } catch (err) {
        console.error("Bad WS message:", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };
  }

  function logout() {
    localStorage.removeItem("pex_token");
    localStorage.removeItem("pex_user");
    wsRef.current?.close();
    router.push("/login");
  }

  async function createStock(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await request("/api/stocks", {
        method: "POST",
        body: JSON.stringify({
          ticker: newStock.ticker,
          name: newStock.name,
          price: Number(String(newStock.price).replace(",", ".")),
        }),
      });

      setNewStock({ ticker: "", name: "", price: "" });
      setMessage("Stock created");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updatePrice(ticker) {
    setError("");
    setMessage("");

    try {
      const price = Number(String(priceInputs[ticker] || "").replace(",", "."));

      await request(`/api/stocks/${ticker}/price`, {
        method: "PATCH",
        body: JSON.stringify({ price }),
      });

      setPriceInputs((current) => ({ ...current, [ticker]: "" }));
      setMessage("Price updated");
    } catch (err) {
      setError(err.message);
    }
  }

  async function buyStock(ticker) {
    setError("");
    setMessage("");

    try {
      await request("/api/trades/buy", {
        method: "POST",
        body: JSON.stringify({ ticker, shares: Number(buyShares[ticker]) }),
      });

      setBuyShares((current) => ({ ...current, [ticker]: "" }));
      setMessage(`Bought ${ticker}`);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function sellStock(ticker) {
    setError("");
    setMessage("");

    try {
      await request("/api/trades/sell", {
        method: "POST",
        body: JSON.stringify({ ticker, shares: Number(sellShares[ticker]) }),
      });

      setSellShares((current) => ({ ...current, [ticker]: "" }));
      setMessage(`Sold ${ticker}`);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.small}>Personal Exchange</p>
          <h1 className={styles.title}>PEX</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={connected ? styles.online : styles.offline}>
            {connected ? "Connected" : "Offline"}
          </span>
          <button className={styles.ghostButton} onClick={logout} type="button">
            Logout
          </button>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <section className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>User</span>
          <strong>{user?.username || "Loading..."}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Wallet Balance</span>
          <strong>{money(user?.walletBalance)}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Virtual Net Worth</span>
          <strong>{money(valuation)}</strong>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <h2>Create your stock</h2>

          {myStock ? (
            <div className={styles.myStockBox}>
              <b>${myStock.ticker}</b>
              <span>{myStock.name}</span>
              <span>{money(myStock.price)}</span>
            </div>
          ) : (
            <form className={styles.form} onSubmit={createStock}>
              <input
                className={styles.input}
                placeholder="Ticker, for example DEV"
                value={newStock.ticker}
                onChange={(event) =>
                  setNewStock({ ...newStock, ticker: event.target.value })
                }
              />
              <input
                className={styles.input}
                placeholder="Company name"
                value={newStock.name}
                onChange={(event) =>
                  setNewStock({ ...newStock, name: event.target.value })
                }
              />
              <input
                className={styles.input}
                placeholder="Start price"
                inputMode="decimal"
                value={newStock.price}
                onChange={(event) =>
                  setNewStock({ ...newStock, price: event.target.value })
                }
              />
              <button className={styles.button} type="submit">
                Create stock
              </button>
            </form>
          )}
        </div>

        <div className={styles.panel}>
          <h2>Your holdings</h2>
          {holdings.length === 0 ? (
            <p className={styles.muted}>You do not own shares yet.</p>
          ) : (
            <div className={styles.holdingsList}>
              {holdings.map((holding) => {
                const currentPrice =
                  priceByTicker[holding.ticker] ?? holding.price;
                return (
                  <div className={styles.holdingRow} key={holding.ticker}>
                    <div>
                      <b>${holding.ticker}</b>
                      <span>{holding.shares} shares</span>
                    </div>
                    <strong>{money(holding.shares * currentPrice)}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Market</h2>
          </div>
          <button
            className={styles.ghostButton}
            onClick={() => loadAll()}
            type="button"
          >
            Refresh once
          </button>
        </div>

        <div className={styles.stockGrid}>
          {stocks.map((stock) => {
            const holding = holdings.find(
              (item) => item.ticker === stock.ticker,
            );
            return (
              <article className={styles.stockCard} key={stock.id}>
                <div className={styles.stockTop}>
                  <div>
                    <h3>${stock.ticker}</h3>
                    <p>{stock.name}</p>
                  </div>
                  <strong>{money(stock.price)}</strong>
                </div>

                <p className={styles.owner}>Owner: {stock.owner.username}</p>

                {stock.isOwner && (
                  <div className={styles.inlineForm}>
                    <input
                      className={styles.input}
                      placeholder="New price"
                      inputMode="decimal"
                      value={priceInputs[stock.ticker] || ""}
                      onChange={(event) =>
                        setPriceInputs({
                          ...priceInputs,
                          [stock.ticker]: event.target.value,
                        })
                      }
                    />
                    <button
                      className={styles.button}
                      onClick={() => updatePrice(stock.ticker)}
                      type="button"
                    >
                      Update
                    </button>
                  </div>
                )}

                {!stock.isOwner && (
                  <div className={styles.inlineForm}>
                    <input
                      className={styles.input}
                      placeholder="Shares"
                      inputMode="numeric"
                      value={buyShares[stock.ticker] || ""}
                      onChange={(event) =>
                        setBuyShares({
                          ...buyShares,
                          [stock.ticker]: event.target.value,
                        })
                      }
                    />
                    <button
                      className={styles.button}
                      onClick={() => buyStock(stock.ticker)}
                      type="button"
                    >
                      Buy
                    </button>
                  </div>
                )}

                {holding && holding.shares > 0 && (
                  <div className={styles.inlineForm}>
                    <input
                      className={styles.input}
                      placeholder="Sell shares"
                      inputMode="numeric"
                      value={sellShares[stock.ticker] || ""}
                      onChange={(event) =>
                        setSellShares({
                          ...sellShares,
                          [stock.ticker]: event.target.value,
                        })
                      }
                    />
                    <button
                      className={styles.lightButton}
                      onClick={() => sellStock(stock.ticker)}
                      type="button"
                    >
                      Sell
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {stocks.length === 0 && (
          <p className={styles.muted}>
            No stocks yet. Create the first ticker.
          </p>
        )}
      </section>
    </main>
  );
}
