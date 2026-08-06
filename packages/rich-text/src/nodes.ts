import { HeadingNode } from "@lexical/rich-text"
import { ListItemNode, ListNode } from "@lexical/list"
import { LinkNode, AutoLinkNode } from "@lexical/link"
import type { Klass, LexicalNode } from "lexical"

/** Nodes required for formatting features in this package. */
export const RICH_TEXT_NODES: Array<Klass<LexicalNode>> = [
  HeadingNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
]
