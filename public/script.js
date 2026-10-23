const form = document.querySelector("#resolver-form");
const input = document.querySelector("#link-input");
const button = document.querySelector("#resolve-button");

const result = document.querySelector("#result");
const errorBox = document.querySelector("#error");

const title = document.querySelector("#result-title");
const description = document.querySelector("#result-description");
const provider = document.querySelector("#provider");
const resultUrl = document.querySelector("#result-url");
const notice = document.querySelector("#notice");
const openLink = document.querySelector("#open-link");

function showError(message) {
  result.classList.add("hidden");
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);

    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.hostname.includes(".") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const value = input.value.trim();

  result.classList.add("hidden");
  errorBox.classList.add("hidden");

  if (!validHttpUrl(value)) {
    showError("Masukkan URL HTTP atau HTTPS yang valid.");
    return;
  }

  button.disabled = true;
  button.textContent = "Memeriksa...";

  try {
    const response = await fetch("/api/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: value })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Gagal memeriksa URL.");
    }

    title.textContent = "Pemeriksaan selesai";
    description.textContent =
      "Domain berhasil diperiksa. Tujuan akhir belum diverifikasi.";

    provider.textContent = data.provider;
    resultUrl.textContent = data.url;
    resultUrl.href = data.url;

    notice.textContent = data.message;

    // Buka URL asli hanya setelah pengguna menekan tombol.
    openLink.href = data.url;

    result.classList.remove("hidden");
  } catch (error) {
    showError(error.message || "Terjadi kesalahan.");
  } finally {
    button.disabled = false;
    button.innerHTML = 'Periksa <span>↗</span>';
  }
});
