"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import type { ApiRunCodeResponse } from "../../../packages/shared-types/src";
import { formatProgressStatusLabel } from "./learner-progress";
import {
  buildAiCoachQuestion,
  buildStudioTemplates,
  getVisualizationFramesForWorkspace,
  toggleCompletedStep,
} from "../lib/studio-workspace";

type WorkspaceLesson = {
  pathId: string;
  pathTitle: string;
  unit: {
    slug: string;
    title: string;
    learningGoal: string;
    conceptExplanation: string;
    prerequisites: string[];
    exampleCode: string;
    practiceTasks: Array<{
      id: string;
      title: string;
      kind: "guided" | "transfer";
      prompt: string;
      expectedOutcome: string;
      hints: string[];
    }>;
    visualization: {
      kind: string;
      frames: Array<{
        step: number;
        lineNumber: number;
        focus: string;
        variables: Record<string, string>;
      }>;
    };
    aiExplanationContext: string;
    acceptanceCriteria: string[];
  };
  progress: {
    status: "not_started" | "in_progress" | "completed";
    completedStepIds: string[];
    codeDraft: string | null;
    notes: string | null;
  };
  runResult: ApiRunCodeResponse;
  aiResponse: {
    mode: "explain" | "code-map" | "exercise-coach" | "paper-tutor";
    explanation: string;
    selectedText: string | null;
  };
};

type PathProgressUnit = {
  unitSlug: string;
  unitTitle: string;
  status: "not_started" | "in_progress" | "completed";
  lessonHref: string;
  studioHref: string;
};

type PathProgress = {
  pathId: string;
  pathTitle: string;
  totalUnits: number;
  completedUnits: number;
  completionPercent: number;
  units: PathProgressUnit[];
} | null;

type AssistantMessage = {
  id: string;
  role: "assistant" | "user";
  body: string;
  snippet?: string;
};

type ContextMenuState = {
  x: number;
  y: number;
  selectedText: string;
} | null;

type StudioWorkspaceProps = {
  lesson: WorkspaceLesson;
  studioPathProgress: PathProgress;
};

function createAssistantWelcomeMessage(lesson: WorkspaceLesson): AssistantMessage {
  return {
    id: "assistant-welcome",
    role: "assistant",
    body: lesson.aiResponse.explanation,
    snippet: lesson.aiResponse.selectedText ?? undefined,
  };
}

function getProgressStatus(
  completedStepIds: string[],
  practiceTaskCount: number,
): WorkspaceLesson["progress"]["status"] {
  if (practiceTaskCount > 0 && completedStepIds.length >= practiceTaskCount) {
    return "completed";
  }

  return completedStepIds.length > 0 ? "in_progress" : "not_started";
}

function getNoticeSeverity(tone: "info" | "success" | "error") {
  if (tone === "success") {
    return "success";
  }
  if (tone === "error") {
    return "error";
  }
  return "info";
}

export function StudioWorkspace({ lesson, studioPathProgress }: StudioWorkspaceProps) {
  const [editorCode, setEditorCode] = useState(lesson.progress.codeDraft ?? lesson.unit.exampleCode);
  const [stdin, setStdin] = useState("");
  const [runResult, setRunResult] = useState(lesson.runResult);
  const [progress, setProgress] = useState(lesson.progress);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    createAssistantWelcomeMessage(lesson),
  ]);
  const [assistantInput, setAssistantInput] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string>("lesson-example");
  const [activeFrameStep, setActiveFrameStep] = useState<number | null>(null);
  const [activeTemplateTab, setActiveTemplateTab] = useState(0);
  const [runPending, setRunPending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [assistantPending, setAssistantPending] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState<{
    tone: "info" | "success" | "error";
    text: string;
  } | null>(null);

  const templates = useMemo(() => buildStudioTemplates({
    title: lesson.unit.title,
    exampleCode: lesson.unit.exampleCode,
    practiceTasks: lesson.unit.practiceTasks,
  }), [lesson.unit.exampleCode, lesson.unit.practiceTasks, lesson.unit.title]);

  const visualizationFrames = useMemo(() => getVisualizationFramesForWorkspace({
    runtimeStates: runResult.variable_states.map((state) => ({
      step: state.step,
      lineNumber: state.line_number,
      variables: state.variables,
    })),
    lessonFrames: lesson.unit.visualization.frames,
  }), [lesson.unit.visualization.frames, runResult.variable_states]);

  const activeFrame = visualizationFrames.find((frame) => frame.step === activeFrameStep)
    ?? visualizationFrames[visualizationFrames.length - 1]
    ?? null;
  const selectedSnippet = contextMenu?.selectedText ?? selectedText.trim();

  useEffect(() => {
    setActiveFrameStep(visualizationFrames[visualizationFrames.length - 1]?.step ?? null);
  }, [lesson.unit.slug, runResult.job_id, visualizationFrames]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  async function saveProgress(nextCompletedStepIds: string[], nextStatus: WorkspaceLesson["progress"]["status"]) {
    const response = await fetch("/api/studio/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unitSlug: lesson.unit.slug,
        codeDraft: editorCode,
        completedStepIds: nextCompletedStepIds,
        notes: progress.notes,
        status: nextStatus,
      }),
    });

    const payload = await response.json() as {
      detail?: string;
      progress?: WorkspaceLesson["progress"];
    };

    if (!response.ok || !payload.progress) {
      throw new Error(payload.detail ?? "保存进度失败。");
    }

    setProgress(payload.progress);
  }

  async function handleRunCode() {
    setRunPending(true);
    setWorkspaceNotice({
      tone: "info",
      text: "正在运行 Python 代码…",
    });

    try {
      const nextStatus = getProgressStatus(progress.completedStepIds, lesson.unit.practiceTasks.length);
      const response = await fetch("/api/studio/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unitSlug: lesson.unit.slug,
          sourceCode: editorCode,
          stdin,
          completedStepIds: progress.completedStepIds,
          notes: progress.notes,
          status: nextStatus === "not_started" ? "in_progress" : nextStatus,
        }),
      });

      const payload = await response.json() as {
        detail?: string;
        runResult?: ApiRunCodeResponse;
        progress?: WorkspaceLesson["progress"];
      };

      if (!response.ok || !payload.runResult || !payload.progress) {
        throw new Error(payload.detail ?? "运行失败。");
      }

      setRunResult(payload.runResult);
      setProgress(payload.progress);
      setWorkspaceNotice({
        tone: payload.runResult.exit_status === "completed" ? "success" : "error",
        text: payload.runResult.exit_status === "completed" ? "运行完成。" : "代码运行返回错误，请查看输出。",
      });
    } catch (error) {
      setWorkspaceNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "运行失败。",
      });
    } finally {
      setRunPending(false);
    }
  }

  async function handleSaveDraft() {
    setSavePending(true);
    setWorkspaceNotice({
      tone: "info",
      text: "正在保存草稿…",
    });

    try {
      await saveProgress(
        progress.completedStepIds,
        getProgressStatus(progress.completedStepIds, lesson.unit.practiceTasks.length),
      );
      setWorkspaceNotice({
        tone: "success",
        text: "草稿已保存。",
      });
    } catch (error) {
      setWorkspaceNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "保存失败。",
      });
    } finally {
      setSavePending(false);
    }
  }

  async function askAssistant(question: string, snippet = "") {
    const normalizedQuestion = buildAiCoachQuestion({
      selectedText: snippet,
      question,
      unitTitle: lesson.unit.title,
    });

    setAssistantPending(true);
    setAssistantMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        body: normalizedQuestion,
        snippet: snippet || undefined,
      },
    ]);

    try {
      const response = await fetch("/api/studio/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: lesson.aiResponse.mode,
          question: normalizedQuestion,
          code: editorCode,
          selectedText: snippet || undefined,
          context: lesson.unit.aiExplanationContext,
        }),
      });
      const payload = await response.json() as {
        detail?: string;
        aiResponse?: WorkspaceLesson["aiResponse"];
      };

      if (!response.ok || !payload.aiResponse) {
        throw new Error(payload.detail ?? "AI 助教暂时不可用。");
      }

      const aiResponse = payload.aiResponse;
      setAssistantMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          body: aiResponse.explanation,
          snippet: aiResponse.selectedText ?? undefined,
        },
      ]);
      setAssistantInput("");
      setWorkspaceNotice({
        tone: "success",
        text: "AI 助教已返回解释。",
      });
    } catch (error) {
      setAssistantMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          body: error instanceof Error ? error.message : "AI 助教暂时不可用。",
        },
      ]);
      setWorkspaceNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "AI 助教暂时不可用。",
      });
    } finally {
      setAssistantPending(false);
      setContextMenu(null);
    }
  }

  return (
    <Box
      className="page-shell"
      sx={{
        pt: 0,
        width: "min(1720px, calc(100% - 24px))",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: 2,
          alignItems: "start",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "280px minmax(0, 1fr) 360px",
          },
        }}
      >
        <Stack spacing={2}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.18em" }}>
              Chapters
            </Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>{lesson.pathTitle}</Typography>
            <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary", lineHeight: 1.8 }}>
              {lesson.unit.learningGoal}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
              <Chip label={formatProgressStatusLabel(progress.status)} color="primary" variant="outlined" />
              {studioPathProgress ? (
                <Chip
                  label={`路径完成 ${studioPathProgress.completedUnits}/${studioPathProgress.totalUnits}`}
                  variant="outlined"
                />
              ) : null}
            </Stack>
          </Paper>

          <Paper sx={{ p: 1.25 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, pb: 1 }}>
              <Typography variant="h6">章节选择</Typography>
              {studioPathProgress ? (
                <Chip label={`${studioPathProgress.completionPercent}%`} size="small" variant="outlined" />
              ) : null}
            </Stack>
            <List disablePadding>
              {studioPathProgress?.units.map((unit) => (
                <ListItemButton
                  key={unit.unitSlug}
                  component={Link}
                  href={unit.studioHref as Route}
                  selected={unit.unitSlug === lesson.unit.slug}
                  sx={{ borderRadius: 2, mb: 0.75 }}
                >
                  <ListItemText
                    primary={unit.unitTitle}
                    secondary={formatProgressStatusLabel(unit.status)}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">知识要点</Typography>
              <Button component={Link} href={`/learn/${lesson.pathId}/${lesson.unit.slug}` as Route} size="small">
                Lesson
              </Button>
            </Stack>
            <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary", lineHeight: 1.8 }}>
              {lesson.unit.conceptExplanation}
            </Typography>
            {lesson.unit.prerequisites.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                {lesson.unit.prerequisites.map((item) => (
                  <Chip key={item} label={item} size="small" variant="outlined" />
                ))}
              </Stack>
            ) : null}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">学习目标</Typography>
            <Stack spacing={1} sx={{ mt: 1.25 }}>
              {lesson.unit.acceptanceCriteria.map((criterion) => (
                <Typography key={criterion} variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                  {criterion}
                </Typography>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">练习清单</Typography>
              <Chip
                label={`${progress.completedStepIds.length}/${lesson.unit.practiceTasks.length}`}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              {lesson.unit.practiceTasks.map((task) => {
                const checked = progress.completedStepIds.includes(task.id);
                return (
                  <Card key={task.id} variant="outlined">
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Checkbox
                          checked={checked}
                          onChange={async (event) => {
                            const nextCompletedStepIds = toggleCompletedStep(
                              progress.completedStepIds,
                              task.id,
                              event.currentTarget.checked,
                            );
                            const nextStatus = getProgressStatus(nextCompletedStepIds, lesson.unit.practiceTasks.length);
                            setProgress((current) => ({
                              ...current,
                              status: nextStatus,
                              completedStepIds: nextCompletedStepIds,
                            }));

                            try {
                              await saveProgress(nextCompletedStepIds, nextStatus);
                            } catch (error) {
                              setWorkspaceNotice({
                                tone: "error",
                                text: error instanceof Error ? error.message : "保存练习进度失败。",
                              });
                            }
                          }}
                          sx={{ mt: -0.5 }}
                        />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {task.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                            {task.prompt}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={2}>
          <Paper sx={{ p: 2.5 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.18em" }}>
                  Visualization
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5 }}>{lesson.unit.title}</Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip
                  label={activeFrame?.source === "runtime" ? "运行态可视化" : "课程态可视化"}
                  color="primary"
                  variant="outlined"
                />
                <Chip label={lesson.unit.visualization.kind} variant="outlined" />
              </Stack>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                mt: 2,
                gridTemplateColumns: { xs: "1fr", lg: "320px minmax(0, 1fr)" },
              }}
            >
              <Stack spacing={1}>
                {visualizationFrames.map((frame) => (
                  <Button
                    key={`${frame.source}-${frame.step}-${frame.lineNumber}`}
                    onClick={() => setActiveFrameStep(frame.step)}
                    variant={frame.step === activeFrame?.step ? "contained" : "outlined"}
                    color={frame.step === activeFrame?.step ? "primary" : "inherit"}
                    sx={{
                      justifyContent: "flex-start",
                      p: 1.5,
                      borderRadius: 2,
                      textAlign: "left",
                      textTransform: "none",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.72 }}>
                        Step {frame.step}
                      </Typography>
                      <Typography variant="subtitle2">Line {frame.lineNumber}</Typography>
                      <Typography variant="body2" sx={{ color: "inherit", opacity: 0.84 }}>
                        {frame.focus}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Stack>

              <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "rgba(255,255,255,0.03)" }}>
                {activeFrame ? (
                  <>
                    <Typography variant="caption" sx={{ color: "primary.main" }}>
                      Line {activeFrame.lineNumber}
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1 }}>{activeFrame.focus}</Typography>
                    <Stack spacing={1.25} sx={{ mt: 2 }}>
                      {Object.entries(activeFrame.variables).length > 0 ? (
                        Object.entries(activeFrame.variables).map(([name, value]) => (
                          <Paper
                            key={name}
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              bgcolor: "rgba(255,255,255,0.02)",
                            }}
                          >
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                              {name}
                            </Typography>
                            <Typography
                              component="code"
                              variant="body2"
                              sx={{ fontFamily: "var(--font-mono), monospace" }}
                            >
                              {value}
                            </Typography>
                          </Paper>
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          这一步还没有显式变量值。
                        </Typography>
                      )}
                    </Stack>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    运行代码后，这里会显示变量变化。
                  </Typography>
                )}
              </Paper>
            </Box>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.6fr) 320px" },
            }}
          >
            <Paper sx={{ p: 2.5 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button onClick={handleRunCode} variant="contained" disabled={runPending}>
                    {runPending ? "运行中…" : "运行代码"}
                  </Button>
                  <Button onClick={handleSaveDraft} variant="outlined" disabled={savePending}>
                    {savePending ? "保存中…" : "保存草稿"}
                  </Button>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const blankTemplate = templates[0];
                      setEditorCode(blankTemplate.code);
                      setActiveTemplateId(blankTemplate.id);
                      setActiveTemplateTab(0);
                    }}
                  >
                    从 0 开始
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditorCode(lesson.unit.exampleCode);
                      setActiveTemplateId("lesson-example");
                    }}
                  >
                    课程示例
                  </Button>
                </Stack>
              </Stack>

              {workspaceNotice ? (
                <Alert severity={getNoticeSeverity(workspaceNotice.tone)} sx={{ mt: 2 }}>
                  {workspaceNotice.text}
                </Alert>
              ) : null}

              <Box sx={{ position: "relative", mt: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={18}
                  maxRows={28}
                  value={editorCode}
                  onChange={(event) => setEditorCode(event.currentTarget.value)}
                  onContextMenu={(event) => {
                    const textarea = event.currentTarget;
                    const snippet = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).trim();
                    if (!snippet) {
                      setContextMenu(null);
                      return;
                    }

                    event.preventDefault();
                    setContextMenu({
                      x: event.clientX,
                      y: event.clientY,
                      selectedText: snippet,
                    });
                  }}
                  onSelect={(event) => {
                    const textarea = event.currentTarget;
                    setSelectedText(
                      textarea.value.slice(textarea.selectionStart, textarea.selectionEnd),
                    );
                  }}
                  spellCheck={false}
                  sx={{
                    "& textarea": {
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 14,
                      lineHeight: 1.75,
                    },
                  }}
                />
                {contextMenu ? (
                  <Button
                    onClick={() => askAssistant("", contextMenu.selectedText)}
                    variant="contained"
                    color="secondary"
                    size="small"
                    sx={{
                      position: "fixed",
                      left: contextMenu.x + 8,
                      top: contextMenu.y + 8,
                      zIndex: 30,
                    }}
                  >
                    让 AI 专家解释选中代码
                  </Button>
                ) : null}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  mt: 2,
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                }}
              >
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1">stdout</Typography>
                    <Chip label={runResult.exit_status} size="small" variant="outlined" />
                  </Stack>
                  <Box
                    component="pre"
                    sx={{
                      mt: 1.5,
                      mb: 0,
                      minHeight: 120,
                      whiteSpace: "pre-wrap",
                      fontFamily: "var(--font-mono), monospace",
                      color: "#dff7ff",
                    }}
                  >
                    {runResult.stdout || "(no stdout)"}
                  </Box>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1">stderr</Typography>
                    <Chip label={`${runResult.duration_ms}ms`} size="small" variant="outlined" />
                  </Stack>
                  <Box
                    component="pre"
                    sx={{
                      mt: 1.5,
                      mb: 0,
                      minHeight: 120,
                      whiteSpace: "pre-wrap",
                      fontFamily: "var(--font-mono), monospace",
                      color: "#ffc2cf",
                    }}
                  >
                    {runResult.stderr || "(no stderr)"}
                  </Box>
                </Paper>
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="stdin（可选）"
                onChange={(event) => setStdin(event.currentTarget.value)}
                placeholder="如果你的代码需要输入，就在这里填。"
                sx={{ mt: 2 }}
                value={stdin}
              />
            </Paper>

            <Paper sx={{ p: 0, overflow: "hidden" }}>
              <Tabs
                value={activeTemplateTab}
                onChange={(_, nextValue) => setActiveTemplateTab(nextValue)}
                variant="scrollable"
                scrollButtons={false}
              >
                <Tab label="模板" />
                <Tab label="练习" />
              </Tabs>
              <Box sx={{ p: 2 }}>
                <Stack spacing={1.25}>
                  {templates
                    .filter((template) => (activeTemplateTab === 0 ? true : template.id.startsWith("task-")))
                    .map((template) => (
                      <Card
                        key={template.id}
                        variant="outlined"
                        sx={{
                          borderColor: template.id === activeTemplateId ? "primary.main" : undefined,
                        }}
                      >
                        <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {template.title}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", lineHeight: 1.7 }}>
                            {template.description}
                          </Typography>
                          <Button
                            sx={{ mt: 1.5 }}
                            variant={template.id === activeTemplateId ? "contained" : "outlined"}
                            onClick={() => {
                              setEditorCode(template.code);
                              setActiveTemplateId(template.id);
                            }}
                          >
                            载入
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </Stack>
              </Box>
            </Paper>
          </Box>
        </Stack>

        <Paper sx={{ p: 2.5, height: "fit-content", position: { lg: "sticky" }, top: 18 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.18em" }}>
                AI Coach
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5 }}>
                AI 智能学习专家
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              disabled={assistantPending || !selectedSnippet}
              onClick={() => askAssistant("", selectedSnippet)}
            >
              解释选中代码
            </Button>
          </Stack>

          {selectedSnippet ? (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: "rgba(249,168,212,0.06)" }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                当前选中代码
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  mb: 0,
                  whiteSpace: "pre-wrap",
                  fontFamily: "var(--font-mono), monospace",
                  color: "#dff7ff",
                }}
              >
                {selectedSnippet}
              </Box>
            </Paper>
          ) : (
            <Typography variant="body2" sx={{ mt: 2, color: "text.secondary", lineHeight: 1.8 }}>
              在编辑器里选中代码后右键，或者直接点击右上角按钮，让 AI 专家解释。
            </Typography>
          )}

          <Stack spacing={1.25} sx={{ mt: 2, maxHeight: 520, overflowY: "auto" }}>
            {assistantMessages.map((message) => (
              <Paper
                key={message.id}
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: message.role === "assistant" ? "rgba(125,211,252,0.06)" : "rgba(255,255,255,0.03)",
                }}
              >
                <Typography variant="subtitle2">
                  {message.role === "assistant" ? "AI 专家" : "你"}
                </Typography>
                {message.snippet ? (
                  <Box
                    component="pre"
                    sx={{
                      mt: 1,
                      mb: 0,
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: "rgba(3,9,20,0.72)",
                      whiteSpace: "pre-wrap",
                      fontFamily: "var(--font-mono), monospace",
                      color: "#dff7ff",
                    }}
                  >
                    {message.snippet}
                  </Box>
                ) : null}
                <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", lineHeight: 1.8 }}>
                  {message.body}
                </Typography>
              </Paper>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              disabled={assistantPending}
              onClick={() => askAssistant("请根据我当前代码给一个最小可行提示。")}
            >
              给我提示
            </Button>
            <Button
              variant="outlined"
              disabled={assistantPending}
              onClick={() => askAssistant("请帮我检查当前代码里最可能出错的地方。")}
            >
              帮我查错
            </Button>
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="直接提问"
            onChange={(event) => setAssistantInput(event.currentTarget.value)}
            placeholder="比如：为什么这里要先定义变量？"
            sx={{ mt: 2 }}
            value={assistantInput}
          />
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            disabled={assistantPending}
            onClick={() => askAssistant(assistantInput)}
            sx={{ mt: 1.5 }}
          >
            {assistantPending ? "回答中…" : "发送给 AI 专家"}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
