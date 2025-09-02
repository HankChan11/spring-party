import React, { useEffect, useRef, useState } from 'react'
import Controls from './components/Controls.jsx'
import SlotMachine from './components/SlotMachine.jsx'
import History from './components/History.jsx'

const STORAGE_KEY = 'spring-lottery-react-v1'

const DEFAULT_LIST = ['WYAGL','Spider','Peter','Curry','Lin','Jeremy','Jimmy','Fish','Brian','Parker','Steven','Mars','Herbert','Jason']

const DEFAULT_AVATAR = '/img/default.png';

const DATA_URL = `${import.meta.env.BASE_URL}data/participants.json`;

function toPerson(x) {
  if (typeof x === 'string') return { name: x, img: '' };
  return { name: String(x.name || ''), img: String(x.img || '') };
}
function normalizeList(list) {
  return Array.from(new Set(list.map(p => toPerson(p).name))) // 先去重名
    .map(n => {
      const found = list.find(p => (typeof p==='string'?p:p.name) === n);
      const obj = toPerson(found);
      return { name: obj.name, img: obj.img || DEFAULT_AVATAR };
    });
}


function nowStr(){
  const d = new Date()
  const pad = n => String(n).padStart(2,'0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function App(){
  const [pool, setPool] = useState([])
  const [history, setHistory] = useState([])
  const [unique, setUnique] = useState(true)
  const [winnersCount, setWinnersCount] = useState(1)
  const [prize, setPrize] = useState('頭獎')
  const [spinning, setSpinning] = useState(false)
  const [winners, setWinners] = useState([])

  // load from localStorage
  useEffect(() => {
    try{
      const raw = localStorage.getItem(STORAGE_KEY)
      if(raw){
        const obj = JSON.parse(raw)
        if(Array.isArray(obj.pool)) setPool(obj.pool)
        if(Array.isArray(obj.history)) setHistory(obj.history)
        if(typeof obj.unique === 'boolean') setUnique(obj.unique)
      }
    }catch(e){}
  }, [])

  // persist
  useEffect(() => {
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pool, history, unique }))
    }catch(e){}
  }, [pool, history, unique])

  // initial fetch if pool empty
  useEffect(() => {
    if(pool.length === 0){
      fetch('/data/participants.json')
        .then(r => r.json())
        .then(arr => {
          if (Array.isArray(arr) && arr.length) {
            setPool(normalizeList(arr));           // 直接正規化，不要先 String()
          } else {
            setPool(normalizeList(DEFAULT_LIST));
          }
        }).catch(()=> setPool(normalizeList(DEFAULT_LIST)))
    }
  }, [])

  function drawNames(n){
    const fallback = normalizeList(DEFAULT_LIST);            // 確保是物件
    const src = (pool.length ? pool : fallback).slice();     // 一律是 {name,img}
    const res = [];
    n = Math.max(1, Math.min(5, n));
    for (let i = 0; i < n && src.length; i++) {
      const idx = Math.floor(Math.random() * src.length);
      res.push(src.splice(idx, 1)[0]);                       // 推入物件
    }
    if (unique) {
      setPool(prev => prev.filter(p => !res.some(w => w.name === p.name)));
    }
    return res;                                              // 一律回傳物件
  }

  function handleLever(){
    if(spinning) return
    const available = pool.length ? pool.length : DEFAULT_LIST.length
    const n = Math.min(Math.max(1, winnersCount || 1), available)
    const res = drawNames(n)
    setWinners(res)
    setSpinning(true)
  }

  function handleSpinDone(){
    setSpinning(false)
    if(winners.length){
      // const row = { time: nowStr(), prize, winners: winners.slice(), count: winners.length }
      const row = {
        time: nowStr(),
        prize,
        winners: winners.map(p => p.name), // 歷史只存名字，方便匯出
        count: winners.length
      }

      setHistory(prev => [...prev, row])
    }
  }

  function handleUndo(){
    const last = history[history.length-1]
    if(!last) return
    setHistory(prev => prev.slice(0, prev.length-1))
    if(unique){
      setPool(prev => {
        const setPrev = new Set(prev)
        last.winners.forEach(w => setPrev.add(w))
        return Array.from(setPrev)
      })
    }
    setWinners([])
  }

  // function handleReset(){
  //   if(!confirm('確定要重置嗎？將重新載入 participants.json 並清空抽獎紀錄。')) return
  //   fetch('/data/participants.json?ts='+Date.now())
  //     .then(r => r.json())
  //     .then(arr => {
  //       const list = Array.isArray(arr) ? arr : [];
  //       setPool(list.length ? normalizeList(list) : normalizeList(DEFAULT_LIST));
  //       setHistory([]);
  //       setWinners([]);
  //     })
  //     .catch(()=>{
  //       setPool(normalizeList(DEFAULT_LIST)); setHistory([]); setWinners([])
  //     })
  // }

  function handleExport(){
    if(history.length===0){ alert('尚無紀錄可匯出。'); return }
    const header = ['時間','獎項','得獎者','人數']
    const lines = [header.join(',')]
    history.forEach(r => {
      const safe = s => '"'+String(s).replace(/"/g,'""')+'"'
      lines.push([safe(r.time), safe(r.prize), safe(r.winners.join('、')), r.count].join(','))
    })
    const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `春酒抽獎紀錄_${Date.now()}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(()=>URL.revokeObjectURL(url), 3000)
  }

  async function handleImport(file){
    if(!file) return
    const text = await file.text()
    let list = []
    try{
      if (file.name.endsWith('.json')) {
        const arr = JSON.parse(text);
        if (Array.isArray(arr)) list = arr;                         // 直接吃 JSON 物件或字串
      } else {
        list = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }
    }catch(e){
      alert('檔案格式無法解析，請改用 txt/csv/json。')
      return
    }
    if(list.length===0){ alert('檔案裡沒有任何名字。'); return }
    setPool(normalizeList(list))
    setHistory([])
    setWinners([])
  }

  // keyboard: Space
  useEffect(()=>{
    const onKey = (ev)=>{
      if(ev.code==='Space'){ ev.preventDefault(); handleLever() }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [handleLever, pool, winnersCount, prize, unique, spinning])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(DATA_URL, { cache: "no-store" });
        const data = await res.json();
        setParticipants(Array.isArray(data) ? data : []);
      } catch {
        setParticipants([]);
      }
    })();
  }, []);

  const cappedCount = useMemo(
    () => Math.max(1, Math.min(5, Number(count) || 1)),
    [count]
  );

  const handleSpin = () => setSpinning(true);
  const handleReset = () => {
    setSpinning(false);
    setWinners([]);
  };

  const handleResult = (drawn) => {
    setSpinning(false);
    setWinners(drawn);
    setRecords((prev) => [
      { time: new Date().toISOString(), winners: drawn },
      ...prev,
    ]);
  };

  // return (
  //   <>
  //     <header className="site-header">
  //       <h1>2026 春酒抽獎</h1>
  //       {/* <p className="subtitle">React + Hooks，支援一次抽 1–5 位、避免重複、匯入/匯出、抽獎紀錄</p> */}
  //     </header>

  //     <main className="container">
  //       <section className="controls card">
  //         <Controls
  //           winnersCount={winnersCount}
  //           setWinnersCount={setWinnersCount}
  //           prize={prize}
  //           setPrize={setPrize}
  //           unique={unique}
  //           setUnique={setUnique}
  //           onLever={handleLever}
  //           onUndo={handleUndo}
  //           canUndo={history.length>0}
  //           onReset={handleReset}
  //           onExport={handleExport}
  //           onImport={handleImport}
  //           spinning={spinning}
  //         />
  //       </section>

  //       <section className="stage card">
  //         <SlotMachine
  //           winners={winners}
  //           pool={pool.length?pool:DEFAULT_LIST}
  //           spinning={spinning}
  //           onDone={handleSpinDone}
  //         />
  //       </section>

  //       <section className="history card">
  //         <History list={history} />
  //       </section>
  //     </main>

  //     <footer className="site-footer">
  //       {/* <p>資料保存在本機瀏覽器（localStorage）。</p> */}
  //     </footer>
  //   </>
  // )

return (
    <div className="app">
      <div className="header">
        <div>
          <div className="title">2026 春酒抽獎</div>
          <div className="subtitle">GitHub Pages 版（支援圖片＋多名同抽）</div>
        </div>
      </div>

      <div className="panel controls" style={{ marginBottom: 16 }}>
        <Controls
          count={cappedCount}
          setCount={setCount}
          spinning={spinning}
          onStart={handleSpin}
          onReset={handleReset}
        />
      </div>

      <div className="grid">
        <div className="panel slot">
          <SlotMachine
            participants={participants}
            count={cappedCount}
            spinning={spinning}
            onResult={handleResult}
          />

          {winners.length > 0 && (
            <div className="badges">
              {winners.map((p, i) => (
                <span className="badge" key={i}>
                  <img className="badge-avatar" src={p._resolvedImg} alt={p.name} />
                  <b>{p.name}</b>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <History records={records} onClear={() => setRecords([])} />
        </div>
      </div>
    </div>
  );

}
