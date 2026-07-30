import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mjaloptcpeytvecbxbza.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qYWxvcHRjcGV5dHZlY2J4YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjQ1NjksImV4cCI6MjEwMTAwMDU2OX0.0eT8NJxGDMsPzh-y3w4LEt-oFxwkfiEIizBUY67DaFE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a File or Base64 Data URL to a Supabase Storage bucket and returns the public URL.
 * Falls back gracefully to the original base64 if there are bucket/connection issues.
 */
export async function uploadToSupabaseStorage(
  bucket: string,
  fileName: string,
  fileOrDataUrl: File | string
): Promise<string> {
  let body: Blob | File;
  let contentType: string | undefined;

  if (typeof fileOrDataUrl === 'string') {
    if (fileOrDataUrl.startsWith('data:')) {
      try {
        const arr = fileOrDataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        contentType = mimeMatch ? mimeMatch[1] : undefined;
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        body = new Blob([u8arr], { type: contentType });
      } catch (e) {
        console.error("Failed to parse base64 data URL for storage upload:", e);
        return fileOrDataUrl;
      }
    } else {
      // Return plain URL or text
      return fileOrDataUrl;
    }
  } else {
    body = fileOrDataUrl;
    contentType = fileOrDataUrl.type;
  }

  // Generate a clean and uniquely prefixed path to prevent name collision or cache issues
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniquePath = `${Date.now()}_${cleanFileName}`;

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(uniquePath, body, {
        upsert: true,
        contentType: contentType,
        cacheControl: '3600',
      });

    if (error) {
      console.warn(`Supabase Storage upload returned error for bucket '${bucket}':`, error);
      // Fallback: Return original string
      if (typeof fileOrDataUrl === 'string') {
        return fileOrDataUrl;
      }
      return '';
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uniquePath);
    return urlData?.publicUrl || (typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
  } catch (err) {
    console.error(`Supabase Storage exception for bucket '${bucket}':`, err);
    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
  }
}

