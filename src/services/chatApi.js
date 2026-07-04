export async function streamChat({ apiKey, systemPrompt, messages, onDelta, onDone, onError }) {
  try {
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
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API fout (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const event = JSON.parse(data);
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            onDelta(event.delta.text);
          }
        } catch { /* skip malformed lines */ }
      }
    }

    onDone?.();
  } catch (err) {
    onError?.(err.message || 'Onbekende fout');
  }
}

export function buildBalansSystemPrompt(d) {
  return `Je bent een Nederlandse financiële adviseur gespecialiseerd in boekhouding voor e-commerce ondernemers (webshops, dropshipping).

De gebruiker heeft de volgende balans voor ${d.period}:

ACTIVA — totaal ${d.totaalActiva}
  Vlottende activa (subtotaal ${d.totaalVlottend}):
    Bank / kas: ${d.bank}
    Debiteuren (openstaand): ${d.debiteuren}
    Voorraad: ${d.voorraad}
  Vaste activa (subtotaal ${d.totaalVast}):
    Apparatuur: ${d.apparatuur}
    Software: ${d.software}

PASSIVA — totaal ${d.totaalPassiva}
  Eigen vermogen (subtotaal ${d.totaalEigenVermogen}):
    Startkapitaal: ${d.startkapitaal}
    Winst / verlies: ${d.winst}
  Kortlopende schulden (subtotaal ${d.totaalKortlopend}):
    Crediteuren: ${d.crediteuren}
    BTW te betalen: ${d.btwTeBetalen}
    Overige schulden: ${d.overigeSchuld}

${d.inBalans
  ? `De balans is IN EVENWICHT. Activa en passiva zijn gelijk (${d.totaalActiva}).`
  : `De balans is NIET IN EVENWICHT. Verschil: ${d.verschil} (activa - passiva).`
}

Instructies:
- Antwoord altijd in het Nederlands
- Gebruik concrete bedragen uit de balans in je antwoorden
- Wees bondig en praktisch — max 200 woorden tenzij gevraagd
- Gebruik bullet points voor lijstjes
- Als iets ontbreekt of onduidelijk is, vraag dan door
- Je mag Nederlandse boekhoudtermen gebruiken maar leg ze kort uit`;
}
