/**
 * Utility functions for parsing, formatting, and embedding media sources,
 * including Google Drive shared video links, YouTube embeds, Vimeo, Loom, and direct streams.
 */

export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  
  // Standard Google Drive file URL patterns:
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  // https://docs.google.com/file/d/FILE_ID/edit
  const match = trimmed.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/.*\/d\/)([a-zA-Z0-9_-]{20,})/i);
  if (match && match[1]) {
    return match[1];
  }
  
  // Check if raw alphanumeric file ID
  if (/^[a-zA-Z0-9_-]{25,60}$/.test(trimmed)) {
    return trimmed;
  }
  
  return null;
}

export function getGoogleDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getGoogleDriveDirectStreamUrl(fileId: string): string {
  return `/api/drive-proxy/stream/${fileId}`;
}

export function getGoogleDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
  return match && match[1] ? match[1] : null;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}

export function extractVimeoVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(/(?:vimeo\.com\/)(\d+)/i);
  return match && match[1] ? match[1] : null;
}

export function getVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
}

export function extractLoomVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(/(?:loom\.com\/(?:share|embed)\/)([a-zA-Z0-9_-]+)/i);
  return match && match[1] ? match[1] : null;
}

export function getLoomEmbedUrl(videoId: string): string {
  return `https://www.loom.com/embed/${videoId}`;
}

export type VideoSourceType = 'gdrive' | 'youtube' | 'vimeo' | 'loom' | 'direct';

export interface ParsedVideoMedia {
  type: VideoSourceType;
  fileId?: string;
  embedUrl: string;
  proxyStreamUrl?: string;
  originalUrl: string;
  isDrive: boolean;
  isYouTube: boolean;
  isVimeo: boolean;
  isLoom: boolean;
}

export function parseVideoMediaUrl(url: string): ParsedVideoMedia {
  if (!url) {
    return {
      type: 'direct',
      embedUrl: '',
      originalUrl: '',
      isDrive: false,
      isYouTube: false,
      isVimeo: false,
      isLoom: false,
    };
  }

  const gdriveId = extractGoogleDriveFileId(url);
  if (gdriveId) {
    return {
      type: 'gdrive',
      fileId: gdriveId,
      embedUrl: getGoogleDriveEmbedUrl(gdriveId),
      proxyStreamUrl: getGoogleDriveDirectStreamUrl(gdriveId),
      originalUrl: url,
      isDrive: true,
      isYouTube: false,
      isVimeo: false,
      isLoom: false,
    };
  }

  const youtubeId = extractYouTubeVideoId(url);
  if (youtubeId) {
    return {
      type: 'youtube',
      fileId: youtubeId,
      embedUrl: getYouTubeEmbedUrl(youtubeId),
      originalUrl: url,
      isDrive: false,
      isYouTube: true,
      isVimeo: false,
      isLoom: false,
    };
  }

  const vimeoId = extractVimeoVideoId(url);
  if (vimeoId) {
    return {
      type: 'vimeo',
      fileId: vimeoId,
      embedUrl: getVimeoEmbedUrl(vimeoId),
      originalUrl: url,
      isDrive: false,
      isYouTube: false,
      isVimeo: true,
      isLoom: false,
    };
  }

  const loomId = extractLoomVideoId(url);
  if (loomId) {
    return {
      type: 'loom',
      fileId: loomId,
      embedUrl: getLoomEmbedUrl(loomId),
      originalUrl: url,
      isDrive: false,
      isYouTube: false,
      isVimeo: false,
      isLoom: true,
    };
  }

  return {
    type: 'direct',
    embedUrl: url,
    originalUrl: url,
    isDrive: false,
    isYouTube: false,
    isVimeo: false,
    isLoom: false,
  };
}

