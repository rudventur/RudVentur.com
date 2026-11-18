/* World Alphabets data.
   User numbers are approximate. Each script names the public source we actually
   opened. Retrieved 18 November 2026. This file is meant to grow. */
window.WORLD_ALPHABETS = {
  updated: "2026-11-18",
  sources: [
    {
      id: "wiki-adoption",
      name: "Wikipedia, List of writing systems, section List of writing systems by adoption",
      url: "https://en.wikipedia.org/wiki/List_of_writing_systems#List_of_writing_systems_by_adoption",
      note: "Retrieved 18 November 2026. The Latin figure cites Encyclopaedia Britannica (Don Vaughan, The World's 5 Most Commonly Used Writing Systems, 23 November 2020). The Chinese, Arabic and Cyrillic figures cite Amit Patel, Where the world writes, script by script, a presentation of data from the Unicode Common Locale Data Repository, version 48.2."
    },
    {
      id: "wiki-latin-script",
      name: "Wikipedia, Latin script, citing WorldStandards",
      url: "https://en.wikipedia.org/wiki/Latin_script",
      note: "Retrieved 18 November 2026. The Latin script page also cites WorldStandards, The world's scripts and alphabets, last updated 30 December 2024, which gives a lower count of about 3 billion people, almost 40 percent of the world population."
    },
    {
      id: "wiki-greek-lang",
      name: "Wikipedia, Greek language",
      url: "https://en.wikipedia.org/wiki/Greek_language",
      note: "Retrieved 18 November 2026. At least 13.5 million people speak Greek today. This is a speaker count, not a separate count of people who write the alphabet every day."
    },
    {
      id: "wiki-hebrew-lang",
      name: "Wikipedia, Hebrew language",
      url: "https://en.wikipedia.org/wiki/Hebrew_language",
      note: "Retrieved 18 November 2026. About 9 million speakers of Modern Hebrew (5 million as a first language and 3.3 million as a second language, figures around 2013). The information box also shows 20 million, but that figure is marked as needing a citation, so we do not use it. The letters are also used for Yiddish and other Jewish languages."
    },
    {
      id: "wiki-georgian-lang",
      name: "Wikipedia, Georgian language",
      url: "https://en.wikipedia.org/wiki/Georgian_language",
      note: "Retrieved 18 November 2026. Approximately 3.8 million speakers. This is a speaker count, not a separate count of daily writers."
    },
    {
      id: "wiki-armenian-lang",
      name: "Wikipedia, Armenian language",
      url: "https://en.wikipedia.org/wiki/Armenian_language",
      note: "Retrieved 18 November 2026. The article says between five and seven million speakers worldwide. The information box gives about 5.3 million for 2013 to 2021. This is a speaker count, not a separate count of daily writers."
    }
  ],
  typeExplain: {
    alphabet: "An alphabet has letters for both consonants and vowels.",
    abjad: "An abjad has letters mainly for consonants. Vowels can be added with extra marks.",
    abugida: "An abugida gives each consonant a default vowel, which marks then change.",
    syllabary: "A syllabary has a letter for each syllable, such as ka, ki, ku.",
    logographic: "A logographic system uses characters that stand for words or parts of words, often with sound hints built in."
  },
  scripts: [
  {
    "id": "latin",
    "name": "Latin",
    "nativeName": "Latin",
    "sample": "Aa Bb Cc",
    "sampleBig": "ABC abc",
    "type": "alphabet",
    "direction": "left to right",
    "letterCount": 26,
    "letterCountNote": "The basic modern set has 26 letters. Many languages add marks or extra letters, so the full Latin family is much larger.",
    "letters": {
      "Basic uppercase": "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z",
      "Basic lowercase": "a b c d e f g h i j k l m n o p q r s t u v w x y z"
    },
    "languages": [
      "English",
      "Spanish",
      "French",
      "Portuguese",
      "German",
      "Indonesian",
      "Vietnamese",
      "Turkish",
      "Polish",
      "and thousands of other languages"
    ],
    "usersMillion": 5500,
    "usersExact": false,
    "usersLabel": "about 5.5 billion people",
    "usersNote": "Approximate. Wikipedia's adoption list, citing Encyclopaedia Britannica (2020). Another count cited on the Latin script page (WorldStandards, December 2024) says about 3 billion people, almost 40 percent of the world population. The true number is hard to pin down because so many languages use these letters, with very different literacy rates.",
    "usersSource": "wiki-adoption",
    "funFact": "The classical Roman set had fewer letters. J, U and W arrived later, which is why the alphabet once ended at a very different place than Z."
  },
  {
    "id": "han",
    "name": "Chinese characters (Han)",
    "nativeName": "汉字 / 漢字",
    "sample": "汉字 漢字",
    "sampleBig": "汉字 漢字",
    "type": "logographic",
    "direction": "left to right in modern lines; also top to bottom, with columns running right to left",
    "letterCount": null,
    "letterCountNote": "Not an alphabet. Everyday readers learn a few thousand characters. Unicode encodes tens of thousands of Chinese characters.",
    "letters": {
      "A small everyday sample": "一 二 三 四 五 六 七 八 九 十 人 大 小 山 水 日 月 天 地 火 木 金 中 文 你 我 爱 好"
    },
    "languages": [
      "Mandarin Chinese",
      "Cantonese and other Chinese languages",
      "Japanese (as kanji)",
      "Korean (as hanja, now used much less)",
      "Vietnamese historically (as chữ Nôm)"
    ],
    "usersMillion": 1710,
    "usersExact": false,
    "usersLabel": "about 1.71 billion people",
    "usersNote": "Approximate. Wikipedia's adoption list, citing a presentation of the Unicode Common Locale Data Repository, version 48.2.",
    "usersSource": "wiki-adoption",
    "funFact": "One character can stand for a whole word, and many hide a sound hint beside a meaning hint. Japan still mixes these characters with its own kana letters every day."
  },
  {
    "id": "arabic",
    "name": "Arabic",
    "nativeName": "العربية",
    "sample": "أ ب ت",
    "sampleBig": "العربية",
    "type": "abjad",
    "direction": "right to left",
    "letterCount": 28,
    "letterCountNote": "28 basic letters. Short vowels can be written with optional marks. Most letters change shape depending on their place in a word.",
    "letters": {
      "The 28 letters": "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي"
    },
    "languages": [
      "Arabic",
      "Persian",
      "Urdu",
      "Pashto",
      "Kurdish (some varieties)",
      "Uyghur",
      "and other languages of West, Central and South Asia and North Africa"
    ],
    "usersMillion": 1550,
    "usersExact": false,
    "usersLabel": "about 1.55 billion people",
    "usersNote": "Approximate. Wikipedia's adoption list, citing a presentation of the Unicode Common Locale Data Repository, version 48.2.",
    "usersSource": "wiki-adoption",
    "funFact": "Most letters wear a different outfit at the start, middle or end of a word, and a fourth when they stand alone, like clothes for each place in a line."
  },
  {
    "id": "devanagari",
    "name": "Devanagari",
    "nativeName": "देवनागरी",
    "sample": "देवनागरी",
    "sampleBig": "देवनागरी",
    "type": "abugida",
    "direction": "left to right",
    "letterCount": 47,
    "letterCountNote": "A common school set is about 13 or 14 independent vowels and 33 consonants, plus many marks. There are no capital letters. A headline bar often joins the letters.",
    "letters": {
      "Independent vowels": "अ आ इ ई उ ऊ ऋ ए ऐ ओ औ",
      "Consonants": "क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह"
    },
    "languages": [
      "Hindi",
      "Marathi",
      "Nepali",
      "Sanskrit",
      "and many other languages of northern India and Nepal"
    ],
    "usersMillion": 926,
    "usersExact": false,
    "usersLabel": "about 926 million people",
    "usersNote": "Approximate. Wikipedia's adoption list (no separate footnote on this row).",
    "usersSource": "wiki-adoption",
    "funFact": "The name joins two Sanskrit words, loosely 'divine' and 'of the city'. The long bar across the top is a hallmark you can spot from across a page."
  },
  {
    "id": "bengali",
    "name": "Bengali–Assamese",
    "nativeName": "বাংলা / অসমীয়া",
    "sample": "বাংলা",
    "sampleBig": "বাংলা",
    "type": "abugida",
    "direction": "left to right",
    "letterCount": 50,
    "letterCountNote": "Bengali is often taught with 11 independent vowels and a few dozen consonants. Assamese uses a very closely related set, with a few different letters.",
    "letters": {
      "Independent vowels": "অ আ ই ঈ উ ঊ ঋ এ ঐ ও ঔ",
      "Consonants (Bengali)": "ক খ গ ঘ ঙ চ ছ জ ঝ ঞ ট ঠ ড ঢ ণ ত থ দ ধ ন প ফ ব ভ ম য র ল শ ষ স হ ড় ঢ় য়"
    },
    "languages": [
      "Bengali",
      "Assamese",
      "and some neighbouring languages"
    ],
    "usersMillion": 328,
    "usersExact": false,
    "usersLabel": "about 328 million people",
    "usersNote": "Approximate. Wikipedia's adoption list, as Bengali–Assamese.",
    "usersSource": "wiki-adoption",
    "funFact": "Bengali and Assamese share a family of letters, like two close cousins who borrow each other's clothes and keep a few of their own."
  },
  {
    "id": "cyrillic",
    "name": "Cyrillic",
    "nativeName": "Кириллица",
    "sample": "АБВ абв",
    "sampleBig": "АБВ абв",
    "type": "alphabet",
    "direction": "left to right",
    "letterCount": 33,
    "letterCountNote": "The Russian alphabet has 33 letters, shown here. Other languages add, drop or reshape letters, so the wider Cyrillic family is larger.",
    "letters": {
      "Russian uppercase": "А Б В Г Д Е Ё Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я",
      "Russian lowercase": "а б в г д е ё ж з и й к л м н о п р с т у ф х ц ч ш щ ъ ы ь э ю я"
    },
    "languages": [
      "Russian",
      "Ukrainian",
      "Bulgarian",
      "Serbian (also written in Latin letters)",
      "Macedonian",
      "Belarusian",
      "Kazakh",
      "Kyrgyz",
      "Mongolian (in Mongolia, alongside the older vertical script)",
      "and other languages of Eastern Europe and Central Asia"
    ],
    "usersMillion": 301,
    "usersExact": false,
    "usersLabel": "about 301 million people",
    "usersNote": "Approximate. Wikipedia's adoption list, citing a presentation of the Unicode Common Locale Data Repository, version 48.2.",
    "usersSource": "wiki-adoption",
    "funFact": "The name honours Saint Cyril, but his students did much of the letter-shaping. Many letters still wink at their Greek grandparents."
  },
  {
    "id": "kana",
    "name": "Japanese kana",
    "nativeName": "かな / カナ",
    "sample": "あいう アイウ",
    "sampleBig": "あいう アイウ",
    "type": "syllabary",
    "direction": "left to right in modern lines; also top to bottom, with columns running right to left",
    "letterCount": 92,
    "letterCountNote": "46 basic hiragana plus 46 basic katakana, shown below. Marks add voiced sounds, and small letters make glides and doubled consonants. Everyday Japanese also mixes in Chinese characters.",
    "letters": {
      "Hiragana, the basic 46": "あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ を ん",
      "Katakana, the basic 46": "ア イ ウ エ オ カ キ ク ケ コ サ シ ス セ ソ タ チ ツ テ ト ナ ニ ヌ ネ ノ ハ ヒ フ ヘ ホ マ ミ ム メ モ ヤ ユ ヨ ラ リ ル レ ロ ワ ヲ ン"
    },
    "languages": [
      "Japanese",
      "Ryukyuan languages"
    ],
    "usersMillion": 118,
    "usersExact": false,
    "usersLabel": "about 118 million people",
    "usersNote": "Approximate. Wikipedia's adoption list (as Kana).",
    "usersSource": "wiki-adoption",
    "funFact": "Hiragana is the flowing set, often used for native words and grammar. Katakana is the sharper set, often used for borrowed words, emphasis and sound effects."
  },
  {
    "id": "telugu",
    "name": "Telugu",
    "nativeName": "తెలుగు",
    "sample": "తెలుగు",
    "sampleBig": "తెలుగు",
    "type": "abugida",
    "direction": "left to right",
    "letterCount": 52,
    "letterCountNote": "A common set is 16 independent vowels and around 36 consonants, all very rounded. Vowel marks attach to the consonants.",
    "letters": {
      "Independent vowels": "అ ఆ ఇ ఈ ఉ ఊ ఋ ౠ ఌ ౡ ఎ ఏ ఐ ఒ ఓ ఔ",
      "Consonants": "క ఖ గ ఘ ఙ చ ఛ జ ఝ ఞ ట ఠ డ ఢ ణ త థ ద ధ న ప ఫ బ భ మ య ర ల వ శ ష స హ ళ క్ష ఱ"
    },
    "languages": [
      "Telugu"
    ],
    "usersMillion": 108,
    "usersExact": false,
    "usersLabel": "about 108 million people",
    "usersNote": "Approximate. Wikipedia's adoption list.",
    "usersSource": "wiki-adoption",
    "funFact": "The letters are famously round, like little pots and curls. People sometimes tease that a Telugu page looks as if it is singing."
  },
  {
    "id": "tamil",
    "name": "Tamil",
    "nativeName": "தமிழ்",
    "sample": "தமிழ்",
    "sampleBig": "தமிழ்",
    "type": "abugida",
    "direction": "left to right",
    "letterCount": 31,
    "letterCountNote": "12 vowels, 18 consonants and the special mark ஃ (āytam) make the classical set. Grantha letters are sometimes added for Sanskrit sounds.",
    "letters": {
      "Vowels": "அ ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ ஔ",
      "Consonants": "க ங ச ஞ ட ண த ந ப ம ய ர ல வ ழ ள ற ன",
      "Special mark": "ஃ"
    },
    "languages": [
      "Tamil"
    ],
    "usersMillion": 90.9,
    "usersExact": false,
    "usersLabel": "about 90.9 million people",
    "usersNote": "Approximate. Wikipedia's adoption list.",
    "usersSource": "wiki-adoption",
    "funFact": "Tamil writing has a very long continuous history in South India and Sri Lanka, with inscriptions that go back many centuries."
  },
  {
    "id": "thai",
    "name": "Thai",
    "nativeName": "ไทย",
    "sample": "ไทย",
    "sampleBig": "ไทย",
    "type": "abugida",
    "direction": "left to right",
    "letterCount": 44,
    "letterCountNote": "44 consonants, plus vowel signs that combine into many vowel forms, and four tone marks. There are no spaces between words, only between phrases.",
    "letters": {
      "The 44 consonants": "ก ข ฃ ค ฅ ฆ ง จ ฉ ช ซ ฌ ญ ฎ ฏ ฐ ฑ ฒ ณ ด ต ถ ท ธ น บ ป ผ ฝ พ ฟ ภ ม ย ร ล ว ศ ษ ส ห ฬ อ ฮ"
    },
    "languages": [
      "Thai",
      "and some related languages in Thailand"
    ],
    "usersMillion": 80,
    "usersExact": false,
    "usersLabel": "about 80 million people",
    "usersNote": "Approximate. Wikipedia's adoption list.",
    "usersSource": "wiki-adoption",
    "funFact": "A Thai sentence often looks like one long garland, because spaces come between phrases, not between every word. Readers know where each word ends."
  },
  {
    "id": "hangul",
    "name": "Korean Hangul",
    "nativeName": "한글",
    "sample": "한글",
    "sampleBig": "한글",
    "type": "alphabet",
    "typeNote": "A featural alphabet: the shapes of the basic letters hint at how the mouth is held. Letters are packed into syllable blocks, so a word can look like a stack of little squares.",
    "direction": "left to right in modern lines; also top to bottom, with columns running right to left",
    "letterCount": 24,
    "letterCountNote": "24 basic jamo: 14 consonants and 10 vowels, shown below. Modern school Korean also teaches 5 doubled consonants and 11 compound vowels, making 40 letters in all.",
    "letters": {
      "Basic consonants": "ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ",
      "Basic vowels": "ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ",
      "A few syllable blocks": "가 나 다 마 바 사 아 한 글 한 국"
    },
    "languages": [
      "Korean"
    ],
    "usersMillion": 79.3,
    "usersExact": false,
    "usersLabel": "about 79.3 million people",
    "usersNote": "Approximate. Wikipedia's adoption list.",
    "usersSource": "wiki-adoption",
    "funFact": "Hangul was made in the fifteenth century so ordinary people could learn to read. The consonant shapes quietly sketch the tongue, lips or throat."
  },
  {
    "id": "gujarati",
    "name": "Gujarati",
    "nativeName": "ગુજરાતી",
    "sample": "ગુજરાતી",
    "sampleBig": "ગુજરાતી",
    "type": "abugida",
    "direction": "left to right",
    "letterCount": 47,
    "letterCountNote": "A close cousin of Devanagari, usually taught with a similar set of vowels and consonants, but without the long headline bar.",
    "letters": {
      "Independent vowels": "અ આ ઇ ઈ ઉ ઊ ઋ એ ઐ ઓ ઔ",
      "Consonants": "ક ખ ગ ઘ ઙ ચ છ જ ઝ ઞ ટ ઠ ડ ઢ ણ ત થ દ ધ ન પ ફ બ ભ મ ય ર લ વ શ ષ સ હ ળ"
    },
    "languages": [
      "Gujarati",
      "and some closely related languages"
    ],
    "usersMillion": 65.6,
    "usersExact": false,
    "usersLabel": "about 65.6 million people",
    "usersNote": "Approximate. Wikipedia's adoption list.",
    "usersSource": "wiki-adoption",
    "funFact": "If Devanagari wears a straight hat-brim across the line, Gujarati often goes bare-headed, which makes the two easy to tell apart."
  },
  {
    "id": "kannada",
    "name": "Kannada",
    "nativeName": "ಕನ್ನಡ",
    "sample": "ಕನ್ನಡ",
    "sampleBig": "ಕನ್ನಡ",
    "type": "abugida",
    "direction": "left to right",
    "letterCount": 49,
    "letterCountNote": "A rounded South Indian set, close in look to Telugu. Wikipedia's adoption note bases the user figure on speakers of Kannada and some neighbouring languages, then a literacy rate.",
    "letters": {
      "Independent vowels": "ಅ ಆ ಇ ಈ ಉ ಊ ಋ ಎ ಏ ಐ ಒ ಓ ಔ",
      "Consonants": "ಕ ಖ ಗ ಘ ಙ ಚ ಛ ಜ ಝ ಞ ಟ ಠ ಡ ಢ ಣ ತ ಥ ದ ಧ ನ ಪ ಫ ಬ ಭ ಮ ಯ ರ ಲ ವ ಶ ಷ ಸ ಹ ಳ"
    },
    "languages": [
      "Kannada",
      "and some neighbouring languages such as Tulu, Konkani, Kodava and Badaga, according to the Wikipedia note on this figure"
    ],
    "usersMillion": 54.3,
    "usersExact": false,
    "usersLabel": "about 54.3 million people",
    "usersNote": "Approximate. Wikipedia's adoption list. A note there says this is based on 46 million speakers of Kannada, Tulu, Konkani, Kodava and Badaga in a state with a 75.6 percent literacy rate.",
    "usersSource": "wiki-adoption",
    "funFact": "Kannada and Telugu letters grew up as neighbours, so a page of one can feel like a soft echo of the other."
  },
  {
    "id": "ethiopic",
    "name": "Ethiopic (Geʽez)",
    "nativeName": "ግዕዝ",
    "sample": "አማርኛ",
    "sampleBig": "አማርኛ",
    "type": "abugida",
    "direction": "left to right",
    "letterCount": null,
    "letterCountNote": "Each consonant has a family of seven forms, one for each vowel order, called a fidel. There are dozens of base consonants, so the full chart is large. A few rows are shown below.",
    "letters": {
      "Hä family (seven vowel orders)": "ሀ ሁ ሂ ሃ ሄ ህ ሆ",
      "Lä family": "ለ ሉ ሊ ላ ሌ ል ሎ",
      "Mä family": "መ ሙ ሚ ማ ሜ ም ሞ",
      "Sä family": "ሰ ሱ ሲ ሳ ሴ ስ ሶ",
      "A sample word, Amharic for 'Amharic'": "አማርኛ"
    },
    "languages": [
      "Amharic",
      "Tigrinya",
      "Tigre",
      "Geʽez (liturgical)",
      "and other languages of Ethiopia and Eritrea"
    ],
    "usersMillion": 53.5,
    "usersExact": false,
    "usersLabel": "about 53.5 million people",
    "usersNote": "Approximate. Wikipedia's adoption list (as Geʽez).",
    "usersSource": "wiki-adoption",
    "funFact": "The word abugida itself comes from the first four characters of this script's classic teaching order: ä, bu, gi, da."
  },
  {
    "id": "malayalam",
    "name": "Malayalam",
    "nativeName": "മലയാളം",
    "sample": "മലയാളം",
    "sampleBig": "മലയാളം",
    "type": "abugida",
    "direction": "left to right",
    "letterCount": 53,
    "letterCountNote": "A richly curved South Indian set. Older writing stacked many consonant clusters; a twentieth-century reform smoothed a lot of that.",
    "letters": {
      "Independent vowels": "അ ആ ഇ ഈ ഉ ഊ ഋ എ ഏ ഐ ഒ ഓ ഔ",
      "Consonants": "ക ഖ ഗ ഘ ങ ച ഛ ജ ഝ ഞ ട ഠ ഡ ഢ ണ ത ഥ ദ ധ ന പ ഫ ബ ഭ മ യ ര ല വ ശ ഷ സ ഹ ള ഴ റ"
    },
    "languages": [
      "Malayalam"
    ],
    "usersMillion": 45.9,
    "usersExact": false,
    "usersLabel": "about 45.9 million people",
    "usersNote": "Approximate. Wikipedia's adoption list.",
    "usersSource": "wiki-adoption",
    "funFact": "Those deep loops and tails made old Malayalam typesetting a real puzzle, which is one reason a reform in the 1970s and 1980s simplified many clusters."
  },
  {
    "id": "greek",
    "name": "Greek",
    "nativeName": "Ελληνικό",
    "sample": "ΑΒΓ αβγ",
    "sampleBig": "ΑΒΓ αβγ",
    "type": "alphabet",
    "direction": "left to right",
    "letterCount": 24,
    "letterCountNote": "24 letters, from alpha to omega. Sigma has a second lowercase form (ς) used at the end of a word.",
    "letters": {
      "Uppercase": "Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω",
      "Lowercase": "α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ ς τ υ φ χ ψ ω"
    },
    "languages": [
      "Greek"
    ],
    "usersMillion": 13.5,
    "usersExact": false,
    "usersLabel": "at least 13.5 million speakers",
    "usersNote": "Approximate speaker count, not a separate count of daily writers. Wikipedia, Greek language: Greek is spoken by at least 13.5 million people today in Greece, Cyprus, Italy, Albania, Turkey, and the many other countries of the Greek diaspora.",
    "usersSource": "wiki-greek-lang",
    "funFact": "Greek is the earliest known alphabet to write vowels as well as consonants, and it is the grandparent of both Latin and Cyrillic."
  },
  {
    "id": "hebrew",
    "name": "Hebrew",
    "nativeName": "עברית",
    "sample": "אבג",
    "sampleBig": "עברית",
    "type": "abjad",
    "direction": "right to left",
    "letterCount": 22,
    "letterCountNote": "22 letters, with no capital forms. Five letters also have a special final form used at the end of a word. Short vowels can be added with dots and dashes called niqqud.",
    "letters": {
      "The 22 letters": "א ב ג ד ה ו ז ח ט י כ ל מ נ ס ע פ צ ק ר ש ת",
      "Final forms": "ך ם ן ף ץ"
    },
    "languages": [
      "Hebrew",
      "Yiddish",
      "Ladino",
      "and other Jewish languages"
    ],
    "usersMillion": 9,
    "usersExact": false,
    "usersLabel": "about 9 million speakers of Modern Hebrew",
    "usersNote": "Approximate speaker count, not a separate count of daily writers. Wikipedia, Hebrew language, describes about 9 million speakers of Modern Hebrew, of which 5 million are first-language speakers and 3.3 million are second-language speakers (figures around 2013). The script is also used for Yiddish and other Jewish languages, so the number of people who use the letters may be a little higher. A 20 million figure appears in the information box but is marked as needing a citation, so we do not use it.",
    "usersSource": "wiki-hebrew-lang",
    "funFact": "Everyday modern Hebrew often skips the little vowel dots, so readers fill the vowels in from context, like a puzzle the language trusts you to solve."
  },
  {
    "id": "armenian",
    "name": "Armenian",
    "nativeName": "Հայոց գրեր",
    "sample": "ԱԲԳ աբգ",
    "sampleBig": "ԱԲԳ աբգ",
    "type": "alphabet",
    "direction": "left to right",
    "letterCount": 39,
    "letterCountNote": "Mesrop Mashtots created 36 letters in the early fifth century. Later additions brought the modern set to 39, including և.",
    "letters": {
      "Uppercase": "Ա Բ Գ Դ Ե Զ Է Ը Թ Ժ Ի Լ Խ Ծ Կ Հ Ձ Ղ Ճ Մ Յ Ն Շ Ո Չ Պ Ջ Ռ Ս Վ Տ Ր Ց Ւ Փ Ք Օ Ֆ",
      "Lowercase": "ա բ գ դ ե զ է ը թ ժ ի լ խ ծ կ հ ձ ղ ճ մ յ ն շ ո չ պ ջ ռ ս վ տ ր ց ւ փ ք օ ֆ և"
    },
    "languages": [
      "Armenian"
    ],
    "usersMillion": 5.3,
    "usersExact": false,
    "usersLabel": "about 5 to 7 million speakers",
    "usersNote": "Approximate speaker count, not a separate count of daily writers. Wikipedia, Armenian language, says the estimated number of Armenian speakers worldwide is between five and seven million. The information box gives about 5.3 million for 2013 to 2021.",
    "usersSource": "wiki-armenian-lang",
    "funFact": "The alphabet was created so Armenia could have its own books and church writing. Many letters still feel hand-cut, like little carved stones."
  },
  {
    "id": "georgian",
    "name": "Georgian",
    "nativeName": "ქართული",
    "sample": "აბგ",
    "sampleBig": "ქართული",
    "type": "alphabet",
    "direction": "left to right",
    "letterCount": 33,
    "letterCountNote": "Modern everyday Georgian uses the Mkhedruli set of 33 letters. There are no capital letters in ordinary writing, though a taller title style called Mtavruli exists. Two older Georgian scripts are now mostly historical or decorative.",
    "letters": {
      "Mkhedruli, 33 letters": "ა ბ გ დ ე ვ ზ თ ი კ ლ მ ნ ო პ ჟ რ ს ტ უ ფ ქ ღ ყ შ ჩ ც ძ წ ჭ ხ ჯ ჰ"
    },
    "languages": [
      "Georgian",
      "and as a literary language for some related languages of Georgia"
    ],
    "usersMillion": 3.8,
    "usersExact": false,
    "usersLabel": "approximately 3.8 million speakers",
    "usersNote": "Approximate speaker count, not a separate count of daily writers. Wikipedia, Georgian language: its speakers amount to approximately 3.8 million.",
    "usersSource": "wiki-georgian-lang",
    "funFact": "Georgian has no capital letters in ordinary lines, and the rounded Mkhedruli forms look a little like a dance of hooks and loops."
  }
]
};
