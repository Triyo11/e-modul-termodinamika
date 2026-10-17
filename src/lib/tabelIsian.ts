import { inject, type InjectionKey, type Ref } from "vue";
import type { Blok, Kegiatan, KolomTabelIsian } from "@/types/kegiatan";

/** Satu baris tabel-isian seperti yang disimpan: kunci kolom -> teks masukan. */
export type BarisTabel = Record<string, string>;

export const kegiatanKey: InjectionKey<Readonly<Ref<Kegiatan>>> = Symbol("kegiatan");

/** Mencari blok berdasarkan id di seluruh layar kegiatan yang sedang dibuka. */
export function useCariBlok() {
  const kegiatan = inject(kegiatanKey, null);
  return (id: string): Blok | undefined => {
    for (const l of kegiatan?.value.layar ?? []) {
      const b = l.blok.find((x) => "id" in x && x.id === id);
      if (b) return b;
    }
    return undefined;
  };
}

/** Mengubah teks masukan menjadi angka (menerima koma desimal). */
export function keAngka(teks: string | undefined): number | null {
  if (teks === undefined || teks.trim() === "") return null;
  const n = Number(teks.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Mengevaluasi ekspresi aritmetika sederhana (+ - * / dan kurung) dengan variabel
 * dari `nilai`. Mengembalikan null jika ada variabel kosong atau hasil tidak terhingga.
 */
export function evalEkspresi(ekspresi: string, nilai: Record<string, number | null>): number | null {
  const token = ekspresi.match(/\d+(?:\.\d+)?|[A-Za-z_]\w*|[-+*/()]/g) ?? [];
  let i = 0;

  function faktor(): number | null {
    const t = token[i++];
    if (t === "(") {
      const v = jumlah();
      i++; // ")"
      return v;
    }
    if (t === "-") {
      const v = faktor();
      return v === null ? null : -v;
    }
    if (t !== undefined && /^\d/.test(t)) return Number(t);
    if (t !== undefined && t in nilai) return nilai[t] ?? null;
    return null;
  }

  function kali(): number | null {
    let v = faktor();
    while (token[i] === "*" || token[i] === "/") {
      const op = token[i++];
      const r = faktor();
      if (v === null || r === null) v = null;
      else v = op === "*" ? v * r : v / r;
    }
    return v;
  }

  function jumlah(): number | null {
    let v = kali();
    while (token[i] === "+" || token[i] === "-") {
      const op = token[i++];
      const r = kali();
      if (v === null || r === null) v = null;
      else v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  const hasil = jumlah();
  return hasil !== null && Number.isFinite(hasil) ? hasil : null;
}

/** Nilai numerik setiap kolom (termasuk kolom hitung) untuk satu baris. */
export function nilaiBaris(kolom: KolomTabelIsian[], baris: BarisTabel): Record<string, number | null> {
  const nilai: Record<string, number | null> = {};
  for (const k of kolom) {
    if (k.tipe === "angka") nilai[k.kunci] = keAngka(baris[k.kunci]);
  }
  for (const k of kolom) {
    if (k.tipe === "hitung" && k.hitung) nilai[k.kunci] = evalEkspresi(k.hitung, nilai);
  }
  return nilai;
}

export function formatAngka(n: number | null): string {
  if (n === null) return "–";
  const abs = Math.abs(n);
  const teks = abs !== 0 && (abs < 0.001 || abs >= 1e6) ? n.toExponential(3) : String(Number(n.toPrecision(4)));
  return teks.replace(".", ",");
}
