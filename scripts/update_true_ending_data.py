"""
Script to add truth_shards chain, elder_true_form enemy, and elder_true_form_appears event.
Run: python scripts/update_true_ending_data.py
"""
import json, os

BASE = os.path.join(os.path.dirname(__file__), '..', 'data')

# ── 1. chains.json ────────────────────────────────────────────────────────────
with open(os.path.join(BASE, 'chains.json'), encoding='utf-8') as f:
    chains_data = json.load(f)

if any(c['id'] == 'truth_shards' for c in chains_data['chains']):
    print("truth_shards chain already exists, skipping")
else:
    truth_chain = {
      "id": "truth_shards",
      "name": "碎片真相",
      "desc": "五块碎片，分散在五个人的记忆里。拼起来，是一张轮回九百年的棋局。",
      "steps": [
        {
          "id": "shard_0_wang_tie",
          "title": "铁哥的旧事",
          "unlockConditions": {
            "minRebirth": 2,
            "bondLevels": {"wang_tie": 5}
          },
          "text": (
            "王铁那天找到你，神色有些不对。你们坐在镖局的老屋里，他盯着桌上那盏快要燃尽的油灯，忽然开口："
            "「有件事，我一直在想要不要说。」\n\n"
            "他揩了揩旧茶碗边缘，像是在整理措辞：「你来镖局那年——就是你刚满十五岁的时候，你出现的前三个月，有个老头来找过我。」\n\n"
            "他描述那个人：须发皆白，背脊挺直，眼神清澈得不像年纪很大的人。他自称是个看相的，但问的问题极为奇怪——不问名字家世，而是问："
            "你上一个认识的少年，是怎么死的？死在什么时节，哪处受的伤？\n\n"
            "「我那时以为他是疯子，随口说了个护送过的少年——十七岁，镖路上遭伏击，后背中箭，捱了七天，没撑住。」\n\n"
            "王铁停顿了一下：「老头把这些一一记下来，临走前说了一句话："
            "按你描述的，这次应该多撑些时候。」\n\n"
            "「这次，」王铁重复这两个字，盯着你，「你说，这话是什么意思？」"
          ),
          "choices": [
            {
              "id": "understand_shard",
              "text": "他在查我——查我前世的死法",
              "effects": {
                "attributes": {"comprehension": 2},
                "narrative": (
                  "你沉默了很久。那个问法的逻辑，你比任何人都更清楚它意味着什么。\n\n"
                  "「……是，」你最后开口，「他不是在算命。他在核对数据。」\n\n"
                  "王铁把茶碗推到你面前，没有说话。你们就这么坐着，像是在为某件还没发生的事，提前默哀了一会儿。"
                )
              }
            }
          ],
          "onComplete": {"flags": {"shard_wang_tie": True}}
        },
        {
          "id": "shard_1_yan_chixing",
          "title": "独行剑客的记账",
          "unlockConditions": {
            "flags": {"shard_wang_tie": True},
            "bondLevels": {"yan_chixing": 5}
          },
          "text": (
            "「我独行江湖二十余年，」燕赤行说，「有些面孔，记得特别清楚。」\n\n"
            "他从怀中取出一册泛黄的薄本——不像日记，更像记账簿，密密麻麻写着地名、时间、人物描述。"
            "「含光门灭后我没有去处，就到处走，把见过的事记下来。你看这里。」\n\n"
            "他翻到其中一页。上面描述的人：须发皆白，眼神异常清澈，背脊挺直，常在某个镇子边缘出没，"
            "对镇民打听一个刚出生或将出生的孩子的来历。三次记录，不同的镇子，跨度数年——"
            "但燕赤行在三条记录旁边各画了一个圈，注了同一句话：「疑为同一人。」\n\n"
            "「每次出现，都是在一个孩子降生前后，」他说，「他会在附近住一阵，打听这个孩子是否有什么特别之处，"
            "然后就消失了。下一次再出现，是十五年后。」\n\n"
            "燕赤行合上册子，平静地看着你：「最近一次是十五年前。那个孩子，就是你。」\n\n"
            "「我不知道这意味着什么，」他说，「但你问我，我就告诉你。」"
          ),
          "choices": [
            {
              "id": "ask_description",
              "text": "那个人的样子——和神秘老者一模一样，是不是",
              "effects": {
                "attributes": {"comprehension": 2},
                "narrative": (
                  "燕赤行沉默片刻，然后点了点头。\n\n"
                  "「我见过他一次，」他说，「在你十五岁那年，你出现在镇上之前，他在街角站了很久，朝镖局方向看。」\n\n"
                  "「我以为他只是个路人。」\n\n"
                  "「现在，我不这么想了。」"
                )
              }
            }
          ],
          "onComplete": {"flags": {"shard_yan_chixing": True}}
        },
        {
          "id": "shard_2_su_qing",
          "title": "药师的检验",
          "unlockConditions": {
            "flags": {"shard_yan_chixing": True},
            "bondLevels": {"su_qing": 5}
          },
          "text": (
            "「你让我看的那块玉佩，」苏青把药碗放下，神情认真，「我检查了三天。」\n\n"
            "她从袖中取出一叠记录：「首先，这不是天然玉石——内部的气息是人为灌注的，结构极为复杂。"
            "这种痕迹有个名字，师父曾在古籍里提过，叫做印气之物——用于将特定内力的特征封存其中，像印章，也像标记。」\n\n"
            "「但这块玉佩远比记载中复杂。它不只是记录，还有某种引导性的结构——"
            "像是在给某个更大的体系做标识，追踪某个特定的灵魂。」\n\n"
            "她抬起眼：「第二件事。这玉佩里封存的内力气息，我在别处见过。」\n\n"
            "「两年前，我在北边行医，收到一张别人留下的药方。方子用药思路极为特殊，气息特征——」"
            "她从随身小册里取出一张纸，「和玉佩里的，是同一个人的。」\n\n"
            "苏青把那张药方放到你面前。署名只有一个字，但你认出了那笔法的风骨。"
          ),
          "choices": [
            {
              "id": "recognize_calligraphy",
              "text": "这字迹……是神秘老者的",
              "effects": {
                "attributes": {"comprehension": 2, "innerForce": 1},
                "narrative": (
                  "苏青沉默地点了点头。\n\n"
                  "「玉佩是他做的，」她说，「内力气息不会说谎。」\n\n"
                  "你握住那块玉佩，感受着它熟悉的温度。九百年——这个数字第一次有了重量，"
                  "不再是抽象的时间，而是某个人在你不知道的岁月里，真实花费的等待。"
                )
              }
            }
          ],
          "onComplete": {"flags": {"shard_su_qing": True}}
        },
        {
          "id": "shard_3_li_yunshu",
          "title": "焚书之记",
          "unlockConditions": {
            "flags": {"shard_su_qing": True},
            "bondLevels": {"li_yunshu": 5}
          },
          "text": (
            "「我在秋水剑宗的那段日子，」李云舒坐在窗边，手边放着一本用布包裹的薄册，"
            "「有一件事一直没有说——因为不知道怎么开口。」\n\n"
            "「那个宗派的藏书很深，有好几个地下室。我在最深处找到一批残卷，大半已被烧毁，"
            "但残存的内容让我触目惊心。」她把布包打开，里面是她自己抄录的几页文字。\n\n"
            "「残卷的标题是《轮回修真记》，我只认出了几段——」"
            "她把文字递给你，其中一段写道：\n\n"
            "「……以双鱼引气符为锚，绑定于选定灵魂之侧，每世轮回后自动衔接，令其积累感悟与内力而不自知……」\n\n"
            "「……如此三至五世，灵魂自然蜕变，达到足以承载上古剑意执念之程度……」\n\n"
            "「……施术者于第五世后现身，引导其自愿归纳，或以强制手段完成最终一步……」\n\n"
            "李云舒在最后一句下面画了一道线。「这个双鱼引气符，」她抬起头看你，"
            "「是不是就是你怀里那块玉佩的另一个名字？」"
          ),
          "choices": [
            {
              "id": "confirm_amulet",
              "text": "是的。一字不差",
              "effects": {
                "attributes": {"comprehension": 3},
                "narrative": (
                  "你把玉佩轻轻放在那页抄录的文字旁边。\n\n"
                  "两者静静并排，像是相互印证的两半。\n\n"
                  "「施术者，」你念出这个词，「现身。」\n\n"
                  "李云舒把手放在那页文字上，盖住了「强制手段」四个字。"
                  "她没有说话，但她的眼神里，是你见过最清醒、也最沉重的东西。"
                )
              }
            }
          ],
          "onComplete": {"flags": {"shard_li_yunshu": True}}
        },
        {
          "id": "shard_4_ling_xue",
          "title": "天魔的指令",
          "unlockConditions": {
            "flags": {"shard_li_yunshu": True},
            "bondLevels": {"ling_xue": 5}
          },
          "text": (
            "「我给你看一样东西，」凌雪从袖中取出一份对折的旧纸，「我入天魔门下的第一份任务。」\n\n"
            "任务书写得很简单：目标年满十五岁时出现于清风镇附近。不得提前接触，不得干扰其成长。"
            "待其年满二十岁后，以「约定」之名前往，以全力试探。任务书的末尾，有一枚印鉴。\n\n"
            "「这份任务不是陆无归的意思，」凌雪用手指点了点印鉴，「他只是执行人。这枚印鉴的主人，另有其人。」\n\n"
            "她把另一张纸放到你面前——是她从废弃宅院里找到的一封旧信，年份极古，但墨迹保存完好。"
            "信尾有一枚相同结构、但更为古朴的印鉴。\n\n"
            "「我核对过，」凌雪说，「这两枚印鉴是同一种刻法，一个新，一个旧。同一个人，相隔了不知多少年。」\n\n"
            "「最开始我以为那是天魔宗自古以来的传承印鉴，」她顿了顿，"
            "「但我问过陆无归。他说他从未见过这枚印——拿到任务书的时候，它就已经在上面了。」\n\n"
            "「有个人，」凌雪直视你，「比陆无归更早介入了这一切。天魔，从一开始，只是他的棋子。」"
          ),
          "choices": [
            {
              "id": "piece_together",
              "text": "五块碎片——现在全在这里了",
              "effects": {
                "attributes": {"comprehension": 2, "reputation": 2},
                "narrative": (
                  "你把五样东西放在一起：王铁的描述，燕赤行的记账，苏青的药方，李云舒的抄录，凌雪的任务书。\n\n"
                  "五个人，五个不同的角度，指向同一个人——同一张棋局的设计者。\n\n"
                  "你看着这些，心里没有愤怒，也没有悲伤。只有一种从高处俯瞰时才有的、清醒而寒凉的平静。\n\n"
                  "你知道下一步该去哪里了。"
                )
              }
            }
          ],
          "onComplete": {"flags": {"shard_ling_xue": True}}
        },
        {
          "id": "shard_5_confrontation",
          "title": "轮回的设计者",
          "unlockConditions": {
            "flags": {
              "shard_wang_tie": True,
              "shard_yan_chixing": True,
              "shard_su_qing": True,
              "shard_li_yunshu": True,
              "shard_ling_xue": True
            }
          },
          "text": (
            "老者坐在院中，手边是一盏冷掉的茶。\n\n"
            "你把五样东西依次放到他面前——王铁的描述，燕赤行的记账，苏青检验的结果，李云舒抄录的残卷，凌雪保存的任务书。\n\n"
            "他没有打断你，直到你说完，才开口。「你比我预想的更早看清了，」他说，语气里没有惊慌，"
            "只有疲惫的平静，「这说明，这一世的你，真的已经够了。」\n\n"
            "「让我告诉你为什么。」\n\n"
            "他讲了一段你从未听过的历史：上古时，有一道剑意执念——一位穷尽一生追求武道极致的剑修，"
            "在临死前将毕生剑意和不甘凝聚成自主意识。它无法被消灭，因为它的存在形式已不在这个世界的规则之内。"
            "它一直在吞噬活人的气血维持自身。\n\n"
            "九百年前，他发现了它，以大半修为将它封印于玉牌之中。但封印终有散时。"
            "能彻底终结它的，只有一个足以承载并消化它全部剑意的人。\n\n"
            "「单凭一世之力，不够，」他说，「我寻访了七百年，没有一个人能在一世之内达到那个高度。"
            "所以我换了一个思路——一世不够，那就三世、五世呢？」\n\n"
            "「双鱼玉佩是我造的。它绑定你的灵魂，让你在每次轮回后，站在比上一世更高的起点上。"
            "天魔的角色是测试者——他的出现，是为了给你一个值得全力以赴的目标。他不知道这些。」\n\n"
            "「每一世，你经历的一切都是真实的，」他说，「我没有拿走任何东西。我只是……确保了你始终有机会再来一次。」\n\n"
            "他停下来，等你说话。\n\n"
            "院子里，风吹过来，老槐树的叶子簌簌地响。你看着眼前这个须发皆白的老人，"
            "看着他眼中九百年的等待和疲惫，看着他说出这些话时那种近乎坦然的从容。\n\n"
            "然后你想到了王铁，燕赤行，苏青，李云舒，凌雪——以及每一世你曾经爱过的、失去过的、记得的一切。\n\n"
            "他没有问过你。"
          ),
          "choices": [
            {
              "id": "accept_path",
              "text": "我理解你的苦衷了。我会去了结剑魂——但那是我自己的选择，不是你的安排",
              "effects": {
                "narrative": (
                  "老者低下头，久久没有抬起来。\n\n"
                  "当他再度抬头时，眼中有一种你从未见过的东西——不是胜利者的满足，"
                  "而是一种疲惫后的释然，像是一块压了九百年的石头，忽然变轻了一些。\n\n"
                  "「……好，」他说，「就这样。」\n\n"
                  "你转身离去。身后，一阵风吹过院子，茶碗里的茶在微微荡漾。"
                )
              }
            },
            {
              "id": "reject_cycle",
              "text": "你没有权力决定我的人生要用来做什么——我要亲手打碎这个棋局",
              "effects": {
                "flags": {"elder_true_form_ready": True},
                "narrative": (
                  "老者沉默了很长时间。\n\n"
                  "最终，他站了起来。你从未见过他站起来的样子如此沉重——像是九百年的重量全部压在那双脚上。\n\n"
                  "「那么，」他说，「就来证明你有这个资格。」\n\n"
                  "他没有愤怒，也没有失望。只是一种平静的、必然的坚持："
                  "「击败剑魂之后——我会在那里等你。」\n\n"
                  "他转过身，走回屋里，留下你一个人站在院子里。\n\n"
                  "风又吹过来。老槐树的叶子，这一次，一片一片地落下。"
                )
              }
            }
          ],
          "onComplete": {"flags": {"truth_assembled": True}}
        }
      ],
      "completionReward": {
        "attributes": {"comprehension": 3, "innerForce": 2},
        "narrative": (
          "五块碎片，一张棋局，一个横跨九百年的设计者。"
          "你站在所有真相之上，第一次真正看清了这条路的全貌——以及，你自己想走向哪里。"
        )
      }
    }

    chains_data['chains'].append(truth_chain)
    with open(os.path.join(BASE, 'chains.json'), 'w', encoding='utf-8') as f:
        json.dump(chains_data, f, ensure_ascii=False, indent=2)
    print("chains.json: truth_shards chain added")

# ── 2. enemies.json ───────────────────────────────────────────────────────────
with open(os.path.join(BASE, 'enemies.json'), encoding='utf-8') as f:
    enemies = json.load(f)

if any(e['id'] == 'elder_true_form' for e in enemies):
    print("elder_true_form already exists, skipping")
else:
    elder_enemy = {
      "id": "elder_true_form",
      "name": "沈玄清·真身",
      "attack": 140,
      "defense": 85,
      "hp": 900,
      "hpScale": 0,
      "attackScale": 0,
      "defenseScale": 0,
      "innerForce": 85,
      "comprehension": 40,
      "isTrueFinalBoss": True,
      "attackDescs": [
        "以千年积蓄的内力压制",
        "气机扭曲，攻势无迹",
        "掌力如山，稳而不动"
      ],
      "skills": [
        {
          "id": "century_palm",
          "name": "百年真掌",
          "telegraph": "老者双掌缓缓合拢，周遭气流骤然凝固……",
          "damageMult": 2.2,
          "hpThreshold": 0.85,
          "momentumCost": 3
        },
        {
          "id": "world_reversal",
          "name": "逆世回光",
          "telegraph": "一股古老而压迫性的气息从老者身上涌现，那是轮回本身的力量在运转……",
          "damageMult": 3.5,
          "hpThreshold": 0.5,
          "momentumCost": 4
        },
        {
          "id": "cycle_prison",
          "name": "轮回锁链",
          "telegraph": "老者双眼闭合，无形的束缚从四面八方涌来——那是他积蓄九百年的最深执念……",
          "damageMult": 5.0,
          "hpThreshold": 0.25,
          "momentumCost": 5
        }
      ],
      "winNarrative": (
        "老者最终倒下，双手放开。\n\n"
        "他望着你，表情不是失败者的绝望——而是一种复杂的释然，像是放下了一件搬了九百年的重物。\n\n"
        "「你赢了，」他说，声音很轻，「这个结果……也许比我计划的，要好得多。」\n\n"
        "「不是因为你击败了我，」他闭上眼，「而是因为——你是第一个真正做出选择的人。"
        "不是被安排的，不是被设计的。是你自己的。」\n\n"
        "双鱼玉佩的碎片在他手中化为光点，散入天地。轮回的枷锁，就此断裂。"
      ),
      "loseNarrative": (
        "那九百年积蓄的力量将你压倒。\n\n"
        "老者站在你面前，叹了口气：「你已经是我见过最接近的人了。」\n\n"
        "「再来一次吧，」他说，「这一次，你比上一次更近了。」\n\n"
        "这一世，就到这里了。"
      )
    }
    enemies.append(elder_enemy)
    with open(os.path.join(BASE, 'enemies.json'), 'w', encoding='utf-8') as f:
        json.dump(enemies, f, ensure_ascii=False, indent=2)
    print("enemies.json: elder_true_form added")

# ── 3. events.json ────────────────────────────────────────────────────────────
with open(os.path.join(BASE, 'events.json'), encoding='utf-8') as f:
    events = json.load(f)

if any(e['id'] == 'elder_true_form_appears' for e in events):
    print("elder_true_form_appears already exists, skipping")
else:
    elder_event = {
      "id": "elder_true_form_appears",
      "type": "boss",
      "weight": 0,
      "title": "轮回的终局",
      "text": (
        "剑意化为飞灰，玉牌归于沉寂。\n\n"
        "你低下头，感受着缠绕多世的力量终于归于平静——剑魂，就此终结。\n\n"
        "然而，身后传来一阵极为熟悉的脚步声。\n\n"
        "你不需要回头，就知道那是谁。\n\n"
        "「你做到了，」沈玄清的声音从身后传来，一如往常的平静温和，「就差最后一步了。」\n\n"
        "你转过身。他站在那里，须发皆白，眼神清澈——但这一次，你看见了他从未展示过的东西："
        "一种历经九百年的执念，终于浮出水面。\n\n"
        "「现在，」他说，「让我将这份力量正式交给你。」\n\n"
        "他抬起手，那双你熟悉的手——是他传授你内力时的那双手——涌现出一种截然不同的气息。\n\n"
        "不是传授。是收割。\n\n"
        "你明白过来了。这是九百年计划的最后一步。不是问你是否愿意——是不给你拒绝的机会。\n\n"
        "「对不起，」他说，第一次，你听见了他声音里的歉意，「这是唯一的办法。」"
      ),
      "conditions": {},
      "choices": [
        {
          "id": "resist_elder",
          "text": "拔剑——以自己的意志，拒绝这个安排",
          "effects": {
            "hp": 500,
            "combat": "elder_true_form",
            "narrative": (
              "你握紧剑柄，深吸一口气。\n\n"
              "九百年的设计，在这一刻，被你以一个动作打断。"
            )
          }
        }
      ]
    }
    events.append(elder_event)
    with open(os.path.join(BASE, 'events.json'), 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
    print("events.json: elder_true_form_appears added")

print("Done.")
