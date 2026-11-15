"use client";

import { useEffect, useRef, type Ref } from "react";
import { autocompletion, completionKeymap, snippetCompletion, type CompletionContext } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  placeholder as placeholderExt,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * CodeMirror 6 source editor for MDX (PLAN.md 2.8). It edits the actual file
 * text, so nothing is lost in a round trip. Styled with the site's CSS
 * variables, so it follows the light/dark theme without a second theme.
 */

export interface CodeEditorHandle {
  /** Insert text at `pos` (default: the cursor), replacing the selection there. */
  insert(text: string, pos?: number): void;
  focus(): void;
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  /** Image files pasted or dropped at `pos`. */
  onImages?: (files: File[], pos: number) => void;
  ref?: Ref<CodeEditorHandle>;
  className?: string;
  ariaLabel?: string;
}

const theme = EditorView.theme({
  "&": { color: "hsl(var(--foreground))", backgroundColor: "transparent", fontSize: "14px", height: "100%" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-geist-mono), ui-monospace, monospace", lineHeight: "1.7" },
  ".cm-content": { padding: "16px 0", caretColor: "hsl(var(--primary))" },
  ".cm-line": { padding: "0 16px" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "hsl(var(--primary))", borderLeftWidth: "2px" },
  ".cm-activeLine": { backgroundColor: "color-mix(in oklab, hsl(var(--muted)) 45%, transparent)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in oklab, hsl(var(--primary)) 25%, transparent) !important",
  },
  ".cm-selectionMatch": { backgroundColor: "color-mix(in oklab, hsl(var(--primary)) 12%, transparent)" },
  ".cm-placeholder": { color: "hsl(var(--muted-foreground))" },
  ".cm-tooltip": {
    border: "1px solid hsl(var(--border))",
    backgroundColor: "hsl(var(--popover))",
    color: "hsl(var(--popover-foreground))",
    borderRadius: "10px",
    overflow: "hidden",
  },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "color-mix(in oklab, hsl(var(--primary)) 18%, transparent)",
    color: "hsl(var(--foreground))",
  },
  ".cm-panels": { backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" },
  ".cm-panels input, .cm-panels button": { color: "inherit" },
});

const highlight = HighlightStyle.define([
  { tag: tags.heading, fontWeight: "700", color: "hsl(var(--foreground))" },
  { tag: tags.heading1, fontSize: "1.25em" },
  { tag: tags.heading2, fontSize: "1.15em" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: [tags.link, tags.url], color: "hsl(var(--primary))" },
  { tag: [tags.processingInstruction, tags.contentSeparator, tags.meta], color: "hsl(var(--muted-foreground))" },
  { tag: tags.monospace, color: "oklch(0.6 0.15 30)" },
  { tag: [tags.quote], color: "hsl(var(--muted-foreground))", fontStyle: "italic" },
  { tag: [tags.keyword, tags.tagName, tags.angleBracket], color: "oklch(0.6 0.17 300)" },
  { tag: [tags.attributeName, tags.propertyName], color: "oklch(0.62 0.13 230)" },
  { tag: [tags.string, tags.attributeValue], color: "oklch(0.6 0.14 150)" },
  { tag: [tags.number, tags.bool, tags.atom], color: "oklch(0.65 0.15 60)" },
  { tag: tags.comment, color: "hsl(var(--muted-foreground))", fontStyle: "italic" },
  { tag: [tags.function(tags.variableName), tags.typeName, tags.className], color: "oklch(0.62 0.13 230)" },
]);

/** "/" at the start of a line opens snippets for the allowlisted MDX components and common blocks. */
const SNIPPETS = [
  snippetCompletion('<Img src="#{content/…}" width={#{1600}} height={#{900}} alt="#{}" />', {
    label: "/image",
    detail: "<Img> from R2",
  }),
  snippetCompletion('<Img src="#{content/…}" width={#{1600}} height={#{900}} alt="#{}" caption="#{}" />', {
    label: "/figure",
    detail: "<Img> with caption",
  }),
  snippetCompletion("## #{Heading}", { label: "/h2", detail: "Section heading" }),
  snippetCompletion("### #{Heading}", { label: "/h3", detail: "Subsection heading" }),
  snippetCompletion("```#{ts}\n#{}\n```", { label: "/code", detail: "Code block" }),
  snippetCompletion("> #{Quote}", { label: "/quote", detail: "Blockquote" }),
  snippetCompletion("| #{Column} | #{Column} |\n| --- | --- |\n| #{} | #{} |", { label: "/table", detail: "Table" }),
  snippetCompletion("[#{text}](#{https://})", { label: "/link", detail: "Link" }),
  snippetCompletion("- #{}", { label: "/list", detail: "Bulleted list" }),
  snippetCompletion("---\n\n#{}", { label: "/divider", detail: "Horizontal rule" }),
];

function slashCompletions(context: CompletionContext) {
  const word = context.matchBefore(/^\s*\/[a-z0-9]*$/);
  if (!word) return null;
  const from = word.from + word.text.indexOf("/");
  return { from, options: SNIPPETS, validFor: /^\/[a-z0-9]*$/ };
}

function imageFiles(list: FileList | null | undefined): File[] {
  return [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
}

export default function CodeEditor({
  value,
  onChange,
  readOnly = false,
  placeholder,
  onImages,
  ref,
  className,
  ariaLabel,
}: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const readOnlyCompartment = useRef(new Compartment());
  // Latest callbacks, so the editor is created once and never re-created on render.
  const callbacks = useRef({ onChange, onImages });
  useEffect(() => {
    callbacks.current = { onChange, onImages };
  });

  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          drawSelection(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          EditorView.lineWrapping,
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          syntaxHighlighting(highlight),
          autocompletion({ override: [slashCompletions], icons: false }),
          keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
          placeholderExt(placeholder ?? ""),
          theme,
          readOnlyCompartment.current.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
          EditorView.contentAttributes.of({ "aria-label": ariaLabel ?? "", spellcheck: "true" }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange?.(update.state.doc.toString());
          }),
          EditorView.domEventHandlers({
            paste(event, v) {
              const files = imageFiles(event.clipboardData?.files);
              if (!files.length || !callbacks.current.onImages) return false;
              event.preventDefault();
              callbacks.current.onImages(files, v.state.selection.main.head);
              return true;
            },
            drop(event, v) {
              const files = imageFiles(event.dataTransfer?.files);
              if (!files.length || !callbacks.current.onImages) return false;
              event.preventDefault();
              const pos = v.posAtCoords({ x: event.clientX, y: event.clientY }) ?? v.state.selection.main.head;
              callbacks.current.onImages(files, pos);
              return true;
            },
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // Created once; value and readOnly changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outside changes (restore from history, recovered draft) replace the text.
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({
      effects: readOnlyCompartment.current.reconfigure([
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
      ]),
    });
  }, [readOnly]);

  useEffect(() => {
    if (!ref) return;
    const handle: CodeEditorHandle = {
      insert(text, pos) {
        const editor = view.current;
        if (!editor) return;
        const range = pos === undefined ? editor.state.selection.main : { from: pos, to: pos };
        const at = Math.min(range.from, editor.state.doc.length);
        editor.dispatch({
          changes: { from: at, to: Math.min(range.to, editor.state.doc.length), insert: text },
          selection: { anchor: at + text.length },
        });
        editor.focus();
      },
      focus: () => view.current?.focus(),
    };
    if (typeof ref === "function") return ref(handle) ?? undefined;
    ref.current = handle;
    return () => {
      ref.current = null;
    };
  }, [ref]);

  return <div ref={host} className={className} />;
}
