
import { useEffect, useRef, useState } from "react";
import "./App.css";

const emojiList = [
  "🍕", "🚀", "🎮", "🐼", "🌈", "⚽",
  "🎧", "🦋", "🍉", "🐱", "⭐", "🎸",
];

const levels = {
  Easy: 8,
  Medium: 10,
  Hard: 12,
};

function createCards(difficulty) {
  const selectedEmojis = emojiList.slice(
    0,
    levels[difficulty]
  );

  return [...selectedEmojis, ...selectedEmojis]
    .map((emoji, index) => ({
      id: index,
      emoji,
      matched: false,
    }))
    .sort(() => Math.random() - 0.5);
}

function App() {
  const [difficulty, setDifficulty] = useState("Easy");
  const [cards, setCards] = useState(() => createCards("Easy"));
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);

  const [bestScores, setBestScores] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("memoryMasterBestScores")
      ) || {};
    } catch {
      return {};
    }
  });

  const mismatchTimer = useRef(null);

  const won = cards.every((card) => card.matched);
  const pairsFound = cards.filter((card) => card.matched).length / 2;
  const best = bestScores[difficulty] || null;

  useEffect(() => {
    if (!started || won) return;

    const timer = setInterval(() => {
      setSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [started, won]);

  useEffect(() => {
    if (!won || !started) return;

    setBestScores((previous) => {
      const previousBest = previous[difficulty];

      // Fewer moves wins; time breaks ties.
      const isBetter =
        !previousBest ||
        moves < previousBest.moves ||
        (moves === previousBest.moves &&
          seconds < previousBest.seconds);

      if (!isBetter) return previous;

      const updated = {
        ...previous,
        [difficulty]: { moves, seconds },
      };

      try {
        localStorage.setItem(
          "memoryMasterBestScores",
          JSON.stringify(updated)
        );
      } catch {
        // The game still works if browser storage is unavailable.
      }

      return updated;
    });
  }, [won, started, moves, seconds, difficulty]);

  useEffect(() => {
    return () => clearTimeout(mismatchTimer.current);
  }, []);

  function restartGame(level = difficulty) {
    clearTimeout(mismatchTimer.current);
    setDifficulty(level);
    setCards(createCards(level));
    setSelected([]);
    setMoves(0);
    setSeconds(0);
    setStarted(false);
  }

  function handleCardClick(card) {
    if (
      !started && selected.length > 0 ||
      card.matched ||
      selected.length === 2 ||
      selected.includes(card.id) ||
      won
    ) {
      return;
    }

    setStarted(true);

    const nextSelected = [...selected, card.id];
    setSelected(nextSelected);

    if (nextSelected.length !== 2) return;

    setMoves((previous) => previous + 1);

    const first = cards.find(
      (item) => item.id === nextSelected[0]
    );
    const second = cards.find(
      (item) => item.id === nextSelected[1]
    );

    if (first.emoji === second.emoji) {
      setCards((previous) =>
        previous.map((item) =>
          nextSelected.includes(item.id)
            ? { ...item, matched: true }
            : item
        )
      );

      setSelected([]);
    } else {
      mismatchTimer.current = setTimeout(() => {
        setSelected([]);
      }, 800);
    }
  }

  function formatTime(value) {
    const minutes = Math.floor(value / 60);
    const remaining = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  }

  return (
    <main className="game-page">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">🧠</span>
          Memory<span className="brand-highlight">Master</span>
        </a>

        <span className="level-badge">
          {difficulty.toUpperCase()} MODE
        </span>
      </header>

      <section className="game-container" id="home">
        <div className="intro">
          <p className="eyebrow">TRAIN YOUR BRAIN</p>
          <h1>Memory Master</h1>
          <p className="subtitle">
            Find every matching pair and challenge your memory.
          </p>
        </div>

        <div className="difficulty">
          <span>Difficulty</span>

          <div className="level-buttons">
            {Object.keys(levels).map((level) => (
              <button
                key={level}
                className={
                  difficulty === level ? "level-active" : ""
                }
                onClick={() => restartGame(level)}
                aria-pressed={difficulty === level}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <span>⏱️ TIME</span>
            <strong>{formatTime(seconds)}</strong>
          </div>

          <div className="stat-card">
            <span>🎯 MOVES</span>
            <strong>{moves}</strong>
          </div>

          <div className="stat-card">
            <span>🏆 BEST</span>
            <strong>{best ? best.moves : "—"}</strong>
          </div>
        </div>

        <div
          className={`board board-${difficulty.toLowerCase()}`}
          aria-label={`${difficulty} memory game`}
        >
          {cards.map((card) => {
            const revealed =
              selected.includes(card.id) || card.matched;

            return (
              <button
                key={card.id}
                className={`memory-card ${
                  revealed ? "revealed" : ""
                } ${card.matched ? "matched" : ""}`}
                onClick={() => handleCardClick(card)}
                disabled={card.matched || selected.length === 2}
                aria-label={
                  revealed ? card.emoji : "Hidden card"
                }
              >
                <span>{revealed ? card.emoji : "?"}</span>
              </button>
            );
          })}
        </div>

        <div className="progress-info">
          <span>Matching pairs</span>
          <strong>{pairsFound} / {levels[difficulty]}</strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${(pairsFound / levels[difficulty]) * 100}%`,
            }}
          />
        </div>

        {won && (
          <div className="win-message" role="status">
            <span className="win-icon">🎉</span>
            <h2>Amazing! You did it!</h2>
            <p>
              You found every pair in {moves} moves and{" "}
              {formatTime(seconds)}.
            </p>
            <p>
              {best?.moves === moves &&
              best?.seconds === seconds
                ? "🏆 New personal best!"
                : "Great work! Keep practising."}
            </p>
          </div>
        )}

        <button
          className="restart-button"
          onClick={() => restartGame()}
        >
          ↻ Restart Game
        </button>

        <p className="hint">
          💡 Remember where each emoji appears!
        </p>
      </section>

      <footer>
        Memory Master · Exercise your mind, one match at a time.
      </footer>
    </main>
  );
}

export default App;
