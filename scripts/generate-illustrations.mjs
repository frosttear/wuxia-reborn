import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "assets", "illustrations");
const API_URL = "https://aihorde.net/api/v2";
const API_KEY = process.env.AIHORDE_API_KEY || "0000000000";
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
    prompt: "Poetic wuxia scene, a young Chinese male swordsman practicing a graceful sword form alone in a plum blossom garden at dusk, pink petals drifting through the air, and behind him a faint translucent impression of a young swordswoman (李云舒) in blue and white watching with a warm smile, she is almost ghostlike yet full of presence as if the memory of her is woven into the sword movement itself, the two figures connected by invisible threads of shared memory, warm amber evening light, wide cinematic composition, Chinese ink painting aesthetic with soft pink and amber tones, lyrical dreamlike atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
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
    id: "ling-xue-ending",
    name: "凌雪 — 凌霜剑域",
    prompt: "Stark beautiful wuxia scene, a young swordswoman in white (凌雪) and a young swordsman in midnight blue standing side by side on a frozen battlefield, facing the same direction into an approaching storm of ice and snow, both with swords drawn, the icy wind sweeping long flowing hair and robes behind them, neither looking at each other but standing as equals facing the same horizon, a sense of choice made and past shed, frost crystals in the air catching the pale light, wide cinematic composition, Chinese ink painting aesthetic with white silver and deep blue-black tones, resolute melancholic atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
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
        cfg_scale: 2,
        steps: 30,
        width: 1216,
        height: 832,
        karras: true,
        hires_fix: false,
        clip_skip: 1,
        n: 1,
        loras: [{ name: "TurboMix", model: 1, clip: 1 }]
      },
      models: ["AlbedoBase XL (SDXL)"],
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
