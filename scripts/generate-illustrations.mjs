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

// ── Character appearance templates (reused verbatim in every prompt to maximise consistency) ──
const CHAR = {
  player:    "a young Chinese male swordsman in a midnight blue robe",
  wangTie:   "an elderly Chinese escort warrior (王铁) with white hair and a full white beard, deep sun-weathered lines on his face, wearing roughspun brown escort clothes with a circular iron badge plaque hanging at his belt",
  liYunshu:  "a radiant young Chinese swordswoman (李云舒) in bright peach-and-gold hanfu, hair styled in a high-looped bun secured with golden ribbons, large bright expressive eyes, sword at her side",
  yanChixing:"a tall lean Chinese swordsman (燕赤行) with a deep scar running from his left eyebrow down across his jaw, cold expressionless face, wearing worn dark crimson traveling clothes, sword at his waist",
  suQing:    "a calm composed young Chinese woman (苏青) in muted sage-green medicinal robes, dark hair in a simple practical bun, a large wooden medicine chest nearby, serene steady eyes",
  lingXue:   "a cold beautiful young Chinese swordswoman (凌雪) in pristine white robes with silver trim, hair half-pinned with a silver ice-flower ornament, pale complexion, sword with an ice-flower carved on the sheath",
};

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
    prompt: `Wuxia first-meeting scene inside a dimly lit town tavern at dusk. ${CHAR.wangTie} sits alone at a wooden table, drinking. ${CHAR.player} approaches and raises a cup in greeting. Wang Tie's weathered face shows measured appraisal — the cautious sizing-up of a veteran jianghu man meeting a stranger. Warm amber lantern light, other patrons visible but distant, the understated quiet of two strangers meeting for the first time. Wide cinematic composition, Chinese ink painting aesthetic, warm amber and deep shadow tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-meet",
    name: "李云舒 — 初遇",
    prompt: `Wuxia first-encounter scene on a city outskirts road, daytime. ${CHAR.liYunshu} is surrounded by three sneering roguish men who are harassing her. She is completely calm — left hand resting on her sword hilt, chin slightly raised, eyes sharp and unafraid. In the background ${CHAR.player} is approaching, causing the rogues to hesitate and start backing away. She is not being rescued — she had it handled — but she glances at the approaching stranger with curiosity and a slight smile. Open road, spring afternoon light, scattered blossoms. Wide cinematic composition, Chinese ink painting aesthetic, warm peach and sunlit gold tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-meet",
    name: "燕赤行 — 初遇",
    prompt: `Wuxia first-encounter scene at a busy martial demonstration ground, midday. ${CHAR.yanChixing} stands apart from the crowd. He is turning to look directly at ${CHAR.player}, his sharp gaze locking on with quiet intensity — an unspoken challenge. The surrounding crowd maintains a visible distance from the scarred man. Harsh afternoon light, dust in the air, the sounds of sparring in the background. Wide cinematic composition, Chinese ink painting aesthetic, harsh sunlit ochre and deep shadow tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-meet",
    name: "苏青 — 初遇",
    prompt: `Wuxia first-encounter scene at a town entrance gate, warm afternoon. ${CHAR.suQing} crouches on the roadside carefully bandaging a small child's scraped knee, her hands skilled and unhurried. A small crowd watches. The child's mother holds out coins — Su Qing gently waves them away. At that moment she looks up and meets the eyes of ${CHAR.player} who has stopped nearby. Her expression is measured and tranquil — not shy, just unhurried. Soft dappled light, town gate arch behind them. Wide cinematic composition, Chinese ink painting aesthetic, warm earth and soft green tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "ling-xue-meet",
    name: "凌雪 — 初遇",
    prompt: `Dramatic wuxia action scene on a remote mountain road at dusk. Three black-clad assassins are on the ground — fallen, defeated in an instant. ${CHAR.lingXue} stands with her back three-quarters turned, sword already lowering after three lightning-fast strikes, not even looking at the scene she just ended. Her posture is utterly composed. In the mid-ground ${CHAR.player} is catching his breath, clearly having just been saved. The last light cuts long shadows across the mountain path. Wide cinematic composition, Chinese ink painting aesthetic, stark white and cold dusk blue tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  // ── Bond ch.1 ──
  {
    id: "wang-tie-bond-1",
    name: "王铁 — 第一章",
    prompt: `Wuxia bonding scene inside a roadside inn at night. ${CHAR.wangTie} leans forward across a low table, his face lit by candlelight, one hand extended across the table holding an old iron token engraved with the character 信义 — passing it to ${CHAR.player} sitting across from him, a moment of passing on a thirty-year legacy. Warm candlelight, empty cups on the table, the late-night quiet of a near-empty inn. Wide cinematic composition, Chinese ink painting aesthetic, deep shadow and warm amber candlelight tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-bond-1",
    name: "李云舒 — 第一章",
    prompt: `Wuxia bonding scene in a plum garden at dusk, plum blossoms falling. ${CHAR.liYunshu} demonstrates a flowing sword technique with fierce grace — her late mother's style, 梅影剑. Her expression carries both pride and grief. ${CHAR.player} stands a few paces away, watching and beginning to mirror her stance with quiet focus. Falling petals drift between them. Warm amber evening light through the plum branches. Wide cinematic composition, Chinese ink painting aesthetic, warm peach-gold and deep shadow tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-bond-1",
    name: "燕赤行 — 第一章",
    prompt: `Wuxia bonding scene at a martial training ground, overcast afternoon. ${CHAR.yanChixing} and ${CHAR.player} face each other in an intense one-on-one sword duel — not a fight, a test. Yan Chixing's expression is sharp and focused, measuring every movement, the scar on his jaw prominent. Both blades are drawn and mid-motion in a close serious match. No crowd — just two blades and the weight of being judged. Wide cinematic composition, Chinese ink painting aesthetic, grey overcast light and deep shadow tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-bond-1",
    name: "苏青 — 第一章",
    prompt: `Wuxia bonding scene at a simple mountain-side shelter, late afternoon. ${CHAR.suQing} kneels beside ${CHAR.player} who sits against a rock, wounded from an ambush on the trail. Her hands are steady and precise as she applies herbal poultice to his wound. Her face holds a faraway look as she speaks — recounting her missing shifu, a healer who once poisoned himself gathering antidote herbs for a stranger. Medicinal herbs scattered nearby. Soft filtered light through bamboo. Wide cinematic composition, Chinese ink painting aesthetic, soft green and warm earth tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "ling-xue-bond-1",
    name: "凌雪 — 第一章",
    prompt: `Wuxia bonding scene inside a teahouse under night attack. ${CHAR.lingXue} moves with lethal precision at the center of combat, sword cutting through black-clad assassins bearing sect marks on their sleeves. ${CHAR.player} stands at her flank, sword drawn, guarding her side — fighting together for the first time. Broken furniture, overturned lanterns, close-quarters combat. Wide cinematic composition, Chinese ink painting aesthetic, warm lantern-gold and deep chaotic shadow tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  // ── Bond ch.2 ──
  {
    id: "wang-tie-bond-2",
    name: "王铁 — 第二章",
    prompt: `Dynamic wuxia bonding scene on a mountain road at night. ${CHAR.wangTie} and ${CHAR.player} stand back-to-back against a ring of encircling bandits. Wang Tie's broad stance is that of thirty years on escort roads, an immovable wall. The two move in wordless coordination. Torchlight from the bandits, dark forest on both sides, a stolen cargo crate visible nearby. Wide cinematic composition, Chinese ink painting aesthetic, cold night blue and harsh torchlight tones, kinetic and visceral atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-bond-2",
    name: "李云舒 — 第二章",
    prompt: `Tense wuxia bonding scene at a market street confrontation, daytime. ${CHAR.liYunshu} stands protectively in front of her family's market stall, facing two thuggish men who are extorting her. Her hand is on her sword hilt, chin raised, posture immovable — she will not back down. ${CHAR.player} stands behind her, watching her back. The family stall is visible — fabric and goods. Other market-goers watching nervously from a distance. Wide cinematic composition, Chinese ink painting aesthetic, warm midday market tones, tense and determined atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-bond-2",
    name: "燕赤行 — 第二章",
    prompt: `Wuxia bonding scene in a narrow night alley after a fight. Three black-clad assassins with Hanlight Sect marks on their sleeves lie defeated on the ground. ${CHAR.yanChixing} stands breathing hard, his left arm bleeding, a cloth pressed to the wound. ${CHAR.player} stands beside him, both facing the same direction as the aftermath settles. Yan Chixing's expression has cracked — not warmth yet, but unmistakable acknowledgment. Cold moonlight in the alley, puddles on the stone. Wide cinematic composition, Chinese ink painting aesthetic, cold night blue and deep shadow tones with a single point of warmth, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-bond-2",
    name: "苏青 — 第二章",
    prompt: `Wuxia bonding scene on a dangerous mountain cliff face, overcast midday. ${CHAR.suQing} carefully climbs a rocky ledge to reach a cluster of rare blue-green herbs (青心草) growing from a crevice, her movements calm and methodical despite the danger. ${CHAR.player} stands on the path below, ready to act as her anchor. The reason: a poisoned child waiting below. Dramatic precipitous landscape, grey sky, wind pulling at her robes. Wide cinematic composition, Chinese ink painting aesthetic, grey-green and cool mountain tones, tense and determined atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "ling-xue-bond-2",
    name: "凌雪 — 第二章",
    prompt: `Wuxia bonding scene under a covered veranda at night, heavy rain falling outside. ${CHAR.lingXue} stands at the edge of the space looking out at the rain, her sword leaning against the wall nearby. For the first time her cold composure is absent — something distant and uncertain in her expression, the first crack in the belief that only strength matters. ${CHAR.player} sits nearby, present but not crowding, the rain filling the silence between them. Soft interior lamplight against the dark wet world outside. Wide cinematic composition, Chinese ink painting aesthetic, cold rain-blue and dim warm lamplight tones, still and quietly charged atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  // ── Bond ch.3 ──
  {
    id: "li-yunshu-bond-3",
    name: "李云舒 — 第三章",
    prompt: `Intimate wuxia night scene on top of an ancient city wall. ${CHAR.liYunshu} sits sideways on the wide parapet stone, knees drawn up slightly, looking out at the scattered lantern lights of the city below — but her gaze is somewhere much further away. She holds both hands open in her lap, staring at them, the weight of a memory she has never told anyone pressing down on her expression. Moonlight falls across her face in profile. ${CHAR.player} sits close behind her on the same stone, present and still, not looking away. The city hum is distant; it is just the two of them and the moon and the unspoken. Wide cinematic composition, Chinese ink painting aesthetic, deep midnight blue and soft silver moonlight tones, quiet and emotionally weighted atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  // ── Bond ch.4 ──
  {
    id: "li-yunshu-bond-4",
    name: "李云舒 — 第四章",
    prompt: `Wuxia scene of an uncertain parting, indoors, warm afternoon light through a lattice window. ${CHAR.liYunshu} stands holding an unfolded letter — an invitation from 秋水剑宗 — her grip tighter than necessary, expression caught between wanting to leave and not wanting to. She has turned from the window to face ${CHAR.player}, her eyes asking something she cannot quite put into words. The room is quiet and still. Dust motes float in the slanted afternoon light. A sense of a decision that cannot be unmade hovering between them. Wide cinematic composition, Chinese ink painting aesthetic, warm amber afternoon and soft shadow tones, bittersweet and quietly charged atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  // ── Afterstory ──
  {
    id: "li-yunshu-afterstory",
    name: "李云舒 — 后日谈·旧案浮现",
    prompt: `Wuxia mystery discovery scene, late at night by candlelight. ${CHAR.player} sits alone at a low wooden desk, an old sword manual open before him, a single yellowed letter in his hand — found tucked inside the last page. The handwriting on the letter is delicate and faded, unmistakably a woman's brushwork (李若兰's last words to her daughter). The candle flame is the only light in the dark room, casting warm gold over the letter and deep shadow over everything else. His expression is still — the kind of stillness that comes when something dangerous and important falls into place. Wide cinematic composition, Chinese ink painting aesthetic, deep night shadow and single warm candlelight tones, quiet revelation and foreboding atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-afterstory-ending",
    name: "李云舒 — 后日谈·母亲的墓前",
    prompt: `Wuxia scene of quiet closure, outdoors at dawn. ${CHAR.liYunshu} and ${CHAR.player} stand side by side before a simple stone grave marker — 李若兰's grave — set on a gentle hillside with overgrown grass and a single plum tree in early bloom. ${CHAR.liYunshu} has placed fresh flowers at the base of the stone; her hands are folded now, head bowed slightly, expression carrying grief that has finally found its shape after years without answers. ${CHAR.player} stands a half-step behind her, close enough to be felt. Neither speaks. The sky is pale gold and grey at the horizon, the first light of morning just beginning. A sense of things finally laid to rest — not without sorrow, but without unfinished weight. Wide cinematic composition, Chinese ink painting aesthetic, pale dawn gold and cool grey tones, elegiac and quietly peaceful atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
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
        steps: 20,
        width: 1024,
        height: 704,
        karras: true,
        hires_fix: false,
        clip_skip: 1,
        n: 1,
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
