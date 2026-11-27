import type { Kegiatan, Layar } from "@/types/kegiatan";

/** Label tahap STEM-CTL (skema 2.0) dan peran layar lama (skema 1.x). */
export const labelTahap: Record<string, string> = {
  apersepsi: "Apersepsi",
  konsep: "Konsep",
  penerapan: "Penerapan",
  latihan: "Latihan",
  konstruktivisme: "Konstruktivisme",
  inkuiri: "Inkuiri",
  bertanya: "Bertanya",
  "masyarakat-belajar": "Masyarakat belajar",
  pemodelan: "Pemodelan",
  refleksi: "Refleksi",
  "penilaian-autentik": "Penilaian autentik",
};

/** Warna pastel per tahap STEM-CTL (token di style.css), untuk judul dan label tahap. */
export const warnaTahap: Record<string, string> = {
  konstruktivisme: "var(--color-pastel-pink)",
  inkuiri: "var(--color-pastel-biru)",
  bertanya: "var(--color-pastel-kuning)",
  "masyarakat-belajar": "var(--color-pastel-mint)",
  pemodelan: "var(--color-pastel-peach)",
  refleksi: "var(--color-pastel-lavender)",
  "penilaian-autentik": "var(--color-pastel-pink)",
};

export interface Tahap {
  /** Dipakai di URL, mis. /materi/1/inkuiri. */
  id: string;
  label: string;
  /** Semua layar milik tahap ini, urut seperti di berkas konten (KB 1 punya dua layar inkuiri). */
  layar: Layar[];
}

export function idTahapLayar(l: Layar): string {
  return l.tahap ?? l.peran ?? l.id;
}

/** Mengelompokkan layar kegiatan per tahap, urut menurut kemunculan pertama tiap tahap. */
export function kelompokkanTahap(kegiatan: Kegiatan): Tahap[] {
  const peta = new Map<string, Layar[]>();
  for (const l of kegiatan.layar) {
    const id = idTahapLayar(l);
    const daftar = peta.get(id);
    if (daftar) daftar.push(l);
    else peta.set(id, [l]);
  }
  return [...peta].map(([id, layar]) => ({ id, label: labelTahap[id] ?? layar[0]!.judul, layar }));
}

// ---------- Riwayat tahap per KB (localStorage) ----------
const kunciDibuka = (kb: number) => `materi:tahap-dibuka:${kb}`;
const kunciTerakhir = (kb: number) => `materi:tahap-terakhir:${kb}`;

export function bacaTahapDibuka(kb: number): string[] {
  try {
    const isi = JSON.parse(localStorage.getItem(kunciDibuka(kb)) ?? "[]");
    return Array.isArray(isi) ? isi.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function catatTahapDibuka(kb: number, id: string): string[] {
  const daftar = bacaTahapDibuka(kb);
  if (!daftar.includes(id)) daftar.push(id);
  try {
    localStorage.setItem(kunciDibuka(kb), JSON.stringify(daftar));
    localStorage.setItem(kunciTerakhir(kb), id);
  } catch {
    /* localStorage tidak tersedia */
  }
  return daftar;
}

export function bacaTahapTerakhir(kb: number): string | null {
  try {
    return localStorage.getItem(kunciTerakhir(kb));
  } catch {
    return null;
  }
}
