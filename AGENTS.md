# アプリケーションの概要

- 日本の自治体の廃置分合について学べるリファレンス兼クイズアプリ
- Webブラウザのクライアントサイドのみで完結し、ユーザー認証などは行わない

## システム構成

- Vue 3
- TypeScypt
- Vite
- Pinia
- Tailwind CSS
- 本番の環境とデプロイ手順は `.github/workflows/deploy.yml` を参照

## 実装時の手順

- コードを追加・変更したときは対応するtestファイルを修正し、なければ追加する
- testファイルは実装ファイルと同じディレクトリに、Vitestは `.unit.test.ts` 、Playwrightは `.e2e.test.ts` の拡張子で作成する
- **重要** 実装後、`npm run test` を実行し、通過すること
- **重要** 実装後、`npm run lint` を実行し、通過すること

## コミット

- コミットコメントは Conventional Commit 形式で、日本語一行で記述
