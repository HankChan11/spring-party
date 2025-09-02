import React, { useEffect, useMemo, useRef, useState } from "react";

/** 讓任何圖片在 GitHub Pages 子路徑都能正確解析 */
function withBase(p) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const def = `${base}/img/default.png`;
  if (!p) return def;
  if (/^https?:\/\//i.test(p)) return p;              // 完整網址
  if (p.startsWith(base)) return p;                   // 已含 base
  if (p.startsWith("/")) return `${base}${p}`;        // 以 / 開頭
  if (/^img\//i.test(p)) return `${base}/${p}`;       // img/xxx
  return `${base}/img/${p}`;                          // 純檔名
}

/** 從陣列中隨機挑選 n 個不重複項目 */
function pickN(arr, n) {
  const pool = [...arr];
  const res = [];
  for (let i = 0; i < Math.min(n, pool.length); i++) {
    const k = Math.floor(Math.random() * pool.length);
    res.push(pool.splice(k, 1)[0]);
  }
  return res;
}

/** 單一滾輪 */
function Reel({ items, winnerIndex, spinKey, duration = 1200, cellH = 120 }) {
  const trackRef = useRef(null);
  const triple = useMemo(() => [...items, ...items, ...items], [items]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || winnerIndex == null) return;

    // 先把位置重置到最上方（取消動效）
    el.style.transition = "none";
    el.style.transform = "translateY(0px)";

    // 下一幀再套用目標位移（啟用動效）
    const id = requestAnimationFrame(() => {
      const target = items.length + winnerIndex; // 落在中段
      el.style.transition = `transform ${duration}ms cubic-bezier(.12,.7,.1,1)`;
      el.style.transform = `translateY(${-target * cellH}px)`;
    });
    return () => cancelAnimationFrame(id);
  }, [spinKey, winnerIndex, duration, items.length, cellH]);

  return (
    <div className="slot-window">
      <div ref={trackRef} className="reel">
        {triple.map((p, idx) => (
          <div className="cell" key={idx}>
            <img src={withBase(p.img)} alt={p.name} />
            <div className="label">{p.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 主元件：負責抽籤與通知結果 */
export default function SlotMachine({ participants, count, spinning, onResult }) {
  const [winnerIdxList, setWinnerIdxList] = useState([]);
  const [spinKey, setSpinKey] = useState(0);
  const cellH = 120;

  // 參與者清單：若沒資料，顯示佔位
  const items = useMemo(
    () =>
      (participants && participants.length > 0
        ? participants
        : [{ name: "尚無名單", img: "default.png" }]),
    [participants]
  );

  useEffect(() => {
    if (!spinning) return;
    if (items.length === 0) return;

    // 1) 抽出得獎者
    const winners = pickN(items, count);
    const winnerIdx = winners.map((w) => items.findIndex((x) => x === w));

    // 2) 觸發動畫
    setWinnerIdxList(winnerIdx);
    setSpinKey((k) => k + 1);

    // 3) 動畫結束後回傳結果（加上 _resolvedImg 給外層 badge 用）
    const maxMs = 1200 + (count - 1) * 200 + 150; // 最長那捲 + buffer
    const t = setTimeout(() => {
      onResult(
        winners.map((w) => ({
          ...w,
          _resolvedImg: withBase(w.img),
        }))
      );
    }, maxMs);

    return () => clearTimeout(t);
  }, [spinning, count, items, onResult]);

  if (!participants || participants.length === 0) {
    return <div style={{ padding: 8, color: "#9ca3af" }}>請先在 <code>public/data/participants.json</code> 填入名單</div>;
  }

  return (
    <div className="slot-row">
      {Array.from({ length: count }).map((_, i) => (
        <Reel
          key={i}
          items={items}
          winnerIndex={winnerIdxList[i] ?? null}
          spinKey={spinKey}
          duration={1200 + i * 200}  // 每捲延遲一點，效果更好
          cellH={cellH}
        />
      ))}
    </div>
  );
}
