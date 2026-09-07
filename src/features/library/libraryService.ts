import { LibraryResource } from '../../types';
import { LibraryFilterOptions } from './librarySchemas';

export class LibraryService {
  /**
   * Filter library resources by search query, category, or format
   */
  public filterResources(
    resources: LibraryResource[],
    options: LibraryFilterOptions
  ): LibraryResource[] {
    const q = options.searchQuery.toLowerCase().trim();

    return resources.filter(res => {
      const matchSearch = !q ||
        res.title.toLowerCase().includes(q) ||
        (res.summary && res.summary.toLowerCase().includes(q)) ||
        (res.category && res.category.toLowerCase().includes(q)) ||
        (res.author && res.author.toLowerCase().includes(q)) ||
        (res.scriptureReferences && res.scriptureReferences.some(s => s.toLowerCase().includes(q)));

      const matchCategory = !options.category || options.category === 'all' || res.category?.toLowerCase() === options.category.toLowerCase();
      
      let matchType = true;
      if (options.mediaType && options.mediaType !== 'all') {
        const fileExt = (res.format || res.downloadUrl || res.fileDataUrl || '').toLowerCase();
        if (options.mediaType === 'pdf') matchType = fileExt.includes('pdf');
        else if (options.mediaType === 'docx') matchType = fileExt.includes('doc') || fileExt.includes('word');
        else if (options.mediaType === 'audio') matchType = fileExt.includes('mp3') || fileExt.includes('m4a');
        else if (options.mediaType === 'video') matchType = fileExt.includes('mp4') || fileExt.includes('youtube');
      }

      return matchSearch && matchCategory && matchType;
    });
  }

  /**
   * Extract scripture references from library catalog
   */
  public getUniqueScriptures(resources: LibraryResource[]): string[] {
    const refs = new Set<string>();
    resources.forEach(r => {
      if (Array.isArray(r.scriptureReferences)) {
        r.scriptureReferences.forEach(s => refs.add(s));
      }
    });
    return Array.from(refs);
  }
}

export const libraryService = new LibraryService();
