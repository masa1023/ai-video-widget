# AI Video Widget 仕様

## 概要

Preactベースのインタラクティブ動画ウィジェット。Shadow DOMでスタイル隔離。

## 主要機能

### UI状態

- **折りたたみ時**: サムネイル付き円形ボタン → クリックで展開・再生開始
- **展開時**: 動画プレイヤー + コントロール

### 動画再生

- ReactPlayer使用
- 再生/一時停止、ミュート切替、プログレスバー表示
- 字幕表示（時間ベース）

### ナビゲーション

- `navigationGraph`による分岐ナビゲーション
- 履歴スタックで「戻る」機能を実現
- 次の動画選択ボタン表示

### 外部リンク

- 詳細ボタン（`detailButton`）
- CTAボタン（`ctaButton`）

## 設定ファイル

- `video-config/`: 動画メタデータ（URL、タイトル、字幕、ボタン設定）
- `navigation-graph/`: ノード構造（videoId、nextNodeIds）

## 基本ユースケース

1. `pnpm build:widget` でウィジェットをビルド
2. ビルドファイルをCloudflareにアップロード
3. 任意のサイトにスクリプトタグで埋め込み → 動画プレイヤーが右下に自動表示

```html
<script src="https://your-cdn.com/video-widget.iife.js"></script>
```
