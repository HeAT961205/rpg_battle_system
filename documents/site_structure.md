# Site Structure & Navigation Flow

## Page List

| Page | URL | File |
|------|-----|------|
| Home | `/` | `frontend/app/page.tsx` |
| Party Management | `/party` | `frontend/app/party/page.tsx` |
| Battle Preparation | `/battle-prep` | `frontend/app/battle-prep/page.tsx` |
| Battle | `/battle?battleId=X` | `frontend/app/battle/page.tsx` |

---

## Navigation Flow

```
[ Home / ]
    │
    ├─── パーティ編成ボタン ──→ [ /party ]
    │                               │
    │                               │ 保存する → パーティ更新（POST /party）
    │                               │
    │                               └── ← ホームに戻る ──→ [ / ]
    │
    └─── 戦闘準備ボタン ────→ [ /battle-prep ]
                                    │
                                    │ 戦闘開始ボタン
                                    │   1. POST /party（パーティ更新）
                                    │   2. POST /battle/start（バトル作成）
                                    │   3. battleId を受け取りリダイレクト
                                    │
                                    ├──────────────────→ [ /battle?battleId=X ]
                                    │                           │
                                    │                           │ 攻撃ボタン
                                    │                           │   POST /battle/action
                                    │                           │   → HP更新・ログ追加
                                    │                           │   → バトル終了時: GET /battle/:id/result
                                    │                           │
                                    │                           │ リザルトポップアップ（VICTORY / DEFEAT）
                                    │                           │   ホームに戻るボタン
                                    │                           │
                                    │                           └──────────────→ [ / ]
                                    │
                                    └── ← ホームに戻る ──→ [ / ]
```

---

## Page Details

### `/` — Home

- タイトル「TOWER OF DOOM」を表示
- 「パーティ編成」ボタン → `/party`
- 「戦闘準備」ボタン → `/battle-prep`

---

### `/party` — Party Management

**初期表示:**
- `GET /characters` — 全キャラクター一覧を取得
- `GET /party` — 現在保存されているパーティを取得し、選択済みとして表示

**操作:**
- キャラクターカードをクリックして選択/解除（最大3人）
- 選択順に番号（1〜3）が表示される
- 「保存する」ボタン → `POST /party` でパーティを更新

**遷移:**
- 「← ホームに戻る」→ `/`

---

### `/battle-prep` — Battle Preparation

**初期表示:**
- `GET /characters` — キャラクター一覧
- `GET /party` — 現在のパーティを選択済み状態で表示
- `GET /enemies` — 対戦相手の敵一覧

**操作:**
- パーティメンバーを選択（最大3人）
- 対戦相手の敵を1体選択
- 「戦闘開始」ボタン:
  1. `POST /party` — パーティを保存
  2. `POST /battle/start` — バトルセッション作成（`{ partyId: 1, enemyId }` を送信）
  3. 返却された `battleId` を使い `/battle?battleId=X` へ遷移

**遷移:**
- 「← ホームに戻る」→ `/`
- 戦闘開始成功 → `/battle?battleId=X`

---

### `/battle?battleId=X` — Battle

**URLパラメータ:** `battleId`（数値）— どのバトルセッションを操作するかを識別

**初期表示:**
- `GET /battle/:battleId` — バトルの現在状態（パーティHP・敵HP）を取得

**操作:**
- 「攻撃」ボタン → `POST /battle/action`
  - レスポンスでHPバーを更新
  - ログエリアにターン経過を追加表示
  - `isBattleEnd: true` の場合 → `GET /battle/:battleId/result` を呼び出し

**リザルトポップアップ（バトル終了時）:**
- VICTORY（勝利）または DEFEAT（敗北）を表示
- 獲得EXPを表示
- 「ホームに戻る」→ `/`

---

## API Calls Per Page

| Page | API Calls |
|------|-----------|
| `/party` | `GET /characters`, `GET /party`, `POST /party` |
| `/battle-prep` | `GET /characters`, `GET /party`, `GET /enemies`, `POST /party`, `POST /battle/start` |
| `/battle` | `GET /battle/:id`, `POST /battle/action`, `GET /battle/:id/result` |
