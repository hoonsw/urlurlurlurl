const ERROR_MESSAGE = "URL을 확인해 주세요.";

const form = document.querySelector("[data-form]");
const input = document.querySelector("[data-input]");
const submitButton = document.querySelector("[data-submit]");
const message = document.querySelector("[data-message]");
const result = document.querySelector("[data-result]");
const resultUrl = document.querySelector("[data-result-url]");
const copyButton = document.querySelector("[data-copy]");

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

  try {
    await navigator.clipboard.writeText(url);
    copyButton.textContent = "복사됨";
  } catch {
    setMessage(url);
  }

  window.setTimeout(() => {
    copyButton.textContent = "복사";
  }, 1200);
});

function showResult(url) {
  resultUrl.href = url;
  resultUrl.textContent = url;
  result.hidden = false;
}

function hideResult() {
  result.hidden = true;
  resultUrl.removeAttribute("href");
  resultUrl.textContent = "";
}

function setMessage(text) {
  message.textContent = text;
}
