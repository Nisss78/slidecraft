// postMessage protocol between parent editor and slide iframe

// ── Parent → Iframe ──

export type FormatCommandName =
  | 'bold' | 'italic' | 'underline' | 'strikeThrough'
  | 'justifyLeft' | 'justifyCenter' | 'justifyRight' | 'justifyFull'
  | 'insertOrderedList' | 'insertUnorderedList';

export interface FormatCommandMessage {
  type: 'format-command';
  command: FormatCommandName;
}

export interface BlockTypeMessage {
  type: 'block-type';
  tag: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export interface FontFamilyMessage {
  type: 'font-family';
  family: string;
}

export interface FontSizeMessage {
  type: 'font-size';
  size: string; // e.g. "16px"
}

export interface ForeColorMessage {
  type: 'fore-color';
  color: string;
}

export interface BackColorMessage {
  type: 'back-color';
  color: string;
}

export interface ClearFormattingMessage {
  type: 'clear-formatting';
}

export interface UndoMessage {
  type: 'undo';
}

export interface RedoMessage {
  type: 'redo';
}

export interface InsertLinkMessage {
  type: 'insert-link';
  url: string;
  text?: string;
}

export interface InsertImageMessage {
  type: 'insert-image';
  src: string;
  alt?: string;
}

export interface GetHtmlMessage {
  type: 'get-html';
}

export interface RestoreSelectionMessage {
  type: 'restore-selection';
}

export type ParentToIframeMessage =
  | FormatCommandMessage
  | BlockTypeMessage
  | FontFamilyMessage
  | FontSizeMessage
  | ForeColorMessage
  | BackColorMessage
  | ClearFormattingMessage
  | UndoMessage
  | RedoMessage
  | InsertLinkMessage
  | InsertImageMessage
  | GetHtmlMessage
  | RestoreSelectionMessage;

// ── Iframe → Parent ──

export interface EditorReadyMessage {
  type: 'editor-ready';
}

export interface SelectionState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fontFamily: string;
  fontSize: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  foreColor: string;
  backColor: string;
  blockType: string;
  orderedList: boolean;
  unorderedList: boolean;
  undoAvailable: boolean;
  redoAvailable: boolean;
}

export interface SelectionChangeMessage {
  type: 'selection-change';
  selection: SelectionState;
}

export interface ContentChangeMessage {
  type: 'content-change';
  html: string; // body innerHTML
}

export interface HtmlResponseMessage {
  type: 'html-response';
  html: string; // full HTML document (clean)
}

export interface BlockSelectMessage {
  type: 'block-select';
  blockIndex: number;
  blockTag: string;
  hasText: boolean;
}

export interface BlockEditStartMessage {
  type: 'block-edit-start';
  blockIndex: number;
}

export interface BlockEditEndMessage {
  type: 'block-edit-end';
}

export type IframeToParentMessage =
  | EditorReadyMessage
  | SelectionChangeMessage
  | ContentChangeMessage
  | HtmlResponseMessage
  | BlockSelectMessage
  | BlockEditStartMessage
  | BlockEditEndMessage;
