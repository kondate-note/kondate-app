// 内蔵レシピ（1人分）。条件: オーブン・トースター・グリルなし、コンロ1口
// いまは30品。このあと100品に増やす（ジャンルごとの目標は tests/unit/recipes.test.js）
// ごはんは炊飯器で炊いてあるものとする。パスタはレンジでゆでるか、フライパン1つで作る
// seasoning: true … 調味料（残り材料の照合で数えない）
export const RECIPES = [
  {
    id: "pasta-001", name: "ナポリタン", genre: "pasta", minutes: 15, difficulty: 1, servings: 1,
    tools: ["microwave", "frypan"],
    ingredients: [
      { name: "スパゲッティ", amount: 100, unit: "g" },
      { name: "ウインナー", amount: 3, unit: "本" },
      { name: "玉ねぎ", amount: 0.25, unit: "個" },
      { name: "ピーマン", amount: 1, unit: "個" },
      { name: "ケチャップ", amount: 3, unit: "大さじ", seasoning: true },
      { name: "バター", amount: 5, unit: "g", seasoning: true },
      { name: "塩・こしょう", amount: null, unit: "少々", seasoning: true },
    ],
    steps: [
      "スパゲッティを半分に折って耐熱容器に入れ、かぶるくらいの水と塩ひとつまみを入れて、袋の表示時間＋3分レンジ(600W)で加熱。湯を切る。",
      "玉ねぎは薄切り、ピーマンは細切り、ウインナーは斜め切りにする。",
      "フライパンにバターを溶かし、2を中火で2〜3分炒める。",
      "ケチャップを入れて30秒炒め、1を加えて全体にからめる。塩・こしょうで味を整える。",
    ],
  },
  {
    id: "don-001", name: "親子丼", genre: "don", minutes: 15, difficulty: 1, servings: 1,
    tools: ["frypan", "ricecooker"],
    ingredients: [
      { name: "ごはん", amount: 200, unit: "g" },
      { name: "鶏もも肉", amount: 100, unit: "g" },
      { name: "玉ねぎ", amount: 0.25, unit: "個" },
      { name: "卵", amount: 2, unit: "個" },
      { name: "めんつゆ（3倍）", amount: 2, unit: "大さじ", seasoning: true },
      { name: "水", amount: 4, unit: "大さじ", seasoning: true },
    ],
    steps: [
      "鶏肉は一口大、玉ねぎは薄切りにする。",
      "小さめのフライパンにめんつゆと水を入れて中火にかけ、鶏肉と玉ねぎを入れて5分煮る。",
      "溶き卵を回し入れ、ふたをして弱火で1分。半熟でごはんにのせる。",
    ],
  },
  {
    id: "meat-001", name: "豚の生姜焼き", genre: "meat", minutes: 15, difficulty: 1, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "豚こま肉", amount: 150, unit: "g" },
      { name: "玉ねぎ", amount: 0.25, unit: "個" },
      { name: "しょうゆ", amount: 1.5, unit: "大さじ", seasoning: true },
      { name: "みりん", amount: 1, unit: "大さじ", seasoning: true },
      { name: "しょうが（チューブ）", amount: 2, unit: "cm", seasoning: true },
      { name: "サラダ油", amount: 1, unit: "小さじ", seasoning: true },
    ],
    steps: [
      "しょうゆ・みりん・しょうがを混ぜてたれを作る。",
      "フライパンに油を熱し、薄切りにした玉ねぎと豚肉を中火で炒める。",
      "肉の色が変わったらたれを入れ、汁気が少なくなるまでからめる。",
    ],
  },
  {
    id: "fish-001", name: "鮭のバター醤油焼き", genre: "fish", minutes: 12, difficulty: 1, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "生鮭", amount: 1, unit: "切れ" },
      { name: "バター", amount: 10, unit: "g", seasoning: true },
      { name: "しょうゆ", amount: 1, unit: "小さじ", seasoning: true },
      { name: "小麦粉", amount: 1, unit: "小さじ", seasoning: true },
      { name: "塩・こしょう", amount: null, unit: "少々", seasoning: true },
    ],
    steps: [
      "鮭に塩・こしょうをふり、小麦粉を薄くまぶす。",
      "フライパンにバターを溶かし、鮭を皮目から中火で3分焼く。",
      "裏返してふたをし、弱火で3分。しょうゆを回しかけてからめる。",
    ],
  },
  {
    id: "noodle-001", name: "焼うどん", genre: "noodle", minutes: 10, difficulty: 1, servings: 1,
    tools: ["microwave", "frypan"],
    ingredients: [
      { name: "冷凍うどん", amount: 1, unit: "玉" },
      { name: "豚こま肉", amount: 60, unit: "g" },
      { name: "キャベツ", amount: 2, unit: "枚" },
      { name: "めんつゆ（3倍）", amount: 1.5, unit: "大さじ", seasoning: true },
      { name: "かつお節", amount: null, unit: "適量", seasoning: true },
    ],
    steps: [
      "冷凍うどんは袋の表示どおりレンジで解凍する。",
      "フライパンで豚肉とざく切りキャベツを炒める。",
      "うどんとめんつゆを加えて炒め合わせ、かつお節をのせる。",
    ],
  },
  {
    id: "chinese-001", name: "麻婆豆腐", genre: "chinese", minutes: 15, difficulty: 2, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "豆腐", amount: 0.5, unit: "丁" },
      { name: "豚ひき肉", amount: 60, unit: "g" },
      { name: "長ねぎ", amount: 5, unit: "cm" },
      { name: "麻婆豆腐の素", amount: 0.5, unit: "箱", seasoning: true },
      { name: "水", amount: 50, unit: "ml", seasoning: true },
    ],
    steps: [
      "豆腐は2cm角、ねぎはみじん切りにする。",
      "フライパンでひき肉を炒め、色が変わったらねぎを加える。",
      "麻婆豆腐の素と水、豆腐を入れて3分煮る。",
    ],
  },
  {
    id: "western-001", name: "フライパンでチキンカレー", genre: "western", minutes: 25, difficulty: 2, servings: 1,
    tools: ["frypan", "ricecooker"],
    ingredients: [
      { name: "ごはん", amount: 200, unit: "g" },
      { name: "鶏もも肉", amount: 120, unit: "g" },
      { name: "玉ねぎ", amount: 0.5, unit: "個" },
      { name: "カレールウ", amount: 1.5, unit: "かけ", seasoning: true },
      { name: "水", amount: 200, unit: "ml", seasoning: true },
    ],
    steps: [
      "鶏肉は一口大、玉ねぎはくし切りにする。",
      "フライパンで鶏肉と玉ねぎを炒め、水を入れて10分煮る。",
      "火を止めてルウを溶かし、弱火で5分煮る。",
    ],
  },
  {
    id: "soup-001", name: "豚汁", genre: "soup", minutes: 20, difficulty: 1, servings: 1,
    tools: ["pot"],
    ingredients: [
      { name: "豚こま肉", amount: 50, unit: "g" },
      { name: "大根", amount: 2, unit: "cm" },
      { name: "にんじん", amount: 2, unit: "cm" },
      { name: "水", amount: 250, unit: "ml", seasoning: true },
      { name: "みそ", amount: 1, unit: "大さじ", seasoning: true },
    ],
    steps: [
      "大根とにんじんはいちょう切りにする。",
      "鍋で豚肉を炒め、野菜と水を入れて10分煮る。",
      "火を止めてみそを溶く。",
    ],
  },
  {
    id: "side-001", name: "ほうれん草のおひたし", genre: "side", minutes: 5, difficulty: 1, servings: 1,
    tools: ["microwave"],
    ingredients: [
      { name: "ほうれん草", amount: 0.5, unit: "束" },
      { name: "めんつゆ（3倍）", amount: 1, unit: "小さじ", seasoning: true },
      { name: "かつお節", amount: null, unit: "適量", seasoning: true },
    ],
    steps: [
      "ほうれん草を洗ってラップで包み、レンジ(600W)で1分30秒。",
      "水にさらして絞り、4cmに切ってめんつゆとかつお節をかける。",
    ],
  },

  // ===== パスタ =====
  {
    id: "pasta-002", name: "きのことベーコンの和風パスタ", genre: "pasta", minutes: 15, difficulty: 1, servings: 1,
    tools: ["microwave", "frypan"],
    ingredients: [
      { name: "スパゲッティ", amount: 100, unit: "g" },
      { name: "しめじ", amount: 0.5, unit: "パック" },
      { name: "ベーコン", amount: 2, unit: "枚" },
      { name: "バター", amount: 10, unit: "g", seasoning: true },
      { name: "しょうゆ", amount: 2, unit: "小さじ", seasoning: true },
      { name: "塩・こしょう", amount: null, unit: "少々", seasoning: true },
    ],
    steps: [
      "スパゲッティを半分に折って耐熱容器に入れ、かぶるくらいの水と塩ひとつまみを入れて、袋の表示時間＋3分レンジ(600W)で加熱。湯を切る。",
      "しめじは石づきを取ってほぐし、ベーコンは1cm幅に切る。",
      "フライパンにバターを溶かし、ベーコンとしめじを中火で2〜3分炒める。",
      "1としょうゆを加えて全体にからめ、塩・こしょうで味を整える。",
    ],
  },
  {
    id: "pasta-003", name: "フライパンひとつのツナトマトパスタ", genre: "pasta", minutes: 20, difficulty: 2, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "スパゲッティ", amount: 100, unit: "g" },
      { name: "ツナ缶", amount: 1, unit: "缶" },
      { name: "玉ねぎ", amount: 0.25, unit: "個" },
      { name: "カットトマト缶", amount: 0.5, unit: "缶" },
      { name: "水", amount: 250, unit: "ml", seasoning: true },
      { name: "コンソメ（顆粒）", amount: 1, unit: "小さじ", seasoning: true },
      { name: "オリーブオイル", amount: 2, unit: "小さじ", seasoning: true },
      { name: "塩・こしょう", amount: null, unit: "少々", seasoning: true },
    ],
    steps: [
      "玉ねぎは薄切りにする。",
      "フライパンにオリーブオイルを熱し、玉ねぎを中火で2分炒める。",
      "トマト缶・水・コンソメを入れて煮立て、半分に折ったスパゲッティを入れる。",
      "ときどき混ぜながら、袋の表示時間どおり中火で煮る。水分が足りなければ少し足す。",
      "汁気が少なくなったら油を切ったツナを加え、塩・こしょうで味を整える。",
    ],
  },
  {
    id: "pasta-004", name: "たらこバターパスタ", genre: "pasta", minutes: 12, difficulty: 1, servings: 1,
    tools: ["microwave"],
    ingredients: [
      { name: "スパゲッティ", amount: 100, unit: "g" },
      { name: "たらこ", amount: 0.5, unit: "腹" },
      { name: "バター", amount: 10, unit: "g", seasoning: true },
      { name: "しょうゆ", amount: 0.5, unit: "小さじ", seasoning: true },
      { name: "刻みのり", amount: null, unit: "適量", seasoning: true },
    ],
    steps: [
      "スパゲッティを半分に折って耐熱容器に入れ、かぶるくらいの水と塩ひとつまみを入れて、袋の表示時間＋3分レンジ(600W)で加熱する。",
      "たらこは薄皮に切り目を入れて中身をしごき出し、ボウルでバター・しょうゆと混ぜる。",
      "湯を切った1が熱いうちに2のボウルに入れてあえ、刻みのりをのせる。",
    ],
  },

  // ===== 丼もの =====
  {
    id: "don-002", name: "牛丼", genre: "don", minutes: 15, difficulty: 1, servings: 1,
    tools: ["frypan", "ricecooker"],
    ingredients: [
      { name: "ごはん", amount: 200, unit: "g" },
      { name: "牛こま肉", amount: 100, unit: "g" },
      { name: "玉ねぎ", amount: 0.25, unit: "個" },
      { name: "めんつゆ（3倍）", amount: 2, unit: "大さじ", seasoning: true },
      { name: "水", amount: 4, unit: "大さじ", seasoning: true },
      { name: "砂糖", amount: 1, unit: "小さじ", seasoning: true },
      { name: "紅しょうが", amount: null, unit: "適量", seasoning: true },
    ],
    steps: [
      "玉ねぎは薄切りにする。",
      "小さめのフライパンにめんつゆ・水・砂糖を入れて中火にかけ、玉ねぎを入れて3分煮る。",
      "牛肉を広げて入れ、色が変わるまで3〜4分煮る。",
      "ごはんにのせ、紅しょうがを添える。",
    ],
  },
  {
    id: "don-003", name: "豚キムチ丼", genre: "don", minutes: 10, difficulty: 1, servings: 1,
    tools: ["frypan", "ricecooker"],
    ingredients: [
      { name: "ごはん", amount: 200, unit: "g" },
      { name: "豚こま肉", amount: 100, unit: "g" },
      { name: "白菜キムチ", amount: 80, unit: "g" },
      { name: "ごま油", amount: 1, unit: "小さじ", seasoning: true },
      { name: "しょうゆ", amount: 1, unit: "小さじ", seasoning: true },
    ],
    steps: [
      "フライパンにごま油を熱し、豚肉を中火で炒める。",
      "肉の色が変わったらキムチを加えて1分炒め、しょうゆを回し入れる。",
      "ごはんにのせる。",
    ],
  },
  {
    id: "don-004", name: "ツナマヨ丼", genre: "don", minutes: 5, difficulty: 1, servings: 1,
    tools: ["ricecooker"],
    ingredients: [
      { name: "ごはん", amount: 200, unit: "g" },
      { name: "ツナ缶", amount: 1, unit: "缶" },
      { name: "マヨネーズ", amount: 1, unit: "大さじ", seasoning: true },
      { name: "しょうゆ", amount: 1, unit: "小さじ", seasoning: true },
      { name: "刻みのり", amount: null, unit: "適量", seasoning: true },
    ],
    steps: [
      "ツナ缶の油を切り、マヨネーズとしょうゆを混ぜる。",
      "ごはんに刻みのりを散らし、1をのせる。",
    ],
  },

  // ===== 定食（肉） =====
  {
    id: "meat-002", name: "鶏の照り焼き", genre: "meat", minutes: 20, difficulty: 2, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "鶏もも肉", amount: 200, unit: "g" },
      { name: "しょうゆ", amount: 1, unit: "大さじ", seasoning: true },
      { name: "みりん", amount: 1, unit: "大さじ", seasoning: true },
      { name: "砂糖", amount: 1, unit: "小さじ", seasoning: true },
      { name: "サラダ油", amount: 1, unit: "小さじ", seasoning: true },
    ],
    steps: [
      "鶏肉は厚いところに切り込みを入れ、しょうゆ・みりん・砂糖を混ぜてたれを作る。",
      "フライパンに油を熱し、鶏肉を皮目から中火で5分焼く。",
      "裏返してふたをし、弱火で5分焼く。出た脂をキッチンペーパーでふき取る。",
      "たれを入れて中火にし、照りが出るまでからめる。食べやすく切る。",
    ],
  },
  {
    id: "meat-003", name: "豚こまとキャベツのみそ炒め", genre: "meat", minutes: 12, difficulty: 1, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "豚こま肉", amount: 100, unit: "g" },
      { name: "キャベツ", amount: 2, unit: "枚" },
      { name: "ピーマン", amount: 1, unit: "個" },
      { name: "みそ", amount: 1, unit: "大さじ", seasoning: true },
      { name: "砂糖", amount: 1, unit: "小さじ", seasoning: true },
      { name: "酒", amount: 1, unit: "大さじ", seasoning: true },
      { name: "サラダ油", amount: 1, unit: "小さじ", seasoning: true },
    ],
    steps: [
      "キャベツはざく切り、ピーマンは細切りにする。みそ・砂糖・酒を混ぜておく。",
      "フライパンに油を熱し、豚肉を中火で炒める。",
      "肉の色が変わったら野菜を加えて2分炒め、合わせたみそを入れてからめる。",
    ],
  },
  {
    id: "meat-004", name: "フライパンハンバーグ", genre: "meat", minutes: 25, difficulty: 2, servings: 1,
    tools: ["microwave", "frypan"],
    ingredients: [
      { name: "合いびき肉", amount: 150, unit: "g" },
      { name: "玉ねぎ", amount: 0.25, unit: "個" },
      { name: "パン粉", amount: 3, unit: "大さじ", seasoning: true },
      { name: "牛乳", amount: 2, unit: "大さじ" },
      { name: "塩・こしょう", amount: null, unit: "少々", seasoning: true },
      { name: "水", amount: 3, unit: "大さじ", seasoning: true },
      { name: "ケチャップ", amount: 2, unit: "大さじ", seasoning: true },
      { name: "ウスターソース", amount: 1, unit: "大さじ", seasoning: true },
    ],
    steps: [
      "玉ねぎはみじん切りにして耐熱皿に入れ、ラップをしてレンジ(600W)で1分加熱し、冷ます。",
      "ボウルにひき肉・1・パン粉・牛乳・塩・こしょうを入れてよくこね、小判形にして真ん中をくぼませる。",
      "フライパンを中火で熱し、2を2分焼く。裏返して水を入れ、ふたをして弱火で8分蒸し焼きにする。",
      "竹串を刺して透明な汁が出たら皿に取る。同じフライパンにケチャップとソースを入れて温め、かける。",
    ],
  },
  {
    id: "meat-005", name: "鶏むね肉のレンジ蒸し ねぎだれ", genre: "meat", minutes: 15, difficulty: 1, servings: 1,
    tools: ["microwave"],
    ingredients: [
      { name: "鶏むね肉", amount: 150, unit: "g" },
      { name: "長ねぎ", amount: 5, unit: "cm" },
      { name: "酒", amount: 1, unit: "大さじ", seasoning: true },
      { name: "塩", amount: null, unit: "少々", seasoning: true },
      { name: "しょうゆ", amount: 1, unit: "大さじ", seasoning: true },
      { name: "酢", amount: 2, unit: "小さじ", seasoning: true },
      { name: "砂糖", amount: 1, unit: "小さじ", seasoning: true },
      { name: "ごま油", amount: 1, unit: "小さじ", seasoning: true },
    ],
    steps: [
      "鶏肉はフォークで数か所刺し、耐熱皿にのせて塩と酒をふる。",
      "ふんわりラップをしてレンジ(600W)で3分、裏返して1分30秒加熱し、そのまま5分おく。",
      "長ねぎをみじん切りにし、しょうゆ・酢・砂糖・ごま油と混ぜてたれを作る。",
      "鶏肉を薄く切って皿に並べ、たれをかける。",
    ],
  },

  // ===== 定食（魚）（グリルを使わずフライパンで） =====
  {
    id: "fish-002", name: "フライパンでさばのみそ煮", genre: "fish", minutes: 20, difficulty: 2, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "さば", amount: 1, unit: "切れ" },
      { name: "しょうが（チューブ）", amount: 2, unit: "cm", seasoning: true },
      { name: "水", amount: 100, unit: "ml", seasoning: true },
      { name: "みそ", amount: 1, unit: "大さじ", seasoning: true },
      { name: "砂糖", amount: 1, unit: "大さじ", seasoning: true },
      { name: "酒", amount: 1, unit: "大さじ", seasoning: true },
    ],
    steps: [
      "さばは皮に切り込みを入れる。みそ・砂糖・酒・しょうがを水で溶いておく。",
      "小さめのフライパンに1の煮汁を入れて中火で煮立て、さばを皮目を上にして入れる。",
      "アルミホイルをかぶせて弱めの中火で10分煮る。ときどき煮汁をかける。",
      "ホイルを外し、とろみがつくまで2〜3分煮つめる。",
    ],
  },
  {
    id: "fish-003", name: "ぶりの照り焼き", genre: "fish", minutes: 15, difficulty: 1, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "ぶり", amount: 1, unit: "切れ" },
      { name: "小麦粉", amount: 1, unit: "小さじ", seasoning: true },
      { name: "しょうゆ", amount: 1, unit: "大さじ", seasoning: true },
      { name: "みりん", amount: 1, unit: "大さじ", seasoning: true },
      { name: "砂糖", amount: 0.5, unit: "小さじ", seasoning: true },
      { name: "サラダ油", amount: 1, unit: "小さじ", seasoning: true },
    ],
    steps: [
      "ぶりの水気をふき、小麦粉を薄くまぶす。しょうゆ・みりん・砂糖を混ぜておく。",
      "フライパンに油を熱し、ぶりを中火で3分焼く。",
      "裏返して弱火で2分焼き、余分な油をふき取る。",
      "たれを入れて中火にし、照りが出るまでからめる。",
    ],
  },

  // ===== 麺類 =====
  {
    id: "noodle-002", name: "肉うどん", genre: "noodle", minutes: 12, difficulty: 1, servings: 1,
    tools: ["microwave", "pot"],
    ingredients: [
      { name: "冷凍うどん", amount: 1, unit: "玉" },
      { name: "豚こま肉", amount: 60, unit: "g" },
      { name: "長ねぎ", amount: 5, unit: "cm" },
      { name: "めんつゆ（3倍）", amount: 3, unit: "大さじ", seasoning: true },
      { name: "水", amount: 300, unit: "ml", seasoning: true },
    ],
    steps: [
      "冷凍うどんは袋の表示どおりレンジで解凍し、器に入れる。長ねぎは斜め切りにする。",
      "鍋に水とめんつゆを入れて中火で煮立て、豚肉と長ねぎを入れて3分煮る。アクが出たら取る。",
      "1のうどんに2をかける。",
    ],
  },
  {
    id: "noodle-003", name: "ソース焼きそば", genre: "noodle", minutes: 12, difficulty: 1, servings: 1,
    tools: ["microwave", "frypan"],
    ingredients: [
      { name: "焼きそば麺", amount: 1, unit: "玉" },
      { name: "豚こま肉", amount: 60, unit: "g" },
      { name: "キャベツ", amount: 2, unit: "枚" },
      { name: "もやし", amount: 0.25, unit: "袋" },
      { name: "ウスターソース", amount: 2, unit: "大さじ", seasoning: true },
      { name: "サラダ油", amount: 1, unit: "小さじ", seasoning: true },
      { name: "青のり", amount: null, unit: "適量", seasoning: true },
    ],
    steps: [
      "キャベツはざく切りにする。麺は袋のまま電子レンジで30秒温めるとほぐれやすい。",
      "フライパンに油を熱し、豚肉を中火で炒める。色が変わったらキャベツともやしを加えて1分炒める。",
      "麺と水大さじ1（分量外）を入れてほぐしながら炒め、ソースを加えて全体にからめる。青のりをかける。",
    ],
  },
  {
    id: "noodle-004", name: "レンジで釜玉うどん", genre: "noodle", minutes: 5, difficulty: 1, servings: 1,
    tools: ["microwave"],
    ingredients: [
      { name: "冷凍うどん", amount: 1, unit: "玉" },
      { name: "卵", amount: 1, unit: "個" },
      { name: "めんつゆ（3倍）", amount: 1, unit: "大さじ", seasoning: true },
      { name: "長ねぎ", amount: 3, unit: "cm" },
      { name: "かつお節", amount: null, unit: "適量", seasoning: true },
    ],
    steps: [
      "冷凍うどんは袋の表示どおりレンジで加熱する。長ねぎは小口切りにする。",
      "熱いうちに器に入れ、卵を割り入れてすぐに混ぜる。",
      "めんつゆをかけ、長ねぎとかつお節をのせる。",
    ],
  },

  // ===== カレー・洋食 =====
  {
    id: "western-002", name: "オムライス", genre: "western", minutes: 20, difficulty: 3, servings: 1,
    tools: ["frypan", "ricecooker"],
    ingredients: [
      { name: "ごはん", amount: 200, unit: "g" },
      { name: "鶏もも肉", amount: 50, unit: "g" },
      { name: "玉ねぎ", amount: 0.25, unit: "個" },
      { name: "卵", amount: 2, unit: "個" },
      { name: "牛乳", amount: 1, unit: "大さじ" },
      { name: "ケチャップ", amount: 3, unit: "大さじ", seasoning: true },
      { name: "バター", amount: 10, unit: "g", seasoning: true },
      { name: "塩・こしょう", amount: null, unit: "少々", seasoning: true },
    ],
    steps: [
      "鶏肉は1cm角、玉ねぎはみじん切りにする。卵は牛乳と塩少々を混ぜて溶いておく。",
      "フライパンにバターの半量を溶かし、鶏肉と玉ねぎを中火で炒める。",
      "ごはんとケチャップ大さじ2を加えて炒め合わせ、塩・こしょうで味を整えて皿に盛る。",
      "フライパンをキッチンペーパーでふき、残りのバターを溶かして卵を流し入れる。大きく混ぜ、半熟になったら3の上にのせる。残りのケチャップをかける。",
    ],
  },
  {
    id: "western-003", name: "鶏肉ときのこのクリーム煮", genre: "western", minutes: 20, difficulty: 2, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "鶏もも肉", amount: 150, unit: "g" },
      { name: "玉ねぎ", amount: 0.25, unit: "個" },
      { name: "しめじ", amount: 0.5, unit: "パック" },
      { name: "牛乳", amount: 150, unit: "ml" },
      { name: "小麦粉", amount: 1, unit: "大さじ", seasoning: true },
      { name: "バター", amount: 10, unit: "g", seasoning: true },
      { name: "コンソメ（顆粒）", amount: 1, unit: "小さじ", seasoning: true },
      { name: "塩・こしょう", amount: null, unit: "少々", seasoning: true },
    ],
    steps: [
      "鶏肉は一口大に切って塩・こしょうをふる。玉ねぎは薄切り、しめじはほぐす。",
      "フライパンにバターを溶かし、鶏肉を中火で焼く。色が変わったら玉ねぎとしめじを加えて2分炒める。",
      "小麦粉をふり入れて粉っぽさがなくなるまで炒める。",
      "牛乳を少しずつ加えて混ぜ、コンソメを入れる。弱火でとろみがつくまで5分煮て、塩・こしょうで味を整える。",
    ],
  },

  // ===== 中華 =====
  {
    id: "chinese-002", name: "回鍋肉", genre: "chinese", minutes: 15, difficulty: 2, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "豚こま肉", amount: 100, unit: "g" },
      { name: "キャベツ", amount: 3, unit: "枚" },
      { name: "ピーマン", amount: 1, unit: "個" },
      { name: "みそ", amount: 1, unit: "大さじ", seasoning: true },
      { name: "砂糖", amount: 1, unit: "小さじ", seasoning: true },
      { name: "しょうゆ", amount: 1, unit: "小さじ", seasoning: true },
      { name: "豆板醤", amount: 0.5, unit: "小さじ", seasoning: true },
      { name: "ごま油", amount: 1, unit: "小さじ", seasoning: true },
    ],
    steps: [
      "キャベツはざく切り、ピーマンは乱切りにする。みそ・砂糖・しょうゆ・豆板醤を混ぜておく。",
      "フライパンにごま油を熱し、豚肉を中火で炒める。",
      "肉の色が変わったら野菜を加えて2分炒め、合わせた調味料を入れて全体にからめる。",
    ],
  },
  {
    id: "chinese-003", name: "トマトと卵の中華炒め", genre: "chinese", minutes: 10, difficulty: 1, servings: 1,
    tools: ["frypan"],
    ingredients: [
      { name: "卵", amount: 2, unit: "個" },
      { name: "トマト", amount: 1, unit: "個" },
      { name: "鶏ガラスープの素", amount: 0.5, unit: "小さじ", seasoning: true },
      { name: "砂糖", amount: 0.5, unit: "小さじ", seasoning: true },
      { name: "ごま油", amount: 2, unit: "小さじ", seasoning: true },
      { name: "塩", amount: null, unit: "少々", seasoning: true },
    ],
    steps: [
      "トマトはくし切りにする。卵は塩少々を加えて溶く。",
      "フライパンにごま油の半量を熱し、卵を流し入れて大きく混ぜ、半熟で取り出す。",
      "残りのごま油でトマトを中火で1分炒め、鶏ガラスープの素と砂糖を加える。",
      "卵を戻し入れてさっと混ぜる。",
    ],
  },

  // ===== 汁物・鍋 =====
  {
    id: "soup-002", name: "かきたま汁", genre: "soup", minutes: 10, difficulty: 1, servings: 1,
    tools: ["pot"],
    ingredients: [
      { name: "卵", amount: 1, unit: "個" },
      { name: "長ねぎ", amount: 5, unit: "cm" },
      { name: "水", amount: 250, unit: "ml", seasoning: true },
      { name: "顆粒だし", amount: 0.5, unit: "小さじ", seasoning: true },
      { name: "しょうゆ", amount: 1, unit: "小さじ", seasoning: true },
      { name: "片栗粉", amount: 1, unit: "小さじ", seasoning: true },
      { name: "塩", amount: null, unit: "少々", seasoning: true },
    ],
    steps: [
      "長ねぎは斜め薄切りにする。片栗粉は水小さじ2（分量外）で溶く。",
      "鍋に水・だし・長ねぎを入れて中火で煮立て、しょうゆと塩で味をつける。",
      "水溶き片栗粉を混ぜながら入れ、とろみがついたら溶き卵を細く回し入れる。卵がふんわりしたら火を止める。",
    ],
  },

  // ===== 副菜 =====
  {
    id: "side-002", name: "きゅうりの塩昆布あえ", genre: "side", minutes: 5, difficulty: 1, servings: 1,
    tools: [],
    ingredients: [
      { name: "きゅうり", amount: 1, unit: "本" },
      { name: "塩昆布", amount: 5, unit: "g", seasoning: true },
      { name: "ごま油", amount: 0.5, unit: "小さじ", seasoning: true },
    ],
    steps: [
      "きゅうりはポリ袋に入れてめん棒などでたたき、食べやすく割る。",
      "塩昆布とごま油を加えて袋の上からもみ、5分おく。",
    ],
  },
].map(r => ({ ...r, custom: false }));
