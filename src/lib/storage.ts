import { supabase } from './supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Supabase Storage에 이미지를 업로드하고 public URL을 반환합니다.
 */
export async function uploadImage(
  file: File,
  bucket: string,
  folder: string,
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('지원하지 않는 파일 형식입니다. (jpg, png, gif, webp만 가능)');
  }

  if (file.size > MAX_SIZE) {
    throw new Error('파일 크기는 5MB 이하만 가능합니다.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const fileName = folder + '/' + unique + '.' + ext;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error('업로드 실패: ' + error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Supabase Storage에서 이미지를 삭제합니다.
 */
export async function deleteImage(bucket: string, publicUrl: string): Promise<void> {
  const baseUrl = supabase.storage.from(bucket).getPublicUrl('').data.publicUrl;
  const path = publicUrl.replace(baseUrl, '');

  if (!path) {
    throw new Error('유효하지 않은 파일 경로입니다.');
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error('삭제 실패: ' + error.message);
  }
}
