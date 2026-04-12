"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

const LANGUAGE_LABELS: Record<string, string> = {
  plaintext: "Plain text",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  bash: "Shell",
  shell: "Shell",
  go: "Go",
  rust: "Rust",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
  html: "HTML",
  xml: "XML",
  json: "JSON",
  yaml: "YAML",
  markdown: "Markdown",
  sql: "SQL",
  php: "PHP",
  ruby: "Ruby",
  r: "R",
  lua: "Lua",
  perl: "Perl",
  graphql: "GraphQL",
  diff: "Diff",
  makefile: "Makefile",
  objectivec: "Objective-C",
};

const labelFor = (lang: string) => LANGUAGE_LABELS[lang] ?? lang;

export function CodeBlock({ node, updateAttributes, extension }: NodeViewProps) {
  const [copied, setCopied] = useState(false);

  const lowlight = extension.options.lowlight;
  const supported: string[] = (lowlight?.listLanguages?.() ?? []) as string[];
  const sorted = [...supported].sort((a, b) => labelFor(a).localeCompare(labelFor(b)));
  const current: string = node.attrs.language ?? "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <NodeViewWrapper as="div" className="lumen-codeblock">
      <Box
        contentEditable={false}
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.25,
          py: 0.5,
          borderBottom: "1px solid #D0D7DE",
          backgroundColor: "#EFF2F5",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
          ...theme.applyStyles("dark", {
            borderColor: "#30363D",
            backgroundColor: "#161B22",
          }),
        })}
      >
        <Select
          value={sorted.includes(current) ? current : ""}
          displayEmpty
          variant="standard"
          disableUnderline
          onChange={(e) => updateAttributes({ language: e.target.value || null })}
          sx={(theme) => ({
            fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Code', Menlo, monospace",
            fontSize: "0.72rem",
            fontWeight: 500,
            color: "#57606A",
            height: 24,
            "& .MuiSelect-select": {
              py: 0,
              pl: 0.75,
              pr: 2.5,
              minHeight: "unset",
              backgroundColor: "transparent",
            },
            "& .MuiSvgIcon-root": { color: "#57606A", right: 0, fontSize: 15 },
            "&:hover": { color: "#1F2328" },
            ...theme.applyStyles("dark", {
              color: "#8B949E",
              "& .MuiSvgIcon-root": { color: "#8B949E" },
              "&:hover": { color: "#E6EDF3" },
            }),
          })}
          MenuProps={{
            slotProps: {
              paper: {
                sx: {
                  maxHeight: 320,
                  borderRadius: "8px",
                  mt: 0.5,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                },
              },
            },
          }}
        >
          <MenuItem value="" sx={{ fontSize: "0.78rem" }}>
            <Typography sx={{ fontSize: "0.78rem", fontStyle: "italic", color: "text.secondary" }}>
              Auto-detect
            </Typography>
          </MenuItem>
          {sorted.map((lang) => (
            <MenuItem key={lang} value={lang} sx={{ fontSize: "0.78rem" }}>
              {labelFor(lang)}
            </MenuItem>
          ))}
        </Select>
        <Tooltip title={copied ? "Copied" : "Copy"}>
          <IconButton
            onClick={handleCopy}
            size="small"
            sx={(theme) => ({
              width: 24,
              height: 24,
              color: "#57606A",
              "&:hover": { backgroundColor: "rgba(175, 184, 193, 0.2)", color: "#1F2328" },
              ...theme.applyStyles("dark", {
                color: "#8B949E",
                "&:hover": { backgroundColor: "rgba(177, 186, 196, 0.12)", color: "#E6EDF3" },
              }),
            })}
          >
            {copied ? <CheckRoundedIcon sx={{ fontSize: 13 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
          </IconButton>
        </Tooltip>
      </Box>
      <pre>
        <NodeViewContent />
      </pre>
    </NodeViewWrapper>
  );
}
