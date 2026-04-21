import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "assets", "characters");
const API_URL = "https://aihorde.net/api/v2";
const API_KEY = process.env.AIHORDE_API_KEY || "0000000000";
const POLL_INTERVAL = 5000;
const NEGATIVE = "nsfw, nudity, modern clothing, western features, heavy makeup, gore, deformed hands, extra fingers, blurry face, low quality, watermark, text, holding blade, gripping blade, touching sharp edge, hand on blade, curved sword, bent blade, katana, dao, sabre";

const CHARACTERS = [
  {
    id: "player",
    name: "Player (独孤宸)",
    prompt: "A young Chinese male swordsman in ancient wuxia setting, 16-17 years old, handsome and composed face with deep dark eyes carrying a quiet solitary intensity, short-medium black hair with a few loose strands, lean and upright build suggesting latent strength, wearing a deep midnight blue martial arts robe with subtle silver star-pattern embroidery on the collar and sleeves, a plain sheathed jian (straight sword) at his waist, standing alone beneath a vast starry night sky on a high cliff overlooking misty mountains, cool moonlight casting silver highlights, a lone and sovereign bearing like the north celestial star, Chinese ink painting aesthetic with deep indigo and silver tones, portrait composition from waist up, anime-inspired semi-realistic style, detailed face, high quality"
  },
  {
    id: "li-yunshu",
    name: "Li Yunshu (李云舒)",
    prompt: "A strikingly beautiful and spirited young Chinese swordswoman in ancient wuxia setting, 18-19 years old, mature yet youthful, radiant bright smile with dazzling white teeth (明媚皓齿), sharp lively dark eyes full of passion and inner strength, elegant facial features — NOT childish, clearly a young woman not a girl, glossy black hair in a sleek high half-updo with colorful silk ribbons, wearing a vivid well-tailored martial arts hanfu in warm rose-red or coral tones with gold embroidered borders, both hands gripping firmly around the hilt of a jian straight sword — the blade is perfectly straight and flat with zero curve from crossguard to gleaming tip, held diagonally across the body in a strong guard posture conveying fierce protection of those she loves, sword is prominently visible and central to the composition, standing upright with heroic gallant bearing, warm spring light, cherry blossoms in background, waist-up portrait, anime-inspired semi-realistic style, detailed mature expressive face, high quality"
  },
  {
    id: "wang-tie",
    name: "Wang Tie (王铁)",
    prompt: "An elderly Chinese martial artist in ancient wuxia setting, 60-65 years old, weathered face with deep wrinkles and scars, white hair and beard, sharp experienced eyes with a warm righteous gaze, broad-shouldered and sturdy build, wearing a dark brown and gray travel-worn martial arts robe with a leather belt, a saber (dao) strapped to his back, standing outside a rustic roadside inn, dusty road and distant mountains in the background, warm sunset lighting, Chinese ink painting aesthetic with earthy tones, portrait composition from waist up, anime-inspired semi-realistic style, detailed face, high quality"
  },
  {
    id: "mysterious-elder",
    name: "Mysterious Elder (神秘老者)",
    prompt: "A mysterious ancient Chinese sage in wuxia setting, very old with ageless quality, long flowing white hair and long white beard, piercing all-knowing eyes with a faint enigmatic smile, gaunt and tall figure, wearing a simple faded white and pale gray daoist robe with wide sleeves, hands clasped behind his back, standing on a misty mountain cliff under a moonless starry sky, surrounded by swirling clouds and faint ethereal glow, transcendent otherworldly atmosphere, Chinese ink painting aesthetic with cool silver and indigo tones, portrait composition from waist up, anime-inspired semi-realistic style, detailed face, high quality"
  },
  {
    id: "yan-chixing",
    name: "Yan Chixing (燕赤行)",
    prompt: "A cold brooding Chinese swordsman in ancient wuxia setting, mid-20s, sharp angular face with a prominent deep scar on his left cheek, narrow intense eyes with a guarded piercing gaze, short messy black hair, lean muscular build, wearing a dark red and black martial arts outfit with a high collar and worn leather bracers, a sheathed straight sword (jian) in its scabbard at his left waist, right hand wrapped around the hilt grip firmly with thumb resting on the sword guard (tsuba), never touching the blade, standing alone in an autumn forest with red fallen leaves, overcast moody lighting, Chinese ink painting aesthetic with dark crimson and charcoal tones, portrait composition from waist up, anime-inspired semi-realistic style, detailed face, high quality"
  },
  {
    id: "ling-xue",
    name: "Ling Xue (凌雪)",
    prompt: "A solitary Chinese swordswoman in ancient wuxia setting, early 20s, beautiful but cold and aloof expression, sharp calculating eyes that hide deep emotions, long straight black hair flowing freely with a simple silver hairpin, pale complexion, slender and agile build, wearing an elegant pure white hanfu-style martial arts outfit with subtle silver embroidery, holding a jian Chinese straight double-edged sword — the blade is perfectly straight with no curve whatsoever, completely flat and linear from guard to tip, right hand gripping the hilt firmly with thumb on the crossguard, standing in a snowy bamboo forest with snowflakes gently falling, cool winter light, Chinese ink painting aesthetic with white silver and pale blue tones, portrait composition from waist up, anime-inspired semi-realistic style, detailed face, high quality"
  },
  {
    id: "su-qing",
    name: "Su Qing (苏青)",
    prompt: "A young Chinese female healer in ancient wuxia setting, early 20s, gentle face with a trace of melancholy in her eyes, soft kind expression, black hair tied in a simple low bun with a few loose strands framing her face, wearing a muted green and cream hanfu-style outfit with rolled-up sleeves, a large wooden medicine chest strapped to her back with cloth bands, one hand holding a bundle of dried herbs, standing on a quiet mountain path with wildflowers and morning mist, soft warm natural lighting, Chinese ink painting aesthetic with gentle green and warm earth tones, portrait composition from waist up, anime-inspired semi-realistic style, detailed face, high quality"
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
        width: 1024,
        height: 1024,
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
    ? CHARACTERS.filter(c => c.id === filter)
    : CHARACTERS;

  if (targets.length === 0) {
    console.error(`Unknown character: ${filter}`);
    console.error(`Available: ${CHARACTERS.map(c => c.id).join(", ")}`);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating ${targets.length} avatar(s)...\n`);

  for (const char of targets) {
    const outputPath = path.join(OUTPUT_DIR, `${char.id}.png`);

    if (!filter && fs.existsSync(outputPath)) {
      console.log(`[skip] ${char.name} — ${char.id}.png already exists`);
      continue;
    }

    try {
      console.log(`[submit] ${char.name}`);
      const jobId = await submitJob(char.prompt);
      console.log(`  job: ${jobId}`);

      const imgUrl = await waitForResult(jobId);
      console.log(`\n  downloading...`);

      await downloadImage(imgUrl, outputPath);
      console.log(`  saved: ${outputPath}\n`);
    } catch (err) {
      console.error(`  [error] ${char.name}: ${err.message}\n`);
    }
  }

  console.log("Done.");
}

main();
