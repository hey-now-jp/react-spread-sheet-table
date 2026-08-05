## MODIFIED Requirements

### Requirement: Paste Data

クリップボードのTSV形式データをアクティブセルから原子的にペーストできなければならない（MUST）。

ペーストは候補となる全セルを検証した後、一操作として全体を確定または拒否しなければならない（MUST）。

#### Scenario: Paste with Ctrl+V

- **WHEN** アクティブセルがある状態でCtrl+V（Mac: Cmd+V）を押す
- **THEN** クリップボードのTSVデータがアクティブセルを起点にペーストされる
- **AND** 影響を受けた全行が一回の`onChange`で通知される

#### Scenario: Reject invalid paste atomically

- **WHEN** ペースト候補のいずれかが列の型、組み込み制約、カスタム検証に違反する
- **THEN** ペースト候補は一つもテーブルへ反映されない
- **AND** 検証エラーが表示される
- **AND** `onChange`は通知されない

#### Scenario: Paste skips read-only cells

- **WHEN** ペースト先に`readOnly`セルが含まれる
- **THEN** そのセルは候補から除外され、他のセルが検証される

#### Scenario: Paste skips action columns

- **WHEN** ペースト先にアクション列が含まれる
- **THEN** アクション列は候補から除外される
