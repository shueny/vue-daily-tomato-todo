import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RetroDial from '@/components/RetroDial.vue'

const sectorOf = (w) => w.find('.rd-sector')
const labels = (w) => w.findAll('.rd-num').map((n) => n.text())

// 錶盤 300x300,中心 (150,150);讓 getBoundingClientRect 回傳固定位置
function placeAt (wrapper) {
  wrapper.element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 300 })
  wrapper.element.setPointerCapture = () => {}
}
function pointer (type, x, y) {
  const e = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(e, { clientX: x, clientY: y, button: 0, pointerId: 1 })
  return e
}

describe('RetroDial', () => {
  it('draws no sector at zero and a full circle at the full scale', async () => {
    const w = mount(RetroDial, { props: { value: 0, scale: 60 } })
    expect(sectorOf(w).exists()).toBe(false)
    await w.setProps({ value: 60 })
    // 整圈用兩段半圓畫,不經過中心點
    expect(sectorOf(w).attributes('d')).toMatch(/^M150 46 A104 104 0 1 1 150 254 A104 104/)
  })

  it('draws a quarter sector ending at 3 o\'clock for 15 of 60 minutes', () => {
    const w = mount(RetroDial, { props: { value: 15, scale: 60 } })
    expect(sectorOf(w).attributes('d')).toBe('M150 150 L150 46 A104 104 0 0 1 254 150 Z')
  })

  it('uses the large-arc flag past half way', () => {
    const w = mount(RetroDial, { props: { value: 45, scale: 60 } })
    expect(sectorOf(w).attributes('d')).toContain(' 0 1 1 ')
  })

  it('clamps a value above the scale to a full circle', () => {
    const w = mount(RetroDial, { props: { value: 90, scale: 60 } })
    expect(sectorOf(w).attributes('d')).toContain('A104 104 0 1 1 150 254')
  })

  it('labels a 60-minute dial every 5 and a 15-minute dial every 3', async () => {
    const w = mount(RetroDial, { props: { value: 1, scale: 60 } })
    expect(labels(w)).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'])
    await w.setProps({ scale: 15 })
    expect(labels(w)).toEqual(['0', '3', '6', '9', '12'])
  })

  it('shortens a long task title in the hub', () => {
    const w = mount(RetroDial, { props: { value: 5, title: '一個非常非常長的任務名稱' } })
    expect(w.find('.rd-hub-title').text()).toBe('一個非常非常…')
  })

  it('is hidden from assistive tech and ignores keys when not adjustable', async () => {
    const w = mount(RetroDial, { props: { value: 10 } })
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.attributes('role')).toBeUndefined()
    await w.trigger('keydown', { key: 'ArrowUp' })
    placeAt(w)
    w.element.dispatchEvent(pointer('pointerdown', 290, 150))
    expect(w.emitted('update:value')).toBeUndefined()
    expect(w.find('.rd-handle').exists()).toBe(false)
  })

  describe('adjustable', () => {
    const mountAdj = (value = 25) =>
      mount(RetroDial, { props: { value, scale: 60, min: 5, max: 60, adjustable: true, label: '專注時間' } })

    it('exposes slider semantics', () => {
      const w = mountAdj()
      expect(w.attributes()).toMatchObject({
        role: 'slider', 'aria-label': '專注時間', 'aria-valuemin': '5', 'aria-valuemax': '60', 'aria-valuenow': '25'
      })
      expect(w.find('.rd-handle').exists()).toBe(true)
    })

    it.each([
      ['ArrowUp', 26], ['ArrowRight', 26], ['ArrowDown', 24], ['ArrowLeft', 24],
      ['PageUp', 30], ['PageDown', 20], ['Home', 5], ['End', 60]
    ])('%s emits %s', async (key, expected) => {
      const w = mountAdj()
      await w.trigger('keydown', { key })
      expect(w.emitted('update:value')[0]).toEqual([expected])
    })

    it('clamps keyboard steps at the bounds and does not re-emit the same value', async () => {
      const w = mountAdj(60)
      await w.trigger('keydown', { key: 'ArrowUp' })
      expect(w.emitted('update:value')).toBeUndefined()
      await w.trigger('keydown', { key: 'a' })
      expect(w.emitted('update:value')).toBeUndefined()
    })

    it('sets the value from where the pointer is while dragging', async () => {
      const w = mountAdj(25)
      placeAt(w)
      w.element.dispatchEvent(pointer('pointerdown', 290, 150)) // 3 點鐘 → 15
      w.element.dispatchEvent(pointer('pointermove', 150, 290)) // 6 點鐘 → 30
      w.element.dispatchEvent(pointer('pointerup', 150, 290))
      w.element.dispatchEvent(pointer('pointermove', 10, 150)) // 放開後不再更新
      expect(w.emitted('update:value')).toEqual([[15], [30]])
    })

    it('does not jump from max to min when dragged across 12 o\'clock', () => {
      const w = mountAdj(58)
      placeAt(w)
      w.element.dispatchEvent(pointer('pointerdown', 160, 10)) // 12 點鐘右邊一點點 ≈ 1 分
      expect(w.emitted('update:value')).toEqual([[60]])
    })

    it('does not jump from min to max when dragged backwards across 12 o\'clock', () => {
      const w = mountAdj(6)
      placeAt(w)
      w.element.dispatchEvent(pointer('pointerdown', 140, 10)) // 12 點鐘左邊 ≈ 59 分
      expect(w.emitted('update:value')).toEqual([[5]])
    })

    it('ignores a right-click', () => {
      const w = mountAdj()
      placeAt(w)
      const e = pointer('pointerdown', 290, 150)
      e.button = 2
      w.element.dispatchEvent(e)
      expect(w.emitted('update:value')).toBeUndefined()
    })
  })
})
