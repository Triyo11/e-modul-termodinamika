import type { BlokKuis, Kegiatan } from "@/types/kegiatan";

/**
 * Soal yang tampil di panel kuis samping untuk satu KB.
 * SEMENTARA: memakai blok kuis yang sudah ada di dalam tahap KB (7 soal per KB) untuk keperluan tata letak.
 * Nanti diganti soal kuis baru; cukup ubah fungsi ini (mis. membaca field baru di JSON kegiatan).
 */
export function soalKuisPanel(kegiatan: Kegiatan): BlokKuis[] {
  return kegiatan.layar.flatMap((l) => l.blok.filter((b): b is BlokKuis => b.tipe === "kuis"));
}

/** Kunci localStorage jawaban panel kuis, terpisah dari kuis di dalam tahap. */
export function kunciJawabanPanel(kegiatanId: string, soalId: string): string {
  return `panel-kuis:${kegiatanId}:${soalId}`;
}
