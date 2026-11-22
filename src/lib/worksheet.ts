import { toRaw, type InjectionKey, type Ref } from "vue";
import type { Blok, Kegiatan } from "@/types/kegiatan";

/** Tipe blok yang dikerjakan murid dan diberi label "Student e-Worksheet". Kuis dan rubrik tidak termasuk. */
const TIPE_WORKSHEET = new Set<Blok["tipe"]>([
  "isian",
  "kebutuhan-informasi",
  "tabel-isian",
  "klaim-uji",
  "refleksi",
  "tugas-rancangan",
  "tugas-rancangan-lanjutan",
]);

/**
 * Menomori blok worksheet sesuai urutan kemunculan di seluruh layar satu KB, mis. "1.3".
 * Nomor tidak diambil dari id blok (mis. lkpd-1-12) karena urutan id tidak berurutan.
 * Kunci peta adalah objek bloknya, sebab tugas-rancangan-lanjutan tidak punya id.
 */
export function hitungNomorWorksheet(kegiatan: Kegiatan): Map<Blok, string> {
  const nomor = new Map<Blok, string>();
  let n = 0;
  for (const layar of kegiatan.layar) {
    for (const blok of layar.blok) {
      if (!TIPE_WORKSHEET.has(blok.tipe)) continue;
      n += 1;
      nomor.set(toRaw(blok), kegiatan.kb === undefined ? String(n) : `${kegiatan.kb}.${n}`);
    }
  }
  return nomor;
}

export const nomorWorksheetKey: InjectionKey<Readonly<Ref<Map<Blok, string>>>> = Symbol("nomorWorksheet");
