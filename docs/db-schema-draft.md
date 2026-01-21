## パフォーマンス計測用ログ関連の仕様

- スロットの定義：管理画面で複数のスロットを作成可能。そこに動画やCTAボタン、詳細ボタンの設定を紐づけることができる。スロット同士を紐づけることで動画の分岐ナビゲーションも実現可能。
- セッション定義
  - ウィジェット立ち上げのタイミングでセッション発生
  - 有効期間：540日
  - ユーザーを一意に特定する乱数(uuid)を生成する
- 動画関連イベントはどのスロットで再生されたかも一緒に取得
- 全てのイベントにセッションIDを紐づける
- ウィジェット立ち上げイベント
  - 立ち上げの定義：ウィジェットのクリック
  - 追加情報：referrer (ウィジェットを立ち上げたページのURL)
  - UU = ユニークセッションとし、UU単位で計測できるようにする
- 動画再生
  - 再生数定義：動画の読み込みが完了して再生が始まったタイミング
  - 動画ID単位で計測
- 動画再生x％
  - 動画ID単位で動画再生時から25%/50%/75%/100%通過時を計測
- 動画再生時間（秒）
  - 動画ID単位での動画再生秒数
- CVイベント
  - 定義
    - 直近の動画再生が30日以内かつCV条件達成（CV条件は特定のページへの遷移がメイン）
- 動画内のCTAボタンと詳細はこちらボタンのクリックイベント
  - 動画ID×スロット情報も一緒に

## DB設計

### sessions

セッション定義：同一ブラウザ内で30分

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### videos

```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    detail_url TEXT NOT NULL,
    cta_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### event_widget_open

```sql
# Widgetクリックのタイミングで生成
CREATE TABLE event_widget_open (
    id UUID PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id),
    referrer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### event_video_play

```sql
CREATE TABLE event_video_play (
    id UUID PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id),
    video_id INTEGER REFERENCES videos(id),
    play_percent FLOAT,     -- x%
    played_seconds FLOAT,     -- 実際再生時間
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### event_click

```sql
CREATE TABLE event_click (
    id UUID PRIMARY KEY,
		session_id INTEGER REFERENCES sessions(id),
    target TEXT, -- "CTA1", "詳細はこちら", "設問A" などクリック対象
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### event_conversions

```sql
CREATE TABLE event_conversions (
    id UUID PRIMARY KEY,
		session_id INTEGER REFERENCES sessions(id),
    conversion_type TEXT, -- 例: "purchase","signup"
    // value FLOAT
    // raw_properties JSONB -- 追加情報/メタデータ
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
