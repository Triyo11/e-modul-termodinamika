import type { Kegiatan } from "@/types/kegiatan";
import kb1 from "./kegiatan-01-gas-ideal.json";
import kb2 from "./kegiatan-02-konsep-dasar-termodinamika.json";
import kb3 from "./kegiatan-03-proses-termodinamika.json";
import kb4 from "./kegiatan-04-hukum-termodinamika.json";
import kb5 from "./kegiatan-05-mesin-kalor-pompa-kalor.json";

/** Semua kegiatan belajar, urut berdasarkan nomor KB. Tambahkan berkas baru di sini. */
export const daftarKegiatan: Kegiatan[] = ([kb1, kb2, kb3, kb4, kb5] as unknown as Kegiatan[]).sort(
  (a, b) => (a.kb ?? 0) - (b.kb ?? 0),
);

export function cariKegiatanKb(kb: number): Kegiatan | undefined {
  return daftarKegiatan.find((k) => k.kb === kb);
}
