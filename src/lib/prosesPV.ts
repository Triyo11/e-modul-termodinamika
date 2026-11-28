import type { ProsesPV } from "@/types/kegiatan";

export interface TitikPV {
  p: number;
  V: number;
}

/** Tetapan Laplace bawaan untuk proses adiabatik: udara (gas diatomik) pada suhu sedang. */
export const GAMMA_BAWAAN = 1.4;

export const labelProses: Record<ProsesPV, string> = {
  isobarik: "Isobarik",
  isokhorik: "Isokhorik",
  isotermal: "Isotermal",
  adiabatik: "Adiabatik",
};

/** Tetapan adiabat yang melalui titik a: p V^gamma. */
export const tetapanAdiabat = (a: TitikPV, gamma = GAMMA_BAWAAN) => a.p * Math.pow(a.V, gamma);

/**
 * Usaha oleh gas sepanjang satu proses (luas di bawah lintasan, bertanda): W = ∫ p dV.
 * Adiabatik: W = (p1V1 − p2V2)/(γ − 1), berlaku jika b terletak pada adiabat yang melalui a.
 */
export function usahaProses(proses: ProsesPV, a: TitikPV, b: TitikPV, gamma = GAMMA_BAWAAN): number {
  if (proses === "isobarik") return a.p * (b.V - a.V);
  if (proses === "isokhorik") return 0;
  if (proses === "adiabatik") return (a.p * a.V - b.p * b.V) / (gamma - 1);
  if (a.V <= 0 || b.V <= 0) return 0;
  return a.p * a.V * Math.log(b.V / a.V);
}

/** Titik-titik lintasan untuk digambar; isotermal (pV tetap) dan adiabatik (pV^γ tetap) disampel sebagai kurva. */
export function sampelLintasan(proses: ProsesPV, a: TitikPV, b: TitikPV, n = 40, gamma = GAMMA_BAWAAN): TitikPV[] {
  if (proses === "isobarik" || proses === "isokhorik") return [a, b];
  const pada = (V: number) =>
    proses === "isotermal" ? (a.p * a.V) / V : tetapanAdiabat(a, gamma) / Math.pow(V, gamma);
  return Array.from({ length: n + 1 }, (_, i) => {
    const V = a.V + ((b.V - a.V) * i) / n;
    return { V, p: pada(V) };
  });
}

/** True jika b dapat dicapai dari a melalui proses tersebut (dalam toleransi relatif). */
export function bisaDicapai(proses: ProsesPV, a: TitikPV, b: TitikPV, tol = 1e-6, gamma = GAMMA_BAWAAN): boolean {
  const dekat = (x: number, y: number) => Math.abs(x - y) <= tol * Math.max(1, Math.abs(x), Math.abs(y));
  if (proses === "isobarik") return dekat(a.p, b.p);
  if (proses === "isokhorik") return dekat(a.V, b.V);
  if (proses === "adiabatik") return dekat(tetapanAdiabat(a, gamma), tetapanAdiabat(b, gamma));
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
