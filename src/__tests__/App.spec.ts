import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import App from '../App.vue'
import { downloadTsv } from '@/cards'

vi.mock('@/cards', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/cards')>()),
  downloadTsv: vi.fn<(text: string) => void>(),
}))

let wrapper: VueWrapper

const mountApp = () => (wrapper = mount(App, { attachTo: document.body }))
const inputs = (label: string) => wrapper.findAll(`input[aria-label="${label}"]`)
const cell = (label: string, row = 0) => inputs(label)[row]!
const value = (label: string, row = 0) => (cell(label, row).element as HTMLInputElement).value
const button = (text: string) => wrapper.findAll('button').find((b) => b.text() === text)!

async function type(label: string, text: string, row = 0) {
  // setValue would also fire `change`, which a browser only fires on blur
  const input = cell(label, row)
  ;(input.element as HTMLInputElement).value = text
  await input.trigger('input')
  await nextTick()
}

async function exported() {
  vi.mocked(downloadTsv).mockClear()
  await button('Download for Anki').trigger('click')
  return vi.mocked(downloadTsv).mock.calls[0]![0]
}

beforeEach(() => {
  localStorage.clear()
  mountApp()
})
afterEach(() => wrapper.unmount())

describe('App', () => {
  it('generates Traditional and Pinyin live', async () => {
    await type('Simplified', '学习')
    expect(value('Traditional')).toBe('學習')
    expect(value('Pinyin')).toBe('xué xí')
  })

  it('waits for IME composition to end', async () => {
    const input = cell('Simplified')
    await input.trigger('compositionstart')
    await type('Simplified', '学习')
    expect(value('Traditional')).toBe('')
    expect(value('Pinyin')).toBe('')
    await input.trigger('compositionend')
    await nextTick()
    expect(value('Traditional')).toBe('學習')
    expect(value('Pinyin')).toBe('xué xí')
  })

  it('keeps exactly one trailing blank row without a remove button', async () => {
    await type('Simplified', '中')
    expect(inputs('Simplified')).toHaveLength(2)
    await type('Simplified', '')
    expect(inputs('Simplified')).toHaveLength(1)
    expect(wrapper.findAll('[aria-label="Remove row"]')).toHaveLength(0)
  })

  it('keeps values and focus when deleting a middle row', async () => {
    for (const [i, w] of ['一', '二', '三'].entries()) await type('Simplified', w, i)
    const third = cell('Simplified', 2).element as HTMLInputElement
    third.focus()
    await wrapper.findAll('[aria-label="Remove row"]')[0]!.trigger('click')
    await nextTick()
    expect(value('Simplified', 0)).toBe('二')
    expect(value('Simplified', 1)).toBe('三')
    expect(document.activeElement).toBe(third)
  })

  it('lets you edit Pinyin and restores the generated value on change', async () => {
    await type('Simplified', '银行')
    expect(cell('Pinyin').classes()).not.toContain('edited')
    await type('Pinyin', '')
    expect(value('Pinyin')).toBe('')
    expect(cell('Pinyin').classes()).toContain('edited')
    await type('Pinyin', 'yín xíng')
    expect(value('Pinyin')).toBe('yín xíng')
    await type('Pinyin', '  ')
    await cell('Pinyin').trigger('change')
    expect(value('Pinyin')).toBe('yín háng')
    expect(cell('Pinyin').classes()).not.toContain('edited')
  })

  it('exports manual edits and resets them when Simplified changes', async () => {
    await type('Simplified', '银行')
    await type('Pinyin', 'yín xíng')
    expect(await exported()).toContain('yín xíng')
    await type('Simplified', '学习')
    expect(value('Pinyin')).toBe('xué xí')
  })

  it('warns about and skips rows without Simplified', async () => {
    await type('English', 'orphan')
    await type('Simplified', '中', 1)
    expect(wrapper.findAll('tbody tr')[0]!.classes()).toContain('missing')
    expect(await exported()).not.toContain('orphan')
  })

  it('enables Download only when a row has Simplified', async () => {
    expect(button('Download for Anki').attributes('disabled')).toBeDefined()
    await type('English', 'hello')
    expect(button('Download for Anki').attributes('disabled')).toBeDefined()
    await type('Simplified', '你好')
    expect(button('Download for Anki').attributes('disabled')).toBeUndefined()
  })

  it('restores rows and settings after remount', async () => {
    await type('Simplified', '学习')
    await wrapper.find('input[placeholder="Chinese::HSK1"]').setValue('Chinese')
    await wrapper.find('input[placeholder="Chinese"]').setValue('Basic')
    await nextTick()
    wrapper.unmount()
    mountApp()
    expect(value('Simplified')).toBe('学习')
    expect(inputs('Simplified')).toHaveLength(2)
    expect(
      (wrapper.find('input[placeholder="Chinese::HSK1"]').element as HTMLInputElement).value,
    ).toBe('Chinese')
    expect((wrapper.find('input[placeholder="Chinese"]').element as HTMLInputElement).value).toBe(
      'Basic',
    )
  })

  it('mounts with one blank row when saved data is invalid', () => {
    wrapper.unmount()
    localStorage.setItem('anki-cards', '{not json')
    mountApp()
    expect(inputs('Simplified')).toHaveLength(1)
  })

  it('clears rows but keeps settings only when confirmed', async () => {
    await wrapper.find('input[placeholder="Chinese::HSK1"]').setValue('Chinese')
    await type('Simplified', '学习')
    vi.stubGlobal('confirm', () => false)
    await button('Clear all').trigger('click')
    expect(value('Simplified')).toBe('学习')
    vi.stubGlobal('confirm', () => true)
    await button('Clear all').trigger('click')
    await nextTick()
    expect(inputs('Simplified')).toHaveLength(1)
    expect(value('Simplified')).toBe('')
    expect(
      (wrapper.find('input[placeholder="Chinese::HSK1"]').element as HTMLInputElement).value,
    ).toBe('Chinese')
    vi.unstubAllGlobals()
  })

  it('writes deck and note type headers into the file', async () => {
    await wrapper.find('input[placeholder="Chinese::HSK1"]').setValue('Chinese')
    await wrapper.find('input[placeholder="Chinese"]').setValue('Basic')
    await type('Simplified', '学习')
    let tsv = await exported()
    expect(tsv).toContain('#deck:Chinese\n')
    expect(tsv).toContain('#notetype:Basic\n')
    await wrapper.find('input[placeholder="Chinese::HSK1"]').setValue('')
    tsv = await exported()
    expect(tsv).not.toContain('#deck:')
  })
})
