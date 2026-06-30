# 2026 AI 愿景论坛 · 智能体产业研讨会（上海站）

> AI Vision Forum on Agentic AI Workshop · Shanghai · 2026-06-27 · 上海西岸美高梅酒店

会议回顾站点：按五大主题展示嘉宾、演讲与 AI 整理的智能纪要。纯静态站点（HTML/CSS，无构建步骤）。

## 结构
- `index.html` — 首页：会议概览 + 完整日程（按主题分组）+ 嘉宾墙
- `talks/*.html` — 每场演讲 / 圆桌的智能纪要与章节
- `speakers.html` — 嘉宾目录
- `wiki/index.html` — 知识库（纪要 / 人物 / 主题）

## 本地预览
```
python3 -m http.server 8080   # http://localhost:8080
```

## 部署
该仓库根目录即为站点，可直接用 Cloudflare Pages 连接本仓库部署（构建命令留空，输出目录填 `/`）。

---
说明：内容由飞书妙记 AI 自动整理为会议纪要，可能存在识别误差，仅供学习参考；议程与嘉宾职务以官方会议日程为准。
