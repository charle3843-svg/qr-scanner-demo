const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resultText = document.getElementById("resultText");
const redirectMsg = document.getElementById("redirectMsg");

const returnUrl = new URLSearchParams(window.location.search).get("returnUrl");

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

function onScanSuccess(decodedText) {
  resultText.textContent = decodedText;

  if (navigator.vibrate) {
    navigator.vibrate(100);
  }

  stopScan();

  if (returnUrl) {
    redirectMsg.style.display = "block";
    setTimeout(() => {
      location.href = `${returnUrl}?code=${encodeURIComponent(decodedText)}`;
    }, 1000);
  }
}

async function startScan() {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      () => {}
    );
  } catch (err) {
    resultText.textContent = "スキャン開始に失敗しました: " + err;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

async function stopScan() {
  try {
    await html5QrCode.stop();
  } catch (err) {
    // already stopped
  }
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);
