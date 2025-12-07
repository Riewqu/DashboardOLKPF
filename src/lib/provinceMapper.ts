/**
 * Thailand Province Normalization
 * Maps various province name formats to standard Thai province names
 */

export type ThaiProvince =
  | "กรุงเทพมหานคร"
  | "กระบี่"
  | "กาญจนบุรี"
  | "กาฬสินธุ์"
  | "กำแพงเพชร"
  | "ขอนแก่น"
  | "จันทบุรี"
  | "ฉะเชิงเทรา"
  | "ชลบุรี"
  | "ชัยนาท"
  | "ชัยภูมิ"
  | "ชุมพร"
  | "เชียงราย"
  | "เชียงใหม่"
  | "ตรัง"
  | "ตราด"
  | "ตาก"
  | "นครนายก"
  | "นครปฐม"
  | "นครพนม"
  | "นครราชสีมา"
  | "นครศรีธรรมราช"
  | "นครสวรรค์"
  | "นนทบุรี"
  | "นราธิวาส"
  | "น่าน"
  | "บึงกาฬ"
  | "บุรีรัมย์"
  | "ปทุมธานี"
  | "ประจวบคีรีขันธ์"
  | "ปราจีนบุรี"
  | "ปัตตานี"
  | "พระนครศรีอยุธยา"
  | "พังงา"
  | "พัทลุง"
  | "พิจิตร"
  | "พิษณุโลก"
  | "เพชรบุรี"
  | "เพชรบูรณ์"
  | "แพร่"
  | "พะเยา"
  | "ภูเก็ต"
  | "มหาสารคาม"
  | "มุกดาหาร"
  | "แม่ฮ่องสอน"
  | "ยโสธร"
  | "ยะลา"
  | "ร้อยเอ็ด"
  | "ระนอง"
  | "ระยอง"
  | "ราชบุรี"
  | "ลพบุรี"
  | "ลำปาง"
  | "ลำพูน"
  | "เลย"
  | "ศรีสะเกษ"
  | "สกลนคร"
  | "สงขลา"
  | "สตูล"
  | "สมุทรปราการ"
  | "สมุทรสงคราม"
  | "สมุทรสาคร"
  | "สระแก้ว"
  | "สระบุรี"
  | "สิงห์บุรี"
  | "สุโขทัย"
  | "สุพรรณบุรี"
  | "สุราษฎร์ธานี"
  | "สุรินทร์"
  | "หนองคาย"
  | "หนองบัวลำภู"
  | "อ่างทอง"
  | "อำนาจเจริญ"
  | "อุดรธานี"
  | "อุตรดิตถ์"
  | "อุทัยธานี"
  | "อุบลราชธานี";

export type ProvinceAliasMap = Record<ThaiProvince, string[]>;

/**
 * Province name aliases mapping
 * Key: Standard province name
 * Value: Array of possible name variations (English, abbreviations, typos)
 */
export const PROVINCE_ALIASES: ProvinceAliasMap = {
  "กรุงเทพมหานคร": [
    "bangkok", "bkk", "กทม", "กทม.", "กรุงเทพ", "กรุงเทพฯ",
    "krungthep", "krung thep", "กท.", "กรุงเทพมหานครฯ"
  ],
  "กระบี่": ["krabi", "กระบี"],
  "กาญจนบุรี": ["kanchanaburi", "kanchanaburi province", "กาญจน์", "กจ."],
  "กาฬสินธุ์": ["kalasin", "kalasin province", "กส.", "กาฬสินทุ์"],
  "กำแพงเพชร": ["kamphaeng phet", "กำแพง", "กพ."],
  "ขอนแก่น": ["khon kaen", "khonkaen", "ขก.", "ขอนแก่น"],
  "จันทบุรี": ["chanthaburi", "จบ.", "จันท์"],
  "ฉะเชิงเทรา": ["chachoengsao", "ฉช.", "ฉะเชิง"],
  "ชลบุรี": ["chonburi", "chon buri", "ชบ.", "ชลบุรี"],
  "ชัยนาท": ["chainat", "chai nat", "ชน."],
  "ชัยภูมิ": ["chaiyaphum", "chaiya phum", "ชย."],
  "ชุมพร": ["chumphon", "chumporn", "ชพ."],
  "เชียงราย": ["chiang rai", "chiangrai", "ชร.", "เชียงใหม่"],
  "เชียงใหม่": ["chiang mai", "chiangmai", "ชม.", "เชียงใหม"],
  "ตรัง": ["trang", "ตรัง"],
  "ตราด": ["trat", "ตราด"],
  "ตาก": ["tak", "ตาก"],
  "นครนายก": ["nakhon nayok", "นย."],
  "นครปฐม": ["nakhon pathom", "นฐ."],
  "นครพนม": ["nakhon phanom", "นพ."],
  "นครราชสีมา": ["nakhon ratchasima", "korat", "โคราช", "นม.", "นครราชสีม"],
  "นครศรีธรรมราช": ["nakhon si thammarat", "nakhon sri thammarat", "นศ.", "เทศบาลนครนครศรีธรรมราช"],
  "นครสวรรค์": ["nakhon sawan", "นว."],
  "นนทบุรี": ["nonthaburi", "นบ.", "นนท์"],
  "นราธิวาส": ["narathiwat", "นธ."],
  "น่าน": ["nan", "น่าน"],
  "บึงกาฬ": ["bueng kan", "buengkan", "บก."],
  "บุรีรัมย์": ["buri ram", "buriram", "บร.", "บุรีรัมย์"],
  "ปทุมธานี": ["pathum thani", "pathumthani", "ปท."],
  "ประจวบคีรีขันธ์": ["prachuap khiri khan", "prachuap", "ปข."],
  "ปราจีนบุรี": ["prachin buri", "prachinburi", "ปจ."],
  "ปัตตานี": ["pattani", "ปน."],
  "พระนครศรีอยุธยา": ["phra nakhon si ayutthaya", "ayutthaya", "ayuthaya", "อยุธยา", "พระนครศรีอยุธยา", "อย."],
  "พังงา": ["phang nga", "phangnga", "พง."],
  "พัทลุง": ["phatthalung", "พท."],
  "พิจิตร": ["phichit", "พจ."],
  "พิษณุโลก": ["phitsanulok", "พล."],
  "เพชรบุรี": ["phetchaburi", "เพชรบุรี", "พบ."],
  "เพชรบูรณ์": ["phetchabun", "เพชรบูรณ์", "พช."],
  "แพร่": ["phrae", "แพร่"],
  "พะเยา": ["phayao", "พย."],
  "ภูเก็ต": ["phuket", "phukett", "ภก."],
  "มหาสารคาม": ["maha sarakham", "mahasarakham", "มค."],
  "มุกดาหาร": ["mukdahan", "มห."],
  "แม่ฮ่องสอน": ["mae hong son", "maehongson", "มส."],
  "ยโสธร": ["yasothon", "ยส."],
  "ยะลา": ["yala", "ยล."],
  "ร้อยเอ็ด": ["roi et", "roiet", "รอ."],
  "ระนอง": ["ranong", "รน."],
  "ระยอง": ["rayong", "รย."],
  "ราชบุรี": ["ratchaburi", "ratburi", "รบ."],
  "ลพบุรี": ["lopburi", "lop buri", "ลบ."],
  "ลำปาง": ["lampang", "ลป."],
  "ลำพูน": ["lamphun", "ลพ."],
  "เลย": ["loei", "ลย."],
  "ศรีสะเกษ": ["si sa ket", "sisaket", "ศก."],
  "สกลนคร": ["sakon nakhon", "sakonnakhon", "สน."],
  "สงขลา": ["songkhla", "สข."],
  "สตูล": ["satun", "สต."],
  "สมุทรปราการ": ["samut prakan", "samutprakan", "สป."],
  "สมุทรสงคราม": ["samut songkhram", "samutsongkhram", "สส."],
  "สมุทรสาคร": ["samut sakhon", "samutsakhon", "สค."],
  "สระแก้ว": ["sa kaeo", "sakaeo", "สก."],
  "สระบุรี": ["saraburi", "sara buri", "สบ."],
  "สิงห์บุรี": ["sing buri", "singburi", "สห."],
  "สุโขทัย": ["sukhothai", "สท."],
  "สุพรรณบุรี": ["suphan buri", "suphanburi", "สพ."],
  "สุราษฎร์ธานี": ["surat thani", "suratthani", "สฎ."],
  "สุรินทร์": ["surin", "สร."],
  "หนองคาย": ["nong khai", "nongkhai", "หค."],
  "หนองบัวลำภู": ["nong bua lamphu", "nongbualamphu", "หบ."],
  "อ่างทอง": ["ang thong", "angthong", "อท."],
  "อำนาจเจริญ": ["amnat charoen", "amnatcharoen", "อจ."],
  "อุดรธานี": ["udon thani", "udonthani", "อด."],
  "อุตรดิตถ์": ["uttaradit", "อต."],
  "อุทัยธานี": ["uthai thani", "uthaitthani", "อน."],
  "อุบลราชธานี": ["ubon ratchathani", "ubon", "อบ."]
};

/**
 * Normalize province name from various formats to standard Thai name
 * @param input Raw province name from Excel
 * @param additionalAliases Optional alias map from DB to merge
 * @returns Standard province name or null if not recognized
 */
export function normalizeProvince(
  input: string | null | undefined,
  additionalAliases?: Partial<ProvinceAliasMap>
): ThaiProvince | null {
  if (!input || typeof input !== 'string') return null;

  // Clean input: lowercase, remove common prefixes/suffixes
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/^จังหวัด/g, "")
    .replace(/^เทศบาลนคร/g, "")
    .replace(/^เทศบาล/g, "")
    .replace(/^อำเภอ/g, "")
    .replace(/^ตำบล/g, "")
    .replace(/province$/g, "")
    .replace(/[.ฯ\s]+/g, " ")
    .trim();

  if (!cleaned) return null;

  // Try exact match with standard names first (using cleaned input)
  for (const [standard] of Object.entries(PROVINCE_ALIASES) as [ThaiProvince, string[]][]) {
    if (standard.toLowerCase() === cleaned) {
      return standard;
    }
  }

  // Merge aliases (static + dynamic)
  const mergedAliases: Partial<ProvinceAliasMap> = { ...PROVINCE_ALIASES, ...(additionalAliases || {}) };

  // Try matching with aliases
  for (const [standard, aliases] of Object.entries(mergedAliases) as [ThaiProvince, string[]][]) {
    for (const alias of aliases) {
      if (cleaned.includes(alias.toLowerCase()) || alias.toLowerCase().includes(cleaned)) {
        return standard;
      }
    }
  }

  // No match found
  return null;
}

/**
 * Get all standard province names
 */
export function getAllProvinces(): ThaiProvince[] {
  return Object.keys(PROVINCE_ALIASES) as ThaiProvince[];
}

/**
 * Get total number of provinces in Thailand
 */
export const TOTAL_PROVINCES = 77;

/**
 * Get province display name with emoji flag
 */
export function getProvinceDisplayName(province: ThaiProvince): string {
  return `📍 ${province}`;
}

/**
 * Validate if a string is a valid Thai province
 */
export function isValidProvince(province: string): province is ThaiProvince {
  return getAllProvinces().includes(province as ThaiProvince);
}
