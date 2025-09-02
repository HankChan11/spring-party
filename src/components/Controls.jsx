import React from "react";
import React, { useRef } from 'react'

export default function Controls({
  winnersCount, setWinnersCount,
  prize, setPrize,
  unique, setUnique,
  onLever, onUndo, canUndo,
  onReset, onExport, onImport,
  spinning
}){
  const fileRef = useRef(null)

  return (
    <div className="controls">
      <div className="control-row">
        <label htmlFor="winnersCount">抽出人數</label>
        <input id="winnersCount" type="number" min="1" max="5"
          value={winnersCount}
          onChange={e=>setWinnersCount(Math.max(1, Math.min(5, parseInt(e.target.value||'1',10))))} />
      </div>

      <div className="control-row">
        <label htmlFor="prizeLevel">獎項</label>
        <select id="prizeLevel" value={prize} onChange={e=>setPrize(e.target.value)}>
          <option value="特別獎">特別獎</option>
          <option value="頭獎">頭獎</option>
          <option value="二獎">二獎</option>
          <option value="三獎">三獎</option>
          <option value="加碼獎">加碼獎</option>
        </select>
      </div>

      <div className="control-row">
        <label className="checkbox">
          <input type="checkbox" checked={unique} onChange={e=>setUnique(e.target.checked)} />
          <span>避免重複（抽到的人會從名單移除）</span>
        </label>
      </div>

      <div className="control-row responsive">
        <label className="file-label">
          <input ref={fileRef} type="file" accept=".txt,.csv,.json"
            onChange={e=>onImport(e.target.files?.[0])} />
          <span>匯入名單（txt/csv/json）</span>
        </label>
        <a className="btn link" href="/data/participants.json" target="_blank" rel="noopener">管理名單（participants.json）</a>
      </div>

      <div className="lever-wrap">
        <button className={`lever ${spinning?'spin':''}`} onClick={onLever} disabled={spinning}>
          <span className="lever-body"></span>
          <span className="lever-stick"></span>
          <span className="lever-ball"></span>
          <span className="lever-text">{spinning?'抽獎中…':'拉一下開抽！'}</span>
        </button>
      </div>

      <div className="actions">
        <button className="btn" onClick={onUndo} disabled={!canUndo}>復原上一次</button>
        <button className="btn danger" onClick={onReset}>重置名單</button>
        <button className="btn outline" onClick={onExport}>匯出紀錄 CSV</button>
      </div>
    </div>
  )
}
