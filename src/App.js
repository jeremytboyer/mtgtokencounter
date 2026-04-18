import React, { useState } from "react";

// --- Manual logic layer (still MVP) ---
const CARD_LOGIC = {
  "Doubling Season": (state) => {
    state.main *= 2;
    return state;
  },
  "Parallel Lives": (state) => {
    state.main *= 2;
    return state;
  },
  "Mondrak, Glory Dominus": (state) => {
    state.main *= 2;
    return state;
  },
  "Chatterfang, Squirrel General": (state) => {
    state.squirrels += state.main;
    return state;
  },
  "Peregrin Took": (state) => {
    state.food += 1;
    return state;
  },
};

// --- Scryfall fetch ---
async function fetchCards(query) {
  if (!query) return [];

  const res = await fetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.data || [];
}

export default function TokenApp() {
  const [battlefield, setBattlefield] = useState([]);
  const [baseTokens, setBaseTokens] = useState(1);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  // --- Search Scryfall ---
  const handleSearch = async () => {
    const cards = await fetchCards(search);
    setResults(cards.slice(0, 8)); // limit UI noise
  };

  // --- Add card ---
  const addCard = (cardName) => {
    setBattlefield([...battlefield, cardName]);
  };

  const removeCard = (index) => {
    const copy = [...battlefield];
    copy.splice(index, 1);
    setBattlefield(copy);
  };

  const moveUp = (i) => {
    if (i === 0) return;
    const copy = [...battlefield];
    [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
    setBattlefield(copy);
  };

  const moveDown = (i) => {
    if (i === battlefield.length - 1) return;
    const copy = [...battlefield];
    [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
    setBattlefield(copy);
  };

  // --- Calculate ---
  const calculate = () => {
    let state = {
      main: baseTokens,
      food: 0,
      squirrels: 0,
    };

    let steps = [];

    steps.push({
      label: "Base",
      state: { ...state },
    });

    battlefield.forEach((card) => {
      const before = { ...state };

      if (CARD_LOGIC[card]) {
        state = CARD_LOGIC[card](state);
      }

      steps.push({
        label: card,
        before,
        after: { ...state },
      });
    });

    return { state, steps };
  };

  const { state, steps } = calculate();

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>MTG Token Engine</h1>

      {/* Base tokens */}
      <div>
        <label>Base Tokens: </label>
        <input
          type="number"
          value={baseTokens}
          onChange={(e) => setBaseTokens(Number(e.target.value))}
        />
      </div>

      {/* --- SEARCH UI --- */}
      <div style={{ marginTop: 20 }}>
        <h3>Search Cards (Scryfall)</h3>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="e.g. Chatterfang"
        />

        <button onClick={handleSearch}>Search</button>

        <div style={{ marginTop: 10 }}>
          {results.map((card) => (
            <div key={card.id} style={{ marginBottom: 5 }}>
              <strong>{card.name}</strong>
              <button
                style={{ marginLeft: 10 }}
                onClick={() => addCard(card.name)}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- Battlefield --- */}
      <div style={{ marginTop: 20 }}>
        <h3>Battlefield</h3>

        {battlefield.length === 0 && <p>No cards yet</p>}

        {battlefield.map((card, i) => (
          <div key={i}>
            {card}

            <button onClick={() => moveUp(i)}>⬆️</button>
            <button onClick={() => moveDown(i)}>⬇️</button>
            <button onClick={() => removeCard(i)}>Remove</button>
          </div>
        ))}
      </div>

      {/* --- Breakdown --- */}
      <div style={{ marginTop: 20 }}>
        <h3>Breakdown</h3>

        {steps.map((s, i) => (
          <div key={i}>
            {s.label === "Base" ? (
              <strong>Start → {s.state.main} main tokens</strong>
            ) : (
              <div>
                <strong>{s.label}</strong>
                <div>
                  Main: {s.before.main} → {s.after.main}
                </div>
                <div>
                  Food: {s.before.food} → {s.after.food}
                </div>
                <div>
                  Squirrels: {s.before.squirrels} → {s.after.squirrels}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- Final --- */}
      <div style={{ marginTop: 20 }}>
        <h2>Final Result</h2>
        <p>Main: {state.main}</p>
        <p>Food: {state.food}</p>
        <p>Squirrels: {state.squirrels}</p>
      </div>
    </div>
  );
}
