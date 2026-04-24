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
  mysteriousElder: "a very old Chinese sage (沈玄清) with pure white hair and an unnaturally straight spine — his posture holds the compact stillness of a sword at rest, no wasted curve despite extreme age. Plain unadorned grey-white robes. A small cracked jade piece fastened at his waist sash emits a faint cold luminescence with no natural light source. Deep blade-calluses on his right index and middle fingers betray a lifetime of sword work. His eyes carry the quality of a man watching events he has already seen conclude.",
};

const ILLUSTRATIONS = [
  // ── 江湖奇遇 / Environment ──
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
  },

  // ── 武道传承 / Martial Arts ──
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

  // ── BOSS ──
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

  // ── 王铁 / Wang Tie ──
  {
    id: "wang-tie-meet",
    name: "王铁 — 初遇",
    prompt: `Wuxia first-meeting scene inside a dimly lit town tavern at dusk. ${CHAR.wangTie} sits alone at a wooden table, drinking. ${CHAR.player} approaches and raises a cup in greeting. Wang Tie's weathered face shows measured appraisal — the cautious sizing-up of a veteran jianghu man meeting a stranger. Warm amber lantern light, other patrons visible but distant, the understated quiet of two strangers meeting for the first time. Wide cinematic composition, Chinese ink painting aesthetic, warm amber and deep shadow tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "wang-tie-bond-1",
    name: "王铁 — 第一章",
    prompt: `Wuxia bonding scene inside a roadside inn at night. ${CHAR.wangTie} leans forward across a low table, his face lit by candlelight, one hand extended across the table holding an old iron token engraved with the character 信义 — passing it to ${CHAR.player} sitting across from him, a moment of passing on a thirty-year legacy. Warm candlelight, empty cups on the table, the late-night quiet of a near-empty inn. Wide cinematic composition, Chinese ink painting aesthetic, deep shadow and warm amber candlelight tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "wang-tie-bond-2",
    name: "王铁 — 第二章",
    prompt: `Dynamic wuxia bonding scene on a mountain road at night. ${CHAR.wangTie} and ${CHAR.player} stand back-to-back against a ring of encircling bandits. Wang Tie's broad stance is that of thirty years on escort roads, an immovable wall. The two move in wordless coordination. Torchlight from the bandits, dark forest on both sides, a stolen cargo crate visible nearby. Wide cinematic composition, Chinese ink painting aesthetic, cold night blue and harsh torchlight tones, kinetic and visceral atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "wang-tie-bond-3",
    name: "王铁 — 第三章",
    prompt: `Wuxia bonding scene on an open dusty training ground outside a small town at late afternoon. ${CHAR.wangTie} stands in the long gold shadow of dusk, extending with both hands a worn yellowed handbook bearing his dead mentor's handwriting — thirty years of hard-won survival wisdom. His expression is solemn and weary, the weight of seven dead companions visible in his eyes. ${CHAR.player} stands before him, reaching to receive it. Sparse dried grass, a crumbling stone wall behind them, warm dying sunlight casting long shadows across the ground. Wide cinematic composition, Chinese ink painting aesthetic, warm dusty amber and deep late-shadow tones, solemn and bittersweet atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "wang-tie-bond-4",
    name: "王铁 — 第四章",
    prompt: `Tense wuxia scene on a desolate moonlit hillside outside the city, crude wooden grave markers planted in a row in the earth. ${CHAR.wangTie} kneels before the last marker, one weathered hand resting on the carved wood, head bowed in silent farewell to a dead captain. From the shadows at the edge of the frame, black-clad assassins begin to emerge — sent to desecrate this private grief. ${CHAR.player} stands at Wang Tie's shoulder, sword half-drawn, alert and protective. Cold moonlight on snow-dusted ground, bare winter trees, stark sense of a sacred moment about to be violated. Wide cinematic composition, Chinese ink painting aesthetic, cold silver moonlight and deep threatening shadow tones, tense sorrowful atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "wang-tie-ending",
    name: "王铁 — 最后的镖路",
    prompt: "Quiet sorrowful wuxia scene, a young Chinese male swordsman kneeling before a simple grave on a snowy hillside at dawn, eight grave markers lined in a row, he is placing a worn iron plaque (铁牌) at the last grave, one hand resting gently on the stone, head bowed in silent farewell, bare winter trees behind him, soft grey dawn light, snow on the ground, a sense of deep respect and grief and promise kept, wide cinematic composition, Chinese ink painting aesthetic with muted grey and white tones, quiet emotional atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "wang-tie-afterstory",
    name: "王铁 — 后日谈·追踪赵霸天",
    prompt: `Determined wuxia scene outside a fortified bandit stronghold (黑鹰寨) at dusk. ${CHAR.player} crouches in shadow on a ridge overlooking the lit torches of the fortress below, scouting the layout — alone, resolute, the kind of stillness of someone who has made up their mind. A worn iron escort badge rests against his chest beneath his robe. The stronghold sprawls on the hillside, guards visible at the gate, torches casting hard orange light on stone walls. Dark forest behind him, valley below. Wide cinematic composition, Chinese ink painting aesthetic, cold dusk blue and harsh torchlight tones, quietly resolved and dangerous atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "wang-tie-afterstory-ending",
    name: "王铁 — 后日谈·告慰英灵",
    prompt: `Quiet wuxia closure scene at a grave on a hillside under a full moon, late night. ${CHAR.player} kneels alone before Wang Tie's grave marker, slowly pouring a bottle of 烧刀子 (sorghum spirits) into the earth at the base of the stone — the old escort's favourite drink. His head is bowed, one hand resting lightly on the grave. The hill is quiet, wind moving through dry grass, moonlight on the stone. The promise has been kept. A sense of grief completed, the weight of an obligation finally released. Wide cinematic composition, Chinese ink painting aesthetic, cold silver moonlight and deep shadow tones, elegiac and quietly fulfilled atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },

  // ── 李云舒 / Li Yunshu ──
  {
    id: "li-yunshu-meet",
    name: "李云舒 — 初遇",
    prompt: `Wuxia first-encounter scene on a city outskirts road, daytime. ${CHAR.liYunshu} is surrounded by three sneering roguish men who are harassing her. She is completely calm — left hand resting on her sword hilt, chin slightly raised, eyes sharp and unafraid. In the background ${CHAR.player} is approaching, causing the rogues to hesitate and start backing away. She is not being rescued — she had it handled — but she glances at the approaching stranger with curiosity and a slight smile. Open road, spring afternoon light, scattered blossoms. Wide cinematic composition, Chinese ink painting aesthetic, warm peach and sunlit gold tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-bond-1",
    name: "李云舒 — 第一章",
    prompt: `Wuxia bonding scene in a plum garden at dusk, plum blossoms falling. ${CHAR.liYunshu} demonstrates a flowing sword technique with fierce grace — her late mother's style, 梅影剑. Her expression carries both pride and grief. ${CHAR.player} stands a few paces away, watching and beginning to mirror her stance with quiet focus. Falling petals drift between them. Warm amber evening light through the plum branches. Wide cinematic composition, Chinese ink painting aesthetic, warm peach-gold and deep shadow tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-bond-2",
    name: "李云舒 — 第二章",
    prompt: `Tense wuxia bonding scene at a market street confrontation, daytime. ${CHAR.liYunshu} stands protectively in front of her family's market stall, facing two thuggish men who are extorting her. Her hand is on her sword hilt, chin raised, posture immovable — she will not back down. ${CHAR.player} stands behind her, watching her back. The family stall is visible — fabric and goods. Other market-goers watching nervously from a distance. Wide cinematic composition, Chinese ink painting aesthetic, warm midday market tones, tense and determined atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-bond-3",
    name: "李云舒 — 第三章",
    prompt: `Intimate wuxia night scene on top of an ancient city wall. ${CHAR.liYunshu} sits sideways on the wide parapet stone, knees drawn up slightly, looking out at the scattered lantern lights of the city below — but her gaze is somewhere much further away. She holds both hands open in her lap, staring at them, the weight of a memory she has never told anyone pressing down on her expression. Moonlight falls across her face in profile. ${CHAR.player} sits close behind her on the same stone, present and still, not looking away. The city hum is distant; it is just the two of them and the moon and the unspoken. Wide cinematic composition, Chinese ink painting aesthetic, deep midnight blue and soft silver moonlight tones, quiet and emotionally weighted atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-bond-4",
    name: "李云舒 — 第四章",
    prompt: `Wuxia scene of an uncertain parting, indoors, warm afternoon light through a lattice window. ${CHAR.liYunshu} stands holding an unfolded letter — an invitation from 秋水剑宗 — her grip tighter than necessary, expression caught between wanting to leave and not wanting to. She has turned from the window to face ${CHAR.player}, her eyes asking something she cannot quite put into words. The room is quiet and still. Dust motes float in the slanted afternoon light. A sense of a decision that cannot be unmade hovering between them. Wide cinematic composition, Chinese ink painting aesthetic, warm amber afternoon and soft shadow tones, bittersweet and quietly charged atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-ending",
    name: "李云舒 — 一剑长歌",
    prompt: "Poetic wuxia scene, a young Chinese male swordsman practicing a graceful sword form alone in a plum blossom garden at dusk, pink petals drifting through the air, and behind him a faint translucent impression of a radiant young swordswoman (李云舒) in a bright goose-yellow and peach-toned hanfu watching with a beaming dazzling smile full of warmth and life, her high-looped hair with golden ribbons gently floating in the memory-breeze, she is almost ghostlike yet luminous and vivid as if the joy of her is woven into the sword movement itself, the two figures connected by golden threads of light and shared memory, warm amber evening light, wide cinematic composition, Chinese ink painting aesthetic with warm yellow and amber and pink tones, lyrical radiant dreamlike atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
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

  // ── 燕赤行 / Yan Chixing ──
  {
    id: "yan-chixing-meet",
    name: "燕赤行 — 初遇",
    prompt: `Wuxia first-encounter scene at a busy martial demonstration ground, midday. ${CHAR.yanChixing} stands apart from the crowd. He is turning to look directly at ${CHAR.player}, his sharp gaze locking on with quiet intensity — an unspoken challenge. The surrounding crowd maintains a visible distance from the scarred man. Harsh afternoon light, dust in the air, the sounds of sparring in the background. Wide cinematic composition, Chinese ink painting aesthetic, harsh sunlit ochre and deep shadow tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-bond-1",
    name: "燕赤行 — 第一章",
    prompt: `Wuxia bonding scene at a martial training ground, overcast afternoon. ${CHAR.yanChixing} and ${CHAR.player} face each other in an intense one-on-one sword duel — not a fight, a test. Yan Chixing's expression is sharp and focused, measuring every movement, the scar on his jaw prominent. Both blades are drawn and mid-motion in a close serious match. No crowd — just two blades and the weight of being judged. Wide cinematic composition, Chinese ink painting aesthetic, grey overcast light and deep shadow tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-bond-2",
    name: "燕赤行 — 第二章",
    prompt: `Wuxia bonding scene in a narrow night alley after a fight. Three black-clad assassins with Hanlight Sect marks on their sleeves lie defeated on the ground. ${CHAR.yanChixing} stands breathing hard, his left arm bleeding, a cloth pressed to the wound. ${CHAR.player} stands beside him, both facing the same direction as the aftermath settles. Yan Chixing's expression has cracked — not warmth yet, but unmistakable acknowledgment. Cold moonlight in the alley, puddles on the stone. Wide cinematic composition, Chinese ink painting aesthetic, cold night blue and deep shadow tones with a single point of warmth, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-bond-3",
    name: "燕赤行 — 第三章",
    prompt: `Wuxia confession scene on a riverbank at deep night. ${CHAR.yanChixing} stands at the water's edge, one hand tight around an old iron token, moonlight cutting across the scar on his face. His cold composure has fractured — a rare and raw expression of something long buried: the moment twenty years ago when he found the man he had trained to kill, weeping, and could not strike. ${CHAR.player} stands a respectful distance back, listening. The river reflects moonlight in long silver streaks, tall reeds along the bank, the night holding the weight of everything unsaid. Wide cinematic composition, Chinese ink painting aesthetic, deep silver moonlight and cold water-blue tones, emotionally raw and quietly devastating atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-bond-4",
    name: "燕赤行 — 第四章",
    prompt: `Climactic wuxia confrontation in the crumbling ruins of an abandoned mountain temple. ${CHAR.yanChixing} stands face to face with his senior brother Ji Canghai (季沧海) — a gaunt older man with haunted eyes who does not draw his sword. The decisive moment: Yan Chixing's sword arm drops, and instead he opens his scarred hand to reveal the sect founder's token in his palm, extending it toward the man who wronged him — surrendering the burden of remembrance rather than taking revenge. ${CHAR.player} stands to the side, witnessing. Broken stone pillars, overgrown vines, cold grey afternoon light filtering through a collapsed roof. Wide cinematic composition, Chinese ink painting aesthetic, cold grey ruin and pale dusty light tones, cathartic and quietly devastating atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-ending",
    name: "燕赤行 — 无名同行",
    prompt: "Atmospheric wuxia night scene, two lone Chinese swordsmen walking a dark mountain road together at night, the brooding scarred swordsman (燕赤行) in dark red stepping slightly ahead and to the side as if shielding his companion, one of them holding a dim lantern that casts a warm circle of light on the rocky path, the surrounding forest dark and vast, a sense of unspoken loyalty and quiet solidarity between two people who have chosen the same direction, wide cinematic composition, Chinese ink painting aesthetic with deep shadow and warm amber lantern light, quiet companionable atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "yan-chixing-afterstory",
    name: "燕赤行 — 后日谈·归山",
    prompt: `Wuxia pilgrimage scene in the overgrown ruins of the Hanlight Sect's mountain stronghold. ${CHAR.yanChixing} and ${CHAR.player} stand before a crumbling stone wall half-covered in vines and moss, where thirty-two names have been carved into the rock — each one a dead disciple. Yan Chixing's expression is still and grave, one hand raised to trace a name carved in the stone. The ruins stretch behind them into dark forest, the mountain reclaiming everything. Grey overcast sky, wind through broken stone. Wide cinematic composition, Chinese ink painting aesthetic, cold grey ruin and deep shadow tones, solemn memorial atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-afterstory-ending",
    name: "燕赤行 — 后日谈·立碑",
    prompt: `Wuxia scene of final release at a mountain gate at dusk. ${CHAR.yanChixing} kneels alone before a newly carved stone monument at the Hanlight Sect's mountain entrance — all thirty-two names inscribed in clean strokes, the sect token buried at its base. For the first time, tears run silently down his scarred face. His hands rest flat on the stone, grounding himself in this moment. The sky behind the gate fades gold and deep violet, the mountain in long shadow. ${CHAR.player} stands a few paces back, leaving him this private grief. Wide cinematic composition, Chinese ink painting aesthetic, fading gold dusk and deep shadow tones, cathartic and quietly triumphant atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },

  // ── 苏青 / Su Qing ──
  {
    id: "su-qing-meet",
    name: "苏青 — 初遇",
    prompt: `Wuxia first-encounter scene at a town entrance gate, warm afternoon. ${CHAR.suQing} crouches on the roadside carefully bandaging a small child's scraped knee, her hands skilled and unhurried. A small crowd watches. The child's mother holds out coins — Su Qing gently waves them away. At that moment she looks up and meets the eyes of ${CHAR.player} who has stopped nearby. Her expression is measured and tranquil — not shy, just unhurried. Soft dappled light, town gate arch behind them. Wide cinematic composition, Chinese ink painting aesthetic, warm earth and soft green tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-bond-1",
    name: "苏青 — 第一章",
    prompt: `Wuxia bonding scene at a simple mountain-side shelter, late afternoon. ${CHAR.suQing} kneels beside ${CHAR.player} who sits against a rock, wounded from an ambush on the trail. Her hands are steady and precise as she applies herbal poultice to his wound. Her face holds a faraway look as she speaks — recounting her missing shifu, a healer who once poisoned himself gathering antidote herbs for a stranger. Medicinal herbs scattered nearby. Soft filtered light through bamboo. Wide cinematic composition, Chinese ink painting aesthetic, soft green and warm earth tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-bond-2",
    name: "苏青 — 第二章",
    prompt: `Wuxia bonding scene on a dangerous mountain cliff face, overcast midday. ${CHAR.suQing} carefully climbs a rocky ledge to reach a cluster of rare blue-green herbs (青心草) growing from a crevice, her movements calm and methodical despite the danger. ${CHAR.player} stands on the path below, ready to act as her anchor. The reason: a poisoned child waiting below. Dramatic precipitous landscape, grey sky, wind pulling at her robes. Wide cinematic composition, Chinese ink painting aesthetic, grey-green and cool mountain tones, tense and determined atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-bond-3",
    name: "苏青 — 第三章",
    prompt: `Wuxia parting scene in a simple medicine room at dusk. ${CHAR.suQing} stands at a low wooden table carefully packing dried herbs and small vials into her large wooden medicine chest — each item placed with the reverence of a person preparing for a long journey. Her expression is calm and decided, though a heaviness sits in her posture. ${CHAR.player} stands in the doorway, watching her pack. Warm amber light from a low lamp, medicinal herb bundles hanging from the rafters, the quiet of a moment between speaking and leaving. Wide cinematic composition, Chinese ink painting aesthetic, warm amber and deep green shadow tones, bittersweet and quietly determined atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-bond-4",
    name: "苏青 — 第四章",
    prompt: `Wuxia reunion scene inside a dim wooden hut in the wilderness, just cleared of its bandit captors. ${CHAR.suQing} has rushed forward to embrace her elderly white-haired master — emaciated, his robes worn thin, but alive — her shoulders shaking with tears for the first time. Her steady composure has broken entirely, face buried against his shoulder. The master's eyes are closed, his hands coming up slowly to hold her. ${CHAR.player} stands in the hut doorway, sword lowered, watching in silence. Dim filtered light, hay on the floor, the quiet aftermath of rescue. Wide cinematic composition, Chinese ink painting aesthetic, warm dim earth and pale daylight tones, deeply emotional and gentle atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-ending",
    name: "苏青 — 针灸传心",
    prompt: "Tender wuxia scene, in a simple countryside medicine hall, a gentle young woman healer (苏青) in muted green is standing with her back turned and shoulders slightly trembling in suppressed emotion, her father an elderly doctor bowing in gratitude to a young swordsman in the doorway, the swordsman witnessing this quiet family reunion, dried herbs hanging from the rafters, warm candlelight inside, late afternoon sun coming through the window, a sense of things finally found after long searching, wide cinematic composition, Chinese ink painting aesthetic with warm green and amber earth tones, gentle emotional atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "su-qing-afterstory",
    name: "苏青 — 后日谈·秘方",
    prompt: `Wuxia scene of moral weight in a candlelit medicine room at night. ${CHAR.suQing} stands at a table with her elderly white-haired master, an ancient handwritten formula scroll unrolled between them — the cure for Heaven Demon's internal poison, in hands that could save or destroy. Her face holds the gravity of a decision too large for one person. ${CHAR.player} stands across the table, witnessing. The single candle illuminates their faces and the scroll; everything else is shadow. Dried herbs hanging above, the quiet of late night, an impossible weight hovering in the still air. Wide cinematic composition, Chinese ink painting aesthetic, single candlelight gold against deep shadow tones, morally charged and quietly tense atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-afterstory-ending",
    name: "苏青 — 后日谈·重开",
    prompt: `Warm wuxia scene at the threshold of a newly reopened medicine hall at sunset. ${CHAR.suQing} stands in the doorway under her master's old wooden sign — freshly rehung, the characters for 济世堂 legible above her — with a small quiet smile at the last of the day's light. Inside, ${CHAR.player} sits at a low table with a bowl of steaming congee, the warmth of the room visible behind her. The medicine hall is simple but whole: dried herbs in order, lamplight just starting to glow in the window, the first day's patients seen. Wide cinematic composition, Chinese ink painting aesthetic, warm amber sunset and soft green interior tones, gentle fulfilled atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },

  // ── 凌雪 / Ling Xue ──
  {
    id: "ling-xue-meet",
    name: "凌雪 — 初遇",
    prompt: `Dramatic wuxia action scene on a remote mountain road at dusk. Three black-clad assassins are on the ground — fallen, defeated in an instant. ${CHAR.lingXue} stands with her back three-quarters turned, sword already lowering after three lightning-fast strikes, not even looking at the scene she just ended. Her posture is utterly composed. In the mid-ground ${CHAR.player} is catching his breath, clearly having just been saved. The last light cuts long shadows across the mountain path. Wide cinematic composition, Chinese ink painting aesthetic, stark white and cold dusk blue tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "ling-xue-bond-1",
    name: "凌雪 — 第一章",
    prompt: `Wuxia bonding scene inside a teahouse under night attack. ${CHAR.lingXue} moves with lethal precision at the center of combat, sword cutting through black-clad assassins bearing sect marks on their sleeves. ${CHAR.player} stands at her flank, sword drawn, guarding her side — fighting together for the first time. Broken furniture, overturned lanterns, close-quarters combat. Wide cinematic composition, Chinese ink painting aesthetic, warm lantern-gold and deep chaotic shadow tones, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "ling-xue-bond-2",
    name: "凌雪 — 第二章",
    prompt: `Wuxia bonding scene under a covered veranda at night, heavy rain falling outside. ${CHAR.lingXue} stands at the edge of the space looking out at the rain, her sword leaning against the wall nearby. For the first time her cold composure is absent — something distant and uncertain in her expression, the first crack in the belief that only strength matters. ${CHAR.player} sits nearby, present but not crowding, the rain filling the silence between them. Soft interior lamplight against the dark wet world outside. Wide cinematic composition, Chinese ink painting aesthetic, cold rain-blue and dim warm lamplight tones, still and quietly charged atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "ling-xue-bond-3",
    name: "凌雪 — 第三章",
    prompt: `Intimate wuxia winter scene in a snow-covered courtyard at night. ${CHAR.lingXue} stands in the open, snowflakes falling around her, looking down at her own hands. For the first time her composed coldness has cracked — something vulnerable surfacing: the admission that she has broken her sect's most inviolable rule, that she has come to depend on someone without intending to. ${CHAR.player} stands nearby under the eave, watching. No wind — just the soft hush of snow, the pale glow of the courtyard in winter quiet, and the strange fragility of a person who has never allowed herself to feel fragile. Wide cinematic composition, Chinese ink painting aesthetic, cold white snow and pale silver moonlight tones, vulnerable and quietly charged atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "ling-xue-bond-4",
    name: "凌雪 — 第四章",
    prompt: `Pivotal wuxia scene in a doorway at dawn, pale light coming from outside. ${CHAR.lingXue} stands in the threshold, one hand resting on her sword hilt — not as a threat, but as the last anchor to the identity she is about to abandon. Her expression is torn: the cold training of twenty years against the pull of a choice already made in her heart. ${CHAR.player} faces her from inside the room, still. She has just confessed she was sent to kill him three times and could not — and now she speaks the words that seal her as a defector. The doorway is both an exit and an entrance. Cool dawn light, the world behind her pale and open. Wide cinematic composition, Chinese ink painting aesthetic, cool pale dawn and deep interior shadow tones, pivotal and quietly devastating atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "ling-xue-ending",
    name: "凌雪 — 凌霜剑域",
    prompt: "Stark beautiful wuxia scene, a young swordswoman in white (凌雪) and a young swordsman in midnight blue standing side by side on a frozen battlefield, facing the same direction into an approaching storm of ice and snow, both with swords drawn, the icy wind sweeping long flowing hair and robes behind them, neither looking at each other but standing as equals facing the same horizon, a sense of choice made and past shed, frost crystals in the air catching the pale light, wide cinematic composition, Chinese ink painting aesthetic with white silver and deep blue-black tones, resolute melancholic atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "ling-xue-afterstory",
    name: "凌雪 — 后日谈·追杀令",
    prompt: `Dynamic wuxia action scene on a rocky mountain road in harsh afternoon light. ${CHAR.lingXue} and ${CHAR.player} move in coordinated retreat — one black-clad guild assassin lies defeated on the road behind them, two more descending through forest paths in pursuit. Ling Xue's sword is drawn, her white robes catching the light as she turns to assess the pursuit, her expression calm and calculating despite the danger — she has been trained to do exactly this, just not from this side. Deep forest shadows on both sides, the road steep and narrow. Wide cinematic composition, Chinese ink painting aesthetic, stark mountain light and deep forest shadow tones, urgent kinetic atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "ling-xue-afterstory-ending",
    name: "凌雪 — 后日谈·自由",
    prompt: `Wuxia scene of final liberation on an open plain under a wide sky. ${CHAR.lingXue} stands with her hands extended, the torn pieces of a sect assassination order scattering from her fingers in the wind — white paper catching the light as they drift and tumble like real snow across the grey plain. She watches them go, her expression carrying something she has never worn before: relief, lightness, the first breath of a person who has finally stopped being what she was made to be. ${CHAR.player} stands beside her, sword sheathed. No enemies behind them. The plain is wide and the sky is pale and the future is open. Wide cinematic composition, Chinese ink painting aesthetic, pale grey open sky and cold white paper-snow tones, liberated and quietly radiant atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },

  // ── 神秘老者 / Mysterious Elder ──
  {
    id: "mysterious-elder-meet",
    name: "神秘老者 — 初遇",
    prompt: `Wuxia night scene on a bare open practice ground. ${CHAR.player} stands mid-stance, training alone. ${CHAR.mysteriousElder} is simply there — he did not arrive, he is just present, no disturbed air, no sound, as if the darkness folded around him naturally. He watches the player with the quality of a man confirming something already known, not discovering it. The jade piece at his waist emits its faint cold gleam in the moonless dark. His posture is the stillness of a sword that has never needed to be drawn. Wide cinematic composition, Chinese ink painting aesthetic, deep midnight black and cold pale jade-light tones, atmosphere of inexplicable recognition and vast concealed weight, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "mysterious-elder-bond-1",
    name: "神秘老者 — 第一章",
    prompt: `Wuxia teahouse scene. ${CHAR.mysteriousElder} sits at a corner table, his presence making a precise radius of stillness in the surrounding noise — not commanding it, simply occupying it, the way a blade occupies space differently from other objects. He extends his right hand palm-upward across the table toward ${CHAR.player}: a star-shaped burn scar, deep and ancient, distinctly not the scar of combat or cultivation gone wrong — the mark of contact with something that should not be touched. His expression gives nothing away. The faint cold glow of the jade piece at his waist is visible. Wide cinematic composition, Chinese ink painting aesthetic, warm amber lantern light thrown against the cold pale gleam from the jade piece at his waist, atmosphere of quiet precision and concealed depth, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "mysterious-elder-bond-2",
    name: "神秘老者 — 第二章",
    prompt: `Wuxia scene in a sparse mountain clearing at dusk. ${CHAR.mysteriousElder} crouches beside ${CHAR.player} — one blade-calloused hand resting precisely at a single point on the player's back, not guiding but locating, with the exactitude of a swordsman finding the joint between armour plates. His guidance comes not from cultivation experience but from a sword master's structural knowledge applied to the body: he knows exactly where force flows and where it bends wrong. The jade piece at his waist catches the light, its cold faint gleam visible between them. His expression is concentrated and entirely without warmth — this is not mentorship, it is precision. Sparse pines, last amber light. Wide cinematic composition, Chinese ink painting aesthetic, cool dusk grey and cold jade-pale tones, atmosphere of uncanny exactitude, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "mysterious-elder-ending",
    name: "神秘老者 — 一线天命",
    prompt: `Serene wuxia dawn scene on a cliff edge. ${CHAR.mysteriousElder} and ${CHAR.player} sit side by side facing the rising sun, the vast misty mountains below. Between them, suspended in still air, floats the cracked jade piece — removed from his waist, freed at last, radiating pale cold light that does not belong to the warm gold of dawn around it. His spine is still straight, his eyes are at rest. Something vast that he has been holding in place for a very long time has finally been allowed to end. First light turns the clouds gold; the jade piece glows cold against it. Wide cinematic composition, Chinese ink painting aesthetic, warm dawn gold and cold jade-pale light in precise contrast, transcendent and quietly final atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "mysterious-elder-bond-3",
    name: "神秘老者 — 第三章",
    prompt: `Wuxia revelation scene in an isolated stone pavilion above misty mountain valleys. ${CHAR.mysteriousElder} sits across from ${CHAR.player}, his posture unchanged — still that sword-at-rest stillness — but the mask of vagueness has dropped. He extends his right hand palm-upward, showing the star-shaped burn scar. As he speaks, the jade piece at his waist pulses with a brief cold light, the only uncontrolled moment in an otherwise perfectly controlled man. His face carries the gravity of someone who has decided to let another person see what he is. Pale mist below, above the clouds, a vast and silent world that seems to belong to him somehow. Wide cinematic composition, Chinese ink painting aesthetic, pale grey mist and cold mountain light with a single pulse of jade-cold illumination, solemn revelation atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "mysterious-elder-bond-4",
    name: "神秘老者 — 第四章",
    prompt: `Tense and sorrowful wuxia scene in a walled garden courtyard. ${CHAR.mysteriousElder} sits at a stone table, teacup in hand, as black-robed Heaven Demon assassins close in from three sides. He does not move — and the assassins' advance is visibly slower than it should be, as if something in the air near him makes certainty difficult. The jade piece at his waist is still, deliberately dark. ${CHAR.player} stands sword-drawn between him and the attackers. The elder speaks throughout, his voice low and grief-laden, recounting a student who was broken. The assassins know they are approaching something they cannot calculate. Wide cinematic composition, Chinese ink painting aesthetic, cold grey stone and harsh amber shadow tones, tense and sorrowful atmosphere with an undertone of suppressed enormity, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "mysterious-elder-afterstory",
    name: "神秘老者 — 后日谈·铜簪",
    prompt: `Intimate wuxia scene by evening candlelight. ${CHAR.mysteriousElder} holds a small copper hairpin in his aged hands — his disappeared daughter's keepsake, carried for twenty years. The hands that hold it are blade-calloused and unnaturally steady for a man his age; only now, holding this small object, do they tremble. He lowers it into ${CHAR.player}'s cupped hands, his fingers barely releasing it. The jade piece rests still at his waist, its faint cold gleam dimmed — this moment belongs entirely to the human part of him. A single candle, deep shadow, the hairpin at the center of the frame. Wide cinematic composition, Chinese ink painting aesthetic, single candlelight gold and deep shadow with the jade piece's cold gleam barely visible, quietly heartbreaking atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "elder-true-form",
    name: "设计者显形",
    prompt: `Wuxia confrontation scene of revelation and betrayal. ${CHAR.mysteriousElder} stands before ${CHAR.player} in an open space, his posture unchanged — that same sword-at-rest stillness — but the jade piece has been removed from his waist and held in his extended hand, now fully unsheathed of its restraint, pouring cold pale light in every direction. His aged hands generate an energy entirely unlike anything before: not cultivation, not inner force — something vast and structural, the accumulated pressure of nine hundred years of deliberate design finally released. His expression is sorrowful and resolute at once, a man who knows exactly what he is doing and finds no comfort in it. The player faces him in the mid-ground, sword drawn, understanding arriving too late. Behind the elder, the world is slightly wrong — light falling in directions it shouldn't, space bending very subtly around the point of his power. Wide cinematic composition, Chinese ink painting aesthetic, cold jade-white light overwhelming warm surroundings, atmosphere of terrible revelation and inevitable reckoning, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "mysterious-elder-afterstory-ending",
    name: "神秘老者 — 后日谈·重逢",
    prompt: `Deeply moving wuxia reunion scene in a moonlit garden pavilion. ${CHAR.mysteriousElder} kneels before his daughter (沈微尘) — a quiet woman in plain robes who has inherited his stillness. With trembling hands he carefully pins a small copper hairpin back into her hair. Neither speaks. His head is bowed; for the first time his spine is not perfectly straight — the weight of twenty years briefly visible. The jade piece at his waist glows faintly in the silver moonlight, the only light that is not from the moon. ${CHAR.player} stands in the shadows as a silent witness. A single plum tree in early bloom nearby. Wide cinematic composition, Chinese ink painting aesthetic, cold silver moonlight and deep garden shadow with the faint jade piece glow, profoundly moving and quietly final atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
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
