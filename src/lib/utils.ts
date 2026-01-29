export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ko-KR');
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('ko-KR');
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
}
