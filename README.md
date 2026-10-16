# Anki Chinese Flashcards

Type Chinese words, get Traditional characters and pinyin filled in, and download a file Anki can import. Runs fully in the browser; cards are saved in `localStorage`.

Your Anki note type needs these fields, in this order: Front, Traditional, Back, Pinyin, Example, Example Translation. Front contains simplified characters, and Back contains English translations.

## Development

```sh
npm install
npm run dev        # dev server
npx vitest run     # tests
npm run build      # type-check and build
```

## Credits

- [opencc-js](https://github.com/nk2028/opencc-js) for Simplified to Traditional conversion
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro) for pinyin
