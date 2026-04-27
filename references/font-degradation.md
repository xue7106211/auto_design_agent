# 字体降级规则

本文档由 `SKILL.md` 在检测到不可用字体后按需读取。
本文档不是独立 Skill，不直接触发执行；它只提供字体降级的执行顺序、代码模板和边界规则。

## 降级映射表

| 不可用字体 | 降级目标 family | style 映射 |
|-----------|----------------|------------|
| MiSans VF | MiSans | Medium → Medium，其余 → Regular |
| HyperOS Symbols VF | MiSans | Medium → Medium，其余 → Regular |

如果遇到不在此表中的不可用字体，用 `listAvailableFontsAsync()` 查找同 family 的可用变体；如果没有同 family 可用变体，降级到 `{ family: 'MiSans', style: 'Regular' }` 并在输出中记录。

## 涉及不可用字体的实例，强制执行顺序

```
clone → setProperties(target variant) → detachInstance → fixFonts → appendChild
```

关键约束：
- variant 切换（`setProperties`）必须在 `detachInstance` 之前完成，detach 后无法再切换 variant
- `fixFonts` 必须在 `appendChild` 之前完成，否则 appendChild 触发字体加载报错
- detach 后节点不再是 instance，这是已知代价，在输出中标记为妥协项

## fixFonts 代码模板

```javascript
async function fixFonts(node, degradationMap) {
  if (node.type === 'TEXT' && node.characters.length > 0) {
    const fn = node.fontName;
    if (fn !== figma.mixed) {
      const key = fn.family;
      if (degradationMap[key]) {
        const target = degradationMap[key];
        const newFont = { family: target.family, style: target.styleMap[fn.style] || target.defaultStyle };
        await figma.loadFontAsync(newFont);
        node.fontName = newFont;
      }
    } else {
      for (let i = 0; i < node.characters.length; i++) {
        const rf = node.getRangeFontName(i, i + 1);
        const key = rf.family;
        if (degradationMap[key]) {
          const target = degradationMap[key];
          const newFont = { family: target.family, style: target.styleMap[rf.style] || target.defaultStyle };
          await figma.loadFontAsync(newFont);
          node.setRangeFontName(i, i + 1, newFont);
        }
      }
    }
  }
  if ('children' in node) {
    for (const child of node.children) { await fixFonts(child, degradationMap); }
  }
}
```

其中 `degradationMap` 结构示例：

```javascript
{
  'MiSans VF': { family: 'MiSans', styleMap: { 'Medium': 'Medium' }, defaultStyle: 'Regular' },
  'HyperOS Symbols VF': { family: 'MiSans', styleMap: { 'Medium': 'Medium' }, defaultStyle: 'Regular' }
}
```

## 文本属性修改场景

如果需要修改已有文本节点的 fontSize、characters 等属性（非 appendChild 场景），必须先加载降级后的字体：

```javascript
await figma.loadFontAsync({ family: 'MiSans', style: 'Regular' });
await figma.loadFontAsync({ family: 'MiSans', style: 'Medium' });
// 然后才能修改文本属性
```
