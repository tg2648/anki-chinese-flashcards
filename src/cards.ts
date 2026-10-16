import { ref } from 'vue'
import { Converter } from 'opencc-js/cn2t'
import { pinyin, addDict } from 'pinyin-pro'

// `tw` converts characters only; `twp` would also swap vocabulary (软件→軟體), wrong for flashcards.
const toTw = Converter({ from: 'cn', to: 'tw' })

export type Card = {
  id: string
  front: string
  back: string
  example: string
  exampleTranslation: string
  traditional: string | null
  pinyin: string | null
}

export const blank = (): Card => ({
  id: crypto.randomUUID(),
  front: '',
  back: '',
  example: '',
  exampleTranslation: '',
  // null means "no override, generate it."; a string indicates a user-supplied value
  traditional: null,
  pinyin: null,
})

// Blank when identical to the simplified text, so the field only shows real differences.
export function traditional(s: string) {
  const t = toTw(s)
  return t === s ? '' : t
}

const dictLoaded = ref(false)

// The modern dictionary fixes words the default gets wrong (京都 → jīng dū), but it is ~1.2 MB
// gzipped, so it loads as its own chunk after the app starts.
// https://pinyin-pro.cn/en/use/addDict.html#using-the-modern-chinese-dictionary
export async function loadDict() {
  addDict((await import('@pinyin-pro/data/modern')).default)
  dictLoaded.value = true
}

export function pinyinOf(s: string) {
  void dictLoaded.value // reactive callers re-run once the dictionary arrives
  return pinyin(s)
}

export const resolve = (card: Card) => ({
  traditional: card.traditional ?? traditional(card.front),
  pinyin: card.pinyin ?? pinyinOf(card.front),
})

export const isEmpty = (c: Card) =>
  [c.front, c.back, c.example, c.exampleTranslation, c.traditional, c.pinyin].every(
    (v) => !v?.trim(),
  )

export function withTrailingBlank(rows: Card[]): Card[] {
  let end = rows.length
  while (end > 0 && isEmpty(rows[end - 1]!)) end--
  if (end === rows.length - 1) return rows
  return end < rows.length ? rows.slice(0, end + 1) : [...rows, blank()]
}

const quote = (s: string) => (/[\t\n\r"]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s)

export function toAnkiTsv(cards: Card[], { deck, notetype }: { deck: string; notetype: string }) {
  const lines = ['#separator:tab', '#html:false']
  if (notetype.trim()) lines.push(`#notetype:${notetype.trim()}`)
  if (deck.trim()) lines.push(`#deck:${deck.trim()}`)
  lines.push('#columns:Front\tTraditional\tBack\tPinyin\tExample\tExample Translation')
  for (const card of cards) {
    if (!card.front.trim()) continue
    const r = resolve(card)
    const fields = [
      card.front,
      r.traditional,
      card.back,
      r.pinyin,
      card.example,
      card.exampleTranslation,
    ]
    lines.push(fields.map((f) => quote(f.trim())).join('\t'))
  }
  return lines.join('\n')
}

export function downloadTsv(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/tab-separated-values' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'anki-cards.txt'
  a.click()
  URL.revokeObjectURL(url)
}
