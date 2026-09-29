import { test, expect } from '@playwright/test'

// 外部字型在沙盒/CI 可能連不到,擋掉避免雜訊
test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
})

async function freshApp (page, storage = {}) {
  await page.goto('./')
  await page.evaluate((s) => {
    localStorage.clear()
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v)
  }, storage)
  await page.reload()
}
const titles = (page) => page.locator('.todo-item .ti-title').allTextContents()

async function addTasks (page, list) {
  for (const t of list) {
    await page.fill('.addTask input', t)
    await page.keyboard.press('Enter')
  }
}

async function dragDial (page, fromDeg, toDeg) {
  const box = await page.locator('.duration-sheet .retro-dial').boundingBox()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const r = box.width * 0.35
  const at = (deg) => [cx + Math.sin((deg * Math.PI) / 180) * r, cy - Math.cos((deg * Math.PI) / 180) * r]
  await page.mouse.move(...at(fromDeg))
  await page.mouse.down()
  for (let d = fromDeg; d <= toDeg; d += 15) await page.mouse.move(...at(d))
  await page.mouse.move(...at(toDeg))
  await page.mouse.up()
}

test.describe('focus / break durations', () => {
  test('adjust in the settings sheet, persist across reload, and count down from it', async ({ page }) => {
    await freshApp(page)
    await expect(page.locator('.pomodoro__length')).toContainText('專注 25 · 休息 5')

    await page.click('.pomodoro__length')
    await dragDial(page, 150, 180) // 拖到 6 點鐘 = 30 分
    await expect(page.locator('.ds-value').first()).toHaveText('30分')
    await page.keyboard.press('ArrowUp')
    await expect(page.locator('.ds-value').first()).toHaveText('31分')
    await page.getByRole('button', { name: '休息多 1 分鐘' }).click()
    await page.getByRole('button', { name: '完成', exact: true }).click()
    await expect(page.locator('.duration-sheet')).toHaveCount(0)

    await page.reload()
    await expect(page.locator('.pomodoro__length')).toContainText('專注 31 · 休息 6')

    await page.getByRole('button', { name: '開始蕃茄鐘' }).first().click()
    await expect(page.locator('.tb-label')).toHaveText(/^3[01]:\d\d$/)
  })

  test('clamps at the limits even with rapid clicking', async ({ page }) => {
    await freshApp(page, { 'pomodoro-durations': JSON.stringify({ focus: 58, break: 2 }) })
    await page.click('.pomodoro__length')
    const plus = page.getByRole('button', { name: '專注多 1 分鐘' })
    await plus.click()
    await plus.click()
    await expect(plus).toBeDisabled()
    await expect(page.locator('.ds-value').first()).toHaveText('60分')
    const breakMinus = page.getByRole('button', { name: '休息少 1 分鐘' })
    await breakMinus.click()
    await expect(breakMinus).toBeDisabled()
    await page.keyboard.press('Escape')
    await expect(page.locator('.duration-sheet')).toHaveCount(0)
  })

  test('keeps a user\'s old 50/10 choice', async ({ page }) => {
    await freshApp(page, { 'pomodoro-mode': '50/10' })
    await expect(page.locator('.pomodoro__length')).toContainText('專注 50 · 休息 10')
  })
})

test.describe('retro theme', () => {
  test('switches theme, remembers it, and runs the round timer', async ({ page }) => {
    await freshApp(page, { 'pomodoro-durations': JSON.stringify({ focus: 15, break: 5 }) })
    await page.getByRole('button', { name: '復古' }).click()
    await expect(page.locator('.app-todo')).toHaveClass(/theme-retro/)
    await page.reload()
    await expect(page.locator('.app-todo')).toHaveClass(/theme-retro/)
    await expect(page.locator('.duration-pill')).toContainText('15 · 5 分')

    await page.getByRole('button', { name: '開始蕃茄鐘' }).first().click()
    const overlay = page.locator('.focus-overlay--retro')
    await expect(overlay).toBeVisible()
    await expect(overlay.locator('.fr-len')).toHaveText('專注 15 分')
    await expect(overlay.locator('.rd-num')).toHaveCount(12)

    await page.getByRole('button', { name: '暫停' }).click()
    await expect(overlay.locator('.fr-sub')).toContainText('已暫停')
    const frozen = await overlay.locator('.fr-time').textContent()
    await page.waitForTimeout(1500)
    await expect(overlay.locator('.fr-time')).toHaveText(frozen)
    await page.getByRole('button', { name: '繼續' }).click()

    await page.getByRole('button', { name: '放棄這顆蕃茄' }).click()
    await expect(overlay).toHaveCount(0)
  })

  test('restores a running break after reload in the retro theme', async ({ page }) => {
    await freshApp(page, { 'ui-theme': 'retro' })
    await page.evaluate(() => localStorage.setItem('pomodoro-session', JSON.stringify({
      phase: 'break', phaseSeconds: 360, endsAt: Date.now() + 200000, paused: false, activeTodoId: 0
    })))
    await page.reload()
    const overlay = page.locator('.focus-overlay--retro.is-break')
    await expect(overlay).toBeVisible()
    await expect(overlay.locator('.fr-len')).toHaveText('休息 6 分')
    await expect(overlay.locator('.rd-num')).toHaveText(['0', '3', '6', '9', '12'])
    await page.getByRole('button', { name: '跳過休息' }).click()
    await expect(overlay).toHaveCount(0)
  })

  test('the ⋯ button opens the edit dialog, which can delete the task', async ({ page }) => {
    await freshApp(page, { 'ui-theme': 'retro' })
    await addTasks(page, ['刪掉我'])
    await expect(page.locator('.ti-edit').first()).toBeHidden()
    await page.locator('.todo-item', { hasText: '刪掉我' }).getByRole('button', { name: /更多動作/ }).click()
    await expect(page.locator('#editModal')).toBeVisible()
    await page.getByRole('button', { name: '刪除任務' }).click()
    await expect(page.locator('.todo-item', { hasText: '刪掉我' })).toHaveCount(0)
  })
})

test.describe('organizing tasks', () => {
  test('drag, keyboard nudge, sort modes and sinking completed tasks', async ({ page }) => {
    await freshApp(page, { 'todos-vuejs': '[]' })
    await expect(page.locator('.day-card__empty').first()).toBeVisible()
    await addTasks(page, ['C', 'B', 'A'])
    await expect.poll(() => titles(page)).toEqual(['A', 'B', 'C'])
    // 等新增的進場動畫跑完,位置才是最終位置
    await expect(page.locator('.todo-anim-enter-active, .todo-anim-move')).toHaveCount(0)

    // 拖曳 A 到 C 下面
    const handle = page.locator('.todo-item', { hasText: 'A' }).locator('.ti-handle')
    const hb = await handle.boundingBox()
    const cb = await page.locator('.todo-item', { hasText: 'C' }).boundingBox()
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(hb.x + hb.width / 2, hb.y + (cb.y + cb.height * 0.9 - hb.y) * i / 8)
    }
    await page.mouse.up()
    await expect.poll(() => titles(page)).toEqual(['B', 'C', 'A'])

    // 鍵盤:A 往上一格
    await page.locator('.todo-item', { hasText: 'A' }).locator('.ti-handle').focus()
    await page.keyboard.press('ArrowUp')
    await expect.poll(() => titles(page)).toEqual(['B', 'A', 'C'])

    // 星號排序
    await page.locator('.todo-item', { hasText: 'C' }).getByRole('button', { name: '標為重要' }).click()
    await page.getByRole('button', { name: /重要/ }).first().click()
    await expect.poll(() => titles(page)).toEqual(['C', 'B', 'A'])
    await expect(page.locator('.ti-handle')).toHaveCount(0) // 非自訂模式不顯示拖曳把手

    // 完成的沉底;關掉沉底後回到原位
    await page.getByRole('button', { name: /自訂/ }).click()
    await page.locator('.todo-item', { hasText: 'B' }).locator('.ti-check').click()
    await expect.poll(() => titles(page)).toEqual(['A', 'C', 'B'])
    await page.getByRole('button', { name: /完成沉底/ }).click()
    await expect.poll(() => titles(page)).toEqual(['B', 'A', 'C'])

    // 重新整理後順序還在
    await page.reload()
    await expect.poll(() => titles(page)).toEqual(['B', 'A', 'C'])
  })

  test('ignores blank tasks and keeps a very long title inside the card', async ({ page }) => {
    await freshApp(page, { 'todos-vuejs': '[]' })
    await addTasks(page, ['   '])
    await expect(page.locator('.todo-item')).toHaveCount(0)
    const long = '很長的任務'.repeat(40)
    await addTasks(page, [long])
    const card = await page.locator('.app-card').boundingBox()
    const item = await page.locator('.todo-item').first().boundingBox()
    expect(item.x + item.width).toBeLessThanOrEqual(card.x + card.width + 1)
  })
})

test('page metadata: Traditional Chinese lang and current app name in <noscript>', async ({ page }) => {
  await freshApp(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant')
  const noscript = await page.locator('noscript').innerHTML()
  expect(noscript).toContain('Daily Tomato Todo')
  expect(noscript).not.toContain('vue-todolist-1')
})
