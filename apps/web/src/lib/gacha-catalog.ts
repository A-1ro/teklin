import type { TekkiId, GachaRarity } from "@teklin/shared";

export interface CatalogItem {
  id: TekkiId;
  nameJa: string;
  rarity: GachaRarity;
}

export const TEKKI_CATALOG_ITEMS: CatalogItem[] = [
  { id: "default", nameJa: "テッキ", rarity: "N" },
  { id: "cool", nameJa: "クールテッキ", rarity: "N" },
  { id: "pink", nameJa: "ローズテッキ", rarity: "N" },
  { id: "mint", nameJa: "ミントテッキ", rarity: "N" },
  { id: "night", nameJa: "ナイトテッキ", rarity: "N" },
  { id: "coral", nameJa: "コーラルテッキ", rarity: "R" },
  { id: "plum", nameJa: "プラムテッキ", rarity: "R" },
  { id: "gold", nameJa: "ゴールドテッキ", rarity: "R" },
  { id: "wizard", nameJa: "ウィザードテッキ", rarity: "SR" },
  { id: "cosmos", nameJa: "コスモステッキ", rarity: "SSR" },
];

export const TEKKI_CATALOG_LENGTH = TEKKI_CATALOG_ITEMS.length;
