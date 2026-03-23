# RPG Battle System API Specification

## 1. 概要

本APIはターン制バトルシステムのバックエンドを提供する。
フロントエンドは本APIを通じてパーティ編成、戦闘進行、リザルト取得を行う。

---

## 2. ベースURL

```
http://localhost:3001
```

---

## 3. 共通仕様

### レスポンス形式

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

### エラーレスポンス

```json
{
  "success": false,
  "data": null,
  "error": "Error message"
}
```

---

## 4. パーティ関連API

### 4.1 パーティ取得

```
GET /party
```

#### レスポンス

```json
{
  "members": [
    {
      "id": 1,
      "name": "Hero",
      "hp": 100,
      "attack": 20,
      "defense": 10
    }
  ]
}
```

---

### 4.2 パーティ更新

```
POST /party
```

#### リクエスト

```json
{
  "members": [1, 2, 3]
}
```

#### レスポンス

```json
{
  "message": "Party updated"
}
```

---

## 5. バトル関連API

### 5.1 バトル開始

```
POST /battle/start
```

#### リクエスト

```json
{
  "partyId": 1,
  "enemyId": 2
}
```

#### レスポンス

```json
{
  "battleId": 10,
  "party": [...],
  "enemy": {
    "id": 2,
    "name": "Slime",
    "hp": 150
  }
}
```

---

### 5.2 行動（攻撃 / スキル）

```
POST /battle/action
```

#### リクエスト

```json
{
  "battleId": 10,
  "characterId": 1,
  "action": "attack",
  "skillId": null
}
```

#### レスポンス

```json
{
  "damage": 50,
  "enemyHp": 100,
  "playerHp": 90,
  "isEnemyDefeated": false,
  "isBattleEnd": false,
  "logs": [
    "Hero attacks Slime",
    "Slime takes 50 damage"
  ]
}
```

---

### 5.3 バトル状態取得

```
GET /battle/:battleId
```

#### レスポンス

```json
{
  "battleId": 10,
  "party": [...],
  "enemy": {...},
  "turn": 3
}
```

---

## 6. リザルト関連API

### 6.1 リザルト取得

```
GET /battle/:battleId/result
```

#### レスポンス

```json
{
  "result": "win",
  "expGained": 100,
  "levelUp": true,
  "newStats": {
    "hp": 105,
    "attack": 23,
    "defense": 13
  }
}
```

---

## 7. 設計方針

* battleId により戦闘状態を一意に管理
* action フィールドで行動を統一（attack / skill）
* フロントとバックを疎結合にするため、画面単位ではなく状態単位でAPI設計
* 再読み込み対応のため状態取得APIを用意

---

## 8. 今後の拡張予定

* 全体攻撃（AOE）対応
* スキル効果（バフ / デバフ）
* ターンログの永続化
* PvP対応

---
