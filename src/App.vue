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
        Your Anki note type needs these fields, in this order: Front, Traditional, Back, Pinyin,
        Example, Example Translation.
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
.hint {
  padding-left: 1.1rem;
  font-size: 0.875rem;
  color: var(--muted);
}
</style>
