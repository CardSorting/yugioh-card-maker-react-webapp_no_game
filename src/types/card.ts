export interface Link {
  val: boolean;
  symbol: string;
}

// Base card creation interface
export interface Card {
  uiLang: string;
  cardLang: string;
  holo: boolean;
  cardRare: string;
  cardLoadYgoProEnabled: boolean;
  cardKey: string;
  cardTitle: string;
  cardImg: File | null;
  cardType: 'Monster' | 'Spell' | 'Trap';
  cardSubtype: string;
  cardEff1: string;
  cardEff2: string;
  cardAttr: string;
  cardCustomRaceEnabled: boolean;
  cardCustomRace: string;
  cardRace: string;
  Pendulum: boolean;
  Special: boolean;
  cardLevel: string;
  cardBLUE: number;
  cardRED: number;
  cardATK: string;
  cardDEF: string;
  pendulumSize: number;
  cardPendulumInfo: string;
  links: {
    [key: number]: Link;
  };
  infoSize: string;
  cardInfo: string;
}

export interface CardState extends Card {}

// Database card type with social features
export interface DBCard extends Card {
  id: string;
  user_id: string;
  created_at: string;
  card_image_path: string;
  likes_count: number;
  comments_count: number;
  isLiked: boolean;
  isBookmarked: boolean;
  creator_username?: string;
  creator_profile_image?: string;
}

export interface CardMeta {
  _offset: {
    tS: number;
    tX: number;
    tY: number;
    sS: number;
    sX1: number;
    sY1: number;
    sX2: number;
    sY2: number;
    oX: number;
    oY: number;
    lh: number;
  };
  _templateLang: string;
  _fontName: string[];
  name: string;
  QUOTE_L: string;
  QUOTE_R: string;
  SEP: string;
  Spell: string;
  Trap: string;
  Race: { [key: string]: string };
  Effect: { [key: string]: string };
  M_SPECIAL: string;
  M_PENDULUM: string;
  M_EFFECT: string;
  Subtype: { [key: string]: string };
  Default: {
    title: string;
    info: string;
    size: number;
    pInfo: string;
    pSize: number;
  };
}

export interface UI {
  [key: string]: {
    name: string;
    ui_lang: string;
    card_lang: string;
    square_foil_stamp: string;
    on: string;
    off: string;
    rarity: string;
    title_color: string;
    card_secret: string;
    auto_fill_card_data: string;
    card_secret_note: string;
    plz_input_card_secret: string;
    card_name: string;
    upload_image: string;
    drag_and_drop: string;
    card_type: string;
    card_subtype: string;
    card_effect: string;
    card_attribute: string;
    card_race_type: string;
    custom: string;
    plz_input_race_type: string;
    pendulum: string;
    special_summon: string;
    lavel_and_rank: string;
    pendulum_area: string;
    pendulum_blue: string;
    pendulum_red: string;
    text_size: string;
    card_info_text: string;
    attack: string;
    defence: string;
    link: string;
    generate: string;
    download: string;
    auto_gen_note: string;
    reset_to_default: string;
    monster_card: string;
    spell_card: string;
    trap_card: string;
    m_card: {
      normal: string;
      effect: string;
      fusion: string;
      ritual: string;
      synchro: string;
      xyz: string;
      link: string;
      token: string;
      slifer: string;
      ra: string;
      obelisk: string;
      ldragon: string;
    };
    st_card: {
      normal: string;
      continuous: string;
      field: string;
      equip: string;
      quick: string;
      ritual: string;
      counter: string;
    };
    card_effect_opts: {
      none: string;
      normal: string;
      toon: string;
      spirit: string;
      union: string;
      gemini: string;
      flip: string;
      tuner: string;
    };
    card_attr_opts: {
      divine: string;
      earth: string;
      water: string;
      fire: string;
      wind: string;
      light: string;
      dark: string;
    };
    card_race_type_opts: { [key: string]: string };
  };
}
