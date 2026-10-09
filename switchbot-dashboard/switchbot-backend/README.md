# SwitchBot Backend

## 管理者 API トークン

`/api/backup` と `/api/import` は管理者トークンによる Bearer 認証で保護されています。

- `ADMIN_API_TOKEN` が未設定の場合、両エンドポイントは `503 Admin API is not configured` を返します（fail-closed）。
- トークンは次のように生成してください: `openssl rand -hex 32`

### 本番環境（Fly.io）への設定

`switchbot-dashboard/` ディレクトリで、fly.toml のアプリに対して以下を実行します:

```sh
fly secrets set ADMIN_API_TOKEN=<生成したトークン>
```

### 利用例

```sh
curl -H "Authorization: Bearer $ADMIN_API_TOKEN" -o backup.db https://<app>.fly.dev/api/backup
```

`backup_database.sh` を実行する場合も、環境変数 `ADMIN_API_TOKEN` に同じトークンを設定してください。
