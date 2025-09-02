import React, { useEffect, useMemo, useRef, useState } from "react";

// 讓任何圖片路徑都能在 GitHub Pages 正確解析
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

function createCell(person){
  const cell = document.createElement('div');
  cell.className = 'cell';

  const img = document.createElement('img');
  img.src = withBase(person?.img);   // ★ 用 withBase
  img.alt = person?.name || "";

  // .jpg/.jpeg 互換，最後用預設
  img.onerror = () => {
    const u = img.src || "";
    if (/\.jpg(\?.*)?$/i.test(u))      img.src = u.replace(/\.jpg(\?.*)?$/i, '.jpeg$1');
    else if (/\.jpeg(\?.*)?$/i.test(u)) img.src = u.replace(/\.jpeg(\?.*)?$/i, '.jpg$1');
    else                                 img.src = withBase('default.png');   // ★ 也用 withBase
    img.onerror = null;
  };

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = person?.name || "—";

  cell.append(img, label);
  return cell;
}


// 放在檔案開頭（import 之後），新增一個建立「圖片＋名字」的 cell
// function createCell(person){
//   const cell = document.createElement('div');
//   cell.className = 'cell';                  // 這個 class 會在 CSS 設計樣式
//   const img = document.createElement('img');
//   img.src = person.img || '';
//   img.alt = person.name;
//   img.onerror = () => {                     // .jpg/.jpeg 互相嘗試；再退預設
//     const u = img.src;
//     if (/\.jpg(\?.*)?$/i.test(u))      img.src = u.replace(/\.jpg(\?.*)?$/i, '.jpeg$1');
//     else if (/\.jpeg(\?.*)?$/i.test(u)) img.src = u.replace(/\.jpeg(\?.*)?$/i, '.jpg$1');
//     else                                img.src = '/img/default.png';
//     img.onerror = null;
//   };

//   const label = document.createElement('div');
//   label.className = 'label';
//   label.textContent = person.name;

//   cell.append(img, label);
//   return cell;
// }

// 用圖片卡片餵進每個轉輪
function feedReel(reelEl, people, repeats = 12){
  reelEl.innerHTML = '';
  const src = (people && people.length) ? people : [];
  for(let i=0;i<repeats;i++){
    const p = src[Math.floor(Math.random()*src.length)] || { name:'—', img:'' };
    reelEl.appendChild(createCell(p));
  }
}

// 轉動到最終得獎者，也用圖片卡片停住
// SlotMachine.jsx
function spinReel(reelEl, finalPerson, durationMs = 1600){
  return new Promise(resolve => {
    // 每步高度先抓一個合理值，稍後用實測覆蓋
    let stepH = 48;
    const cells = reelEl.querySelectorAll('.cell');
    if (cells.length > 1){
      const r0 = cells[0].getBoundingClientRect();
      const r1 = cells[1].getBoundingClientRect();
      if (r0 && r1) stepH = Math.max(40, Math.floor(r1.top - r0.top));
    }

    let y = 0;
    const t0 = performance.now();
    const timer = setInterval(() => {
      y += stepH;
      reelEl.style.transform = `translateY(-${y}px)`;

      if (performance.now() - t0 > durationMs){
        clearInterval(timer);

        // 放入最終得獎格
        const endCell = createCell(finalPerson);
        reelEl.appendChild(endCell);

        // ★ 用 offset 計算讓 endCell 的中心 = slot 的中心
        const slotH  = reelEl.parentElement.clientHeight;   // .slot 高度
        const cellTop = endCell.offsetTop;                  // 在 reel 內的頂端位置（不受 transform 影響）
        const cellH   = endCell.offsetHeight;
        const targetY = Math.max(0, cellTop - (slotH - cellH)/2);

        // 平滑移動到目標
        requestAnimationFrame(() => {
          reelEl.style.transform = `translateY(-${Math.round(targetY)}px)`;
          setTimeout(() => resolve(true), 200);
        });
      }
    }, 80);
  });
}




export default function SlotMachine({ winners, pool, spinning, onDone }){
  const [badges, setBadges] = useState([])
  const reelsRef = useRef([])

  useEffect(()=>{
    if(!winners || winners.length===0) { setBadges([]); return }
    reelsRef.current = Array.from({length: winners.length}, (_,i)=>reelsRef.current[i] || null)
    reelsRef.current.forEach(el => { if(el) feedReel(el, pool) })
    let aborted = false;
    async function run(){
      for(let i=0;i<winners.length;i++){
        if(!reelsRef.current[i]) continue
        await spinReel(reelsRef.current[i], winners[i], 1600 + i*250)
      }
      if(!aborted){
        //setBadges(winners.slice())
        onDone && onDone()
      }
    }
    run()
    return ()=> { aborted = true }
  }, [winners])

  return (
    <>
      <div className="slots" aria-live="polite" aria-atomic="true">
        {Array.from({length: winners?.length || 1}).map((_,i)=>(
          <div className="slot" key={i}>
            <div className="reel" ref={el => reelsRef.current[i] = el}></div>
          </div>
        ))}
      </div>
      <div className="winners-area">
        {badges.map((p, idx) => (
          <span className="badge" key={idx}>
            <img className="badge-avatar" src={withBase(p.img)} alt={p.name} />
            {p.name}
          </span>
        ))}
      </div>
    </>
  )
}
