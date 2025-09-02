import React from "react";

export default function Controls({ count, setCount, spinning, onStart, onReset }) {
  return (
    <>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        一次抽幾位（1~5）：
        <input
          className="input"
          type="number"
          min={1}
          max={5}
          value={count}
          disabled={spinning}
          onChange={(e) => setCount(e.target.value)}
        />
      </label>

      <button className="btn" onClick={onStart} disabled={spinning}>
        🎰 開始抽獎
      </button>

      <button className="btn secondary" onClick={onReset} disabled={spinning}>
        重新設定
      </button>
    </>
  );
}
