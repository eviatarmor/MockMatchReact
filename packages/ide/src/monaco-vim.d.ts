declare module "monaco-vim" {
  import type { editor } from "monaco-editor"

  export function initVimMode(
    editor: editor.IStandaloneCodeEditor,
    statusNode?: HTMLElement | null
  ): { dispose: () => void }

  const monacoVim: {
    initVimMode: typeof initVimMode
  }

  export default monacoVim
}
