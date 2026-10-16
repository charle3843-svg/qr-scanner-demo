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
    redirectWithCode(decodedText);
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
