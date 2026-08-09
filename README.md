# 株式会社電総 コーポレートサイト

電気設備工事会社のコーポレートサイト。静的HTML/CSS/JSで構築。
コンテンツ構成は `docs/contents.md`、デザイン仕様は `docs/design.md` に準拠。

## 構成

```
/                     トップページ
├ /service/           サービス・事業内容
│  └ /service/work/   仕事の内容（施工の流れ・作業詳細）
├ /works/             施工事例（現在は「対応可能な工事内容」として構成）
├ /price/             料金・費用の目安（B2C向け）
├ /area/              対応エリア
├ /company/           会社概要・代表者メッセージ
├ /recruit/           求人・採用情報
└ /contact/           お問い合わせ
assets/
├ css/style.css       デザイントークン・全スタイル
├ js/main.js          ハンバーガー / 絞り込み / フォーム分岐 / 写真添付
└ img/                プレースホルダー画像（実写真に差し替え予定）
```

ビルド不要。任意の静的サーバーで配信できます（例：`python3 -m http.server`）。

## ヒーローの切り替え（design.md §5）

`index.html` の `<section class="hero" data-hero="split">` の属性1つで切り替え：

- `data-hero="split"` … B案・分割型（**現在の初期値**。写真の掲載許可が未確定のため）
- `data-hero="photo"` … A案・人物写真の全面型（許可が取れたら切り替え）

## 未確定のため非表示・保留にしている項目（contents.md 4章）

design.md の方針「未確定の情報をプレースホルダで出さない」に従い、以下は確定後に追加する。

| 項目 | 現在の対応 | 確定後にやること |
| --- | --- | --- |
| 電話番号 | 仮番号 `000-0000-0000` | 全ページ一括置換（`tel:` リンク含む）。受付時間 8:00-19:00 も仮 |
| 社名 | 「株式会社電総」で確定。ロゴ画像も設置済み（`logo.png`/`logo.webp`、白背景を透過処理） | — |
| 電気工事業登録番号 | 証拠バー・会社概要とも**非表示**（証拠バーは3カラム構成） | 証拠バーに4カラム目を追加、会社概要に行を追加 |
| 電気工事士の種別 | 「電気工事士」とだけ表記 | 第一種／第二種を明記 |
| 会社所在地・設立年月・代表者名 | 会社概要の行ごと非表示 | 表に行を追加。LocalBusiness 構造化データにも address を追加 |
| 建設業許可・加入保険 | 行ごと非表示 | 確認でき次第追加 |
| 施工写真 | ヒーロー・施工事例とも実写真（最適化版は `assets/img/works/`、原本は `assets/img/Webサイト_株式会社電総/`）。メーター番号・建物銘板・車両ナンバーは単色マスク済み（design.md §8）。代表者写真のみプレースホルダー | 代表者写真の差し替え |
| 料金（エアコン取付の金額） | 金額は出さず「お見積りでご案内」 | 確定金額を /price/ の表に記載 |
| 給与レンジ・勤務時間・休日 | 採用ページで「整備中・面談時に説明」と明示（カードは非表示） | カード3枚で大きく掲載し、JobPosting 構造化データを追加 |
| お客様の声 /voice/ | **0件のためページ・導線ごと非公開** | 声が集まり次第ページを作成しナビに追加 |
| フォーム送信先 | バックエンド未接続（`action="#"`） | フォーム送信サービスまたはサーバー側の実装に接続 |

## 品質チェックリスト（design.md §9）の状態

- 縦書きヒーロー（`writing-mode: vertical-rl`・漢数字・`<br>`相当の列分割）実装済み
- `data-hero` 属性でA案/B案切替可能
- 証拠バーは3カラム均等割り・空セルなし（モバイルは縦積み）
- 電話番号はすべて `<a href="tel:">`
- フォーカスリング `outline: 2px solid var(--copper)` 全リンク・ボタンに適用
- `prefers-reduced-motion: reduce` で通電アニメーション無効化
- 会社概要に LocalBusiness 構造化データ（areaServed 1都4県）
- JobPosting 構造化データは給与レンジ確定後に追加（未実装・仕様どおり）
- フォームは全入力に `<label>` を紐づけ

## 独自ドメイン取得時にやること

canonical / OGP / sitemap / robots / 構造化データ / 404 のURLはすべて
`https://dendojapan22.github.io/KabusikigaisyaDensou_Web/` を前提にしている。
独自ドメインに移行するときは以下を一括で差し替えること。

- 全ページの `<link rel="canonical">` と `og:url` / `og:image`
- `sitemap.xml` / `robots.txt` の URL
- `index.html` / `company/index.html` の JSON-LD 内 `url` / `image`
- `404.html` 内の絶対パス（`/KabusikigaisyaDensou_Web/` → `/`）
