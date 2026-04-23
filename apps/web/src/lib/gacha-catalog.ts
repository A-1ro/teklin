import type { TekkiId, GachaRarity } from "@teklin/shared";

export interface CatalogItem {
  id: TekkiId;
  nameJa: string;
  rarity: GachaRarity;
}

export const TEKKI_CATALOG_ITEMS: CatalogItem[] = [
  // N
  { id: "default", nameJa: "Tekki", rarity: "N" },
  { id: "cool", nameJa: "クールTekki", rarity: "N" },
  { id: "pink", nameJa: "ローズTekki", rarity: "N" },
  { id: "mint", nameJa: "ミントTekki", rarity: "N" },
  { id: "night", nameJa: "ナイトTekki", rarity: "N" },
  { id: "sleepy", nameJa: "スリーピーTekki", rarity: "N" },
  // R
  { id: "coral", nameJa: "コーラルTekki", rarity: "R" },
  { id: "plum", nameJa: "プラムTekki", rarity: "R" },
  { id: "gold", nameJa: "ゴールドTekki", rarity: "R" },
  { id: "cat", nameJa: "キャットTekki", rarity: "R" },
  // SR
  { id: "wizard", nameJa: "ウィザードTekki", rarity: "SR" },
  { id: "samurai", nameJa: "サムライTekki", rarity: "SR" },
  { id: "idol", nameJa: "アイドルTekki", rarity: "SR" },
  // SSR
  { id: "cosmos", nameJa: "コスモスTekki", rarity: "SSR" },
  { id: "angel", nameJa: "エンジェルTekki", rarity: "SSR" },
];

export const TEKKI_CATALOG_LENGTH = TEKKI_CATALOG_ITEMS.length;
