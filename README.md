# RPG Battle System (Node.js + PostgreSQL)

## 概要
ターン制バトルシステムのバックエンドを実装したプロジェクトです。  
パーティ制・ボスフェーズ・スキル・属性相性などを考慮した戦闘ロジックを構築しています。

## 主な機能
- パーティ編成（1〜3人）
- ターン制バトル
- 属性相性によるダメージ補正
- スキルシステム（威力3:7計算）
- ボスフェーズ（HP50%で変化）
- 全体攻撃 / 単体攻撃
- 経験値・レベルアップ
- 戦闘履歴保存（battle_history）

## 技術スタック

### Backend
- Node.js
- Express
- PostgreSQL

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

## 設計のポイント
- トランザクション管理によるデータ整合性
- service / utils の責務分離
- 再利用可能なダメージ計算ロジック

## 画面構成

| 画面 | URL | 説明 |
|------|-----|------|
| ホーム | `/` | 各画面へのナビゲーション |
| パーティ編成 | `/party` | キャラクターの選択・保存（最大3人） |
| 戦闘準備 | `/battle-prep` | パーティと敵を選択して戦闘開始 |
| 戦闘 | `/battle?battleId=X` | ターン制バトル・リザルト表示 |

## 環境構築

### Backend

```bash
cd backend
npm install
cp .env.example .env   # 環境変数を設定
node src/index.js      # ポート3001で起動
```

### Database

```bash
psql -U <user> -d tower_of_doom -f backend/schema.sql
psql -U <user> -d tower_of_doom -f backend/seed.sql
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # ポート3000で起動
```

## 工夫した点
- ダメージ計算をユーティリティとして分離し再利用性を向上
- トランザクションを用いてデータ整合性を確保

## 今後の改善予定
- スキルシステムの実装
- 経験値・レベルアップ処理
- ユーザー認証
- UIデザインの実装