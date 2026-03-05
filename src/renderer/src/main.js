import { createApp } from 'vue'
import App from './App.vue'
import './styles/global.css'
import i18n from './i18n.js'

function initMobileKeyboardInsets() {
  const vv = window.visualViewport
  if (!vv) return

  const updateKeyboardInset = () => {
    const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
    document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`)
    document.documentElement.classList.toggle('keyboard-open', inset > 20)
  }

  vv.addEventListener('resize', updateKeyboardInset)
  vv.addEventListener('scroll', updateKeyboardInset)
  window.addEventListener('orientationchange', updateKeyboardInset)

  document.addEventListener('focusin', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable

    if (!isInput) return
    setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120)
  })

  updateKeyboardInset()
}

initMobileKeyboardInsets()

createApp(App).use(i18n).mount('#app')
