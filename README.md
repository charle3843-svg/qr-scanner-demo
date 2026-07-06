# QR・バーコードリーダー

これは動作確認のために作ったサンプルです。

スマホのカメラでQRコードやバーコード(EAN, UPC, CODE128など)を読み取るWebアプリです。
HTML / CSS / JavaScript のみで作られており、[html5-qrcode](https://github.com/mebjas/html5-qrcode) ライブラリを使用しています。

## 使い方

1. GitHub Pagesで公開されたURLにスマホでアクセスする
2. カメラの使用を許可する
3. 「スキャン開始」を押し、QRコードやバーコードにカメラを向ける
4. 読み取った内容が画面に表示される
5. URLに `?returnUrl=呼び出し元のURL` を付けて開いた場合は、読み取り後に `呼び出し元のURL?code=読み取り結果` へ自動的に遷移する

## 注意

カメラ(`getUserMedia`)はHTTPS環境またはlocalhostでのみ動作します。GitHub Pagesは自動的にHTTPSになるため、公開後は問題なく動作します。

