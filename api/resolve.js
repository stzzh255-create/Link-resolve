const PROVIDERS = [
  {
    name: "SFL.gl",
    domains: ["sfl.gl"]
  },
  {
    name: "LootLabs",
    domains: ["loot-link.com", "lootlabs.gg"]
  },
  {
    name: "Linkvertise",
    domains: ["linkvertise.com", "linkvertise.net"]
  }
];

function identifyProvider(hostname) {
  const host = hostname.toLowerCase();

  for (const provider of PROVIDERS) {
    const found = provider.domains.some(
      (domain) => host === domain || host.endsWith("." + domain)
    );

    if (found) return provider.name;
  }

  return "Lainnya";
}

function isPrivateOrLocal(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "::1" ||
    host === "::"
  ) {
    return true;
  }

  // Blokir alamat IPv4 literal pada endpoint ini.
  // Pemeriksaan DNS dan akses jaringan tidak diperlukan.
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    return true;
  }

  // Blokir IPv6 literal.
  if (host.includes(":")) {
    return true;
  }

  return false;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Metode tidak diizinkan. Gunakan POST."
    });
  }

  const contentType = req.headers["content-type"] || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return res.status(415).json({
      error: "Content-Type harus application/json."
    });
  }

  let value;

  try {
    const body = req.body;

    value = body && typeof body.url === "string"
      ? body.url.trim()
      : "";
  } catch {
    return res.status(400).json({
      error: "Body JSON tidak valid."
    });
  }

  if (!value || value.length > 2048) {
    return res.status(400).json({
      error: "URL kosong atau terlalu panjang."
    });
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    return res.status(400).json({
      error: "Format URL tidak valid."
    });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({
      error: "Hanya URL HTTP dan HTTPS yang didukung."
    });
  }

  if (!parsed.hostname || parsed.username || parsed.password) {
    return res.status(400).json({
      error: "Hostname tidak valid atau URL mengandung kredensial."
    });
  }

  if (isPrivateOrLocal(parsed.hostname)) {
    return res.status(400).json({
      error: "Alamat lokal atau IP literal tidak diizinkan."
    });
  }

  // Hilangkan fragmen yang sering berisi data pelacakan sisi klien.
  // Query string dipertahankan agar tautan aslinya tetap berfungsi.
  parsed.hash = "";

  const provider = identifyProvider(parsed.hostname);

  return res.status(200).json({
    ok: true,
    provider,
    url: parsed.toString(),
    resolved: false,
    message:
      "Domain dikenali, tetapi tujuan akhir belum diverifikasi. " +
      "Jika ini link locker, ikuti proses resmi penyedia."
  });
}
