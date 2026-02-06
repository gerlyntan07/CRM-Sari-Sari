// frontend/src/utils/printQuoteInvoice.js

const escapeHtml = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value, currencySymbol = "") => {
  const n = toNumber(value);
  return `${currencySymbol}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const resolveLogoSrc = (rawLogo) => {
  if (!rawLogo) return null;
  const logo = String(rawLogo).trim();
  if (!logo) return null;
  if (logo.startsWith("data:image/")) return logo;
  return logo;
};

const waitForAssets = async (doc, timeoutMs = 2500) => {
  // Best-effort wait for images/fonts so the first print isn't blank.
  const promises = [];

  try {
    const images = Array.from(doc.images || []);
    for (const img of images) {
      if (img.complete) continue;
      promises.push(
        new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        }),
      );
    }
  } catch {
    // ignore
  }

  if (doc.fonts && typeof doc.fonts.ready?.then === "function") {
    promises.push(doc.fonts.ready.catch(() => undefined));
  }

  await Promise.race([
    Promise.all(promises),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
};

const printViaIframe = async (html) => {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    throw new Error("Print frame unavailable");
  }

  doc.open();
  doc.write(html);
  doc.close();

  await waitForAssets(doc);

  return await new Promise((resolve, reject) => {
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try {
        iframe.remove();
      } catch {
        // ignore
      }
    };

    const handleAfterPrint = () => {
      cleanup();
      resolve(true);
    };

    // Some browsers don't fire afterprint reliably for iframe.
    const fallbackTimer = setTimeout(() => {
      cleanup();
      resolve(true);
    }, 4000);

    try {
      win.addEventListener("afterprint", handleAfterPrint, { once: true });
      win.focus();
      win.print();
    } catch (e) {
      clearTimeout(fallbackTimer);
      cleanup();
      reject(e);
    }
  });
};

export function printQuoteInvoice({
  quote,
  companyInfo,
  currencySymbol,
  title = "Invoice",
}) {
  if (!quote) throw new Error("Missing quote");

  const formattedDateTime = (datetime) => {
    if (!datetime) return "";
    return new Date(datetime)
      .toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
      .replace(",", "");
  };

  const formatQuoteId = (quoteId) => {
    if (!quoteId) return "";
    // Convert Q26-1-00006 -> Q26-00006 (remove middle company ID)
    const parts = String(quoteId).split("-");
    if (parts.length === 3) {
      return `${parts[0]}-${parts[2]}`;
    }
    return String(quoteId);
  };

  const invoiceNoRaw = quote.quote_id || quote.id;
  const invoiceNo = formatQuoteId(invoiceNoRaw);
  const issuedDate = formattedDateTime(quote.created_at || quote.updated_at);

  const fromName = companyInfo?.company_name || "";
  const fromNumber = companyInfo?.company_number || "";
  const fromEmail = companyInfo?.ceo_email || "";
  const logoSrc = resolveLogoSrc(companyInfo?.company_logo);

  const toAccount = quote?.account?.name || "";
  const toContactName = quote?.contact
    ? `${quote.contact.first_name || ""} ${quote.contact.last_name || ""}`.trim()
    : "";
  const toContactEmail = quote?.contact?.email || "";

  const items = Array.isArray(quote.items) ? quote.items : [];

  const subtotal = quote.subtotal ?? 0;
  const discountAmount = quote.discount_amount ?? 0;
  const taxAmount = quote.tax_amount ?? 0;
  const totalAmount = quote.total_amount ?? 0;

  const itemsRows =
    items.length > 0
      ? items
          .map((it, idx) => {
            const qty = toNumber(it.quantity);
            const unit = it.unit || "";
            const unitPrice = it.unit_price ?? 0;
            const lineTotal = it.line_total ?? 0;
            const descBits = [it.description, it.variant, it.sku]
              .filter((x) => x !== null && x !== undefined && String(x).trim())
              .map((x) => String(x).trim());
            const desc = descBits.join(" • ");

            return `
              <tr>
                <td>${idx + 1}</td>
                <td>
                  <div class="item-name">${escapeHtml(it.name || "")}</div>
                  ${desc ? `<div class="muted">${escapeHtml(desc)}</div>` : ""}
                </td>
                <td class="right">${escapeHtml(qty)}${unit ? ` ${escapeHtml(unit)}` : ""}</td>
                <td class="right">${escapeHtml(formatMoney(unitPrice, currencySymbol))}</td>
                <td class="right">${escapeHtml(formatMoney(lineTotal, currencySymbol))}</td>
              </tr>
            `;
          })
          .join("\n")
      : `
        <tr>
          <td colspan="5" class="muted">No line items.</td>
        </tr>
      `;

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} - ${escapeHtml(invoiceNo)}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

      :root {
        --color-secondary: #232F3E;
        --color-tertiary: #37475A;
        --color-paper-white: #fbfbf8;
        --font-inter: "Inter", sans-serif;
      }

      @media print {
        .no-print { display: none !important; }
        html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }

      html, body { margin: 0; padding: 0; }
      body {
        font-family: var(--font-inter);
        color: var(--color-secondary);
        background: #fff;
      }

      .page { padding: 28px; }
      .top-actions { display: flex; justify-content: flex-end; margin-bottom: 12px; gap: 8px; }
      button {
        border: 1px solid var(--color-tertiary);
        border-radius: 10px;
        background: var(--color-paper-white);
        color: var(--color-secondary);
        padding: 8px 10px;
        cursor: pointer;
        font-family: var(--font-inter);
      }

      .row { display: flex; gap: 16px; align-items: flex-start; justify-content: space-between; }
      .col { flex: 1; }
      .muted { font-size: 12px; opacity: 0.9; }
      .kicker { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; }
      .logo { max-height: 56px; max-width: 220px; object-fit: contain; }

      .card {
        border: 1px solid var(--color-tertiary);
        border-radius: 14px;
        background: #fff;
        padding: 14px;
      }

        .card-1 {
        background: #fff;
        padding: 14px;
      }

      .header { margin-bottom: 14px; }
      .title { margin: 0; font-size: 20px; font-weight: 700; }
      /* ===== Invoice Header Redesign ===== */

.invoice-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.invoice-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.invoice-center {
  flex: 1;
  text-align: center;
}

.invoice-right {
  text-align: right;
  min-width: 160px;
}

.quote-label {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.8;
}

.quote-number {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.6px;
}

.issued-label {
  font-size: 12px;
  opacity: 0.8;
}

.issued-date {
  font-size: 14px;
  font-weight: 700;
}

      .meta { font-size: 13px; line-height: 1.6; margin-top: 6px; }
      .meta strong { font-weight: 700; }

      .grid2 { display: grid; grid-template-columns: 1fr 360px; gap: 16px; align-items: start; }

      @media (max-width: 860px) {
        .grid2 { grid-template-columns: 1fr; }
      }

      table { width: 100%; border-collapse: collapse; margin-top: 14px; }
      th, td { border-bottom: 1px solid var(--color-tertiary); padding: 10px 8px; vertical-align: top; }
      th {
        text-align: left;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        background: var(--color-paper-white);
        border-top: 1px solid var(--color-tertiary);
      }
      tr:last-child td { border-bottom: 1px solid var(--color-tertiary); }

      .right { text-align: right; white-space: nowrap; }
      .item-name { font-weight: 700; font-size: 14px; margin-bottom: 2px; }

      .totalsWrap { display: flex; justify-content: flex-end; margin-top: 12px; }
      .totals {
        width: 360px;
        border: 1px solid var(--color-tertiary);
        border-radius: 14px;
        padding: 12px 14px;
        background: var(--color-paper-white);
      }
      .totalsRow { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
      .totalsRow strong { font-weight: 800; }
      .divider { height: 1px; background: var(--color-tertiary); opacity: 0.6; margin: 10px 0; }

      .footer { margin-top: 18px; font-size: 12px; opacity: 0.9; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="top-actions no-print">
        <button onclick="window.print()">Print</button>
      </div>

      <div class="grid2 header">
        <div class="card-1">
  <div class="invoice-header-row">

    <!-- Left: Logo + Title -->
    <div class="invoice-left">
      ${logoSrc ? `<img class="logo" alt="Company logo" src="${escapeHtml(logoSrc)}" />` : ""}
      <div>
        <div class="kicker">Business Invoice</div>
        <div class="title">${escapeHtml(title)}</div>
      </div>
    </div>

    <!-- Center: Quote / Invoice No -->
    <div class="invoice-center">
      <div class="quote-label">Quote No</div>
      <div class="quote-number">${escapeHtml(invoiceNo)}</div>
    </div>

    <!-- Right: Issued Date -->
    <div class="invoice-right">
      ${issuedDate ? `
        <div class="issued-label">Issued</div>
        <div class="issued-date">${escapeHtml(issuedDate)}</div>
      ` : ""}
    </div>

  </div>
</div>


        <div class="card">
          <div style="font-weight:800; font-size: 14px; margin-bottom: 6px;">${escapeHtml(fromName)}</div>
          ${fromNumber ? `<div class="meta">Company No: ${escapeHtml(fromNumber)}</div>` : ""}
          ${fromEmail ? `<div class="meta">Email: ${escapeHtml(fromEmail)}</div>` : ""}
        </div>
      </div>

      <div class="card" style="margin-top: 14px;">
        <div class="kicker">Bill To</div>
        <div style="margin-top: 6px;">
          ${toAccount ? `<div style="font-weight:700;">${escapeHtml(toAccount)}</div>` : ""}
          ${toContactName ? `<div>${escapeHtml(toContactName)}</div>` : ""}
          ${toContactEmail ? `<div class="muted">${escapeHtml(toContactEmail)}</div>` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 44px;">#</th>
            <th>Item</th>
            <th style="width: 120px;" class="right">Qty</th>
            <th style="width: 140px;" class="right">Unit Price</th>
            <th style="width: 140px;" class="right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="totalsWrap">
        <div class="totals">
          <div class="totalsRow"><div>Subtotal</div><div>${escapeHtml(formatMoney(subtotal, currencySymbol))}</div></div>
          <div class="totalsRow"><div>Discount</div><div>-${escapeHtml(formatMoney(discountAmount, currencySymbol))}</div></div>
          <div class="totalsRow"><div>Tax</div><div>${escapeHtml(formatMoney(taxAmount, currencySymbol))}</div></div>
          <div class="divider"></div>
          <div class="totalsRow"><div><strong>Total</strong></div><div><strong>${escapeHtml(formatMoney(totalAmount, currencySymbol))}</strong></div></div>
        </div>
      </div>

      ${quote.notes ? `
        <div class="card" style="margin-top: 14px;">
          <div class="kicker">Notes</div>
          <div style="margin-top: 6px; white-space: pre-wrap; font-size: 13px;">${escapeHtml(quote.notes)}</div>
        </div>
      ` : ""}

      <div class="footer">
        Generated from Sari-Sari CRM quote. This printout is for business use.
      </div>
    </div>
  </body>
</html>
  `.trim();

  // Prefer printing via hidden iframe to avoid popup blockers.
  // Fallback to window.open for browsers that don't allow iframe printing.
  printViaIframe(html).catch(() => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      throw new Error("Popup blocked. Please allow popups to print.");
    }

    w.document.open();
    w.document.write(html);
    w.document.close();

    w.onload = () => {
      try {
        w.focus();
        w.print();
      } catch {
        // ignore
      }
    };
  });
}
