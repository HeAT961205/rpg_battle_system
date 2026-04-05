# Tower of Doom — ターン制RPGバトルシステム

## 概要

ブラウザで遊べるターン制RPGゲーム。
バックエンドはExpress.js + PostgreSQL、フロントエンドはNext.js + Tailwind CSSで構築。
パーティ編成・属性相性・スキル・ボスフェーズなどを備えた戦闘システムを実装済み。

## 主な機能（実装済み）

- **ホーム画面** — タイトル + 各ページへのナビゲーション
- **キャラクターリスト** — 全キャラクター一覧表示（詳細パネル・スキルスロット・ステータス）
- **パーティ編成** — 最大5パーティ × 3メンバー、キャラ選択モーダル、パーティ名編集
- **戦闘準備（敵選択）** — 敵カルーセル表示、フレーバーテキスト、Floor選択（1〜30）
- **戦闘準備（パーティ選択）** — パーティ確認・Floor別ステータスプレビュー
- **ターン制バトル** — メンバーごとのスキル/通常攻撃選択、ターンログ、勝敗リザルト
- **属性相性** — fire / water / wood の三すくみ（有利1.2x / 不利0.8x）
- **ボスフェーズ** — HP50%以下でPhase 2移行（AOE攻撃30%確率）
- **敵レベルスケール** — Floorに応じてHP/ATKが1.1倍ずつ増加
- **レベルリセット** — `base_hp/base_attack/base_defense/base_sp` を使って初期値に戻す
- **SP（スキルポイント）** — DB実装済み、戦闘での消費ロジックは未実装

## 技術スタック

| 項目 | 内容 |
|------|------|
| バックエンド | Node.js / Express.js |
| データベース | PostgreSQL |
| フロントエンド | Next.js 15 / React 19 / TypeScript |
| スタイリング | Tailwind CSS |

## 画面構成・ページフロー

```
ホーム (/)
├── キャラクターリスト (/character-list)
├── パーティ編成 (/party)
└── 戦闘準備 (/battle-prep)
    └── パーティ選択 (/battle-prep/party?enemyId=X&floor=Y)
        └── 戦闘 (/battle?battleId=X)
```

| 画面 | URL | 説明 |
|------|-----|------|
| ホーム | `/` | タイトル・ナビゲーション |
| キャラクターリスト | `/character-list` | キャラ一覧グリッド・詳細・スキルスロット |
| パーティ編成 | `/party` | 5パーティ編成、メンバー選択モーダル、名前編集 |
| 敵選択 | `/battle-prep` | 敵カルーセル、Floor選択 |
| パーティ選択 | `/battle-prep/party` | パーティ確認、戦闘開始 |
| 戦闘 | `/battle?battleId=X` | ターン制バトル・ログ・リザルト |

## API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/characters` | キャラクター一覧 |
| GET | `/enemies` | 敵一覧 |
| GET | `/party` | 全5パーティ + メンバー取得 |
| POST | `/party` | パーティ更新（メンバー・名前） |
| GET | `/skills` | スキル一覧 |
| GET | `/skills/character/:id` | キャラ別スキル取得 |
| POST | `/battle/start` | バトルセッション開始 |
| POST | `/battle/action` | ターン実行 |
| GET | `/battle/:id` | バトル状態取得 |
| GET | `/battle/:id/result` | バトル結果取得 |
| POST | `/characters/:id/reset` | レベルリセット |

## 環境構築

### 前提条件

- Node.js 18+
- PostgreSQL（`tower_of_doom` データベースを作成済みであること）

### バックエンド

```bash
cd backend
npm install
cp .env.example .env   # DB接続情報を設定（user: Heat, host: localhost, port: 5432）
psql -U Heat -d tower_of_doom -f schema.sql
psql -U Heat -d tower_of_doom -f seed.sql
node src/index.js      # ポート3001で起動
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev   # ポート3000で起動
```

## 今後の実装予定

- [ ] スキルデータの追加（`skills` / `character_skills` テーブルが現在空）
- [ ] SP消費ロジックの実装（スキル使用時にSPを消費）
- [ ] 経験値・レベルアップ処理（`applyExpWithClient` が未実装 — 勝利時エラー）
- [ ] ユーザー認証（現在はuser_id=1固定）
- [ ] ボスデータの追加（全敵の `is_boss = false` 状態）
- [ ] i18n（日本語 / 英語対応）
- [ ] セキュリティ仕上げ → 公開
