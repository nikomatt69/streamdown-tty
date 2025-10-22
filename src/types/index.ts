import { Widgets } from 'blessed';
import type { TTYPluggableList } from './plugin-types';

export interface StreamttyOptions {
  /**
   * Parse and style unterminated Markdown blocks
   */
  parseIncompleteMarkdown?: boolean;

  /**
   * Custom style overrides for different markdown elements
   */
  styles?: Partial<MarkdownStyles>;

  /**
   * Enable syntax highlighting for code blocks
   */
  syntaxHighlight?: boolean;

  /**
   * Show line numbers in code blocks
   */
  showLineNumbers?: boolean;

  /**
   * Maximum width for the content (auto-wrap)
   */
  maxWidth?: number;

  /**
   * Enable GFM (GitHub Flavored Markdown) extensions
   */
  gfm?: boolean;

  /**
   * Custom blessed screen instance
   */
  screen?: Widgets.Screen;

  /**
   * Custom blessed container element
   */
  container?: Widgets.BoxElement;

  /**
   * Auto-scroll to bottom on updates
   */
  autoScroll?: boolean;

  // ========== Enhanced Features (Streamdown Parity) ==========

  /**
   * Remark plugins for markdown preprocessing
   */
  remarkPlugins?: TTYPluggableList;

  /**
   * Rehype plugins for token post-processing
   */
  rehypePlugins?: TTYPluggableList;

  /**
   * Theme for syntax highlighting and rendering
   */
  theme?: 'light' | 'dark' | 'auto';

  /**
   * Shiki syntax highlighting languages to load
   */
  shikiLanguages?: string[];

  /**
   * Interactive controls (disabled in simplified version)
   */
  controls?: false;

  /**
   * Mermaid diagram configuration
   */
  mermaidConfig?: MermaidTTYConfig;

  /**
   * Math rendering configuration
   */
  mathConfig?: MathRenderConfig;

  /**
   * Security configuration
   */
  security?: SecurityConfig;

  /**
   * Enhanced features toggle (opt-in)
   */
  enhancedFeatures?: EnhancedFeaturesConfig;

  /**
   * Streaming animation state
   */
  isStreaming?: boolean;

  /**
   * Custom component overrides
   */
  components?: ComponentOverrides;
}

export interface MarkdownStyles {
  h1: BlessedStyle;
  h2: BlessedStyle;
  h3: BlessedStyle;
  h4: BlessedStyle;
  h5: BlessedStyle;
  h6: BlessedStyle;

  paragraph: BlessedStyle;
  strong: BlessedStyle;
  em: BlessedStyle;
  code: BlessedStyle;
  codeBlock: BlessedStyle;
  blockquote: BlessedStyle;
  link: BlessedStyle;
  list: BlessedStyle;
  listItem: BlessedStyle;
  table: BlessedStyle;
  tableHeader: BlessedStyle;
  hr: BlessedStyle;
  thinking?: BlessedStyle; // Optional: dark gray for thinking/cognitive blocks
}

export interface BlessedStyle {
  fg?: string;
  bg?: string;
  bold?: boolean;
  underline?: boolean;
  italic?: boolean;
  inverse?: boolean;
}

export interface ParsedToken {
  type: TokenType;
  content: string;
  depth?: number;
  ordered?: boolean;
  lang?: string;
  style?: BlessedStyle;
  incomplete?: boolean;
  raw?: string;
}

export type TokenType =
  | 'heading'
  | 'paragraph'
  | 'text'
  | 'strong'
  | 'em'
  | 'code'
  | 'codeblock'
  | 'blockquote'
  | 'list'
  | 'listitem'
  | 'link'
  | 'image'
  | 'table'
  | 'hr'
  | 'br'
  | 'del'
  | 'task'
  | 'incomplete'
  // Enhanced token types
  | 'math-inline'
  | 'math-block'
  | 'mermaid'
  | 'diagram';

export interface StreamBuffer {
  content: string;
  tokens: ParsedToken[];
  lastUpdate: number;
}

export interface RenderContext {
  screen: Widgets.Screen;
  container: Widgets.BoxElement;
  options: Required<StreamttyOptions>;
  buffer: StreamBuffer;
}

// ========== Enhanced Configuration Types ==========

/**
 * Enhanced features configuration
 */
export interface EnhancedFeaturesConfig {
  math?: boolean;
  mermaid?: boolean;
  shiki?: boolean;
  security?: boolean;
  interactiveControls?: boolean;
  advancedTables?: boolean;
}

/**
 * Interactive controls configuration (deprecated - visual-only rendering)
 * @deprecated Interactive controls have been removed for simplified visual-only rendering
 */
export interface TTYControlsConfig {
  // All interactive features disabled
}

/**
 * Key bindings configuration (deprecated)
 * @deprecated Key bindings removed for visual-only rendering
 */
export interface KeyBindings {
  // All key bindings disabled
}

/**
 * Mermaid diagram configuration for TTY
 */
export interface MermaidTTYConfig {
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  flowchart?: {
    useMaxWidth?: boolean;
    htmlLabels?: boolean;
  };
  sequence?: {
    showSequenceNumbers?: boolean;
  };
  gantt?: {
    titleTopMargin?: number;
    barHeight?: number;
  };
}

/**
 * Math rendering configuration
 */
export interface MathRenderConfig {
  displayMode?: boolean;           // Block vs inline
  throwOnError?: boolean;          // Throw on invalid LaTeX
  errorColor?: string;             // Color for error messages
  macros?: Record<string, string>; // Custom LaTeX macros
  trust?: boolean;                 // Trust mode for \url, \href
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  enabled?: boolean;
  allowedLinkPrefixes?: string[];
  allowedImagePrefixes?: string[];
  maxBufferSize?: number;
  stripDangerousAnsi?: boolean;
  sanitizeHtml?: boolean;
}

/**
 * Component override configuration
 */
export interface ComponentOverrides {
  heading?: (token: ParsedToken, yOffset: number) => Widgets.BoxElement;
  paragraph?: (token: ParsedToken, yOffset: number) => Widgets.BoxElement;
  code?: (token: ParsedToken, yOffset: number) => Widgets.BoxElement;
  codeblock?: (token: ParsedToken, yOffset: number) => Widgets.BoxElement;
  table?: (token: ParsedToken, yOffset: number) => Widgets.BoxElement;
  math?: (token: ParsedToken, yOffset: number) => Widgets.BoxElement;
  mermaid?: (token: ParsedToken, yOffset: number) => Widgets.BoxElement;
}

/**
 * Render context for blessed renderer
 */
export interface RenderContext {
  screen: Widgets.Screen;
  container: Widgets.BoxElement;
  options: Required<StreamttyOptions>;
  buffer: {
    content: string;
    tokens: ParsedToken[];
    lastUpdate: number;
  };
}
