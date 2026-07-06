# [Vue] Todo List
Demo: [Todo List](https://shueny.github.io/vue-todolist-1/)
<img src="/src/assets/vue-todo-1.jpg" alt="todo list" width="50%" />

## 來源
* [The F2E - 前端修練精神時光屋](https://www.hexschool.com/2018/05/09/2018-05-09-the_f2e/)
* [FB 貼文](https://www.facebook.com/groups/173311386703334/permalink/179453469422459/)
* [六角提供的設計稿](https://hexschool.github.io/THE_F2E_Design/todolist/?fbclid=IwAR3I77oClyfjNC0CWsn9xN1UgU6eSFH9tlEWXkP85Jv579NNeKyMSji2qQQ)

## 設計樣式參考
* [https://yuanchen1103.github.io/f2e-w1/](https://yuanchen1103.github.io/f2e-w1/)

## Tech Stack
* Vue 3 + Pinia (state management) + Vue Router 4
* Vite (build tool, with PWA support via `vite-plugin-pwa`)
* Bootstrap 4 + Font Awesome 6

## Features
* 每日卡片:一天一張卡,左右滑動切換昨天/今天/明天等每日待辦;「昨天|今天|明天」膠囊與「回今天」快速導航
* 行事曆:點標題日期展開整月,每天都可點選跳轉;小圓點顯示當日狀態(灰=有任務、紅=有未完成、綠=全完成)
* 建立任務可選日期:輸入框旁的日期 chip 預設跟著目前檢視的日子,可快選今天/明天/下週或任意日期
* 逾期處理:過去未完成的任務標紅,可勾選槓掉、一鍵「移到今天」,或在編輯視窗改到任何一天
* 蕃茄鐘:按任務列的 ▶ 進入全畫面專注遮罩(半透明模糊背景),只顯示倒數、任務名與 ⏸/▶/■;支援 25/5 與 50/10 模式、暫停/繼續,完成顆數以 🍅 顯示
* 所有資料(待辦、蕃茄鐘進行中的階段)存於 localStorage,重新整理後續跑

## Project setup
```
npm install
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
```
