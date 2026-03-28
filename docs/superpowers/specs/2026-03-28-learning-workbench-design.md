# Learning Workbench Design

**Date:** 2026-03-28

## Product Goal

把当前项目从 demo 风格的课程网站，重构为一个真正可用的多用户学习产品。产品核心不是首页展示，而是一个长期可用的学习型编程环境：

- 登录后直接恢复到上次学习位置
- 左侧是章节与知识结构
- 中间上方是可视化
- 中间下方是正式可用的 Python 编译器
- 编译器旁边是模板、习题、框架练习与从 0 开始入口
- 右侧是持续型 AI 专家会话

首版先只支持 Python，但架构上允许后续扩展到更多语言。

## Confirmed Decisions

以下决策已在本轮设计中确认：

- 视觉方向：`Premium Hybrid`
- 产品入口：`App-First`
- 主界面骨架：`Balanced Three-Pane`
- 默认进入方式：`直接恢复上次学习位置`
- AI 面板模式：`Persistent Expert Chat`
- 产品优先级：`多用户产品优先`
- AI 能力：`真实大模型优先`
- 大模型供应商：`DeepSeek`
- 登录方式：`邮箱 + 密码`
- 首版范围：`只做学员端`
- 实现路线：`在现有 Next.js + FastAPI + Python runner 技术栈上重建正式产品骨架`

## Information Architecture

### Primary Flow

用户访问产品后：

1. 未登录：进入登录 / 注册页
2. 已登录：系统读取最近学习位置
3. 自动跳转到最近一个学习中的 studio
4. 用户在 studio 中完成知识理解、写代码、运行、问 AI、保存进度
5. 下次登录继续恢复到最近学习现场

### Product Routes

学员端产品路由建议为：

- `/auth`
  登录 / 注册
- `/app`
  恢复入口，根据最近学习记录重定向
- `/app/studio/[unitSlug]`
  主学习工作台
- `/app/lesson/[unitSlug]`
  独立知识解释页
- `/app/catalog`
  课程路径与章节总览
- `/app/account`
  用户账户与学习偏好设置

注意：

- 不再以传统营销首页为主入口
- lesson 页面是辅助视图，不再是产品主中心
- studio 页面是核心产品界面

## Studio Workspace Design

### Left Pane

左侧负责知识结构与导航：

- 当前路径 / 当前章节
- 章节树与进度状态
- 知识要点与章节目标
- 当前练习清单

### Center Top

中上方是可视化区域：

- 优先显示运行态变量变化
- 次优先显示课程预置的可视化帧
- 能定位到步骤、行号、关键变量

### Center Bottom

中下方是正式可用的 Python 编译器与输出区：

- Monaco 级编辑体验
- 高亮、缩进、括号匹配、当前行聚焦
- 快捷键、撤销/重做、自动保存
- 清晰区分 stdout / stderr / 变量态 / 耗时

### Center Sidecar

编译器旁边提供学习动作资源：

- 课程示例模板
- 练习模板
- 框架练习模板
- 从 0 开始的空白模板

这些模板不是静态代码片段，而要与当前章节目标、练习要求、AI 上下文联动。

### Right Pane

右侧是持续型 AI 专家会话：

- 保留连续上下文
- 支持自由提问
- 支持基于当前章节和当前代码回答
- 右键动作进入这个会话，而不是一次性弹窗

## Editor Strategy

### Core Principle

编译器必须是正式可用的编辑器，而不是一个看起来像编辑器的输入框。

### Chosen Approach

首版推荐使用 `Monaco` 作为编辑器基础能力。

原因：

- 功能深度足够
- 长期可用性强
- 更适合正式产品级体验
- 便于承载学习动作系统

### Must-Have Editor Capabilities

首版编辑器必须具备：

- 代码高亮
- 行号
- 自动缩进
- 括号匹配
- 撤销 / 重做
- 快捷键
- 自动保存
- 草稿恢复
- 模板切换
- 最近成功运行结果保留

## Learning Context Menu Strategy

右键菜单不能只做“问 AI 专家”，而要成为学习动作入口。

首版右键菜单至少包含：

- 解释这段代码
- 分析为什么报错
- 生成一个相似练习
- 加入学习笔记 / 标记为重点

后续可扩展：

- 重构建议
- 术语解释
- 测试输入建议
- 生成迁移练习

### Innovation Thesis

创新不在于重新发明编辑器，而在于把学习动作嵌入编辑器上下文：

- 学习型右键系统
- 可视化优先的运行反馈
- 模板与章节目标联动
- 恢复完整学习现场

## AI Architecture

### Core Principle

AI 必须是正式能力，不使用占位 explain 逻辑。

### Provider

首版使用 `DeepSeek`。

实现要求：

- 使用环境变量配置
- 不把密钥写入代码
- 统一在后端 AI service 中处理模型调用

建议环境变量：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_API_URL`

### AI Inputs

当用户通过右键菜单或右侧面板发起 AI 请求时，后端应接收：

- 当前完整代码
- 当前选中文本
- 当前章节目标
- 当前章节知识上下文
- 当前动作类型（解释 / 查错 / 练习 / 笔记）

### AI Outputs

AI 输出不只是一段文字，还应是带学习意图的结果：

- 解释代码
- 分析错误
- 给出下一步提示
- 给出相似练习建议
- 形成持续型专家会话记录

## Data Model

首版应形成正式多用户数据结构，至少包括以下 4 类：

### 1. User Account

- 邮箱
- 密码哈希
- 最近学习位置
- 用户偏好
- 会员状态（即使首版暂不收费，也预留）

### 2. Learning Content

- 路径
- 章节
- 知识解释
- 示例代码
- 模板
- 习题
- 框架练习
- 可视化帧

### 3. Learning Progress

- 草稿代码
- 已完成练习
- 最近打开章节
- 最近运行状态
- 学习笔记
- 最近 AI 会话摘要

### 4. Runtime And AI

- Python runner 运行结果
- stdout / stderr / trace / variable states
- DeepSeek AI 请求与响应

## Content Completeness Requirement

内容补齐不是后续注释，而是首版产品定义的一部分。

每个已上线章节必须同时包含：

- 知识解释
- 示例代码
- 从 0 开始模板
- 至少 2 个习题
- 至少 1 个框架练习
- 可视化帧
- 与章节目标绑定的 AI 上下文

额外要求：

- 第一版至少完成一条完整 Python 主路径
- 未完成内容不上线
- 不允许用占位章节伪装课程完整度

## Scope

### Must Ship In V1

- 多用户认证：邮箱 + 密码
- 登录后恢复最近学习位置
- App-First 应用入口
- Premium Hybrid 视觉系统
- Balanced Three-Pane 工作台
- Monaco 级编辑器体验
- Python runner 正式接入
- 右键学习动作系统
- DeepSeek 驱动的持续型 AI 专家
- 自动保存 / 草稿恢复 / 最近学习现场恢复
- 至少一条完整 Python 主路径内容

### Explicitly Deferred

- 多语言编译器
- 内容后台
- 多人协作编辑
- 支付 / 订阅
- 浏览器内 Python 作为主执行环境
- 首版移动端达到桌面同级编辑器体验

## Definition Of Done

首版完成，不是页面好看，而是用户能完整走通以下闭环：

1. 注册 / 登录
2. 进入应用并恢复到最近学习位置
3. 打开 Python 章节
4. 查看知识点与可视化
5. 从示例、框架模板或空白模板开始写代码
6. 运行代码并看到变量态与输出
7. 通过右键菜单触发解释 / 查错 / 生成练习 / 记录笔记
8. 在右侧 AI 专家会话中继续追问
9. 退出后再次回来时恢复到上次学习现场

## Implementation Guidance

建议不要继续在现有 demo 页面上局部修补，而是在现有技术栈上重建正式学员端产品骨架：

- 保留 Next.js / FastAPI / Python runner
- 重建学员端应用壳层、信息架构和页面结构
- 把认证、多用户数据、AI service、工作台状态作为正式产品模块实现

这条路径最适合当前目标：

- 不浪费现有基础
- 也不继续背着 demo 结构前进
- 可以较快得到真正可用的第一版产品
