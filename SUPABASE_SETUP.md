# オンラインランキング設定

1. Supabaseでプロジェクトを作成します。
2. SQL Editorで `supabase-ranking.sql` の内容を実行します。
3. Project Settings の API 画面から Project URL と anon / publishable key を確認します。
4. `ranking-config.js` の `supabaseUrl` と `supabaseAnonKey` に設定します。

`service_role`キーやデータベースのパスワードは、ブラウザ側へ設定しないでください。

ランキングテーブルへの追加・名前変更は、入力値を検査するデータベース関数だけに許可しています。通常の匿名アクセスではランキングの閲覧のみ可能です。
