'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// ── BONDS.JSON ────────────────────────────────────────────────────────────────
const bondsPath = path.join(ROOT, 'data/bonds.json');
const bonds = JSON.parse(fs.readFileSync(bondsPath, 'utf8'));
const yan = bonds.yan_chixing;

// Bond 5 Step 1: add 季沧海's fate after the first paragraph
const b5 = yan.find(b => b.level === 5);
b5.steps[0].text = [
  '几日后，燕赤行找到你，背上已经包袱整齐。',
  '',
  '「那批黑衣客已经知道有人见过季沧海，」他说，平静得像是在说天气，「他们会来，早晚的事。与其等，不如先走。」',
  '',
  '季沧海的伤，你们托了城里的大夫去看。等他能起身，他是有地方可去的——那份皮质封套，他只给了你们一份誊抄，原件还在他手里，那件事他还没做完。',
  '',
  '他顿了顿，看着远处：「师父说过——含光门的人，是为了让别人路上多一盏灯的。我那时候觉得这话太酸了。现在想想，他的意思不是让我守着那盏灯，而是把它带走，走到哪里，照到哪里。」',
  '',
  '他转过来看你：「你往哪边走？」',
  '',
  '那是他用自己的方式说：他想跟你走一段。从燕赤行嘴里说出来的话，每一个字都经过了掂量。这句话的分量，你知道。',
].join('\n');

// ── CHAINS.JSON ───────────────────────────────────────────────────────────────
const chainsPath = path.join(ROOT, 'data/chains.json');
const chainsData = JSON.parse(fs.readFileSync(chainsPath, 'utf8'));
const afterstory = chainsData.chains.find(c => c.id === 'yan_afterstory');

// Step 1 go_together narrative: 季沧海's name handled differently from the dead
const step1 = afterstory.steps[0];
step1.choices.find(c => c.id === 'go_together').effects.narrative = [
  '含光山比你想象的更荒凉。到处是矿洞和塌方的痕迹，树木被砍得七零八落。但在半山腰的一处平台上，残破的正殿还在——屋顶塌了一半，门被风吹掉了，但墙壁还立着。',
  '',
  '燕赤行走到那面墙前，用手擦去灰尘和苔藓。名字还在——密密麻麻的，从第一代到最后一代。他的手指一个一个地划过去，嘴唇在无声地念着每一个名字。',
  '',
  '最后他的手停在了两个名字上——「季沧海」和「燕赤行」，并排刻着，是同一年入门的。他在那一刻停了很久，指尖没有动。这两个名字和其他的不一样——它们的主人还在世上。他不知道该用什么表情面对这件事。也许是庆幸，也许是别的什么，更复杂。',
  '',
  '他在那面墙前站了很久很久。',
].join('\n');

// Step 1 bring_supplies narrative: 30 incense/wine for the dead, 2 alive handled differently
step1.choices.find(c => c.id === 'bring_supplies').effects.narrative = [
  '你带了香烛和酒上山。含光门的遗址比想象中更破败，但那面刻满名字的墙还在。',
  '',
  '燕赤行在每一个名字前都点了一炷香，倒了一杯酒。轮到最后两个名字——「季沧海」和「燕赤行」——他停在那里，看了很久，把那两杯酒留着没有倒，放在台阶上，退开一步，弯腰鞠了一躬。',
  '',
  '「活着的人不用烧，」他低声说，声音很平，「我替他们谢一声。」',
  '',
  '做完这些，他在墙前跪了下去——那是你第一次看见他跪。跪了很久。站起来的时候，他的眼眶是红的，但表情比你见过的任何时候都平静。',
].join('\n');

// Step 3: carve 30 names (the dead), leave the 2 living out
const step3 = afterstory.steps[2];
step3.text = [
  '矿贼被清剿后，燕赤行在含光山上住了三天。',
  '',
  '他把正殿里的杂物全部清了出去，把塌了的屋顶用木头勉强撑了起来，把那面刻名字的墙重新清理干净。他还在山门口立了一块新的石碑——上面刻着「含光门」三个字，是他自己一笔一笔凿出来的，花了整整两天。',
  '',
  '碑的背面，他刻了三十个名字——含光门中没能走出来的三十个人，一个不少。刻完，他停了一下，把最后两格的位置留空，没有刻他自己的，也没有刻季沧海的。两个活着的人，不该被放进这里。',
  '',
  '最后他在碑下面加了一行小字：「含光一门，三十二人。三十人长眠于此，此碑长存。——燕赤行立。」',
  '',
  '他站在碑前，手上全是石粉和血，因为凿子太钝，他的手磨破了好几处。但他的表情——你从来没见过他这么平静。',
  '',
  '「不开门了，」他说，「含光门就到这里了。但这些人的名字——不能没有一个地方记着。」',
  '',
  '他把那块旧的含光门令牌从怀里取出来，埋在碑下的土里。',
  '',
  '「师父，」他说，「弟子来晚了。但灯……没有全灭。」',
  '',
  '风吹过山顶，松涛如歌。你站在一旁，觉得这一刻，含光门的三十个人——也许真的在某个地方，看着这里。',
].join('\n');

fs.writeFileSync(bondsPath, JSON.stringify(bonds, null, 2), 'utf8');
fs.writeFileSync(chainsPath, JSON.stringify(chainsData, null, 2), 'utf8');
console.log('bonds.json and chains.json updated.');

// ── ENGINE.JS (epilogue) ───────────────────────────────────────────────────────
const enginePath = path.join(ROOT, 'js/engine.js');
let engine = fs.readFileSync(enginePath, 'utf8');

const oldEpilogue = `                    { text: '含光山上的碑立好之后，燕赤行下了山，此后再没回去过。他说那是含光门的事，不是他的事——他的事，已经了了。', cls: 'epilogue' },
                    { text: '他又回到了那种来去无踪的日子，只不过这次走起来不一样——身上没有悬着的东西，步子比以前轻。', cls: 'epilogue' },`;

const newEpilogue = `                    { text: '含光山上的碑立好之后，燕赤行下了山，此后再没回去过。他说那是含光门的事，不是他的事——他的事，已经了了。', cls: 'epilogue' },
                    { text: '天魔死后不久，季沧海送来了一封信。信不长，只说了一件事：他打算重建含光门，想知道燕赤行是否愿意回来。', cls: 'epilogue' },
                    { text: '「他想重建。」燕赤行把信叠好，收进怀里，「我回了他，说我不去做那件事。但他要挂牌，我帮他守几天场子没问题。」', cls: 'epilogue-dialogue' },
                    { text: '「含光门是师父的含光门，」他停顿了一下，「他想把那个名字留下来，是他的选择。我的选择，是把灯带出来——不需要那块牌匾。」', cls: 'epilogue-dialogue' },
                    { text: '他说得很平，像是想了很久才想清楚的事，不带一点遗憾。', cls: 'epilogue' },
                    { text: '他又回到了那种来去无踪的日子，只不过这次走起来不一样——身上没有悬着的东西，步子比以前轻。', cls: 'epilogue' },`;

if (!engine.includes(oldEpilogue)) {
  console.error('ERROR: could not find target text in engine.js');
  process.exit(1);
}
engine = engine.replace(oldEpilogue, newEpilogue);
fs.writeFileSync(enginePath, engine, 'utf8');
console.log('engine.js epilogue updated.');
