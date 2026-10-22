import { RequiredDocument, UploadedFile, Service } from '../types';

/**
 * Common file signatures (magic bytes)
 */
const MAGIC_SIGNATURES: Record<string, number[][]> = {
  PDF: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  JPG: [[0xff, 0xd8, 0xff]], // JPEG header
  JPEG: [[0xff, 0xd8, 0xff]],
  PNG: [[0x89, 0x50, 0x4e, 0x47]], // PNG header
};

/**
 * Sanitize filename to prevent path traversal and unsafe character injection
 */
export function sanitizeFileName(fileName: string): string {
  // Strip paths
  const base = fileName.replace(/^.*[\\/]/, '');
  // Replace unsafe chars
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

/**
 * Read the first few bytes of a file to inspect signature
 */
async function checkMagicBytes(file: File, allowedFormats: string[]): Promise<boolean> {
  try {
    const slice = file.slice(0, 8);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Normalize allowed formats
    const formats = allowedFormats.map((f) => f.toUpperCase());
    if (formats.includes('JPG') && !formats.includes('JPEG')) formats.push('JPEG');

    for (const fmt of formats) {
      const signatures = MAGIC_SIGNATURES[fmt];
      if (!signatures) continue;

      for (const sig of signatures) {
        let match = true;
        for (let i = 0; i < sig.length; i++) {
          if (bytes[i] !== sig[i]) {
            match = false;
            break;
          }
        }
        if (match) return true;
      }
    }

    return false;
  } catch {
    // If buffer reading fails, fallback to mime & extension
    return true;
  }
}

/**
 * Validate a user-selected file against service document requirements
 */
export async function validateDocumentFile(
  file: File,
  rule: RequiredDocument
): Promise<{ valid: boolean; error?: string }> {
  // 1. Check file existence and non-empty
  if (!file || file.size === 0) {
    return { valid: false, error: `The file "${file?.name || 'unknown'}" is empty (0 bytes).` };
  }

  // 2. Check maximum size in MB
  const maxBytes = rule.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds maximum allowed limit of ${rule.maxSizeMB} MB for "${rule.name}".`,
    };
  }

  // 3. Check file extension
  const ext = file.name.split('.').pop()?.toUpperCase() || '';
  const normalizedAllowed = rule.acceptedFormats.map((f: string) => f.toUpperCase());
  const isExtAllowed =
    normalizedAllowed.includes(ext) ||
    (ext === 'JPEG' && normalizedAllowed.includes('JPG')) ||
    (ext === 'JPG' && normalizedAllowed.includes('JPEG'));

  if (!isExtAllowed) {
    return {
      valid: false,
      error: `Invalid file extension ".${ext.toLowerCase()}". "${rule.name}" only accepts ${rule.acceptedFormats.join(', ')} files.`,
    };
  }

  // 4. Check MIME type
  const mime = file.type.toLowerCase();
  const allowedMimes: Record<string, string[]> = {
    PDF: ['application/pdf'],
    JPG: ['image/jpeg', 'image/pjpeg'],
    JPEG: ['image/jpeg', 'image/pjpeg'],
    PNG: ['image/png'],
  };

  if (mime) {
    const validMimesForExt = normalizedAllowed.flatMap((fmt: string) => allowedMimes[fmt] || []);
    if (validMimesForExt.length > 0 && !validMimesForExt.some((m: string) => mime.includes(m))) {
      return {
        valid: false,
        error: `Invalid file format (${mime}). The uploaded file type does not match ${rule.acceptedFormats.join(', ')}.`,
      };
    }
  }

  // 5. Inspect magic bytes signature for PDF/JPG/PNG
  const isSignatureValid = await checkMagicBytes(file, rule.acceptedFormats);
  if (!isSignatureValid) {
    return {
      valid: false,
      error: `File header mismatch: "${file.name}" does not match genuine ${rule.acceptedFormats.join('/')} binary structure. Please upload an authentic file.`,
    };
  }

  return { valid: true };
}

/**
 * Validate that all mandatory documents for a service are attached
 */
export function validateMandatoryDocuments(
  service: Service,
  uploadedFiles: UploadedFile[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const doc of service.requiredDocuments) {
    if (doc.mandatory) {
      const exists = uploadedFiles.some((f: UploadedFile) => f.docId === doc.id);
      if (!exists) {
        missing.push(doc.name);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
