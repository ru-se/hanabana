# はなびん（Hanabin）

「小さな幸せを書くと、花が咲く」日記アプリ。  
Vite + React + TypeScript + Canvas、永続化はSupabase（未設定ならlocalStorageに自動フォールバック）。  
感情解析は `/api/detect-mood`（Claude APIが未設定でもヒューリスティックで動きます）。

## まずあなたがやること（最短）

### 1) 起動して動作確認

```bash
npm install
npm run dev
```

- Web: `http://localhost:5173/`
- API: `http://localhost:5174/`（Viteが`/api`をプロキシ）

### 2) （推奨）Supabaseを有効化して「リロードしても残る」を本番仕様にする

- Supabaseで新規Project作成
- SQL Editorで `supabase/schema.sql` を実行（`memories`テーブル作成）
- `.env` を作成して以下を埋める（例は `.env.example`）

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

※ 今は認証なしのため、`user_id`は `device_id`（localStorageのUUID）を入れています。

### 3) （任意）Claude感情解析を有効化

```bash
ANTHROPIC_API_KEY=...
CLAUDE_MODEL=claude-3-5-sonnet-latest
```

未設定でも動きます（サーバ側でヒューリスティックにフォールバック）。

## デプロイ（おすすめ：Render でフロント+APIを1つに）

このリポジトリは **Expressが`dist/`を配信** するので、Render/Fly/RailwayのようなNode常駐サーバが最短です。

### Render（Web Service）

1. GitHubにpush
2. Renderで「New +」→「Web Service」→ 対象リポジトリを選択
3. 設定
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. 環境変数
   - `ANTHROPIC_API_KEY`（任意）
   - `CLAUDE_MODEL`（任意）
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`（任意）
   - `PORT`（Renderが自動で注入するので通常不要）

## ローカルで本番相当（build → start）

```bash
npm run build
npm run start
```

## プロトタイプ

- `prototype/hanabana3.html` に元のプロトタイプを残しています。
