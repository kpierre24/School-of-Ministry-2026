import { exportReportToCSV, generateReportPDF, ReportColumn, ReportSummaryMetric } from '../../lib/reportExporter';

export class ReportService {
  /**
   * Export dataset to CSV
   */
  public exportCSV(title: string, columns: ReportColumn[], rows: Record<string, any>[]): void {
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportReportToCSV(filename, columns, rows);
  }

  /**
   * Generate downloadable PDF document
   */
  public async exportPDF(
    title: string,
    filterSummary: string[],
    columns: ReportColumn[],
    rows: Record<string, any>[],
    metrics: ReportSummaryMetric[] = []
  ): Promise<void> {
    await generateReportPDF(title, filterSummary, metrics, columns, rows);
  }
}

export const reportService = new ReportService();
