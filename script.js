const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resultText = document.getElementById("resultText");
const redirectMsg = document.getElementById("redirectMsg");

const confirmBox = document.getElementById("confirmBox");
const confirmMsg = document.getElementById("confirmMsg");
const sendBtn = document.getElementById("sendBtn");
const cancelBtn = document.getElementById("cancelBtn");

const params = new URLSearchParams(window.location.search);
const returnUrl = params.get("returnUrl");

const ALLOWED_HOSTS_KEY = "qrScannerAllowedHosts";

// http/https 以外（javascript: や data: など）は拒否する
function parseReturnUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch (err) {
    return null;
  }
}

function loadAllowedHosts() {
  try {
    return JSON.parse(localStorage.getItem(ALLOWED_HOSTS_KEY)) || [];
  } catch (err) {
    return [];
  }
}

function rememberHost(host) {
  try {
    const hosts = loadAllowedHosts();
    if (!hosts.includes(host)) {
      localStorage.setItem(ALLOWED_HOSTS_KEY, JSON.stringify([...hosts, host]));
    }
  } catch (err) {
    // 保存できなくても送信は続ける（次回また確認が出るだけ）
  }
}

function redirectWithCode(decodedText) {
  const url = parseReturnUrl(returnUrl);
  if (!url) {
    redirectMsg.textContent = "戻り先のURLが正しくないため、結果を送れません";
    redirectMsg.style.display = "block";
    return;
  }

  url.searchParams.set("code", decodedText);

  const go = () => {
    redirectMsg.textContent = "呼び出し元のアプリに戻ります...";
    redirectMsg.style.display = "block";
    setTimeout(() => {
      location.href = url.href;
    }, 1000);
  };

  // 初めての行き先だけ確認し、許可したホスト名を記憶する
  if (loadAllowedHosts().includes(url.host)) {
    go();
    return;
  }

  confirmMsg.textContent = `「${url.host}」に読み取り結果を送ります。よろしいですか？`;
  confirmBox.hidden = false;
  sendBtn.onclick = () => {
    confirmBox.hidden = true;
    rememberHost(url.host);
    go();
  };
  cancelBtn.onclick = () => {
    confirmBox.hidden = true;
  };
}

const video = document.getElementById("video");

const FORMATS = ["QRCode", "EAN-13", "EAN-8", "UPC-A", "UPC-E", "Code39", "Code128", "ITF"];

let stream = null;
let scanning = false;

function onScanSuccess(decodedText) {
  resultText.textContent = decodedText;

  if (navigator.vibrate) {
    navigator.vibrate(100);
  }

  stopScan();

  if (returnUrl) {
    redirectWithCode(decodedText);
  }
}

async function scanLoop() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  while (scanning) {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w && h) {
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const results = await ZXingWASM.readBarcodes(ctx.getImageData(0, 0, w, h), {
        formats: FORMATS,
        tryHarder: true,
        maxNumberOfSymbols: 1,
      });
      const hit = results.find((r) => r.isValid);
      if (hit && scanning) {
        onScanSuccess(hit.text);
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function startScan() {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    scanning = true;
    scanLoop();
  } catch (err) {
    resultText.textContent = "スキャン開始に失敗しました: " + err;
    stopScan();
  }
}

function stopScan() {
  scanning = false;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.srcObject = null;
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);
