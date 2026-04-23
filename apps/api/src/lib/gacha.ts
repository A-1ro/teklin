import type { TekkiCatalogItem, GachaRarity } from "@teklin/shared";

export const TEKKI_CATALOG: TekkiCatalogItem[] = [
  // N (60%)
  {
    id: "default",
    name: "Tekki",
    nameJa: "Tekki",
    rarity: "N",
    probability: 10,
  },
  {
    id: "cool",
    name: "Tekki Cool",
    nameJa: "クールTekki",
    rarity: "N",
    probability: 10,
  },
  {
    id: "pink",
    name: "Tekki Rose",
    nameJa: "ローズTekki",
    rarity: "N",
    probability: 10,
  },
  {
    id: "mint",
    name: "Tekki Mint",
    nameJa: "ミントTekki",
    rarity: "N",
    probability: 10,
  },
  {
    id: "night",
    name: "Tekki Night",
    nameJa: "ナイトTekki",
    rarity: "N",
    probability: 10,
  },
  {
    id: "sleepy",
    name: "Tekki Sleepy",
    nameJa: "スリーピーTekki",
    rarity: "N",
    probability: 10,
  },
  // R (30%)
  {
    id: "coral",
    name: "Tekki Coral",
    nameJa: "コーラルTekki",
    rarity: "R",
    probability: 8,
  },
  {
    id: "plum",
    name: "Tekki Plum",
    nameJa: "プラムTekki",
    rarity: "R",
    probability: 8,
  },
  {
    id: "gold",
    name: "Tekki Gold",
    nameJa: "ゴールドTekki",
    rarity: "R",
    probability: 7,
  },
  {
    id: "cat",
    name: "Tekki Cat",
    nameJa: "キャットTekki",
    rarity: "R",
    probability: 7,
  },
  // SR (8%)
  {
    id: "wizard",
    name: "Tekki Wizard",
    nameJa: "ウィザードTekki",
    rarity: "SR",
    probability: 3,
  },
  {
    id: "samurai",
    name: "Tekki Samurai",
    nameJa: "サムライTekki",
    rarity: "SR",
    probability: 3,
  },
  {
    id: "idol",
    name: "Tekki Idol",
    nameJa: "アイドルTekki",
    rarity: "SR",
    probability: 2,
  },
  // SSR (2%)
  {
    id: "cosmos",
    name: "Tekki Cosmos",
    nameJa: "コスモスTekki",
    rarity: "SSR",
    probability: 1,
  },
  {
    id: "angel",
    name: "Tekki Angel",
    nameJa: "エンジェルTekki",
    rarity: "SSR",
    probability: 1,
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
