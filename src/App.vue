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
    <h1>Anki Chinese flashcards</h1>
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
  </main>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}
input {
  width: 100%;
  box-sizing: border-box;
  font-size: 1.1rem;
}
.settings,
.actions {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}
.edited {
  font-style: italic;
  color: #555;
}
.generated {
  background: #f0f4f8;
  color: #555;
}
.missing {
  background: #fff3cd;
}
.hint {
  font-size: 0.9rem;
  color: #555;
}
</style>
