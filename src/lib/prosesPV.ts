import type { ProsesPV } from "@/types/kegiatan";

export interface TitikPV {
  p: number;
  V: number;
}

export const labelProses: Record<ProsesPV, string> = {
  isobarik: "Isobarik",
  isokhorik: "Isokhorik",
  isotermal: "Isotermal",
};

/** Usaha oleh gas sepanjang satu proses (luas di bawah lintasan, bertanda): W = ∫ p dV. */
export function usahaProses(proses: ProsesPV, a: TitikPV, b: TitikPV): number {
  if (proses === "isobarik") return a.p * (b.V - a.V);
  if (proses === "isokhorik") return 0;
  if (a.V <= 0 || b.V <= 0) return 0;
  return a.p * a.V * Math.log(b.V / a.V);
}

/** Titik-titik lintasan untuk digambar; isotermal disampel sebagai hiperbola pV = konstan. */
export function sampelLintasan(proses: ProsesPV, a: TitikPV, b: TitikPV, n = 40): TitikPV[] {
  if (proses !== "isotermal") return [a, b];
  const k = a.p * a.V;
  return Array.from({ length: n + 1 }, (_, i) => {
    const V = a.V + ((b.V - a.V) * i) / n;
    return { V, p: k / V };
  });
}

/** True jika b dapat dicapai dari a melalui proses tersebut (dalam toleransi relatif). */
export function bisaDicapai(proses: ProsesPV, a: TitikPV, b: TitikPV, tol = 1e-6): boolean {
  const dekat = (x: number, y: number) => Math.abs(x - y) <= tol * Math.max(1, Math.abs(x), Math.abs(y));
  if (proses === "isobarik") return dekat(a.p, b.p);
  if (proses === "isokhorik") return dekat(a.V, b.V);
  return dekat(a.p * a.V, b.p * b.V);
}

/** Satuan usaha: kPa·L = J; selain itu tampilkan hasil kali satuannya. */
export function satuanUsaha(satuanP: string, satuanV: string): string {
  if (satuanP === "kPa" && satuanV === "L") return "J";
  if (satuanP === "Pa" && satuanV === "m³") return "J";
  return `${satuanP}·${satuanV}`;
}

export function formatDesimal(n: number, digit = 1): string {
  const r = Number(n.toFixed(digit));
  return (r === 0 ? 0 : r).toFixed(digit).replace(".", ","); // hindari "-0,0"
}
