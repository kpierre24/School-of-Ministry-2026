import { createClient } from '@supabase/supabase-js';
import { sanitizeFileName } from './securityHelper';
import { logger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

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
        logger.error("Failed to parse base64 data URL for storage upload:", e);
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
  const cleanFileName = sanitizeFileName(fileName);
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
      logger.warn(`Supabase Storage upload returned error for bucket '${bucket}':`, error);
      // Fallback: Return original string if string, or convert File to base64 data URL
      if (typeof fileOrDataUrl === 'string') {
        return fileOrDataUrl;
      }
      return await fileToBase64(fileOrDataUrl);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uniquePath);
    return urlData?.publicUrl || (typeof fileOrDataUrl === 'string' ? fileOrDataUrl : await fileToBase64(fileOrDataUrl));
  } catch (err) {
    logger.error(`Supabase Storage exception for bucket '${bucket}':`, err);
    if (typeof fileOrDataUrl === 'string') {
      return fileOrDataUrl;
    }
    return await fileToBase64(fileOrDataUrl);
  }
}

/**
 * Ensures an image URL or File/data string is stored in a Supabase Storage bucket
 * and returns the public Supabase Storage URL.
 */
export async function ensureSupabaseStorageUrl(
  bucket: string,
  fileName: string,
  imageUrl: string
): Promise<string> {
  if (!imageUrl) return imageUrl;

  // If already a Supabase Storage public URL, return as is
  if (imageUrl.includes('.supabase.co/storage/v1/object/public/')) {
    return imageUrl;
  }

  // If it's a data URL, upload directly
  if (imageUrl.startsWith('data:')) {
    return await uploadToSupabaseStorage(bucket, fileName, imageUrl);
  }

  // If it's a local relative path, asset import, or blob URL, fetch and upload to Supabase Storage
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return imageUrl;
    const blob = await res.blob();
    const contentType = blob.type || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    const cleanFileName = fileName.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`;
    const file = new File([blob], cleanFileName, { type: contentType });
    return await uploadToSupabaseStorage(bucket, cleanFileName, file);
  } catch (err) {
    logger.warn(`Could not upload image '${fileName}' to Supabase Storage:`, err);
    return imageUrl;
  }
}

/**
 * Iterates through a list of FacultyTeacher objects and ensures all teacher portrait images
 * are uploaded and stored in the Supabase 'classroom_media' bucket. Returns updated faculty list.
 */
export async function syncFacultyImagesToSupabase(facultyTeachers: any[]): Promise<any[]> {
  if (!Array.isArray(facultyTeachers) || facultyTeachers.length === 0) {
    return facultyTeachers;
  }

  const updatedFaculty = [...facultyTeachers];

  for (let i = 0; i < updatedFaculty.length; i++) {
    const teacher = updatedFaculty[i];
    if (!teacher || !teacher.image) continue;

    // Check if the image needs to be saved to Supabase storage
    if (!teacher.image.includes('.supabase.co/storage/v1/object/public/')) {
      const cleanSlug = (teacher.name || teacher.id || `faculty_${i}`)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      const fileName = `faculty_portrait_${cleanSlug}.jpg`;

      const supabaseUrl = await ensureSupabaseStorageUrl('classroom_media', fileName, teacher.image);
      if (supabaseUrl && supabaseUrl !== teacher.image) {
        updatedFaculty[i] = {
          ...teacher,
          image: supabaseUrl,
        };
      }
    }
  }

  return updatedFaculty;
}

export interface StorageObjectInfo {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
  publicUrl?: string;
  sizeBytes?: number;
}

export interface SupabaseDiagnosticReport {
  timestamp: string;
  supabaseUrl: string;
  hasAnonKey: boolean;
  dbConnected: boolean;
  dbError?: string;
  userRowCount?: number;
  availableBuckets: string[];
  bucketErrors: Record<string, string>;
  libraryBucketWriteOk: boolean;
  libraryBucketWriteError?: string;
  assignmentsBucketWriteOk: boolean;
  assignmentsBucketWriteError?: string;
  libraryFiles: StorageObjectInfo[];
  assignmentsFiles: StorageObjectInfo[];
  diagnosis: string[];
}

/**
 * Runs a comprehensive test of Supabase database & storage connectivity, RLS rules,
 * bucket availability, and lists all files stored in the library & assignments buckets.
 */
export async function runSupabaseDiagnostics(userEmail?: string): Promise<SupabaseDiagnosticReport> {
  const report: SupabaseDiagnosticReport = {
    timestamp: new Date().toISOString(),
    supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey),
    dbConnected: false,
    availableBuckets: [],
    bucketErrors: {},
    libraryBucketWriteOk: false,
    assignmentsBucketWriteOk: false,
    libraryFiles: [],
    assignmentsFiles: [],
    diagnosis: [],
  };

  // 1. Test DB Table Connectivity (check both 'app_states' and 'app_state')
  try {
    let { data, error } = await supabase
      .from('app_states')
      .select('id, updated_at')
      .limit(5);

    if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
      // Fallback check for 'app_state'
      const fallback = await supabase
        .from('app_state')
        .select('email, updated_at')
        .limit(5);
      data = fallback.data as any;
      error = fallback.error;
    }

    if (error) {
      report.dbError = `${error.code || ''}: ${error.message} (${error.details || 'No details'})`;
      report.diagnosis.push(`Database error on 'app_states'/'app_state': ${error.message}. Table might not exist or lacks public RLS policies.`);
    } else {
      report.dbConnected = true;
      report.userRowCount = data?.length || 0;
    }
  } catch (err: any) {
    report.dbError = err.message || String(err);
    report.diagnosis.push(`Database exception: ${report.dbError}`);
  }

  // 2. List Storage Buckets
  try {
    const { data: buckets, error: bError } = await supabase.storage.listBuckets();
    if (bError) {
      report.bucketErrors['listBuckets'] = bError.message;
      report.diagnosis.push(`Could not list buckets: ${bError.message}. Access privileges may be restricted.`);
    } else if (buckets) {
      report.availableBuckets = buckets.map(b => b.name);
    }
  } catch (err: any) {
    report.bucketErrors['listBuckets'] = err.message || String(err);
  }

  // 3. Test Library Bucket Write & List
  const testBuckets = ['library', 'assignments'];

  for (const bucketName of testBuckets) {
    try {
      const { data: fileList, error: lError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (lError) {
        report.bucketErrors[bucketName] = lError.message;
        report.diagnosis.push(`Bucket '${bucketName}' error: ${lError.message}. Check if bucket '${bucketName}' exists and is set to Public in Supabase.`);
      } else if (fileList) {
        const fileInfos: StorageObjectInfo[] = fileList.map(f => {
          const { data: pubUrl } = supabase.storage.from(bucketName).getPublicUrl(f.name);
          return {
            name: f.name,
            id: f.id,
            created_at: f.created_at,
            updated_at: f.updated_at,
            metadata: f.metadata,
            sizeBytes: f.metadata?.size || 0,
            publicUrl: pubUrl?.publicUrl || '',
          };
        });

        if (bucketName === 'library') report.libraryFiles = fileInfos;
        if (bucketName === 'assignments') report.assignmentsFiles = fileInfos;
      }
    } catch (err: any) {
      report.bucketErrors[bucketName] = err.message || String(err);
    }

    // Write Test (Upload tiny dummy file & delete)
    try {
      const testPath = `_test_diag_${Date.now()}.txt`;
      const dummyBlob = new Blob(['Supabase diagnostic test file'], { type: 'text/plain' });
      const { error: upError } = await supabase.storage
        .from(bucketName)
        .upload(testPath, dummyBlob, { upsert: true });

      if (upError) {
        const errorMsg = `${upError.message} (${(upError as any).error || 'Upload failed'})`;
        if (bucketName === 'library') report.libraryBucketWriteError = errorMsg;
        if (bucketName === 'assignments') report.assignmentsBucketWriteError = errorMsg;
        report.diagnosis.push(`Write permission failed on bucket '${bucketName}': ${errorMsg}. Ensure Row Level Security (RLS) policies allow INSERT/public uploads for anon role.`);
      } else {
        if (bucketName === 'library') report.libraryBucketWriteOk = true;
        if (bucketName === 'assignments') report.assignmentsBucketWriteOk = true;
        // Clean up test file
        await supabase.storage.from(bucketName).remove([testPath]);
      }
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      if (bucketName === 'library') report.libraryBucketWriteError = errorMsg;
      if (bucketName === 'assignments') report.assignmentsBucketWriteError = errorMsg;
    }
  }

  // Final Diagnosis Assessment
  if (report.dbConnected && report.libraryBucketWriteOk && report.assignmentsBucketWriteOk) {
    if (report.libraryFiles.length === 0 && report.assignmentsFiles.length === 0) {
      report.diagnosis.push("Supabase connection and bucket permissions are working! However, no uploaded files were found in storage buckets. Previous uploads might have failed due to missing storage policies or were saved as temporary browser data URLs before Supabase storage was enabled.");
    } else {
      report.diagnosis.push(`Found ${report.libraryFiles.length} file(s) in 'library' bucket and ${report.assignmentsFiles.length} file(s) in 'assignments' bucket. Storage reads and writes are operational!`);
    }
  } else if (!report.dbConnected) {
    report.diagnosis.push("Database connection failed. Check if the 'app_state' table has been created in your Supabase SQL Editor.");
  }

  return report;
}

/**
 * Scans the Supabase 'library' storage bucket for uploaded objects and imports any missing
 * files into the app's LibraryResources list so they show up in the app UI.
 */
export async function syncLibraryFromSupabaseBucket(existingResources: any[]): Promise<{ updatedResources: any[]; addedCount: number }> {
  try {
    const { data: fileList, error } = await supabase.storage
      .from('library')
      .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

    if (error || !fileList) {
      logger.warn("Could not list Supabase 'library' storage bucket files:", error?.message);
      return { updatedResources: existingResources, addedCount: 0 };
    }

    const existingFileNames = new Set(existingResources.map(r => (r.fileName || '').toLowerCase()).filter(Boolean));
    const existingTitles = new Set(existingResources.map(r => (r.title || '').toLowerCase()).filter(Boolean));
    const existingUrls = new Set(existingResources.map(r => (r.downloadUrl || r.fileDataUrl || '').toLowerCase()).filter(Boolean));

    const newResources: any[] = [];

    for (const file of fileList) {
      // Ignore hidden files and diagnostic test files
      if (!file.name || file.name.startsWith('.') || file.name.startsWith('_test_diag_')) continue;

      const { data: urlData } = supabase.storage.from('library').getPublicUrl(file.name);
      const pubUrl = urlData?.publicUrl || '';

      const lowerName = file.name.toLowerCase();
      const lowerUrl = pubUrl.toLowerCase();

      if (existingFileNames.has(lowerName) || (pubUrl && existingUrls.has(lowerUrl))) {
        continue;
      }

      const fileExt = file.name.split('.').pop()?.toUpperCase() || 'DOC';
      const rawTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

      if (existingTitles.has(cleanTitle.toLowerCase())) {
        continue;
      }

      const newRes = {
        id: `sp_lib_sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: cleanTitle,
        category: 'Library Document',
        author: 'Uploaded File',
        courseCode: 'ALL-COURSES',
        format: fileExt,
        size: file.metadata?.size ? `${(file.metadata.size / 1024).toFixed(1)} KB` : '1.0 MB',
        summary: `Imported from Supabase Storage bucket 'library' (${file.name}).`,
        downloadUrl: pubUrl,
        fileDataUrl: pubUrl,
        fileName: file.name,
        uploadedAt: file.created_at || new Date().toISOString(),
        aiEvaluated: false
      };

      newResources.push(newRes);
    }

    if (newResources.length > 0) {
      const merged = [...newResources, ...existingResources];
      return { updatedResources: merged, addedCount: newResources.length };
    }

    return { updatedResources: existingResources, addedCount: 0 };
  } catch (err) {
    logger.error("Failed to sync library from Supabase storage bucket:", err);
    return { updatedResources: existingResources, addedCount: 0 };
  }
}

/**
 * Scans the Supabase 'assignments' storage bucket for uploaded assignment files/documents,
 * matches each file to the student who uploaded it (or current user/student list) and the corresponding assignment,
 * and syncs them into the app's submissions and customAssignments state.
 */
export async function syncAssignmentsFromSupabaseBucket(
  existingAssignments: any[],
  existingSubmissions: any[],
  studentsList: { name: string; email?: string }[] = [],
  currentStudentOrUserEmail?: string
): Promise<{
  updatedAssignments: any[];
  updatedSubmissions: any[];
  addedSubmissionsCount: number;
  addedAssignmentsCount: number;
}> {
  try {
    const { data: fileList, error } = await supabase.storage
      .from('assignments')
      .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

    if (error || !fileList) {
      logger.warn("Could not list Supabase 'assignments' storage bucket files:", error?.message);
      return {
        updatedAssignments: existingAssignments,
        updatedSubmissions: existingSubmissions,
        addedSubmissionsCount: 0,
        addedAssignmentsCount: 0,
      };
    }

    // Build lookup sets for existing URLs and file names to prevent duplicates
    const existingFileNames = new Set<string>();
    const existingUrls = new Set<string>();

    existingSubmissions.forEach(sub => {
      if (sub.studentFileName) existingFileNames.add(sub.studentFileName.toLowerCase());
      if (sub.studentFileUrl) existingUrls.add(sub.studentFileUrl.toLowerCase());
      if (sub.teacherCorrectedFileName) existingFileNames.add(sub.teacherCorrectedFileName.toLowerCase());
      if (sub.teacherCorrectedFileUrl) existingUrls.add(sub.teacherCorrectedFileUrl.toLowerCase());
      if (Array.isArray(sub.studentFiles)) {
        sub.studentFiles.forEach((f: any) => {
          if (f.name) existingFileNames.add(f.name.toLowerCase());
          if (f.url) existingUrls.add(f.url.toLowerCase());
        });
      }
    });

    existingAssignments.forEach(asg => {
      if (asg.teacherAttachmentName) existingFileNames.add(asg.teacherAttachmentName.toLowerCase());
      if (asg.teacherAttachmentUrl) existingUrls.add(asg.teacherAttachmentUrl.toLowerCase());
    });

    const newSubmissions: any[] = [];
    let currentAssignments = [...existingAssignments];
    let newAssignmentsCreatedCount = 0;

    for (const file of fileList) {
      // Ignore hidden files and diagnostic test files
      if (!file.name || file.name.startsWith('.') || file.name.startsWith('_test_diag_')) continue;

      const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(file.name);
      const pubUrl = urlData?.publicUrl || '';

      const lowerName = file.name.toLowerCase();
      const lowerUrl = pubUrl.toLowerCase();

      if (existingFileNames.has(lowerName) || (pubUrl && existingUrls.has(lowerUrl))) {
        continue;
      }

      // 1. MATCH STUDENT NAME
      let assignedStudentName = '';
      const cleanFileName = lowerName.replace(/[_.-]/g, ' ');

      // Check against studentsList first
      for (const student of studentsList) {
        if (!student.name) continue;
        const lowerStudent = student.name.toLowerCase().trim();
        const cleanStudentName = lowerStudent.replace(/[^a-z0-9 ]/g, '');
        const nameParts = cleanStudentName.split(' ').filter(p => p.length > 2);

        if (cleanFileName.includes(lowerStudent) || cleanFileName.includes(cleanStudentName)) {
          assignedStudentName = student.name;
          break;
        }

        // Check individual name parts (e.g. "Burke", "Williams", "Thomas", etc.)
        for (const part of nameParts) {
          if (cleanFileName.includes(part)) {
            assignedStudentName = student.name;
            break;
          }
        }
        if (assignedStudentName) break;
      }

      // Fallback to active current student or user email name if provided
      if (!assignedStudentName) {
        if (currentStudentOrUserEmail && currentStudentOrUserEmail.trim()) {
          const emailName = currentStudentOrUserEmail.split('@')[0].replace(/[._-]/g, ' ');
          assignedStudentName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        } else if (studentsList.length > 0) {
          assignedStudentName = studentsList[0].name;
        } else {
          assignedStudentName = 'A. Burke';
        }
      }

      // 2. MATCH ASSIGNMENT
      let targetAssignmentId = '';
      for (const asg of currentAssignments) {
        const titleClean = (asg.title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '');
        const codeClean = (asg.courseCode || asg.id || '').toLowerCase().replace(/[^a-z0-9 ]/g, '');

        if (titleClean && cleanFileName.includes(titleClean)) {
          targetAssignmentId = asg.id;
          break;
        }
        if (codeClean && cleanFileName.includes(codeClean)) {
          targetAssignmentId = asg.id;
          break;
        }
      }

      // If no matching assignment found, default to first existing assignment or create new one
      if (!targetAssignmentId) {
        if (currentAssignments.length > 0) {
          targetAssignmentId = currentAssignments[0].id;
        } else {
          // Create new custom assignment
          const createdAsg = {
            id: `ASG-${Date.now()}`,
            title: 'Uploaded Course Assignment',
            courseCode: 'MIN-101 Biblical Foundations',
            moduleTrack: 'MIN-101 Biblical Foundations',
            description: 'Auto-created assignment for uploaded documents from Supabase Storage.',
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            maxPoints: 100,
            createdAt: file.created_at || new Date().toISOString()
          };
          currentAssignments.push(createdAsg);
          targetAssignmentId = createdAsg.id;
          newAssignmentsCreatedCount++;
        }
      }

      // 3. CREATE SUBMISSION RECORD
      const fileExt = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      let mimeType = 'application/pdf';
      if (['DOCX', 'DOC'].includes(fileExt)) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (['PNG', 'JPG', 'JPEG'].includes(fileExt)) mimeType = `image/${fileExt.toLowerCase()}`;
      else if (fileExt === 'TXT') mimeType = 'text/plain';

      const formattedDate = file.created_at 
        ? file.created_at.replace('T', ' ').slice(0, 16) 
        : new Date().toISOString().replace('T', ' ').slice(0, 16);

      const newSub = {
        id: `SUB-${targetAssignmentId}-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        assignmentId: targetAssignmentId,
        studentName: assignedStudentName,
        submittedAt: formattedDate,
        studentFileName: file.name,
        studentFileUrl: pubUrl,
        studentFileType: mimeType,
        studentFiles: [{ name: file.name, url: pubUrl, type: mimeType }],
        studentNotes: `Synced from Supabase Storage bucket 'assignments' (${file.name}).`,
        status: 'Submitted',
        updatedAt: formattedDate
      };

      newSubmissions.push(newSub);
    }

    if (newSubmissions.length > 0 || newAssignmentsCreatedCount > 0) {
      const mergedSubmissions = [...newSubmissions, ...existingSubmissions];
      return {
        updatedAssignments: currentAssignments,
        updatedSubmissions: mergedSubmissions,
        addedSubmissionsCount: newSubmissions.length,
        addedAssignmentsCount: newAssignmentsCreatedCount
      };
    }

    return {
      updatedAssignments: existingAssignments,
      updatedSubmissions: existingSubmissions,
      addedSubmissionsCount: 0,
      addedAssignmentsCount: 0
    };
  } catch (err) {
    logger.error("Failed to sync assignments from Supabase storage bucket:", err);
    return {
      updatedAssignments: existingAssignments,
      updatedSubmissions: existingSubmissions,
      addedSubmissionsCount: 0,
      addedAssignmentsCount: 0
    };
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

