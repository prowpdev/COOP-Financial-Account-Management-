import { db } from '../db/database';

export class NumberingService {
  /**
   * Generates next document sequence based on configured numbering pattern
   */
  public static getNextNumber(moduleIdOrPrefix: string, branchCode: string = 'MAIN'): string {
    const formats = db.getTable('numbering_formats');
    const branches = db.getTable('branches');
    
    // Find format by prefix or module
    let fmt = formats.find(f => 
      f.prefix.toLowerCase() === moduleIdOrPrefix.toLowerCase() ||
      f.module.toLowerCase().includes(moduleIdOrPrefix.toLowerCase()) ||
      f.id === moduleIdOrPrefix
    );

    if (!fmt) {
      // Fallback format
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      return `${branchCode}-${moduleIdOrPrefix.toUpperCase()}-${year}-${rand}`;
    }

    const currentSeq = (fmt.current_seq || 0) + 1;
    fmt.current_seq = currentSeq;
    db.update('numbering_formats', f => f.id === fmt.id, () => fmt);

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const paddedSeq = String(currentSeq).padStart(fmt.length || 6, '0');

    // Pattern replacements
    let result = fmt.pattern || '{BRANCH}-{PREFIX}-{YEAR}-{NUMBER}';
    result = result.replace('{BRANCH}', branchCode || 'MAIN');
    result = result.replace('{PREFIX}', fmt.prefix);
    result = result.replace('{YEAR}', String(year));
    result = result.replace('{MONTH}', month);
    result = result.replace('{NUMBER}', paddedSeq);

    return result;
  }
}
