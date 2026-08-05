export const fetchSpreadsheetMetadata = async (
  spreadsheetId: string,
  accessToken: string
) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.error?.message || `Failed to fetch spreadsheet metadata: ${response.statusText}`
    );
  }

  return response.json();
};

export const fetchMultipleRanges = async (
  spreadsheetId: string,
  ranges: string[],
  accessToken: string
) => {
  const params = new URLSearchParams();
  ranges.forEach(range => {
    // Single-quote range names if they contain spaces or special characters to prevent API invalid range errors
    const formattedRange = range.startsWith("'") ? range : `'${range.replace(/'/g, "''")}'`;
    params.append('ranges', formattedRange);
  });
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.error?.message || `Failed to fetch from Google Sheets: ${response.statusText}`
    );
  }

  return response.json();
};

export const extractSpreadsheetId = (input: string): string | null => {
  if (/^[a-zA-Z0-9-_]{20,}$/.test(input)) {
    return input;
  }
  try {
    const url = new URL(input);
    const match = url.pathname.match(/\/d\/(.*?)\//);
    if (match && match[1]) {
      return match[1];
    }
  } catch (e) {
    // invalid url
  }
  return null;
};

/**
 * Extracts sheet/tab names from a Google Spreadsheet's public htmlview or pubhtml page
 */
export const extractPublicSheetNames = (html: string): string[] => {
  const names: string[] = [];
  
  // 1. Try matching htmlview tab buttons
  const regex1 = /<li[^>]*id="sheet-button-[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/g;
  let match;
  while ((match = regex1.exec(html)) !== null) {
    if (match[1]) names.push(match[1].trim());
  }

  // 2. Try matching caption spans
  if (names.length === 0) {
    const regex2 = /<span class="[^"]*sheet-tab-caption[^"]*">([^<]+)<\/span>/g;
    while ((match = regex2.exec(html)) !== null) {
      if (match[1]) names.push(match[1].trim());
    }
  }

  // 3. Try matching JSON sheet name configs in script tags
  if (names.length === 0) {
    const regex3 = /"name"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*,\s*"sheetId"/g;
    while ((match = regex3.exec(html)) !== null) {
      if (match[1]) {
        try {
          const decoded = JSON.parse(`"${match[1]}"`);
          names.push(decoded.trim());
        } catch {
          names.push(match[1].trim());
        }
      }
    }
  }

  // 4. Try matching items.push({name: "...", pageUrl: ...})
  if (names.length === 0) {
    const regex4 = /items\.push\(\s*\{\s*name:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    while ((match = regex4.exec(html)) !== null) {
      if (match[1]) {
        try {
          const decoded = JSON.parse(`"${match[1]}"`);
          names.push(decoded.trim());
        } catch {
          names.push(match[1].trim());
        }
      }
    }
  }

  return Array.from(new Set(names)).filter(Boolean);
};

/**
 * Fetches and parses a public Google Spreadsheet ( Anyone with the link can view )
 * using the GViz API without requiring an OAuth access token.
 */
export const fetchPublicSpreadsheetData = async (spreadsheetId: string) => {
  let sheets: string[] = [];
  try {
    const htmlUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
    const resp = await fetch(htmlUrl);
    if (resp.ok) {
      const htmlText = await resp.text();
      sheets = extractPublicSheetNames(htmlText);
    }
  } catch (err) {
    console.warn("Could not fetch public sheet list:", err);
  }

  if (sheets.length === 0) {
    sheets = ['']; // fallback to fetch default sheet
  }

  const valueRanges: any[] = [];

  for (const sheetName of sheets) {
    try {
      const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json${sheetParam}`;
      const gvizResp = await fetch(gvizUrl);
      if (!gvizResp.ok) continue;
      
      const gvizText = await gvizResp.text();
      const startIdx = gvizText.indexOf('{');
      const endIdx = gvizText.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) continue;
      
      const jsonStr = gvizText.substring(startIdx, endIdx + 1);
      const data = JSON.parse(jsonStr);
      
      if (data && data.table) {
        const cols = data.table.cols || [];
        const rows = data.table.rows || [];
        
        const headers = cols.map((c: any) => c ? (c.label || c.id || '') : '');
        const parsedRows = rows.map((r: any) => {
          if (!r || !r.c) return [];
          return r.c.map((cell: any) => {
            if (!cell) return '';
            if (cell.f !== undefined) return cell.f;
            if (cell.v !== undefined) {
              if (typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
                try {
                  const parts = cell.v.slice(5, -1).split(',').map((p: string) => parseInt(p, 10));
                  if (parts.length >= 3) {
                    const date = new Date(parts[0], parts[1], parts[2]);
                    return date.toLocaleDateString();
                  }
                } catch {}
              }
              return String(cell.v);
            }
            return '';
          });
        });

        valueRanges.push({
          range: sheetName || 'Sheet1',
          values: [headers, ...parsedRows]
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch public sheet values for ${sheetName}:`, err);
    }
  }

  if (valueRanges.length === 0) {
    throw new Error("No data could be retrieved from the public spreadsheet. Ensure 'Anyone with the link' view access is active.");
  }

  return {
    properties: { title: 'Public Google Sheet Quiz Data' },
    valueRanges
  };
};

