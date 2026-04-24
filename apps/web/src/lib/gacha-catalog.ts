import type { TekkiId, GachaRarity } from "@teklin/shared";

export interface CatalogItem {
  id: TekkiId;
  nameJa: string;
  rarity: GachaRarity;
  description: string;
}

export const TEKKI_CATALOG_ITEMS: CatalogItem[] = [
  // N
  {
    id: "default",
    nameJa: "Tekki",
    rarity: "N",
    description:
      "すべてのTekkiの原型。技術英語の世界へ飛び込む好奇心旺盛なマスコット。口ぐせは「Let's ship it!」",
  },
  {
    id: "cool",
    nameJa: "クールTekki",
    rarity: "N",
    description:
      "ダークなサングラスがトレードマーク。コードレビューは的確だけど、コメントはいつもクールに一言だけ。",
  },
  {
    id: "pink",
    nameJa: "ローズTekki",
    rarity: "N",
    description:
      "ハートのほっぺが可愛いロマンチスト。ペアプログラミングが大好きで、いつもパートナーを探している。",
  },
  {
    id: "mint",
    nameJa: "ミントTekki",
    rarity: "N",
    description:
      "爽やかなミントグリーンのボディに星の輝き。リファクタリングでコードをピカピカにするのが得意。",
  },
  {
    id: "night",
    nameJa: "ナイトTekki",
    rarity: "N",
    description:
      "星空を纏う夜型エンジニア。深夜のデプロイを見守る頼もしい存在。星の瞳で全てのバグを見逃さない。",
  },
  {
    id: "sleepy",
    nameJa: "スリーピーTekki",
    rarity: "N",
    description:
      "ナイトキャップをかぶったお昼寝好き。でも寝ている間もCI/CDパイプラインの夢を見ているらしい。",
  },
  // R
  {
    id: "coral",
    nameJa: "コーラルTekki",
    rarity: "R",
    description:
      "金の王冠を戴くリーダー格。チームのテックリードとしてPRを素早くマージし、プロジェクトを導く。",
  },
  {
    id: "plum",
    nameJa: "プラムTekki",
    rarity: "R",
    description:
      "三日月のバッジを持つ神秘的な存在。難解なアルゴリズムを美しく実装する天才肌。",
  },
  {
    id: "gold",
    nameJa: "ゴールドTekki",
    rarity: "R",
    description:
      "全身が黄金に輝くゴージャスなTekki。パフォーマンス最適化のスペシャリストで、レスポンスタイムを金に変える。",
  },
  {
    id: "cat",
    nameJa: "キャットTekki",
    rarity: "R",
    description:
      "猫耳とヒゲが特徴の気まぐれな性格。キーボードの上を歩くのが趣味だけど、なぜかいいコードが書ける。",
  },
  // SR
  {
    id: "wizard",
    nameJa: "ウィザードTekki",
    rarity: "SR",
    description:
      "魔法使いの帽子と金の星が目印。どんな複雑なバグもmagical debuggingで一瞬で解決してしまう伝説のTekki。",
  },
  {
    id: "samurai",
    nameJa: "サムライTekki",
    rarity: "SR",
    description:
      "兜を纏う武士の魂を持つTekki。コードの品質に一切の妥協を許さず、テストカバレッジ100%を貫く侍。",
  },
  {
    id: "idol",
    nameJa: "アイドルTekki",
    rarity: "SR",
    description:
      "リボンとマイクでステージに立つスターTekki。カンファレンスのLTで会場を盛り上げるプレゼンの達人。",
  },
  // SSR
  {
    id: "cosmos",
    nameJa: "コスモスTekki",
    rarity: "SSR",
    description:
      "宇宙の深淵を宿す伝説のTekki。シアンに光る瞳は無限のスケーラビリティを見通す。分散システムの守護者。",
  },
  {
    id: "angel",
    nameJa: "エンジェルTekki",
    rarity: "SSR",
    description:
      "金のヘイローと白い翼を持つ天使のTekki。本番障害の夜にそっと現れ、チームを導く奇跡のデバッガー。",
  },
];

export const TEKKI_CATALOG_LENGTH = TEKKI_CATALOG_ITEMS.length;
