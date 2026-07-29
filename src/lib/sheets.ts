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
