import React from 'react'

export default function History({ list }){
  return (
    <>
      <h2>抽獎紀錄</h2>
      <div className="history-head">
        <span>時間</span><span>獎項</span><span>得獎者</span><span>人數</span>
      </div>
      <div className="history-list">
        {list.slice().reverse().map((row, idx)=>(
          <div className="history-row" key={idx}>
            <span>{row.time}</span>
            <span>{row.prize}</span>
            <span>{row.winners.join('、')}</span>
            <span>{row.count}</span>
          </div>
        ))}
      </div>
    </>
  )
}
