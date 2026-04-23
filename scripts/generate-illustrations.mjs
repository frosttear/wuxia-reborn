import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root if present
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const OUTPUT_DIR = path.join(__dirname, "..", "assets", "illustrations");
const API_URL = "https://aihorde.net/api/v2";
const API_KEY = process.env.AIHORDE_API_KEY || "0000000000";
if (API_KEY === "0000000000") {
  console.warn("⚠  AIHORDE_API_KEY not set — using anonymous key (very slow queue). Set it in .env or environment.");
}
const POLL_INTERVAL = 5000;
const NEGATIVE = "nsfw, nudity, modern clothing, western features, heavy makeup, gore, extra fingers, blurry, low quality, watermark, text, logo, signature";

const ILLUSTRATIONS = [
  {
    id: "tianmo-win",
    name: "天魔 — 胜利",
    prompt: "Epic wuxia battle aftermath scene, a young Chinese male swordsman in a midnight blue robe standing victorious, sword tip lowered, dramatic clouds parting above him as golden dawn light breaks through, the massive dark demonic figure of the Demon King (陆无归) collapsing to the ground with black demonic energy dispersing into wisps, the sky shifting from ominous purple-black to radiant gold, shattered mountain terrain, a profound sense of triumph and release, wide cinematic landscape composition, Chinese ink painting aesthetic with deep gold and indigo tones, epic fantasy illustration style, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "tianmo-lose",
    name: "天魔 — 失败",
    prompt: "Tragic wuxia scene, a young Chinese male swordsman in a midnight blue robe collapsed on the ground, one hand pressed to the earth, wounded and exhausted, dark demonic energy swirling around him like black chains, the towering silhouette of the Demon King standing above him against a blood-red stormy sky, sense of overwhelming despair yet unbroken will in the fallen warrior's eyes, broken sword on the ground nearby, wide cinematic landscape composition, Chinese ink painting aesthetic with deep crimson and charcoal tones, melancholic dramatic atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "sword-soul-win",
    name: "剑魂 — 胜利",
    prompt: "Ethereal wuxia scene, the moment a thousand-year-old sword spirit finally finds peace, a translucent ghostly humanoid figure made of pure sword intent dissolving into thousands of tiny flowing lights like falling stars, fragments of a shattered jade pendant (玉牌) glowing and floating upward, a young Chinese male swordsman in a midnight blue robe standing solemnly with lowered sword, surrounded by the dispersing luminous fragments that slowly drift toward his forehead, an expression of deep reverence and release, night sky filled with drifting lights, wide cinematic scene, Chinese ink painting aesthetic with silver and pale gold tones, transcendent spiritual atmosphere, anime-inspired semi-realistic art, high quality"
  },
  {
    id: "sword-soul-lose",
    name: "剑魂 — 失败",
    prompt: "Intense wuxia scene, a young Chinese male swordsman on his knees overwhelmed, countless translucent sword slashes filling the air around him like a lattice of silver light, an imposing ethereal formless figure made of pure ancient sword intent towering above, neither human nor monster but pure will given form, cold otherworldly light from the spirit illuminating the kneeling warrior below, the atmosphere of facing something beyond mortal limits, wide cinematic composition, Chinese ink painting aesthetic with icy silver and deep shadow tones, dramatic and overwhelming atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "wang-tie-ending",
    name: "王铁 — 最后的镖路",
    prompt: "Quiet sorrowful wuxia scene, a young Chinese male swordsman kneeling before a simple grave on a snowy hillside at dawn, eight grave markers lined in a row, he is placing a worn iron plaque (铁牌) at the last grave, one hand resting gently on the stone, head bowed in silent farewell, bare winter trees behind him, soft grey dawn light, snow on the ground, a sense of deep respect and grief and promise kept, wide cinematic composition, Chinese ink painting aesthetic with muted grey and white tones, quiet emotional atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "li-yunshu-ending",
    name: "李云舒 — 一剑长歌",
    prompt: "Poetic wuxia scene, a young Chinese male swordsman practicing a graceful sword form alone in a plum blossom garden at dusk, pink petals drifting through the air, and behind him a faint translucent impression of a radiant young swordswoman (李云舒) in a bright goose-yellow and peach-toned hanfu watching with a beaming dazzling smile full of warmth and life, her high-looped hair with golden ribbons gently floating in the memory-breeze, she is almost ghostlike yet luminous and vivid as if the joy of her is woven into the sword movement itself, the two figures connected by golden threads of light and shared memory, warm amber evening light, wide cinematic composition, Chinese ink painting aesthetic with warm yellow and amber and pink tones, lyrical radiant dreamlike atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "mysterious-elder-ending",
    name: "神秘老者 — 一线天命",
    prompt: "Serene wuxia scene at the break of dawn, a young Chinese male swordsman and a very old white-haired sage (沈玄清) sitting together on a cliff edge facing the rising sun, a softly glowing shattered jade pendant floating between them, both figures silent and at peace after a long night of trials, the vast misty mountains below, first light touching the clouds turning them gold, the jade pendant radiating a faint warm light as if something ancient has finally accepted its fate, wide cinematic composition, Chinese ink painting aesthetic with pale dawn gold and deep indigo tones, transcendent serene atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "yan-chixing-ending",
    name: "燕赤行 — 无名同行",
    prompt: "Atmospheric wuxia night scene, two lone Chinese swordsmen walking a dark mountain road together at night, the brooding scarred swordsman (燕赤行) in dark red stepping slightly ahead and to the side as if shielding his companion, one of them holding a dim lantern that casts a warm circle of light on the rocky path, the surrounding forest dark and vast, a sense of unspoken loyalty and quiet solidarity between two people who have chosen the same direction, wide cinematic composition, Chinese ink painting aesthetic with deep shadow and warm amber lantern light, quiet companionable atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "su-qing-ending",
    name: "苏青 — 针灸传心",
    prompt: "Tender wuxia scene, in a simple countryside medicine hall, a gentle young woman healer (苏青) in muted green is standing with her back turned and shoulders slightly trembling in suppressed emotion, her father an elderly doctor bowing in gratitude to a young swordsman in the doorway, the swordsman witnessing this quiet family reunion, dried herbs hanging from the rafters, warm candlelight inside, late afternoon sun coming through the window, a sense of things finally found after long searching, wide cinematic composition, Chinese ink painting aesthetic with warm green and amber earth tones, gentle emotional atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "rebirth",
    name: "轮回 — 玉佩引渡",
    prompt: "Spectacular wuxia worldline-reset scene, a massive violent spiral vortex dominates the entire frame — concentric rings of distorted space and fractured time spinning inward like a cosmic whirlpool, the fabric of reality visibly tearing and bending in spacetime shock waves, inside the vortex multiple translucent ghost-images of the same young Chinese swordsman at different ages and moments overlap and dissolve, at the absolute center of the vortex a twin-fish jade pendant (双鱼玉佩, two carved fish in pale green nephrite) blazing with searing golden-white light, its cracks erupting blinding rays outward, the pendant is the eye of the storm and clearly the brightest element in the composition, shockwave rings and temporal distortion rippling outward from it like a stone dropped in a mirror surface, deep indigo and electric blue void with streaks of gold and white lightning crackling along the spiral arms, overwhelming sense of being pulled irresistibly into a new timeline, wide cinematic landscape composition, Chinese ink painting aesthetic with electric indigo and blazing gold tones, dynamic kinetic atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "wuxiang-unlock",
    name: "无相剑意 — 化境",
    prompt: "Mystical wuxia scene depicting the moment a swordsman comprehends the formless sword intent (无相剑意), a young Chinese male swordsman in meditation pose with eyes closed, six ghostly luminous silhouettes of his companions (two men, four women) standing in a circle around him each emitting soft light, the light from each figure flows inward and merges into translucent sword shapes that dissolve around the swordsman, the air shimmering with wordless understanding, an ancient stone stele in the background with faded carvings barely visible, profound stillness and realization, no physical sword yet every particle of air a blade, wide cinematic composition, Chinese ink painting aesthetic with silver white and pale gold tones, ethereal transcendent atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "ling-xue-ending",
    name: "凌雪 — 凌霜剑域",
    prompt: "Stark beautiful wuxia scene, a young swordswoman in white (凌雪) and a young swordsman in midnight blue standing side by side on a frozen battlefield, facing the same direction into an approaching storm of ice and snow, both with swords drawn, the icy wind sweeping long flowing hair and robes behind them, neither looking at each other but standing as equals facing the same horizon, a sense of choice made and past shed, frost crystals in the air catching the pale light, wide cinematic composition, Chinese ink painting aesthetic with white silver and deep blue-black tones, resolute melancholic atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  // ── First-met ──
  {
    id: "wang-tie-meet",
    name: "王铁 — 初遇",
    prompt: "Wuxia chance-meeting scene, a chance encounter at a busy roadside inn at dusk, a broad-shouldered rugged Chinese man in roughspun escort clothes with an iron badge plaque at his belt (王铁) sizing up a young Chinese male swordsman in a midnight blue robe, both holding cups of tea across a wooden table, Wang Tie's gruff weathered face showing cautious appraisal, lantern glow inside the inn, warm amber light, the understated tension of two strangers reading each other, wide cinematic composition, Chinese ink painting aesthetic with warm amber and deep brown tones, atmospheric and grounded, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "li-yunshu-meet",
    name: "李云舒 — 初遇",
    prompt: "Lively wuxia first-encounter scene, a radiant young Chinese swordswoman in a bright peach and goose-yellow hanfu with high-looped hair and golden ribbons (李云舒) suddenly blocking the path of a young Chinese male swordsman in midnight blue on a sunlit mountain trail, her quick bright eyes full of mischief and curiosity as she studies him, cherry blossoms drifting past, spring afternoon light, infectious cheerful energy of someone who has no fear of strangers, wide cinematic composition, Chinese ink painting aesthetic with warm peach and soft gold tones, lively and vivid atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "yan-chixing-meet",
    name: "燕赤行 — 初遇",
    prompt: "Atmospheric wuxia first-encounter scene, a tall lean Chinese swordsman with a scar across his jaw in worn dark red traveling clothes (燕赤行) standing alone at the edge of a moonlit cliff overlooking a misty river valley, turning his head slightly as a young Chinese male swordsman in midnight blue approaches from behind, Yan Chixing's expression guarded and assessing without hostility, the two strangers sharing a moment of mutual sizing-up in silence, cold moonlight, mist below, solitary atmosphere on the cliff edge, wide cinematic composition, Chinese ink painting aesthetic with deep indigo and cold silver tones, brooding and restrained atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "su-qing-meet",
    name: "苏青 — 初遇",
    prompt: "Gentle wuxia first-encounter scene, a calm young Chinese woman in muted sage green medicinal robes (苏青) looking up from tending a patient under a simple roadside shelter, her composed attentive eyes meeting those of a young Chinese male swordsman in midnight blue who has just arrived, medicinal herb bundles and a wooden medicine chest around her, soft dappled afternoon light through bamboo leaves, the quiet steady presence of someone grounded in their purpose, wide cinematic composition, Chinese ink painting aesthetic with soft green and warm earth tones, peaceful and measured atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "ling-xue-meet",
    name: "凌雪 — 初遇",
    prompt: "Tense wuxia first-encounter scene, a cold beautiful young Chinese swordswoman in pristine white robes with a silver hair ornament (凌雪) standing in a snowy forest clearing, sword leveled calmly toward a young Chinese male swordsman in midnight blue who has inadvertently entered her training ground, her expression sharp and unreadable — not hostile but giving nothing away, snow falling softly around them, bare winter trees, icy blue-white light, the charged stillness of two blades in the same space, wide cinematic composition, Chinese ink painting aesthetic with stark white and deep ink-blue tones, cold and precise atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  // ── Bond ch.1 ──
  {
    id: "wang-tie-bond-1",
    name: "王铁 — 第一章",
    prompt: "Warm wuxia bonding scene, Wang Tie (王铁) a broad rugged Chinese escort warrior in roughspun clothes and a young Chinese male swordsman in midnight blue sitting across from each other at a roadside campfire after surviving their first danger together, Wang Tie extending a rough calloused hand across the fire in a gesture of brotherhood, his iron badge plaque glinting in the firelight, the young swordsman meeting the grip, the first real acknowledgment of mutual respect between two warriors, dark night forest behind them, warm amber campfire glow, wide cinematic composition, Chinese ink painting aesthetic with deep shadow and warm amber tones, quiet camaraderie, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "li-yunshu-bond-1",
    name: "李云舒 — 第一章",
    prompt: "Energetic wuxia bonding scene, Li Yunshu (李云舒) in her bright peach and yellow hanfu and the young Chinese male swordsman in midnight blue in a spontaneous sword sparring match in an open field at golden hour, both laughing as their blades meet, her golden hair ribbons streaming behind her, the uninhibited joy of two people discovering a real connection through play and competition, long evening shadows across the grass, warm amber and gold light, wide cinematic composition, Chinese ink painting aesthetic with vibrant warm gold and green tones, joyful and energetic atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "yan-chixing-bond-1",
    name: "燕赤行 — 第一章",
    prompt: "Dramatic wuxia bonding scene, Yan Chixing (燕赤行) in dark red robes with his scarred jaw set in concentration, gripping the arm of an injured young Chinese male swordsman in midnight blue and pulling him into shelter under a stone overhang during heavy rain, the scarred man's guarded expression showing the first crack — not warmth yet, but unmistakable choice, rain hammering the ground outside the shelter, the two catching their breath, the unspoken transaction of trust between survivors, wide cinematic composition, Chinese ink painting aesthetic with dark charcoal and cold rain-blue tones with a point of warmth, tense and quietly emotional, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "su-qing-bond-1",
    name: "苏青 — 第一章",
    prompt: "Tender wuxia bonding scene, Su Qing (苏青) in muted sage green medicinal robes leaning forward in concentration as she carefully applies herbal poultice to the bandaged arm of a young Chinese male swordsman in midnight blue who sits on a low wooden stool, her focused gentle hands steady and precise, the swordsman watching her work with quiet gratitude, candlelight illuminating the small medicine hall, dried herbs hanging from the rafters above, the intimacy of being cared for without judgment, wide cinematic composition, Chinese ink painting aesthetic with warm amber candlelight and soft green tones, quiet and tender atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "ling-xue-bond-1",
    name: "凌雪 — 第一章",
    prompt: "Restrained wuxia bonding scene, Ling Xue (凌雪) in pristine white winter robes standing beside a young Chinese male swordsman in midnight blue on a snow-covered mountain training ground, both facing forward in an opening sword stance, her posture precise and demanding as she demonstrates a technique with quiet authority, the young swordsman mirroring her form with focused attention, cold grey sky above, snow underfoot, the first tentative thaw in her reserved exterior visible only in the patience of her instruction, wide cinematic composition, Chinese ink painting aesthetic with white and deep grey-blue tones, disciplined and quietly evolving atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  // ── Bond ch.2 ──
  {
    id: "wang-tie-bond-2",
    name: "王铁 — 第二章",
    prompt: "Dynamic wuxia bonding scene, Wang Tie (王铁) in roughspun escort clothes and the young Chinese male swordsman in midnight blue fighting back to back against a ring of bandits on a narrow mountain road at amber dusk, the two moving in wordless coordination, Wang Tie's broad back a wall protecting his companion, trust made entirely physical and unspoken, action composition with motion and dust, warm dusk light, wide cinematic landscape, Chinese ink painting aesthetic with amber and ochre tones and dark silhouettes, kinetic and visceral atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "li-yunshu-bond-2",
    name: "李云舒 — 第二章",
    prompt: "Warm wuxia bonding scene, Li Yunshu (李云舒) in her bright peach and yellow hanfu sitting beside the young Chinese male swordsman in midnight blue on a rooftop ledge at night during a lantern festival, glowing paper lanterns floating up all around them like rising stars, she leaning forward with animated hands telling a story, her face radiant in the lantern light, he watching her with a quiet smile too small to hide, the city glowing below, festival music distant, a moment of pure unhurried happiness between two people who know each other now, wide cinematic composition, Chinese ink painting aesthetic with warm gold and deep night-blue tones, luminous and intimate atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "yan-chixing-bond-2",
    name: "燕赤行 — 第二章",
    prompt: "Intimate wuxia bonding scene, Yan Chixing (燕赤行) in dark red robes and the young Chinese male swordsman in midnight blue sitting across from each other in a dim near-empty teahouse at night, Yan Chixing's scarred face finally showing something raw and real as he speaks with low intensity, the young swordsman listening without shifting his gaze, a low clay oil lamp between them casting unsteady warm light over their serious expressions, the stillness of a conversation that matters, wide cinematic composition, Chinese ink painting aesthetic with deep shadow and low amber oil-lamp tones, confessional and charged atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "su-qing-bond-2",
    name: "苏青 — 第二章",
    prompt: "Serene wuxia bonding scene, Su Qing (苏青) in muted sage green walking alongside the young Chinese male swordsman in midnight blue through a sun-dappled summer herb garden, she pointing out medicinal plants with quiet expertise, he listening carefully with genuine interest, a natural unhurried companionship between them, tall medicinal plants around them in full leaf, warm summer afternoon light filtering through foliage, the ease of two people who no longer need to perform for each other, wide cinematic composition, Chinese ink painting aesthetic with lush green and warm gold tones, gentle and domestic atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "ling-xue-bond-2",
    name: "凌雪 — 第二章",
    prompt: "Melancholic wuxia bonding scene, Ling Xue (凌雪) in white winter robes standing at the edge of a frozen lake at blue twilight, her usual cold composure gone for just a moment as she looks out at the ice with a distant and pained expression, the young Chinese male swordsman in midnight blue standing nearby close enough to be present without crowding, neither speaking, the space between them filled with unspoken understanding, ice-reflected twilight rippling across both their faces in pale blue light, wide cinematic composition, Chinese ink painting aesthetic with cold blue and deep indigo tones, still and charged emotional atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  // ── Journey / Environment ──
  {
    id: "journey-dawn",
    name: "黎明出行",
    prompt: "Serene wuxia travel scene, a lone young Chinese male swordsman in a midnight blue robe walking along a misty mountain path at dawn, the first golden light breaking over distant peaks, pine trees silhouetted against a pale lavender sky, his figure small against the vast landscape conveying freedom and possibility, a simple bundled pack on his back, wide cinematic landscape composition, Chinese ink painting aesthetic with soft gold and blue-grey tones, peaceful contemplative atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "ancient-grotto",
    name: "古洞秘境",
    prompt: "Mysterious wuxia discovery scene, a young Chinese male swordsman in a midnight blue robe standing at the entrance of an ancient cave system, bioluminescent moss and ancient carved sword patterns glowing softly on the stone walls, rays of light filtering through a crack in the ceiling illuminating floating dust motes, the warrior holding a torch looking at carved martial diagrams on the cave walls with awe, wide cinematic composition, Chinese ink painting aesthetic with deep teal and gold tones, mysterious ancient atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "winter-seclusion",
    name: "寒冬闭关",
    prompt: "Intense wuxia cultivation scene, a young Chinese male swordsman in a midnight blue robe sitting in deep meditation in the lotus position in the middle of a heavy snowstorm on a mountain peak, snow falling all around him but melting before it touches him due to inner energy radiating faintly as a warm golden aura, ice forming on nearby rocks while he remains still and focused, predawn darkness pierced only by the inner light of his cultivation, wide cinematic composition, Chinese ink painting aesthetic with cold white and deep blue tones with inner warmth gold, intense solitary atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "temple-visit",
    name: "古庙祈福",
    prompt: "Peaceful wuxia scene, a young Chinese male swordsman in a midnight blue robe standing before a weathered ancient Buddhist temple entrance, incense smoke curling upward in the still air, stone lion guardians on either side of the steps worn smooth by centuries of visitors, golden light filtering through the temple doors onto the stone courtyard, the warrior offering a respectful bow, autumn maple leaves drifting past in red and gold, wide cinematic composition, Chinese ink painting aesthetic with warm amber and red tones, serene and reverent atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "past-life-dream",
    name: "前世梦回",
    prompt: "Haunting wuxia dreamscape, a young Chinese male swordsman in a midnight blue robe standing in a ghostly battlefield of his past lives, translucent echoes of his former selves visible around him as faint luminous silhouettes in different poses and different clothes from different eras, some victorious some fallen, fragments of memory swirling like luminous petals in a dark void, the warrior looking at his own hands as if seeing the weight of every past life, wide cinematic composition, deep indigo and ghost-white tones with faint gold memory-threads, melancholic and transcendent atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  }
];

async function submitJob(prompt) {
  const fullPrompt = `${prompt} ### ${NEGATIVE}`;
  const res = await fetch(`${API_URL}/generate/async`, {
    method: "POST",
    headers: { "apikey": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: fullPrompt,
      params: {
        sampler_name: "k_euler_a",
        cfg_scale: 7,
        steps: 30,
        width: 1024,
        height: 704,
        karras: true,
        hires_fix: false,
        clip_skip: 1,
        n: 1,
      },
      models: ["DreamShaper XL"],
      slow_workers: true,
      trusted_workers: false
    })
  });
  if (!res.ok) throw new Error(`Submit failed: ${await res.text()}`);
  return (await res.json()).id;
}

async function waitForResult(jobId) {
  while (true) {
    const res = await fetch(`${API_URL}/generate/status/${jobId}`);
    const data = await res.json();

    if (data.faulted) throw new Error(`Job ${jobId} faulted`);

    if (data.done && data.generations?.length > 0) {
      return data.generations[0].img;
    }

    const wp = data.waiting || 0;
    const proc = data.processing || 0;
    process.stdout.write(`\r  queue: ${wp} waiting, ${proc} processing...`);
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}

async function downloadImage(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

async function main() {
  const filter = process.argv[2];
  const targets = filter
    ? ILLUSTRATIONS.filter(c => c.id === filter)
    : ILLUSTRATIONS;

  if (targets.length === 0) {
    console.error(`Unknown illustration: ${filter}`);
    console.error(`Available: ${ILLUSTRATIONS.map(c => c.id).join(", ")}`);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating ${targets.length} illustration(s)...\n`);

  for (const illus of targets) {
    const outputPath = path.join(OUTPUT_DIR, `${illus.id}.png`);

    if (!filter && fs.existsSync(outputPath)) {
      console.log(`[skip] ${illus.name} — ${illus.id}.png already exists`);
      continue;
    }

    try {
      console.log(`[submit] ${illus.name}`);
      const jobId = await submitJob(illus.prompt);
      console.log(`  job: ${jobId}`);

      const imgUrl = await waitForResult(jobId);
      console.log(`\n  downloading...`);

      await downloadImage(imgUrl, outputPath);
      console.log(`  saved: ${outputPath}\n`);
    } catch (err) {
      console.error(`  [error] ${illus.name}: ${err.message}\n`);
    }
  }

  console.log("Done.");
}

main();
