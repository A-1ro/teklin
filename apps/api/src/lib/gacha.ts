import type { TekkiCatalogItem, GachaRarity } from "@teklin/shared";

export const TEKKI_CATALOG: TekkiCatalogItem[] = [
  {
    id: "default",
    name: "Tekki",
    nameJa: "テッキ",
    rarity: "N",
    probability: 14,
  },
  {
    id: "cool",
    name: "Tekki Cool",
    nameJa: "クールテッキ",
    rarity: "N",
    probability: 13,
  },
  {
    id: "pink",
    name: "Tekki Rose",
    nameJa: "ローズテッキ",
    rarity: "N",
    probability: 12,
  },
  {
    id: "mint",
    name: "Tekki Mint",
    nameJa: "ミントテッキ",
    rarity: "N",
    probability: 11,
  },
  {
    id: "night",
    name: "Tekki Night",
    nameJa: "ナイトテッキ",
    rarity: "N",
    probability: 10,
  },
  {
    id: "coral",
    name: "Tekki Coral",
    nameJa: "コーラルテッキ",
    rarity: "R",
    probability: 10,
  },
  {
    id: "plum",
    name: "Tekki Plum",
    nameJa: "プラムテッキ",
    rarity: "R",
    probability: 10,
  },
  {
    id: "gold",
    name: "Tekki Gold",
    nameJa: "ゴールドテッキ",
    rarity: "R",
    probability: 10,
  },
  {
    id: "wizard",
    name: "Tekki Wizard",
    nameJa: "ウィザードテッキ",
    rarity: "SR",
    probability: 8,
  },
  {
    id: "cosmos",
    name: "Tekki Cosmos",
    nameJa: "コスモステッキ",
    rarity: "SSR",
    probability: 2,
  },
];

// Total probability must sum to 100
const TOTAL_WEIGHT = TEKKI_CATALOG.reduce((sum, t) => sum + t.probability, 0);

export function drawTekki(): TekkiCatalogItem {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const item of TEKKI_CATALOG) {
    roll -= item.probability;
    if (roll <= 0) return item;
  }
  return TEKKI_CATALOG[TEKKI_CATALOG.length - 1];
}

export const GACHA_COST: Record<1 | 10, number> = {
  1: 100,
  10: 1000,
};

export const RARITY_LABEL: Record<GachaRarity, string> = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
};
