import { defineStore } from 'pinia'

export const THEME_KEY = 'ui-theme'
export const THEMES = ['cute', 'retro']

function loadTheme () {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return THEMES.includes(saved) ? saved : 'cute'
  } catch (e) {
    return 'cute'
  }
}

// 介面主題:可愛蕃茄 / 復古計時器
export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: loadTheme(),
    durationOpen: false // 「設定時間」面板
  }),
  getters: {
    isRetro: (state) => state.theme === 'retro'
  },
  actions: {
    setTheme (theme) {
      if (!THEMES.includes(theme)) return
      this.theme = theme
      try {
        localStorage.setItem(THEME_KEY, theme)
      } catch (e) {
        // 無法儲存時照樣切換
      }
    }
  }
})
