import { Router } from "express";
import { Readable } from "stream";

export const driveProxyRouter = Router();

driveProxyRouter.get("/stream/:fileId", async (req, res) => {
  const { fileId } = req.params;
  if (!fileId || !/^[a-zA-Z0-9_-]{15,80}$/.test(fileId)) {
    return res.status(400).json({ error: "Invalid Google Drive File ID" });
  }

  // Google Drive usercontent download endpoints
  const candidateUrls = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://docs.google.com/uc?export=download&id=${fileId}&confirm=t`,
  ];

  const clientHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "*/*",
  };

  if (req.headers.range) {
    clientHeaders["Range"] = req.headers.range as string;
  }

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: clientHeaders,
        redirect: "follow",
      });

      const contentType = response.headers.get("content-type") || "";

      // If Google Drive returns HTML (e.g. warning or login or confirmation page)
      if (contentType.includes("text/html")) {
        const htmlText = await response.text();
        const confirmMatch = htmlText.match(/confirm=([a-zA-Z0-9_-]+)/);
        if (confirmMatch && confirmMatch[1]) {
          const confirmUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmMatch[1]}`;
          const retryRes = await fetch(confirmUrl, {
            headers: clientHeaders,
            redirect: "follow",
          });
          const retryType = retryRes.headers.get("content-type") || "";
          if (retryRes.ok && !retryType.includes("text/html") && retryRes.body) {
            return streamResponse(retryRes, res);
          }
        }
        continue; // Try next candidate URL
      }

      if (response.ok && response.body) {
        return streamResponse(response, res);
      }
    } catch (err) {
      console.error(`Error fetching drive stream from ${url}:`, err);
    }
  }

  // Fallback redirect to Google Drive preview or view
  return res.redirect(`https://drive.google.com/file/d/${fileId}/preview`);
});

function streamResponse(upstreamRes: Response, res: any) {
  const status = upstreamRes.status === 206 ? 206 : 200;
  res.status(status);

  const contentType = upstreamRes.headers.get("content-type") || "video/mp4";
  res.setHeader("Content-Type", contentType);

  if (upstreamRes.headers.get("content-length")) {
    res.setHeader("Content-Length", upstreamRes.headers.get("content-length")!);
  }
  if (upstreamRes.headers.get("content-range")) {
    res.setHeader("Content-Range", upstreamRes.headers.get("content-range")!);
  }
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=3600");

  if (upstreamRes.body) {
    const nodeStream = Readable.fromWeb(upstreamRes.body as any);
    nodeStream.pipe(res);
  } else {
    res.end();
  }
}
