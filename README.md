# QR・バーコードリーダー

これは動作確認のために作ったサンプルです。

スマホのカメラでQRコードやバーコード(EAN, UPC, CODE128など)を読み取るWebアプリです。
HTML / CSS / JavaScript のみで作られており、[html5-qrcode](https://github.com/mebjas/html5-qrcode) ライブラリを使用しています。

## 使い方

1. GitHub Pagesで公開されたURLにスマホでアクセスする
2. カメラの使用を許可する
3. 「スキャン開始」を押し、QRコードやバーコードにカメラを向ける
4. 読み取った内容が画面に表示される
5. URLに `?returnUrl=呼び出し元のURL` を付けて開いた場合は、読み取り後に `呼び出し元のURL?code=読み取り結果` へ遷移する

## 呼び出し元のアプリと連携する

- `returnUrl` は URL エンコードして渡す。戻り先URLに自分のパラメータを含めてもよい（例：`returnUrl=https://example.github.io/app/?target=member` → `https://example.github.io/app/?target=member&code=M001` に戻る）
- 初めての戻り先では「〇〇に読み取り結果を送ります」と確認が出る。「送る」を押したホスト名は記憶され、次回からは確認なしで戻る
- `http:` / `https:` 以外の戻り先（`javascript:` など）には送らない
- 会員証などを自作する場合は、QRコードか CODE128 を推奨。EAN / JAN / UPC はチェックデジットが付くため、「1」「2」のような単純な番号をそのまま表せない

## 注意

カメラ(`getUserMedia`)はHTTPS環境またはlocalhostでのみ動作します。GitHub Pagesは自動的にHTTPSになるため、公開後は問題なく動作します。

