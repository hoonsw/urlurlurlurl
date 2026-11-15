const ERROR_MESSAGE = "URL을 확인해 주세요.";

const form = document.querySelector("[data-form]");
const input = document.querySelector("[data-input]");
const submitButton = document.querySelector("[data-submit]");
const message = document.querySelector("[data-message]");
const result = document.querySelector("[data-result]");
const resultUrl = document.querySelector("[data-result-url]");
const copyButton = document.querySelector("[data-copy]");
const manualCopy = document.querySelector("[data-manual-copy]");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  setMessage("");
  hideResult();
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/extend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: input.value })
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(data.error || ERROR_MESSAGE);
    }

    showResult(data.url);
  } catch (error) {
    setMessage(error.message || ERROR_MESSAGE);
  } finally {
    submitButton.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  const url = resultUrl.href;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      showCopied();
      return;
    } catch {
      // A browser may reject the clipboard permission even on HTTPS.
    }
  }

  manualCopy.hidden = false;
  manualCopy.value = url;
  manualCopy.focus();
  manualCopy.select();
  manualCopy.setSelectionRange(0, url.length);
  try {
    if (document.execCommand("copy")) {
      copyButton.focus();
      showCopied();
      return;
    }
  } catch {
    // Keep the selected, read-only address available for manual copying.
  }
  copyButton.textContent = "복사";
  setMessage("주소가 선택되었습니다. 기기의 복사 메뉴를 사용하세요.");
});

function showCopied() {
  manualCopy.hidden = true;
  setMessage("주소를 복사했습니다.");
  copyButton.textContent = "복사됨";
  window.setTimeout(() => {
    copyButton.textContent = "복사";
  }, 1200);
}

function showResult(url) {
  resultUrl.href = url;
  resultUrl.textContent = url;
  result.hidden = false;
}

function hideResult() {
  result.hidden = true;
  manualCopy.hidden = true;
  manualCopy.value = "";
  resultUrl.removeAttribute("href");
  resultUrl.textContent = "";
}

function setMessage(text) {
  message.textContent = text;
}
