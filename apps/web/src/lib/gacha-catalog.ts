import type { TekkiId, GachaRarity } from "@teklin/shared";

export interface CatalogItem {
  id: TekkiId;
  nameJa: string;
  rarity: GachaRarity;
}

export const TEKKI_CATALOG_ITEMS: CatalogItem[] = [
  // N
  { id: "default", nameJa: "テッキ", rarity: "N" },
  { id: "cool", nameJa: "クールテッキ", rarity: "N" },
  { id: "pink", nameJa: "ローズテッキ", rarity: "N" },
  { id: "mint", nameJa: "ミントテッキ", rarity: "N" },
  { id: "night", nameJa: "ナイトテッキ", rarity: "N" },
  { id: "sleepy", nameJa: "スリーピーテッキ", rarity: "N" },
  // R
  { id: "coral", nameJa: "コーラルテッキ", rarity: "R" },
  { id: "plum", nameJa: "プラムテッキ", rarity: "R" },
  { id: "gold", nameJa: "ゴールドテッキ", rarity: "R" },
  { id: "cat", nameJa: "キャットテッキ", rarity: "R" },
  // SR
  { id: "wizard", nameJa: "ウィザードテッキ", rarity: "SR" },
  { id: "samurai", nameJa: "サムライテッキ", rarity: "SR" },
  { id: "idol", nameJa: "アイドルテッキ", rarity: "SR" },
  // SSR
  { id: "cosmos", nameJa: "コスモステッキ", rarity: "SSR" },
  { id: "angel", nameJa: "エンジェルテッキ", rarity: "SSR" },
];

export const TEKKI_CATALOG_LENGTH = TEKKI_CATALOG_ITEMS.length;
