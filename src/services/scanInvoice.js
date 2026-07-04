function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function scanInvoice(file, apiKey) {
  const base64 = await toBase64(file);
  const isPdf = file.type === 'application/pdf';

  const contentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image',    source: { type: 'base64', media_type: file.type || 'image/jpeg', data: base64 } };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          contentBlock,
          {
            type: 'text',
            text: 'Dit is een factuur. Extraheer de volgende gegevens en geef alleen geldige JSON terug:\n{"supplier":"naam afzender","invoice_nr":"factuurnummer","date":"DD-MM-YYYY","amount_excl":getal,"btw_rate":21of9of0ofnull,"btw_amount":getal,"amount_incl":getal}\nGebruik punt als decimaalteken. Geef alleen de JSON, geen uitleg.',
          },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API fout (${res.status})`);
  }

  const data = await res.json();
  const text = data.content[0].text.trim();
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const parsed = JSON.parse(clean);

  return {
    supplier:    String(parsed.supplier   || ''),
    invoice_nr:  String(parsed.invoice_nr || ''),
    date:        String(parsed.date       || ''),
    amount_excl: Number(parsed.amount_excl ?? 0),
    btw_rate:    parsed.btw_rate != null ? Number(parsed.btw_rate) : null,
    btw_amount:  Number(parsed.btw_amount  ?? 0),
    amount_incl: Number(parsed.amount_incl ?? 0),
  };
}
