export interface ExcelColumn {
  key: string;
  label: string;
  width?: number;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: Record<string, unknown>[];
}
