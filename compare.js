// 読み取りエンジン比較用（本番の script.js には影響しない）
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resultText = document.getElementById("resultText");
const logBody = document.querySelector("#log tbody");
const video = document.getElementById("video");

document.getElementById("env").textContent =
  navigator.userAgent + " / BarcodeDetector: " + ("BarcodeDetector" in window ? "あり" : "なし");

// 本番と同じ設定
const html5QrCode = new Html5Qrcode("reader", {
  formatsToSupport: [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.ITF,
  ],
  verbose: false,
});

const WASM_FORMATS = ["QRCode", "EAN-13", "EAN-8", "UPC-A", "UPC-E", "Code39", "Code128", "ITF"];

let engine = null;
let startedAt = 0;
let stream = null;
let running = false;

function selectedEngine() {
  return document.querySelector('input[name="engine"]:checked').value;
}

function record(name, format, text) {
  const sec = ((performance.now() - startedAt) / 1000).toFixed(2);
  resultText.textContent = `${text}（${sec}秒）`;
  const tr = document.createElement("tr");
  for (const v of [name, sec, format, text]) {
    const td = document.createElement("td");
    td.textContent = v;
    tr.appendChild(td);
  }
  logBody.prepend(tr);
  if (navigator.vibrate) navigator.vibrate(100);
  stopScan();
}

async function startHtml5() {
  await html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (text, result) => record("現行", result?.result?.format?.formatName ?? "", text),
    () => {}
  );
}

async function startWasm() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = stream;
  video.style.display = "block";
  await video.play();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  running = true;

  const loop = async () => {
    if (!running) return;
    const w = video.videoWidth, h = video.videoHeight;
    if (w && h) {
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const results = await ZXingWASM.readBarcodes(ctx.getImageData(0, 0, w, h), {
        formats: WASM_FORMATS,
        tryHarder: true,
        maxNumberOfSymbols: 1,
      });
      const hit = results.find((r) => r.isValid);
      if (hit && running) {
        record("zxing-wasm", hit.format, hit.text);
        return;
      }
    }
    setTimeout(loop, 100);
  };
  loop();
}

async function startScan() {
  startBtn.disabled = true;
  stopBtn.disabled = false;
  engine = selectedEngine();
  resultText.textContent = "スキャン中...";
  try {
    if (engine === "html5") await startHtml5();
    else await startWasm();
    startedAt = performance.now(); // カメラ起動後から計測
  } catch (err) {
    resultText.textContent = "スキャン開始に失敗しました: " + err;
    stopScan();
  }
}

async function stopScan() {
  running = false;
  if (engine === "html5") {
    try { await html5QrCode.stop(); } catch (err) { /* already stopped */ }
  }
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.style.display = "none";
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);
