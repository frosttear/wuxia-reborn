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
// IMPORTANT: All CHAR descriptions below define fixed visual identities.
// Every prompt that references a CHAR must reproduce that appearance exactly — do not substitute generic faces or alter key features.
const CHAR = {
  player:    "a young Chinese male swordsman (主角), early 20s, refined and composed features, clean angular jaw, calm steady dark eyes, long black hair tied half-up with a dark cord, wearing a deep midnight-blue robe with subtle dark embroidery, a plain sword at his waist — his bearing is quiet restraint rather than aggression",
  wangTie:   "an elderly Chinese escort warrior (王铁), late 60s, white hair and a full white beard, deep sun-weathered lines on his face, broad weathered build, wearing roughspun brown escort clothes with a circular iron badge plaque hanging at his belt — his presence is unhurried and immovable",
  liYunshu:  "a radiant young Chinese swordswoman (李云舒), early 20s, bright peach-and-gold hanfu, hair styled in a high-looped bun secured with golden ribbons, large bright expressive eyes, a slender sword at her side — her energy is direct and unguarded",
  yanChixing:"a tall lean Chinese swordsman (燕赤行), early 40s, a deep scar running from his left eyebrow down across his jaw, sharp angular features, stubble, intense guarded eyes, long black hair loosely worn, wearing worn dark crimson traveling clothes — his posture carries the habitual tension of a man who has been alone a long time",
  suQing:    "a calm composed young Chinese woman (苏青), mid 20s, muted sage-green medicinal robes, dark hair in a simple practical bun, a large wooden medicine chest nearby, serene steady eyes — her manner is quiet and deliberate",
  lingXue:   "a cold beautiful young Chinese swordswoman (凌雪), early 20s, pristine white robes with silver trim, hair half-pinned with a silver ice-flower ornament, pale complexion, a sword with an ice-flower carved on the sheath — her stillness reads as restraint, not absence",
  mysteriousElder: "a very old Chinese sage (沈玄清) with pure white hair and an unnaturally straight spine — his posture holds the compact stillness of a sword at rest, no wasted curve despite extreme age. Plain unadorned grey-white robes. A small cracked jade piece fastened at his waist sash emits a faint cold luminescence with no natural light source. Deep blade-calluses on his right index and middle fingers betray a lifetime of sword work. His eyes carry the quality of a man watching events he has already seen conclude.",
  tianmo:    "a tall imposing Chinese demonic martial arts grandmaster (天魔), 50-55 years old, long black hair streaked dark purple worn loose, sharp angular face with high cheekbones, narrow cold ink-dark eyes carrying the weight of having lived through countless world-lines, faint dark veins at his temples from decades of forbidden inner arts, wearing layered dark grey-black robes with subtle serpent patterns and deep crimson collar trim, wisps of black inner energy coiling at his feet",
  swordSpirit: "a spectral ancient sword spirit (剑魂), a translucent humanoid silhouette with no face or features, the entire form composed of overlapping luminous silver-white sword-intent lines forming a vaguely human shape, intersecting ghostly blade trajectories visible inside the form, hair-like tendrils of silver sword-light flowing upward weightlessly, cold glinting points of light where eyes would be, fragments of a shattered jade pendant (玉牌) floating around it",
};

const ILLUSTRATIONS = [
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
    prompt: `Epic wuxia battle aftermath scene. ${CHAR.player} stands victorious, sword tip lowered, dramatic clouds parting above as golden dawn light breaks through. ${CHAR.tianmo} collapses to the ground in the background, black demonic energy dispersing into wisps around the fallen figure. The sky shifts from ominous purple-black to radiant gold, shattered mountain terrain, a profound sense of triumph and release. Wide cinematic landscape composition, Chinese ink painting aesthetic with deep gold and indigo tones, epic atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "tianmo-lose",
    name: "天魔 — 失败",
    prompt: `Tragic wuxia scene. ${CHAR.player} collapsed on the ground, one hand pressed to the earth, wounded and exhausted. ${CHAR.tianmo} stands over him against a blood-red stormy sky, black demonic energy swirling outward like dark chains, the absolute stillness of a man who has seen this moment before. Overwhelming despair yet unbroken will in the fallen warrior's eyes, broken sword on the ground nearby. Wide cinematic landscape composition, Chinese ink painting aesthetic with deep crimson and charcoal tones, melancholic dramatic atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "sword-soul-win",
    name: "剑魂 — 胜利",
    prompt: `Ethereal wuxia scene, the moment a thousand-year-old sword spirit finally finds peace. ${CHAR.swordSpirit} is dissolving — the luminous sword-intent lines unraveling into thousands of drifting motes of light like falling stars, the jade fragments slowly dimming. ${CHAR.player} stands solemnly with lowered sword, surrounded by the dispersing luminous fragments that drift toward his forehead, an expression of deep reverence and release. Night sky filled with drifting lights. Wide cinematic scene, Chinese ink painting aesthetic with silver and pale gold tones, transcendent spiritual atmosphere, anime-inspired semi-realistic art, high quality.`,
  },
  {
    id: "sword-soul-lose",
    name: "剑魂 — 失败",
    prompt: `Intense wuxia scene. ${CHAR.player} on his knees overwhelmed, countless translucent sword slashes filling the air like a lattice of silver light. ${CHAR.swordSpirit} towers above — neither human nor monster but pure will given form, cold otherworldly light from the spirit illuminating the kneeling warrior below, the atmosphere of facing something beyond mortal limits. Wide cinematic composition, Chinese ink painting aesthetic with icy silver and deep shadow tones, dramatic and overwhelming atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "truth-shards",
    name: "碎片真相 — 五物对证",
    prompt: `Tense wuxia revelation scene in a quiet stone courtyard at twilight. ${CHAR.player} stands before ${CHAR.mysteriousElder} who sits on a stone bench, a cold cup of tea beside him. On the low stone table between them, the protagonist has just laid out five items: a small folded paper with a description written in brush strokes, a page torn from a yellowed ledger, a folded stack of medicinal examination notes, charred remnants of an ancient scroll wrapped in cloth, and a yellowed mission order document. The elder looks down at the five items with both hands resting on his knees — his expression holds no panic, no guilt, only a profound and bone-deep weariness, the look of a man who has waited centuries for this exact moment. An old scholar tree (老槐树) stands in the background, its leaves catching the last of the evening light. The protagonist does not draw a sword — this is a confrontation of knowledge, not blades, and both parties know it. Wide cinematic composition, Chinese ink painting aesthetic with twilight amber and deep shadow tones, atmosphere of quiet reckoning, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "zhushi-zhi-wo",
    name: "诸世之我 — 共鸣",
    prompt: `Transcendent wuxia inner-awakening scene. ${CHAR.player} sits cross-legged in meditation at the center, eyes closed, deep night around him with a faint window in the background. Five translucent ghost-silhouettes of himself from past lives surround him in a loose circle — each subtly different in posture and aura: one radiating raw martial intensity, one standing in quiet solitude, one carrying the crystalline clarity of sword-intent, one bent slightly under accumulated weight, one surrounded by faint warm traces of bonds with others. All five silhouettes look inward at the protagonist with silent recognition — not judgment, not pressure — a convergence. Their ghostly forms are beginning to dissolve at the edges, turning to soft warm light that flows inward into his chest. The protagonist's hands emit a growing golden warmth from within, the light pooling and settling as something that was always his returns home. No enemy, no combat — purely internal. The atmosphere is still, vast, and quietly triumphant. Wide cinematic composition, Chinese ink painting aesthetic with midnight blue and soft gold tones, introspective and transcendent atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "jianhun-origin-win",
    name: "九百年前·终结",
    prompt: `Transcendent wuxia climax set nine hundred years in the past, ancient open wilderness before dawn. ${CHAR.player} stands at the center, sword lowered, facing the primordial sword-intent (剑魂·本源) in its original unsealed form: a towering formless column of cold silver-white light filling the upper frame, ageless and inhuman, its edges sharp enough to warp the air — something that has never been touched by another person in nine centuries. From the protagonist's chest five threads of warm human light reach outward toward it: amber (an old escort's courage), gold (a young swordswoman's clarity), deep crimson (a scarred wanderer's letting-go), soft blue-green (a healer's steady hands), clear silver (a white-clad blade finally free). The threads of light make contact. The vast silver column trembles — not from injury, but from encountering something entirely outside its experience: the weight of people genuinely known. On the ancient mountain horizon behind them, the very first thread of dawn gold appears — thin, real, not yet bright. Wide cinematic landscape composition, Chinese ink painting aesthetic, five warm threads of human light against cold ancient silver-white, the first real sunrise in nine hundred years just beginning, atmosphere of something inhuman finally being reached by something human, anime-inspired semi-realistic art, high quality detailed scene.`,
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
    prompt: `Intimate wuxia scene inside a simple workshop courtyard at dusk. ${CHAR.wangTie} sits on a low wooden stool, methodically grinding a broad blade against a sharpening stone — the unhurried rhythm of a man who has done this a thousand times. ${CHAR.player} sits across from him on a step, listening with quiet attention as the old escort slowly recounts memories of thirty years on the escort roads. Wang Tie's eyes are distant, remembering rather than performing. The atmosphere is that of two people at the very beginning of a friendship — quiet, unhurried, the first thread of trust just forming between them. Warm amber lantern light, the night sky just visible above the courtyard walls, simple wooden surroundings. Wide cinematic composition, Chinese ink painting aesthetic, warm amber and deep shadow tones, quietly intimate and understated atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
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
    prompt: `Quiet pre-dawn wuxia scene on a desolate hillside, crude wooden grave markers planted in a row in the earth. The sky is turning from dark blue to pale grey at the horizon. ${CHAR.wangTie} sits exhausted before a grave marked 赵四海, head bowed, a just-poured bottle of spirits soaking into the earth at the marker's base. He has drawn the iron escort badge from his belt — the characters 信义 barely legible from thirty years of wear — and extends it with both weathered hands toward ${CHAR.player} kneeling beside him. The player receives it with both hands, in silence. Both figures carry the quiet exhaustion of a night's fight — torn sleeve, weary posture, hard-won stillness. The first pale light of dawn touches the row of grave markers and their faces. Wide cinematic composition, Chinese ink painting aesthetic, cold pre-dawn blue and soft pale first-light tones, deeply solemn and quietly resolved atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
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
  {
    id: "wang-tie-true-ending",
    name: "王铁 — 刀路犹存",
    prompt: `Quiet nostalgic wuxia scene at an old escort company courtyard. ${CHAR.player} stands motionless at a weathered wooden gate, one hand resting on the door frame, watching through the half-open entrance without stepping in. Inside the sunlit courtyard, a young Chinese man in roughspun escort clothes (early twenties, focused expression) practices knife techniques — wide grounded stance, practical unhurried footwork, the blade settling exactly at his side at the end of each sequence: the same heavy-footed straightforward style of a veteran escort, passed on without ceremony. A gnarled old tree casts long afternoon shadows across the dust-covered ground. A worn wooden name board still hangs above the gate, characters faded. The protagonist does not enter — he watches from the threshold, still. Warm golden late-afternoon light, long shadows, dust motes in the air. Wide cinematic composition, Chinese ink painting aesthetic, warm amber and deep shadow tones, quiet bittersweet atmosphere of a legacy continuing unseen, anime-inspired semi-realistic art, high quality detailed scene.`,
  },

  // ── 李云舒 / Li Yunshu ──
  {
    id: "li-yunshu-meet",
    name: "李云舒 — 初遇",
    prompt: `Wuxia first-encounter scene on a city outskirts road, bright spring afternoon. ${CHAR.liYunshu} is surrounded by three sneering roguish men who are harassing her. She is completely calm — left hand resting on her sword hilt, chin slightly raised, eyes sharp and unafraid. In the background ${CHAR.player} is approaching, causing the rogues to hesitate and start backing away. She is not being rescued — she had it handled — but she glances at the approaching stranger with curiosity and a slight smile. Open road flooded with clear spring sunlight, scattered blossoms in the bright air. Wide cinematic composition, Chinese ink painting aesthetic, vivid warm peach and bright gold tones, luminous and open scene with no heavy shadows, anime-inspired semi-realistic art, high quality detailed scene.`,
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
    name: "李云舒 — 后日谈·她想见那个人",
    prompt: `Quietly charged wuxia scene inside a sparse traveler's inn room in midday light. Across a low wooden table, an elderly weathered Chinese man — gaunt, eyes that have watched too many years go past, the kind of stillness that comes from having been hunted for decades — sits slightly leaned forward, speaking. He is not performing. He is finally saying words he has carried alone since the day a woman he could not protect chose to protect him instead. ${CHAR.liYunshu} sits opposite him, completely still, hands resting open in her lap, her untouched tea cup between them. Her eyes are the only moving thing on her face: she is hearing for the first time what her mother's last words actually were. The low tea table between them — two cups, neither touched — holds the weight of everything those words mean: that it was enough, that her mother saw something real, that someone finally witnessed it. Soft daylight through a paper lattice window, the room otherwise empty and quiet. Wide cinematic composition, Chinese ink painting aesthetic, pale grey-white daylight and warm worn-wood tones, atmosphere of something long carried alone finally being passed to the person who needed it, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-afterstory-ending",
    name: "李云舒 — 后日谈·梅园祭扫",
    prompt: `Quietly moving wuxia scene in a plum garden at dusk. ${CHAR.liYunshu} kneels at the root of an old gnarled plum tree, both hands carefully lowering a folded letter into a hollow at the root — placing something that has been carried a long time into the earth where it belongs. Her expression is whole and still: the grief has not gone, but she is no longer searching — she has the answer now, and she is giving it to the person who needed to hear it. A fresh plum branch, its blossoms just opening, rests across her knee — just broken. ${CHAR.player} stands a half-step behind her in the warm fading light. Plum petals drift in the still air around them. Amber and violet dusk light filters down through the branches above. Wide cinematic composition, Chinese ink painting aesthetic, warm amber and soft violet-shadow tones, atmosphere of quiet affirmation and something finally finding its resting place, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-special-bond-4",
    name: "李云舒 — 梅影旧事",
    prompt: `Intimate wuxia discovery scene inside a small quiet room by candlelight. ${CHAR.liYunshu} sits alone at a low table, an old wooden box open before her. In her hands she holds a letter — paper yellowed with age, brush strokes elegant and unhurried, unmistakably a mother's handwriting. Her expression carries the particular weight of someone who has just read something they needed to read for a long time: not broken, not relieved, but arrived — the expression of a question that has finally been answered. The candle flame is the room's only light, casting warm gold over the letter and soft shadow over her face. The old wooden box rests open beside her like it has been waiting for this moment. Wide cinematic composition, Chinese ink painting aesthetic, deep warm candlelight against surrounding shadow, quiet revelatory atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-special-bond-5",
    name: "李云舒 — 承重之剑",
    prompt: `Dynamic wuxia combat-aftermath scene in the garden courtyard of an ancient manor at dusk. ${CHAR.liYunshu} stands in a composed precise stance — sword extended, tip resting lightly at the throat of a uniformed manor guard captain who is frozen mid-motion, unable to advance. The hold is not aggressive: it is exact, patient, as if she had watched this moment approaching from three exchanges back. Around her, two other guards have halted, exchanging uncertain looks. Her expression carries no triumph, no anger — only the focused stillness of someone who read the situation correctly from the beginning and moved precisely when the moment asked. ${CHAR.player} stands at her flank. The manor's tiled eaves and garden stone lanterns frame the scene; the last warm light of evening falls across her peach-and-gold hanfu and the bright line of her blade. Plum trees visible along the courtyard wall. Wide cinematic composition, Chinese ink painting aesthetic, warm amber dusk lantern light against deep garden shadow, atmosphere of precise unhurried confidence — not brute force but the clarity of someone who waited, saw clearly, and acted exactly right, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "li-yunshu-true-ending",
    name: "李云舒 — 此后同行",
    prompt: `Hopeful forward-looking wuxia scene on a high stone terrace overlooking distant mountains. ${CHAR.player} and ${CHAR.liYunshu} stand shoulder to shoulder at the edge of the terrace, both turned toward the horizon where mountains recede into bright haze. She holds a folded letter against her chest with both hands — not clutching, just holding, the way you hold something once it no longer weighs anything. Neither looks at the other; both look forward. Scattered plum blossom petals drift past on a light breeze. Bright late afternoon sun flooding the terrace with warm amber-gold light, the stone surface glowing, the sky above open and luminous. The mood is unguarded and quietly full of possibility — the first moment neither of them is carrying something that has to be done. Wide cinematic composition, Chinese ink painting aesthetic, bright warm golden light with open sky and mountain haze, luminous hopeful atmosphere with no heavy shadow, anime-inspired semi-realistic art, high quality detailed scene.`,
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
    prompt: `Wuxia scene of return to a ruined mountain sect. ${CHAR.yanChixing} and ${CHAR.player} stand just inside the collapsed main gate of the Hanlight Sect's abandoned stronghold — a wide establishing shot showing the full scale of devastation: the roofless hall ahead, walls cracked and overgrown with vines, scattered stone rubble and old timber half-buried in the hillside. The two figures are small against the ruin, not touching anything yet, simply taking in what remains. A faint carved name-wall is visible in the shadowed interior of the hall beyond, but it is not the focus — the focus is the silence and the scale of what was lost. Grey overcast sky, cold still air, the mountain slowly reclaiming everything. Wide cinematic composition, Chinese ink painting aesthetic, cold grey ruin and deep shadow tones, solemn desolate atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-special-bond-4",
    name: "燕赤行 — 清醒之痛",
    prompt: `Wuxia reckoning scene on a mountain road, overcast afternoon. A wild plum tree grows at the roadside — gnarled, old, blooming with no one having planted it here, its white blossoms falling in the still air. ${CHAR.yanChixing} has stopped before it. He did not mean to stop. His sword hand hangs completely loose at his side, the weapon forgotten. He stands looking at the falling petals — not at the tree, not at the road ahead — with the expression of a man whose seven years of certainty have just gone quiet: not grief, not rage, only the cold clear sight of a mistake seen for the first time. The plum blossoms fall around him in the grey light. Behind him the mountain road disappears into mist — the full length of what he traveled to stand here. ${CHAR.player} stands a few paces back, watching, not approaching. Wide cinematic composition, Chinese ink painting aesthetic, grey overcast tones with the pale white plum blossoms the only brightness in the frame, the image of a hard scarred man stopped by something small and alive, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-special-bond-5",
    name: "燕赤行 — 大义选择",
    prompt: `Wuxia departure scene on a mountain road at dawn, shot from behind: ${CHAR.yanChixing} is already walking, travel pack settled on his back, moving away from camera up a rising mountain road into breaking dawn. ${CHAR.player} is at his shoulder, matching stride — already moving, no hesitation. The road climbs into layered mountain ridges blazing with bright morning gold at their edges, the sky ahead opening into clear luminous dawn. The two figures are deliberately small against the scale of what lies ahead. The road ahead is flooded with morning light; shadow stays behind them. No ceremony, no pause — the decision has already been made, and this is what making it looks like. Wide cinematic landscape composition, Chinese ink painting aesthetic, bright gold breaking dawn with luminous open sky, the road ahead glowing, two small figures already in motion, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-afterstory-ending",
    name: "燕赤行 — 后日谈·立碑",
    prompt: `Solemn wuxia memorial scene inside the ruined Hanlight Sect hall. ${CHAR.yanChixing} kneels before the cracked name-wall, one hand pressed flat against the stone, the other holding a chisel. He is carving — not the names of the dead, which are already there, but finishing the final act of account: his posture is precise and deliberate, the scarred face carrying not grief but the expression of someone completing something that needed to be done. ${CHAR.player} stands behind him, holding a dim oil lamp steady so he can see the stone. Dust in the cold air, the ruined hall silent around them, grey overcast sky visible through the collapsed roof above. Wide cinematic composition, Chinese ink painting aesthetic, cold grey ruin light with a single warm lamp against stone, atmosphere of an act that closes something and opens something else at the same time, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "yan-chixing-true-ending",
    name: "燕赤行 — 游走的灯",
    prompt: `Wuxia epilogue scene, dusk turning to night. Foreground, real and present: ${CHAR.yanChixing} walks a mountain road alone, a small oil lantern swinging at his side — his light is moving, wandering, carried forward into the dark. His posture is easy, the old tension gone; he does not look back. Far in the distance behind him, barely visible through mountain mist and fading light: a translucent ghostly impression of a gaunt older man (季沧海) working at the entrance of crumbling sect ruins — he is re-hanging a large gate lantern at the collapsed archway, a fixed warm beacon beginning to glow. One light wanders across the whole jianghu. One light stands still and calls people home. Same fire, two ways of carrying it. The wandering lantern in the foreground and the ghost-light on the distant mountain are the same warm amber, connected across the dark. Wide cinematic landscape composition, Chinese ink painting aesthetic, deep dusk indigo and warm amber lantern light, the two flames the only warmth in a darkening world, anime-inspired semi-realistic art, high quality detailed scene.`,
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
    prompt: `Wuxia parting scene in a simple medicine room at dusk. ${CHAR.suQing} stands at a low wooden table with her large wooden medicine chest half-packed, dried herbs and small vials on the table — she has paused in her packing and turned her head back over her shoulder to look at ${CHAR.player} standing in the doorway, her gaze calm but carrying the weight of a departure already decided. Their eyes meet in the warm amber lamplight. Medicinal herb bundles hanging from the rafters, the quiet of a moment that does not need words. Wide cinematic composition, Chinese ink painting aesthetic, warm amber and deep green shadow tones, bittersweet and quietly determined atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-bond-4",
    name: "苏青 — 第四章",
    prompt: `Wuxia rescue scene inside a dim wooden hut in the wilderness, just cleared of its bandit captors. ${CHAR.suQing} has rushed forward to embrace her elderly white-haired master — emaciated, his robes worn thin, but alive — her shoulders shaking with tears for the first time. Her steady composure has broken entirely, face buried against his shoulder. The master's eyes are closed, his hands coming up slowly to hold her. ${CHAR.player} has stepped to one side near the hut wall, sword sheathed, deliberately giving them space — the quiet action of someone who knows this moment belongs to them alone. Dim filtered light, hay on the floor, the quiet aftermath of rescue. Wide cinematic composition, Chinese ink painting aesthetic, warm dim earth and pale daylight tones, deeply emotional and gentle atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-ending",
    name: "苏青 — 针灸传心",
    prompt: `Tender wuxia scene in a simple countryside medicine hall at dusk. ${CHAR.suQing} stands inside with her back turned, shoulders slightly trembling in suppressed emotion — the first time her composure has truly broken. ${CHAR.player} stands facing her elderly white-haired master (a distinguished old doctor with kind weathered eyes), hands clasped in a deep respectful bow (作揖) toward the old man — an expression of gratitude and reverence. The master's eyes are warm and a little damp, accepting the gesture. Dried herbs hanging from the rafters, warm candlelight inside, a medicine chest nearby, late afternoon sun through the window. A sense of things finally found after long searching. Wide cinematic composition, Chinese ink painting aesthetic, warm green and amber earth tones, gentle emotional atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-afterstory",
    name: "苏青 — 后日谈·秘方",
    prompt: `Wuxia scene of moral weight in a candlelit medicine room at night. ${CHAR.suQing} stands at a table with her elderly white-haired master, an ancient handwritten formula scroll unrolled between them — the cure for Heaven Demon's internal poison, in hands that could save or destroy. Her face holds the gravity of a decision too large for one person. ${CHAR.player} stands across the table, witnessing. The single candle illuminates their faces and the scroll; everything else is shadow. Dried herbs hanging above, the quiet of late night, an impossible weight hovering in the still air. Wide cinematic composition, Chinese ink painting aesthetic, single candlelight gold against deep shadow tones, morally charged and quietly tense atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-afterstory-ending",
    name: "苏青 — 后日谈·重开",
    prompt: `Warm wuxia scene at the threshold of a newly reopened medicine hall at golden sunset. ${CHAR.suQing} stands in the doorway under her master's old wooden sign — freshly rehung, the characters for 济世堂 legible above her — with a small quiet smile at the last of the day's light. The doorway is filled with bright warm golden sunset light pouring in from outside, illuminating her face and the interior behind her. Inside, ${CHAR.player} sits at a low table with a bowl of steaming congee, the warm interior fully visible and bright. The medicine hall is simple but whole: dried herbs in order, the first day's patients seen. Wide cinematic composition, Chinese ink painting aesthetic, bright warm golden sunset light flooding the doorway and interior, soft sage-green and amber tones, luminous and gently fulfilled atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "su-qing-true-ending",
    name: "苏青 — 问脉道别",
    prompt: `Warm intimate wuxia farewell scene inside a modest medical clinic. ${CHAR.suQing} sits close to ${CHAR.player}, her fingers pressed gently but professionally against his inner wrist in a physician's pulse-reading hold, eyes focused downward — diagnosing, as she always does, yet this is also unmistakably a goodbye. Warm paper-window light fills the clinic interior: bundles of dried herbs hanging from dark wooden rafters, ceramic medicine jars on shelves, a half-finished medicine packet on the low wooden table beside her. Her expression is composed and warm — she has given what she can give, and she knows it is enough. ${CHAR.player} is still, watching her. Wide cinematic composition, Chinese ink painting aesthetic, warm amber and sage-green interior light filtered through rice paper windows, quiet purposeful atmosphere of a person exactly where she belongs, anime-inspired semi-realistic art, high quality detailed scene.`,
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
  {
    id: "ling-xue-special-bond-5",
    name: "凌雪 — 那一杯水",
    prompt: `Quiet wuxia scene on a sunlit stone courtyard step, late afternoon golden light. ${CHAR.lingXue} sits on the lower step of a courtyard entrance, white robes settling around her, holding an old unglazed clay teapot by its handle — she brought it herself. She is not looking at ${CHAR.player} but at the teapot in her hands, her fingers tracing its rough rim slowly. The expression is unguarded for the first time: not cold, not defensive — contemplating something she has finally allowed herself to feel. ${CHAR.player} sits beside her on the same step, not too close, not looking at her either — present without pressure. A few plum blossoms have drifted into the courtyard from beyond the wall. The teapot sits between them on the step. Bright warm afternoon light falls soft and clear across both figures, luminous pale gold, no deep shadows. Wide cinematic composition, Chinese ink painting aesthetic, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "ling-xue-true-ending",
    name: "凌雪 — 各走天涯",
    prompt: `Clean decisive wuxia parting scene on a mountain road in winter. ${CHAR.lingXue} walks away along a frost-edged mountain road heading toward a misty pass, white robes and silver trim catching grey winter light. She has turned her head back over her shoulder — not with longing, but with a composed certain expression: a mutual understanding acknowledged, nothing left unresolved. In the background ${CHAR.player} is a small stationary figure in midnight blue at the start of the road, watching her go without moving to follow. Bare winter trees frame both sides of the path, light frost on the fallen leaves, the road curving away into mist. Wide cinematic composition, Chinese ink painting aesthetic, cool grey-white winter light with silver and deep ink tones, clean bittersweet atmosphere of two people parting exactly as equals, anime-inspired semi-realistic art, high quality detailed scene.`,
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
    prompt: `Quiet wuxia dusk scene in a sparse courtyard. ${CHAR.mysteriousElder} stands facing ${CHAR.player}, his right hand extended palm-upward between them — resting in his palm is a faint warmth, almost invisible, like a candle flame that has burned to its last breath: the final remnant of a lifetime's cultivation being freely offered. His expression carries neither pride nor grief — only the specific calm of a man who has made his decision and finds it correct. The jade piece at his waist is still, its cold gleam dimmed — this moment belongs entirely to what he is passing forward, not what he has been. ${CHAR.player} faces him, hands raised to receive. Last amber light of dusk on the courtyard stones, bare branches above, the world quiet. Wide cinematic composition, Chinese ink painting aesthetic, warm fading amber and deep still shadow, atmosphere of something irreversible and right, anime-inspired semi-realistic art, high quality detailed scene.`,
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
    name: "剑魂·吞噬",
    prompt: `Wuxia absorption horror scene, aftermath of victory turning into defeat. The battlefield is still; ${CHAR.player} stands sword lowered, breathing hard — the fight was won. But the shattered fragments of the sword spirit have not dispersed: they swirl back, slowly, drawn together, and begin spiraling toward the protagonist's chest like silver needles, entering uninvited. His expression shifts from relief to horror as his feet root themselves to the ground, sword arm losing strength — consciousness dimming. In the far background, barely visible at the edge of the scene: ${CHAR.mysteriousElder} has appeared — he was not there a moment ago. He stands perfectly still, one hand extended with the cracked jade piece in his palm. The jade piece blazes with cold star-bright light, sharp and deliberate. His expression is unreadable — not panicked, not surprised. He knew this would happen. He has been waiting for this moment. Wide cinematic composition, Chinese ink painting aesthetic, cold silver-white sword-light spiraling inward at center, warm amber surroundings dimming at the edges, the lone white-haired figure barely visible in deep background with blazing jade light, suffocating and melancholic atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "mysterious-elder-afterstory-ending",
    name: "神秘老者 — 后日谈·重逢",
    prompt: `Deeply moving wuxia reunion scene in a moonlit garden pavilion. ${CHAR.mysteriousElder} kneels before his daughter (沈微尘) — a quiet woman in plain robes who has inherited his stillness. With trembling hands he carefully pins a small copper hairpin back into her hair. Neither speaks. His head is bowed; for the first time his spine is not perfectly straight — the weight of twenty years briefly visible. The jade piece at his waist glows faintly in the silver moonlight, the only light that is not from the moon. ${CHAR.player} stands in the shadows as a silent witness. A single plum tree in early bloom nearby. Wide cinematic composition, Chinese ink painting aesthetic, cold silver moonlight and deep garden shadow with the faint jade piece glow, profoundly moving and quietly final atmosphere, anime-inspired semi-realistic art, high quality detailed scene.`,
  },
  {
    id: "mysterious-elder-true-ending",
    name: "神秘老者 — 长夜将晓",
    prompt: `Wuxia scene of renewal, hope, and dawn after nine hundred years. A simple paper-windowed room blazing with warm gold-rose morning light — the first true dawn in centuries. An elderly white-haired Chinese sage (沈玄清) stands facing the paper window, posture naturally upright — the constrained supernatural stillness of the possessed man is gone; what remains is the simple dignity of an old swordmaster returned to himself, his hands open and unguarded at his sides, no jade piece at his waist. The window glows brilliant gold-rose, bright morning light streaming through the paper panels and painting the entire room with warmth. He faces the light with clear calm eyes: the expression of a man who has just set down something he carried so long he had forgotten what he was carrying. In the open doorway behind him, a young woman in plain medicinal robes (沈微尘) steps forward into the room — radiant dawn light blazing behind her, her expression warm and full of quiet certainty, her lips parting to say one word. A single burned-out candle stands on the low table, its work done — irrelevant now against the brightness. Outside the paper window: bright gold sky, soft rose clouds, mountains fully emerged into morning. Wide cinematic composition, Chinese ink painting aesthetic, the entire room flooded with brilliant warm gold-rose dawn light from window and doorway alike, radiant and luminous with no shadow remaining, profound warmth of a very long night finally over, anime-inspired semi-realistic art, high quality detailed scene.`,
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
