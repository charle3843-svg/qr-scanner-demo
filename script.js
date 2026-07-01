const cameraSelect = document.getElementById("cameraSelect");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resultText = document.getElementById("resultText");
const historyList = document.getElementById("historyList");

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

let lastText = "";
let lastTime = 0;

async function populateCameras() {
  try {
    const devices = await Html5Qrcode.getCameras();
    cameraSelect.innerHTML = "";
    devices.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.id;
      option.textContent = device.label || device.id;
      cameraSelect.appendChild(option);
    });

    const backCamera = devices.find((d) => /back|rear|environment/i.test(d.label));
    if (backCamera) {
      cameraSelect.value = backCamera.id;
    } else if (devices.length > 0) {
      cameraSelect.value = devices[devices.length - 1].id;
    }
  } catch (err) {
    resultText.textContent = "カメラを取得できませんでした: " + err;
  }
}

function onScanSuccess(decodedText) {
  const now = Date.now();
  if (decodedText === lastText && now - lastTime < 2000) {
    return;
  }
  lastText = decodedText;
  lastTime = now;

  resultText.textContent = decodedText;

  if (navigator.vibrate) {
    navigator.vibrate(100);
  }

  const li = document.createElement("li");
  const time = document.createElement("span");
  time.className = "time";
  time.textContent = new Date().toLocaleTimeString();
  li.appendChild(time);
  li.appendChild(document.createTextNode(decodedText));
  historyList.prepend(li);
}

async function startScan() {
  const cameraId = cameraSelect.value;
  if (!cameraId) {
    resultText.textContent = "カメラが選択されていません";
    return;
  }

  startBtn.disabled = true;
  stopBtn.disabled = false;
  cameraSelect.disabled = true;

  try {
    await html5QrCode.start(
      cameraId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      () => {}
    );
  } catch (err) {
    resultText.textContent = "スキャン開始に失敗しました: " + err;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    cameraSelect.disabled = false;
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
  cameraSelect.disabled = false;
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

populateCameras();
