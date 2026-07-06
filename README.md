# 🍅 Daily Tomato Todo

以「日」為單位的待辦清單 × 蕃茄鐘。一天一張卡片,左右滑動安排每日任務;選定一件事按下 ▶,整個畫面只剩倒數計時,專心把它做完。

**線上 Demo** → https://shueny.github.io/vue-daily-tomato-todo/
**設計概念(互動 mockup 與功能決策)** → [docs/design-concept.html](docs/design-concept.html)

<p>
  <img src="/src/assets/screenshot-main.png" alt="每日卡片主畫面" width="30%" />
  <img src="/src/assets/screenshot-calendar.png" alt="行事曆與逾期任務" width="30%" />
  <img src="/src/assets/screenshot-focus.png" alt="全畫面專注模式" width="30%" />
</p>

## 功能

### 📆 每日卡片
- 一天一張卡,**左右滑動**切換日子(CSS scroll-snap,原生慣性手感)
- 「昨天|今天|明天」膠囊快速切換,離開今天時出現「回今天 ↩」
- 任務可新增留言、標星號,以 All / Complete / Incomplete 篩選當日清單

### 🗓 行事曆
- 點標題的大日期展開整月,**每一天都可點選跳轉**,‹ › 切換月份
- 每日狀態小圓點:灰=有任務、紅=有未完成、綠=全部完成

### ➕ 建立任務時選日期
- 輸入框旁的日期 chip **預設跟著目前檢視的日子** —— 滑到明天的卡片打字,任務就建在明天
- 點 chip 可快選今天/明天/下週,或用日期選擇器挑任意一天

### ⏰ 逾期處理
- 過去未完成的任務標紅「逾期」,可勾選完成、一鍵「移到今天 →」,或在編輯視窗改到任何一天
- 今天的卡片會提示「⚠ 有 N 件過去未完成」,點擊直接跳去處理

### 🍅 蕃茄鐘
- 按任務列的 ▶ 進入**全畫面專注模式**:半透明模糊遮罩蓋住一切,只留倒數進度環、任務名稱與 ⏸ 暫停 / ▶ 繼續 / ■ 停止
- 支援 **25/5** 與 **50/10** 兩種模式;專注結束自動進入休息(綠色畫面)
- 每完成一輪專注,該任務累積一顆 🍅
- 倒數以結束時間戳計算,**重新整理、關閉分頁後回來都會續跑**(含暫停狀態)

### 💾 資料
- 待辦、蕃茄鐘進行中的階段、模式偏好全部存於 localStorage,不需帳號、離線可用(PWA)

## Tech Stack

| 類別 | 使用技術 |
| --- | --- |
| 框架 | Vue 3(Options API + `setup()`)、Vue Router 4 |
| 狀態管理 | Pinia(`stores/todo.js` 任務與日期、`stores/pomodoro.js` 蕃茄鐘) |
| 建置 | Vite、`vite-plugin-pwa`(離線快取 + 自動更新) |
| UI | Bootstrap 4、Font Awesome 6、SCSS |
| 部署 | GitHub Actions → GitHub Pages(push `master` 自動建置部署) |

## 開發

```bash
npm install
npm run dev      # 開發伺服器
npm run build    # 正式建置(輸出 dist/)
npm run preview  # 預覽正式建置
```

部署不需手動操作:合併進 `master` 後,[deploy workflow](.github/workflows/deploy.yml) 會自動 build 並發佈到 GitHub Pages。

## 來源與致謝
- 題目:[The F2E - 前端修練精神時光屋](https://www.hexschool.com/2018/05/09/2018-05-09-the_f2e/)([六角提供的設計稿](https://hexschool.github.io/THE_F2E_Design/todolist/))
- 樣式參考:[yuanchen1103/f2e-w1](https://yuanchen1103.github.io/f2e-w1/)
- 動畫參考:[nourabusoud/vue-todo-list](https://nourabusoud.github.io/vue-todo-list/)
- 前身為 2019 年的 Vue 2 版 `vue-todolist-1`,2026 年升級為 Vue 3 + Pinia 並重新設計為每日卡片 + 蕃茄鐘
