# Spreadsheet Plugins Implementation Plan

> **For agentic workers:** Execute task-by-task. Checkboxes track progress.

**Goal:** Restructure `@mockmatch/spreadsheet` around a whiteboard-style plugin system without changing product UX.

**Architecture:** `plugin-system/` + `plugins/*` + thin grid/shell. Host gets `dispatch` + controlled selection/draft. Rich text deferred.

**Tech Stack:** React 19, TypeScript, HyperFormula, Vitest, existing `@mockmatch/ui`.

## Global Constraints

- No rich-text cells in this work
- Behavior-preserving for `/simulations/spreadsheet`
- Mirror whiteboard: `createDefaultPlugins()`, omit plugins → default, `[]` → bare
- Caveman chat; normal English in code/commits

## Tasks

### Task 1: Plugin system core
- Create types, runners, command type, tests for sort/keydown

### Task 2: Default plugins
- selection, keyboard, cell-edit, resize, formula-bar, sheet-tabs, clipboard

### Task 3: Wire shell + grid
- Thin shell chrome slots; grid pointer/key pipeline

### Task 4: useSpreadsheet.dispatch + host migrate

### Task 5: Exports, README, unit tests green
