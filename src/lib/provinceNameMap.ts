/**
 * Province Name Mapping (English → Thai)
 * Maps English names from GeoJSON to Thai names
 */

export const PROVINCE_ENGLISH_TO_THAI: Record<string, string> = {
  // Northern
  "Mae Hong Son": "แม่ฮ่องสอน",
  "Chiang Mai": "เชียงใหม่",
  "Chiang Rai": "เชียงราย",
  "Lampang": "ลำปาง",
  "Lamphun": "ลำพูน",
  "Phayao": "พะเยา",
  "Phrae": "แพร่",
  "Nan": "น่าน",
  "Uttaradit": "อุตรดิตถ์",
  "Phitsanulok": "พิษณุโลก",
  "Tak": "ตาก",
  "Sukhothai": "สุโขทัย",
  "Phichit": "พิจิตร",
  "Kamphaeng Phet": "กำแพงเพชร",
  "Phetchabun": "เพชรบูรณ์",
  "Nakhon Sawan": "นครสวรรค์",
  "Uthai Thani": "อุทัยธานี",

  // Northeastern (Isan)
  "Nakhon Ratchasima": "นครราชสีมา",
  "Buri Ram": "บุรีรัมย์",
  "Surin": "สุรินทร์",
  "Si Sa Ket": "ศรีสะเกษ",
  "Ubon Ratchathani": "อุบลราชธานี",
  "Yasothon": "ยโสธร",
  "Chaiyaphum": "ชัยภูมิ",
  "Amnat Charoen": "อำนาจเจริญ",
  "Bueng Kan": "บึงกาฬ",
  "Nong Bua Lam Phu": "หนองบัวลำภู",
  "Khon Kaen": "ขอนแก่น",
  "Udon Thani": "อุดรธานี",
  "Loei": "เลย",
  "Nong Khai": "หนองคาย",
  "Maha Sarakham": "มหาสารคาม",
  "Roi Et": "ร้อยเอ็ด",
  "Kalasin": "กาฬสินธุ์",
  "Sakon Nakhon": "สกลนคร",
  "Nakhon Phanom": "นครพนม",
  "Mukdahan": "มุกดาหาร",

  // Central
  "Bangkok": "กรุงเทพมหานคร",
  "Bangkok Metropolis": "กรุงเทพมหานคร",
  "Krung Thep Maha Nakhon": "กรุงเทพมหานคร",
  "Samut Prakan": "สมุทรปราการ",
  "Nonthaburi": "นนทบุรี",
  "Pathum Thani": "ปทุมธานี",
  "Phra Nakhon Si Ayutthaya": "พระนครศรีอยุธยา",
  "Ang Thong": "อ่างทอง",
  "Lop Buri": "ลพบุรี",
  "Sing Buri": "สิงห์บุรี",
  "Chai Nat": "ชัยนาท",
  "Saraburi": "สระบุรี",
  "Chon Buri": "ชลบุรี",
  "Rayong": "ระยอง",
  "Chanthaburi": "จันทบุรี",
  "Trat": "ตราด",
  "Chachoengsao": "ฉะเชิงเทรา",
  "Prachin Buri": "ปราจีนบุรี",
  "Nakhon Nayok": "นครนายก",
  "Sa Kaeo": "สระแก้ว",
  "Nakhon Pathom": "นครปฐม",
  "Suphan Buri": "สุพรรณบุรี",

  // Western
  "Kanchanaburi": "กาญจนบุรี",
  "Ratchaburi": "ราชบุรี",
  "Samut Songkhram": "สมุทรสงคราม",
  "Samut Sakhon": "สมุทรสาคร",
  "Phetchaburi": "เพชรบุรี",
  "Prachuap Khiri Khan": "ประจวบคีรีขันธ์",

  // Southern
  "Chumphon": "ชุมพร",
  "Ranong": "ระนอง",
  "Surat Thani": "สุราษฎร์ธานี",
  "Phangnga": "พังงา",
  "Phuket": "ภูเก็ต",
  "Krabi": "กระบี่",
  "Nakhon Si Thammarat": "นครศรีธรรมราช",
  "Trang": "ตรัง",
  "Phatthalung": "พัทลุง",
  "Satun": "สตูล",
  "Songkhla": "สงขลา",
  "Pattani": "ปัตตานี",
  "Yala": "ยะลา",
  "Narathiwat": "นราธิวาส"
};

/**
 * Get Thai name from English name
 */
export function getThaiName(englishName: string): string {
  return PROVINCE_ENGLISH_TO_THAI[englishName] || englishName;
}

/**
 * Get English name from Thai name
 */
export function getEnglishName(thaiName: string): string | null {
  const entry = Object.entries(PROVINCE_ENGLISH_TO_THAI).find(([, thai]) => thai === thaiName);
  return entry ? entry[0] : null;
}
