"""
Add 4 ambient foreshadowing events (rebirthCount >= 1) that hint at the elder's
manipulation across lives without spelling out the truth.
Run: python scripts/add_foreshadow_events.py
"""
import json, os

BASE = os.path.join(os.path.dirname(__file__), '..', 'data')

with open(os.path.join(BASE, 'events.json'), encoding='utf-8') as f:
    events = json.load(f)

NEW_IDS = ['past_life_scar', 'elder_timing', 'deja_vu_road', 'jade_pulse']
existing_ids = {e['id'] for e in events}
skip = [eid for eid in NEW_IDS if eid in existing_ids]
if skip:
    print(f"Already exist, skipping: {skip}")
    NEW_IDS = [eid for eid in NEW_IDS if eid not in existing_ids]

new_events = [
    {
      "id": "past_life_scar",
      "type": "奇遇",
      "weight": 4,
      "title": "前世之伤",
      "text": (
        "清晨，你醒来时左肩隐隐作痛。\n\n"
        "不是新伤——没有撞过，没有练错，但那种钝痛的方式你有些熟悉：像是一处旧伤压到了什么。\n\n"
        "你检查了一遍，什么都没有。皮肤完好，肌肉没有撕裂，骨骼也没有错位。\n\n"
        "路边有个行医的老妪正收摊，你随口问了一句。她摸了摸你的肩膀，皱了皱眉：\n\n"
        "「奇怪，气血的走向好像绕着什么东西走。」她说，「像是这里曾经有过一处很深的旧伤……但这皮肉看起来从没受过伤。」\n\n"
        "她想了想，补了一句：「也许，是上辈子的事。」\n\n"
        "她笑着收了药箱，转身离去。你站在原地，没有笑。"
      ),
      "conditions": {"minRebirth": 1},
      "choices": [
        {
          "id": "accept_the_ache",
          "text": "把手放在那处隐痛的位置，静静体会了一会儿",
          "effects": {
            "attributes": {"comprehension": 2, "constitution": 1},
            "narrative": (
              "那股钝痛持续了大半天，到了傍晚才慢慢消散。\n\n"
              "你说不清楚这算是什么——但你知道，那不是幻觉。\n\n"
              "有些东西，确实跟着你来到了这一世。"
            )
          }
        }
      ]
    },
    {
      "id": "elder_timing",
      "type": "奇遇",
      "weight": 3,
      "title": "一个细节",
      "text": (
        "你想起一件一直觉得奇怪、但从来没细想的事。\n\n"
        "那是你刚来镇上不久，在茶馆里听人闲聊——一个老茶客说，「镇上那个老先生啊，上个月就在问，说有个年轻人要来了，大家有没有见过」。\n\n"
        "当时你以为他只是随口一说，没当回事。\n\n"
        "但那是在你出现之前。\n\n"
        "他知道你会来。\n\n"
        "他不只是知道——他在等。"
      ),
      "conditions": {
        "minRebirth": 1,
        "flags": {"met_mysterious_elder": True}
      },
      "choices": [
        {
          "id": "think_it_through",
          "text": "把这件事认真想了一遍，觉得不安",
          "effects": {
            "attributes": {"comprehension": 2},
            "narrative": (
              "你把记忆里那个细节翻出来，放在现在的眼光下重新看了一遍。\n\n"
              "结论很简单，也很令人不安：他对你的出现，早有预料。\n\n"
              "还是说……不只是预料。\n\n"
              "你把这个想法压下去，继续走路。但它没有消散——只是沉到更深的地方，等着你哪天再把它捞起来。"
            )
          }
        },
        {
          "id": "dismiss_it",
          "text": "或许只是巧合——不去多想",
          "effects": {
            "attributes": {"luck": 1},
            "narrative": (
              "你把这个念头摁下去。\n\n"
              "江湖里什么消息都有，有人提前打听一个外乡人的到来，也不是什么稀奇事。\n\n"
              "你继续走，但那个细节，就这么留在了心里某个角落。"
            )
          }
        }
      ]
    },
    {
      "id": "deja_vu_road",
      "type": "奇遇",
      "weight": 5,
      "title": "似曾相识",
      "text": (
        "你走上一条没有走过的山路，打算抄近道去镇北。\n\n"
        "走到一半，你停下来了。\n\n"
        "你知道前面有什么。\n\n"
        "不是猜测——是知道：转过这个弯，右手边有一块倒了一半的石碑，上面刻着三个字；再往前二十步，路边有一棵被雷劈断了一半的老松，枯枝朝东。\n\n"
        "你绕过弯去。\n\n"
        "石碑在。老松在。枯枝朝东。\n\n"
        "你在那里站了很久，看着这两样你从没见过、却认识的东西。\n\n"
        "江湖人常说「前世缘」，说得轻巧。但站在这里，你觉得这三个字，比任何时候都更有重量。"
      ),
      "conditions": {"minRebirth": 1},
      "choices": [
        {
          "id": "walk_on",
          "text": "在那棵断松旁坐了一会儿，然后继续走",
          "effects": {
            "attributes": {"comprehension": 3},
            "narrative": (
              "你不知道在这条路上，前世的那个你，发生过什么。\n\n"
              "但你的脚知道这条路。你的眼睛认识那块石碑。\n\n"
              "有些记忆，没有跟着进入这一世的脑子——但也许，它们以另一种方式留了下来。"
            )
          }
        }
      ]
    },
    {
      "id": "jade_pulse",
      "type": "奇遇",
      "weight": 3,
      "title": "玉牌的脉动",
      "text": (
        "深夜，你盘坐调息，忽然感到胸口有什么东西动了一下。\n\n"
        "是玉牌。\n\n"
        "就一下，轻微而清晰，像是有什么东西在里面敲了一次。节奏很稳——不是随机的震动，更像是……计数。\n\n"
        "你把它取出来，放在掌心，凝神感知。\n\n"
        "什么都没有了。只有温热的玉质，和你掌心的温度一起，慢慢融为一体。\n\n"
        "你盯着它，想起第一次见到它时，神秘老者的话：「好好保管，关键时刻，它会保护你。」\n\n"
        "他说的保护，是什么意思？\n\n"
        "保护——还是记录？"
      ),
      "conditions": {"minRebirth": 1},
      "choices": [
        {
          "id": "examine_jade",
          "text": "以内力轻轻探查玉牌内部的结构",
          "requirements": {"minAttributes": {"innerForce": 10}},
          "effects": {
            "attributes": {"innerForce": 2, "comprehension": 2},
            "narrative": (
              "你的内力渗入玉牌，感到一种复杂的、非天然的结构——像是有人用很长时间、很深的功力，"
              "在里面刻了什么东西。\n\n"
              "你感知不到全部，只能感知到一点边缘：那个结构很大，远比玉牌本身的体积能容纳的要大。\n\n"
              "你收回内力，把玉牌重新放回胸口。\n\n"
              "有些东西，你还没有足够的力量去看清。\n\n"
              "但你会的。"
            )
          }
        },
        {
          "id": "put_it_away",
          "text": "把玉牌重新放好，不去多想",
          "effects": {
            "attributes": {"comprehension": 1, "luck": 1},
            "narrative": (
              "你把玉牌收好。\n\n"
              "也许只是一时的错觉。或者，它本来就有某种感知外界的特性——神秘老者没有解释，你也没有追问。\n\n"
              "但那一下轻敲的感觉，在你心里留了很久，久到你开始觉得，那不是幻觉。"
            )
          }
        }
      ]
    }
]

for ev in new_events:
    events.append(ev)
    print(f"Added: {ev['id']}")

with open(os.path.join(BASE, 'events.json'), 'w', encoding='utf-8') as f:
    json.dump(events, f, ensure_ascii=False, indent=2)

print(f"events.json: {len(new_events)} foreshadowing events added. Total: {len(events)}")
