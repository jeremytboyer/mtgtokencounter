import React, { useState } from "react";
import "./styles.css";
/* =========================
   TOKEN TYPES
========================= */
const T = {
  MAIN: "Main",
  FOOD: "Food",
  CLUE: "Clue",
  TREASURE: "Treasure",
};

const create = (type, source) => ({ type, source });

/* =========================
   ENGINE (UNCHANGED CORE)
========================= */
function applyDoublers(amount, battlefield) {
  let mult = 1;

  for (const c of battlefield) {
    const n = c.toLowerCase();
    if (n.includes("doubling season")) mult *= 2;
    if (n.includes("parallel lives")) mult *= 2;
  }

  return amount * mult;
}

function resolveEvent(baseAmount, baseType, battlefield) {
  let log = [];

  log.push({
    step: "Start",
    detail: `${baseAmount} ${baseType} token(s)`,
  });

  let amount = applyDoublers(baseAmount, battlefield);

  if (amount !== baseAmount) {
    log.push({
      step: "Replacement",
      detail: `Doublers → ${baseAmount} → ${amount}`,
    });
  }

  let tokens = [];

  for (let i = 0; i < amount; i++) {
    tokens.push(create(baseType, "base"));
  }

  /* Peregrin Took */
  let extraFood = 0;

  if (battlefield.some((c) => c.toLowerCase().includes("peregrin"))) {
    extraFood += amount;
  }

  if (extraFood > 0) {
    log.push({
      step: "Replacement",
      detail: `Peregrin Took → +${extraFood} Food`,
    });
  }

  for (let i = 0; i < extraFood; i++) {
    tokens.push(create(T.FOOD, "peregrin"));
  }

  /* Academy Manufactor */
  let final = [];
  const hasManufactor = battlefield.some((c) =>
    c.toLowerCase().includes("manufactor")
  );

  if (hasManufactor) {
    log.push({
      step: "Replacement",
      detail: "Academy Manufactor applied",
    });
  }

  for (const t of tokens) {
    if (
      hasManufactor &&
      (t.type === T.FOOD || t.type === T.CLUE || t.type === T.TREASURE)
    ) {
      final.push(create(T.CLUE, t.source));
      final.push(create(T.FOOD, t.source));
      final.push(create(T.TREASURE, t.source));
    } else {
      final.push(t);
    }
  }

  tokens = final;

  /* Chatterfang */
  let squirrels = 0;

  if (battlefield.some((c) => c.toLowerCase().includes("chatterfang"))) {
    squirrels = tokens.length;

    log.push({
      step: "Trigger",
      detail: `Chatterfang → +${squirrels} squirrels`,
    });
  }

  return { tokens, squirrels, log };
}

/* =========================
   SCRYFALL
========================= */
async function fetchCards(query) {
  if (!query) return [];

  const res = await fetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.data || [];
}

/* =========================
   APP
========================= */
export default function Engine() {
  const [battlefield, setBattlefield] = useState([]);

  const [base, setBase] = useState(1);
  const [type, setType] = useState("Main");

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const [log, setLog] = useState([]);
  const [state, setState] = useState({
    main: 0,
    food: 0,
    clue: 0,
    treasure: 0,
    squirrel: 0,
  });

  /* =========================
     SEARCH
  ========================= */
  const handleSearch = async () => {
    const cards = await fetchCards(search);
    setResults(cards.slice(0, 8));
  };

  const addCard = (card) => {
    setBattlefield([...battlefield, card.name]);
  };

  /* =========================
     ARROW CONTROLS (RESTORED)
  ========================= */
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

  const remove = (i) => {
    const copy = [...battlefield];
    copy.splice(i, 1);
    setBattlefield(copy);
  };

  /* =========================
     RUN
  ========================= */
  const run = () => {
    const result = resolveEvent(base, type, battlefield);

    const s = {
      main: 0,
      food: 0,
      clue: 0,
      treasure: 0,
      squirrel: result.squirrels,
    };

    for (const t of result.tokens) {
      s[t.type.toLowerCase()]++;
    }

    setState(s);
    setLog(result.log);
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="App" style={{ padding: 20 }}>
      <h2>MTG Token Engine</h2>

      {/* INPUT */}
      <input
        type="number"
        value={base}
        onChange={(e) => setBase(Number(e.target.value))}
      />

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option>Main</option>
        <option>Food</option>
        <option>Clue</option>
        <option>Treasure</option>
      </select>

      <button onClick={run}>Run</button>

      {/* SEARCH */}
      <div style={{ marginTop: 20 }}>
        <h3>Scryfall Search</h3>

        <input value={search} onChange={(e) => setSearch(e.target.value)} />

        <button onClick={handleSearch}>Search</button>

        {results.map((c) => (
          <div key={c.id}>
            {c.name}
            <button onClick={() => addCard(c)}>Add</button>
          </div>
        ))}
      </div>

      {/* BATTLEFIELD (ARROWS RESTORED) */}
      <div style={{ marginTop: 20 }}>
        <h3>Battlefield</h3>

        {battlefield.map((c, i) => (
          <div key={i}>
            {c}

            <button onClick={() => moveUp(i)}>⬆</button>
            <button onClick={() => moveDown(i)}>⬇</button>
            <button onClick={() => remove(i)}>✖</button>
          </div>
        ))}
      </div>

      {/* LOG */}
      <div style={{ marginTop: 20 }}>
        <h3>Log</h3>
        {log.map((l, i) => (
          <div key={i}>
            <b>{l.step}</b> — {l.detail}
          </div>
        ))}
      </div>

      {/* STATE */}
      <div style={{ marginTop: 20 }}>
        <h3>Final State</h3>
        <p>🪙 Main: {state.main}</p>
        <p>🍞 Food: {state.food}</p>
        <p>🔎 Clue: {state.clue}</p>
        <p>💰 Treasure: {state.treasure}</p>
        <p>🐿 Squirrels: {state.squirrel}</p>
      </div>
    </div>
  );
}
