# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.


## Localization

This project supports multiple languages:
- English (en-US)
- Vietnamese (vi-VN) - Default
- Portuguese (pt-PT)
- Japanese (ja-JP)
- Chinese (zh-CN) - Available but hidden in options

### Adding a new language
1. Create a new locale file in `src/locales/`.
2. Import it in `src/utils/i18n.ts`.
3. Add to `SUPPORTED_LANGUAGES` and `LANGUAGE_OPTIONS` in `src/utils/i18n.ts`.
4. Update `TermsOfService/index.vue` to include the translated TOS document.

