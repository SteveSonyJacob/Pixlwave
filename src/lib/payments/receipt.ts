export function escapeReceipt(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export function receiptDocument(title: string, rows: { label: string; value: string }[], lines: { description: string; amountPaise: number }[]) {
  const total = lines.reduce((sum, line) => sum + line.amountPaise, 0);
  const inr = (amount: number) => `₹${(amount / 100).toFixed(2)}`;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${escapeReceipt(title)}</title><style>body{font:16px system-ui;max-width:760px;margin:3rem auto;padding:0 1rem;color:#182333}h1{margin-bottom:.3rem}dl{display:grid;grid-template-columns:12rem 1fr;gap:.4rem}dt{font-weight:700}table{width:100%;border-collapse:collapse;margin-top:2rem}th,td{border-bottom:1px solid #ccc;padding:.7rem;text-align:left}td:last-child,th:last-child{text-align:right}tfoot{font-weight:700}small{color:#566}</style><h1>Pixlwave</h1><p>${escapeReceipt(title)}</p><dl>${rows.map((row) => `<dt>${escapeReceipt(row.label)}</dt><dd>${escapeReceipt(row.value)}</dd>`).join("")}</dl><table><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>${lines.map((line) => `<tr><td>${escapeReceipt(line.description)}</td><td>${inr(line.amountPaise)}</td></tr>`).join("")}</tbody><tfoot><tr><td>Total</td><td>${inr(total)}</td></tr></tfoot></table><p><small>This is a payment or refund record, not a GST tax invoice. Payment does not confirm inventory; admin approval is separate.</small></p></html>`;
}
