import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  blank,
  downloadTsv,
  pinyinOf,
  resolve,
  toAnkiTsv,
  traditional,
  withTrailingBlank,
  type Card,
} from '@/cards'

const card = (fields: Partial<Card>): Card => ({ ...blank(), ...fields })
const opts = { deck: '', notetype: '' }

describe('traditional', () => {
  it('converts characters', () => {
    expect(traditional('为什么')).toBe('為什麼')
    expect(traditional('学习')).toBe('學習')
  })
})

describe('pinyinOf', () => {
  it('gives spaced tone-marked pinyin', () => {
    expect(pinyinOf('中国')).toBe('zhōng guó')
    expect(pinyinOf('银行')).toBe('yín háng')
    expect(pinyinOf('')).toBe('')
  })
})

describe('resolve', () => {
  it('prefers manual values, keeps empty strings, falls back on null', () => {
    expect(resolve(card({ front: '银行', pinyin: 'x', traditional: 'y' }))).toEqual({
      pinyin: 'x',
      traditional: 'y',
    })
    expect(resolve(card({ front: '银行', pinyin: '', traditional: '' }))).toEqual({
      pinyin: '',
      traditional: '',
    })
    expect(resolve(card({ front: '银行' }))).toEqual({ pinyin: 'yín háng', traditional: '銀行' })
  })
})

describe('withTrailingBlank', () => {
  it('appends a blank after a filled last row', () => {
    const rows = [card({ front: 'a' })]
    const out = withTrailingBlank(rows)
    expect(out).toHaveLength(2)
    expect(out[1]!.front).toBe('')
  })

  it('collapses trailing blanks into one, keeping middle blanks', () => {
    const rows = [card({ front: 'a' }), blank(), card({ front: 'b' }), blank(), blank(), blank()]
    expect(withTrailingBlank(rows)).toEqual(rows.slice(0, 4))
  })

  it('returns the same array when nothing changes', () => {
    const rows = [card({ front: 'a' }), blank()]
    expect(withTrailingBlank(rows)).toBe(rows)
  })
})

describe('toAnkiTsv', () => {
  const header = ['#separator:tab', '#html:false']
  const columns = '#columns:Front\tTraditional\tBack\tPinyin\tExample\tExample Translation'

  it('writes header lines and rows in note-field order', () => {
    const tsv = toAnkiTsv(
      [card({ front: '学习', back: 'to study', example: 'e', exampleTranslation: 't' })],
      opts,
    )
    expect(tsv).toBe([...header, columns, '学习\t學習\tto study\txué xí\te\tt'].join('\n'))
  })

  it('writes trimmed deck and notetype, omits blank ones', () => {
    const tsv = toAnkiTsv([], { deck: ' Chinese::HSK1 ', notetype: ' Basic ' })
    expect(tsv).toBe([...header, '#notetype:Basic', '#deck:Chinese::HSK1', columns].join('\n'))
    expect(toAnkiTsv([], { deck: '  ', notetype: '' })).toBe([...header, columns].join('\n'))
  })

  it('uses manual pinyin edits', () => {
    expect(toAnkiTsv([card({ front: '银行', pinyin: 'yín xíng' })], opts)).toContain('yín xíng')
  })

  it('skips blank cards and cards with a blank front', () => {
    const tsv = toAnkiTsv(
      [blank(), card({ front: '  ', back: 'orphan' }), card({ front: '中' })],
      opts,
    )
    expect(tsv.split('\n').slice(3)).toEqual(['中\t中\t\tzhōng\t\t'])
  })

  it('trims fields and quotes tabs and quotes', () => {
    const tsv = toAnkiTsv([card({ front: ' 中 ', back: 'a\tb', example: 'say "hi"' })], opts)
    expect(tsv.split('\n').pop()).toBe('中\t中\t"a\tb"\tzhōng\t"say ""hi"""\t')
  })
})

describe('downloadTsv', () => {
  afterEach(() => vi.restoreAllMocks())

  it('downloads a TSV blob and revokes the URL', async () => {
    let blob: Blob | undefined
    URL.createObjectURL = vi.fn<typeof URL.createObjectURL>((b) => ((blob = b as Blob), 'blob:x'))
    URL.revokeObjectURL = vi.fn<typeof URL.revokeObjectURL>()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadTsv('hello')

    expect(blob!.type).toBe('text/tab-separated-values')
    expect(await blob!.text()).toBe('hello')
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('anki-cards.txt')
    expect(click).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
  })
})
