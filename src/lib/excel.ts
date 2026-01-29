import * as XLSX from 'xlsx';

interface Column {
  key: string;
  label: string;
}

export function downloadExcel(
  data: Record<string, unknown>[],
  columns: Column[],
  filename: string,
) {
  // 헤더 라벨 배열
  const header = columns.map((c) => c.label);

  // 데이터를 헤더 순서에 맞게 2차원 배열로 변환
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      return val === null || val === undefined ? '' : val;
    }),
  );

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // 컬럼 너비 자동 조정
  ws['!cols'] = columns.map((c) => {
    const maxLen = Math.max(
      c.label.length,
      ...rows.map((r) => {
        const idx = columns.indexOf(c);
        const val = String(r[idx] ?? '');
        return val.length;
      }),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });

  // 워크북 생성 & 다운로드
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const safeName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, safeName);
}
