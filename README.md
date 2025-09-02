# 2026 春酒抽獎（React + Vite）

React 版的春酒抽獎程式，功能與純前端版一致：
- 一次抽 1–5 位、避免重複（中獎者從名單移除、可復原上一筆）
- 拉霸動畫、空白鍵啟動
- 匯入 txt/csv/json、紀錄可匯出 CSV
- 名單預設從 `public/data/participants.json` 載入
- 狀態存於 localStorage

## 快速開始

```bash
npm i
npm run dev
# http://localhost:5173
```

打包：
```bash
npm run build
npm run preview
```

## 結構

```
spring-party-lottery-react/
├─ index.html
├─ package.json
├─ public/
│  └─ data/participants.json
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ styles.css
   └─ components/
      ├─ Controls.jsx
      ├─ SlotMachine.jsx
      └─ History.jsx
```
