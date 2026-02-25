## ADDED Requirements

### Requirement: Copy Selection

選択範囲をTSV形式でクリップボードにコピーできなければならない（MUST）。

#### Scenario: Copy with Ctrl+C
- **WHEN** 範囲が選択された状態でCtrl+C（Mac: Cmd+C）を押す
- **THEN** 選択範囲のデータがTSV形式でクリップボードにコピーされる

#### Scenario: Single cell copy
- **WHEN** アクティブセルのみ（範囲選択なし）でCtrl+Cを押す
- **THEN** アクティブセルの値がクリップボードにコピーされる

#### Scenario: Action column excluded from copy
- **WHEN** 選択範囲にアクション列が含まれる
- **THEN** アクション列のデータはコピーに含まれない

### Requirement: Paste Data

クリップボードのTSV形式データをアクティブセルからペーストできなければならない（MUST）。

#### Scenario: Paste with Ctrl+V
- **WHEN** アクティブセルがある状態でCtrl+V（Mac: Cmd+V）を押す
- **THEN** クリップボードのTSVデータがアクティブセルを起点にペーストされる
- **AND** 影響を受けた全行が `onChange` で通知される

#### Scenario: Paste respects column types
- **WHEN** ペーストされたデータが列の型と一致しない
- **THEN** バリデーションエラーが発生する
- **AND** 値はペーストされるがエラー状態で表示される

#### Scenario: Paste skips read-only cells
- **WHEN** ペースト先に `readOnly` セルが含まれる
- **THEN** そのセルはスキップされ、他のセルにはペーストされる

#### Scenario: Paste skips action columns
- **WHEN** ペースト先にアクション列が含まれる
- **THEN** アクション列はスキップされる

### Requirement: Cut Selection

Ctrl+X でカットできなければならない（MUST）。

#### Scenario: Cut with Ctrl+X
- **WHEN** 範囲が選択された状態でCtrl+X（Mac: Cmd+X）を押す
- **THEN** 選択範囲のデータがクリップボードにコピーされる
- **AND** 選択範囲のセルがクリアされる
- **AND** `onChange` で変更が通知される

### Requirement: Excel Compatibility

Excel / Google Sheetsとのコピー&ペースト互換性を維持しなければならない（MUST）。

#### Scenario: Paste from Excel
- **WHEN** Excelからコピーしたデータをペーストする
- **THEN** TSV形式として正しく解析されセルに反映される

#### Scenario: Copy to Excel
- **WHEN** テーブルからコピーしたデータをExcelにペーストする
- **THEN** Excelのセルに正しく反映される
