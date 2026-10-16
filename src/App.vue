<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  blank,
  downloadTsv,
  isEmpty,
  resolve,
  toAnkiTsv,
  withTrailingBlank,
  type Card,
} from '@/cards'

function load(): Card[] {
  try {
    const saved = JSON.parse(localStorage.getItem('anki-cards') ?? 'null')
    if (Array.isArray(saved)) return withTrailingBlank(saved)
  } catch {}
  return [blank()]
}

const rows = ref<Card[]>(load())
const deck = ref(localStorage.getItem('anki-deck') ?? '')
const notetype = ref(localStorage.getItem('anki-notetype') ?? '')

watch(
  rows,
  (value) => {
    const next = withTrailingBlank(value)
    if (next !== value) rows.value = next
    localStorage.setItem('anki-cards', JSON.stringify(rows.value))
  },
  { deep: true },
)
watch(deck, (v) => localStorage.setItem('anki-deck', v))
watch(notetype, (v) => localStorage.setItem('anki-notetype', v))

const canDownload = computed(() => rows.value.some((r) => r.front.trim()))

function editGenerated(row: Card, field: 'traditional' | 'pinyin', e: Event) {
  row[field] = (e.target as HTMLInputElement).value
}

function restoreIfBlank(row: Card, field: 'traditional' | 'pinyin') {
  if (!row[field]?.trim()) row[field] = null
}

function resetEdits(row: Card) {
  row.traditional = null
  row.pinyin = null
}

function remove(row: Card) {
  rows.value = rows.value.filter((r) => r !== row)
}

function clearAll() {
  if (confirm('Remove all cards?')) rows.value = [blank()]
}

function download() {
  downloadTsv(toAnkiTsv(rows.value, { deck: deck.value, notetype: notetype.value }))
}
</script>

<template>
  <main>
    <h1>Anki Chinese Flashcards</h1>
    <div class="settings">
      <label>Deck <input v-model="deck" placeholder="Chinese::HSK1" /></label>
      <label>Note type <input v-model="notetype" placeholder="Chinese" /></label>
    </div>

    <table>
      <thead>
        <tr>
          <th>Simplified (Front)</th>
          <th>English (Back)</th>
          <th>Example</th>
          <th>Example Translation</th>
          <th>Traditional</th>
          <th>Pinyin</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="row.id"
          :class="{ missing: !row.front.trim() && !isEmpty(row) }"
        >
          <td>
            <input v-model="row.front" aria-label="Simplified (Front)" @input="resetEdits(row)" />
          </td>
          <td><input v-model="row.back" aria-label="English (Back)" /></td>
          <td><input v-model="row.example" tabindex="-1" aria-label="Example" /></td>
          <td>
            <input
              v-model="row.exampleTranslation"
              tabindex="-1"
              aria-label="Example Translation"
            />
          </td>
          <td>
            <input
              :value="resolve(row).traditional"
              :class="row.traditional === null ? 'generated' : 'edited'"
              tabindex="-1"
              aria-label="Traditional"
              @input="editGenerated(row, 'traditional', $event)"
              @change="restoreIfBlank(row, 'traditional')"
            />
          </td>
          <td>
            <input
              :value="resolve(row).pinyin"
              :class="row.pinyin === null ? 'generated' : 'edited'"
              tabindex="-1"
              aria-label="Pinyin"
              @input="editGenerated(row, 'pinyin', $event)"
              @change="restoreIfBlank(row, 'pinyin')"
            />
          </td>
          <td>
            <button
              v-if="i < rows.length - 1"
              tabindex="-1"
              aria-label="Remove row"
              @click="remove(row)"
            >
              ✕
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="actions">
      <button :disabled="!canDownload" @click="download">Download for Anki</button>
      <button @click="clearAll">Clear all</button>
    </div>

    <ul class="hint">
      <li>
        Best used with this custom
        <a href="https://tgul.dev/articles/my-anki-template-for-chinese/">Anki note template</a>
        (that also features stroke order animations and audio).
      </li>
      <li>
        If using your own note template, it needs these fields, in this order: Front, Traditional,
        Back, Pinyin, Example, Example Translation.
      </li>
      <li>
        Deck and Note type must match the names in Anki exactly. If you leave one blank, you pick it
        in the import dialog.
      </li>
      <li>Rows without Simplified are skipped.</li>
      <li>
        In the Pinyin and Traditional cells, clearing a cell and leaving it restores the generated
        value.
      </li>
    </ul>

    <p class="hint">
      Built with <a href="https://github.com/nk2028/opencc-js">opencc-js</a> and
      <a href="https://github.com/zh-lx/pinyin-pro">pinyin-pro</a>.
    </p>

    <a
      class="github"
      href="https://github.com/tg2648/anki-chinese-flashcards"
      target="_blank"
      aria-label="GitHub repository"
    >
      <svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor" aria-hidden="true">
        <path
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
        />
      </svg>
    </a>
  </main>
</template>

<style>
:root {
  --bg: #f7f8fa;
  --surface: #fff;
  --border: #e3e6ea;
  --text: #1f2328;
  --muted: #6b7280;
  --accent: #2563eb;
  --accent-soft: #eff4ff;
  --warn: #fff7e0;
  --radius: 8px;
  color-scheme: light;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif;
  line-height: 1.5;
}
</style>

<style scoped>
main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
h1 {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0 0 1.5rem;
}
.settings {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.settings label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 16rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--muted);
}
input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.65rem;
  font: inherit;
  font-size: 1rem;
  color: inherit;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
input:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
th {
  padding: 0.6rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: left;
  color: var(--muted);
  border-bottom: 1px solid var(--border);
}
td {
  padding: 0.25rem;
  border-bottom: 1px solid var(--border);
}
tbody tr:last-child td {
  border-bottom: none;
}
td input {
  border-color: transparent;
  background: transparent;
}
td input:hover {
  border-color: var(--border);
}
td:first-child input {
  font-size: 1.15rem;
}
.generated {
  color: var(--muted);
  background: var(--bg);
}
.edited {
  font-style: italic;
}
.missing {
  background: var(--warn);
}
button {
  padding: 0.5rem 1rem;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s;
}
button:hover:not(:disabled) {
  background: var(--bg);
}
button:focus-visible {
  outline: 3px solid var(--accent-soft);
  border-color: var(--accent);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
td button {
  padding: 0.25rem 0.5rem;
  color: var(--muted);
  background: none;
  border: none;
}
td button:hover {
  color: #dc2626;
}
.actions {
  display: flex;
  gap: 0.75rem;
  margin: 1.5rem 0;
}
.actions button:first-child {
  color: #fff;
  background: var(--accent);
  border-color: var(--accent);
}
.actions button:first-child:hover:not(:disabled) {
  background: #1d4ed8;
}
.github {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  color: var(--muted);
}
.github:hover {
  color: var(--text);
}
.hint {
  padding-left: 1.1rem;
  font-size: 0.875rem;
  color: var(--muted);
}
</style>
