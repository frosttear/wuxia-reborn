---
description: 版本号更新 & 提交前检查清单
---

## 使用方式

每次有代码改动准备提交时运行此 workflow。将 `NEW_VERSION` 替换为新版本号（如 `0.27.20`），将 `OLD_VERSION` 替换为当前版本号（如 `0.27.19`）。

---

## 步骤

### 1. 确认改动内容

在 `PROGRESS.md` 的最顶部添加新版本条目：

```
### vNEW_VERSION（YYYY-MM-DD）

**[分类标题]**
- [具体改动描述]

----
```

同时将第 3 行 `## 当前版本：vOLD_VERSION` 改为 `## 当前版本：vNEW_VERSION`。

### 2. 更新 README.md

将第 1 行 `# 轮回江湖（开发中）vOLD_VERSION` 改为 `# 轮回江湖（开发中）vNEW_VERSION`。

如果改动影响了职业路线、任务门槛、属性说明等文档内容，同步更新对应段落。

### 3. 更新 index.html

- `<title>` 标签中的版本号
- 所有 `?v=OLD_VERSION` 缓存参数（css、js 引用、img src 均含）

可用全文替换：`?v=OLD_VERSION` → `?v=NEW_VERSION`（index.html 内 replace_all）。

### 4. 检查测试文件

如果本次改动涉及以下内容，需同步更新 `tests/` 下对应测试：

- `data/chains.json`：解锁条件（jobs、flags、attributes）变更
- `data/bonds.json`：章节结构、level、minAffinity 变更
- `data/enemies.json`：新增或删除敌人 ID
- `data/jobs.json`：职业需求变更

// turbo
5. 运行测试确认通过

```
cd /Users/liuzhenxing/Documents/GitHub/wuxia-reborn/wuxia-reborn && npx jest --no-coverage 2>&1 | tail -10
```

### 6. Git 提交

```
git add -A && git commit -m "vNEW_VERSION: [改动简述]"
```
