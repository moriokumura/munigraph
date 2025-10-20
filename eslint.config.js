import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default [
  // JavaScriptの推奨設定
  js.configs.recommended,

  // 無視するファイル
  {
    ignores: ['dist/**', 'node_modules/**', '*.d.ts', 'vite.config.d.ts', '.eslintrc.cjs'],
  },

  // グローバル変数の設定
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  // TypeScriptファイル
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off', // TypeScriptのルールを優先
    },
  },

  // Vueファイル（推奨設定を展開）
  ...pluginVue.configs['flat/recommended'],

  // Vueファイルのカスタム設定
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/attributes-order': 'warn', // 警告のみ
      'no-unused-vars': 'off', // Vueの未使用変数は許容
    },
  },

  // Prettier設定（最後に配置）
  prettierConfig,
]
