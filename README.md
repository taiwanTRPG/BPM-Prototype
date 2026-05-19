# BPM-Prototype（展示原型）

內部 BPM 流程的**互動展示原型**（示範用）：出帳申請、三關簽核（主管 → 會計 → 出納）、收件夾、PDF 文件產生。

- 規格：[Design/展示原型規格書.md](Design/展示原型規格書.md)
- **無帳號登入**；以頂部下拉切換角色（申請人／主管／會計／出納）
- 資料存於瀏覽器 `localStorage`

## 本機執行

```bash
npm install
npm run generate:assets   # 產生 public/templates/disbursement.pdf
npm run dev
```

開啟終端機顯示的網址（通常 http://localhost:5173/BPM-Prototype/）。

## 建置

```bash
npm run build
npm run preview
```

## GitHub Pages

1. Repo → **Settings** → **Pages** → Source 選 **GitHub Actions**
2. `main` 分支 push 後會自動部署
3. 網址：`https://<username>.github.io/BPM-Prototype/`

本專案使用 `HashRouter`（網址含 `#/`），以相容 GitHub Pages 靜態 hosting。

## Demo 提示

1. 切換**申請人** → 新增出帳申請 → 送出  
2. 切換**主管／會計／出納** → 收件夾「待我簽核」→ 同意  
3. 案件詳情可預覽／下載 PDF（每關版本遞增、印章累加）  
4. 使用「重置示範資料」恢復含範例單的初始狀態  

預載範例單為「待主管簽核」，可直接從步驟 2 開始簡報。
