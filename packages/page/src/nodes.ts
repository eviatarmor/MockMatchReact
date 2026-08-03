import { CodeNode } from "@lexical/code"
import { LinkNode, AutoLinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode"

/** Nodes for a near-Docs freeform page. */
export const PAGE_EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  HorizontalRuleNode,
]
