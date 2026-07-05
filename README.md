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
* 待辦事項:新增、編輯(含留言)、完成、星號標記、刪除,All / Complete / Incomplete 篩選
* 蕃茄鐘:每個待辦可各自開始專注(▶),支援 25/5 與 50/10 兩種模式,完成顆數以 🍅 顯示
* 所有資料(待辦、蕃茄鐘進行中的階段)存於 localStorage,重新整理後續跑

## Project setup
```
npm install
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
```
