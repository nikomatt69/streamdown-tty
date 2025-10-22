import blessed from 'blessed';
import { Widgets } from 'blessed';
import { StreamingMarkdownParser } from './parser/streaming-parser';
import { BlessedRenderer } from './renderer/blessed-renderer';
import { AISDKStreamAdapter } from './ai-sdk-adapter';
import { createDefaultRegistry, PluginRegistry } from './plugins/plugin-system-inline';
import { sanitizeForTerminal } from './security/ansi-sanitizer';
import { getTheme } from './themes';
import { StreamttyOptions, RenderContext } from './types';
import { StreamEvent } from './types/stream-events';
import { AISDKStreamAdapterOptions } from './ai-sdk-adapter';

export class Streamtty {
    private parser: StreamingMarkdownParser;
    private renderer: BlessedRenderer;
    private context: RenderContext;
    private updateInterval: NodeJS.Timeout | null = null;
    private pendingUpdate = false;
    private aiAdapter: AISDKStreamAdapter;
    private pluginRegistry: PluginRegistry | null = null;

    constructor(options: StreamttyOptions = {}) {
        const screen = options.screen || this.createDefaultScreen();
        const container = options.container || this.createContainer(screen);

        // Apply theme if specified
        const theme = options.theme ? getTheme(options.theme) : null;
        const styles = theme ? { ...theme.markdown, ...options.styles } : options.styles;

        const defaultOptions: Required<StreamttyOptions> = {
            parseIncompleteMarkdown: options.parseIncompleteMarkdown ?? true,
            styles: styles || {},
            syntaxHighlight: options.syntaxHighlight ?? true,
            showLineNumbers: options.showLineNumbers ?? false,
            maxWidth: options.maxWidth ?? 120,
            gfm: options.gfm ?? true,
            screen,
            container,
            autoScroll: options.autoScroll ?? false,
            remarkPlugins: options.remarkPlugins || [],
            rehypePlugins: options.rehypePlugins || [],
            theme: options.theme || 'auto',
            shikiLanguages: options.shikiLanguages || [],
            controls: options.controls || false,
            mermaidConfig: options.mermaidConfig || {},
            mathConfig: options.mathConfig || {},
            security: options.security || {},
            enhancedFeatures: options.enhancedFeatures || {},
            isStreaming: options.isStreaming || false,
            components: options.components || {},
        };

        const buffer = {
            content: '',
            tokens: [],
            lastUpdate: Date.now(),
        };

        this.context = {
            screen,
            container,
            options: defaultOptions,
            buffer,
        };

        this.parser = new StreamingMarkdownParser(defaultOptions.parseIncompleteMarkdown);
        this.renderer = new BlessedRenderer(this.context);

        // Initialize AI SDK adapter
        this.aiAdapter = new AISDKStreamAdapter(this, {
            parseIncompleteMarkdown: defaultOptions.parseIncompleteMarkdown,
            syntaxHighlight: defaultOptions.syntaxHighlight,
            formatToolCalls: true,
            showThinking: true,
            maxToolResultLength: 200,
            renderTimestamps: false
        });

        // Initialize enhanced features with new plugin system
        this.initializeEnhancedFeatures();
    }

    /**
     * Initialize enhanced features with new plugin system
     */
    private async initializeEnhancedFeatures(): Promise<void> {
        const options = this.context.options;

        // Skip if no features enabled
        if (!options.enhancedFeatures || Object.values(options.enhancedFeatures).every(v => !v)) {
            return;
        }

        // Create plugin registry
        this.pluginRegistry = createDefaultRegistry();
        await this.pluginRegistry.init();
    }

    /**
     * Create default blessed screen
     */
    private createDefaultScreen(): Widgets.Screen {
        return blessed.screen({
            smartCSR: true,
            title: 'Streamtty',
            autoPadding: true,
            warnings: false,
        });
    }

    /**
     * Create scrollable container
     */
    private createContainer(screen: Widgets.Screen): Widgets.BoxElement {
        return blessed.box({
            parent: screen,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: {
                type: 'line',
            },
            style: {
                border: {
                    fg: 'blue',
                },
            },
            scrollable: true,
            alwaysScroll: true,
            keys: true,
            vi: true,
            mouse: true,
            scrollbar: {
                ch: '█',
                style: {
                    fg: 'blue',
                },
            },
        });
    }

    /**
     * Stream a chunk of markdown
     */
    async stream(chunk: string): Promise<void> {
        // Sanitize input if security is enabled
        const sanitizedChunk = this.context.options.security?.enabled
            ? sanitizeForTerminal(chunk)
            : chunk;

        this.context.buffer.content += sanitizedChunk;
        this.context.buffer.lastUpdate = Date.now();

        // Parse the new content
        const tokens = this.parser.addChunk(sanitizedChunk);
        this.context.buffer.tokens = tokens;

        // Schedule a render
        this.scheduleRender();
    }

    /**
     * Set complete markdown content
     */
    setContent(markdown: string): void {
        this.context.buffer.content = markdown;
        this.context.buffer.lastUpdate = Date.now();

        // Clear parser buffer and add all content
        this.parser = new StreamingMarkdownParser(this.context.options.parseIncompleteMarkdown);
        const tokens = this.parser.addChunk(markdown);
        this.context.buffer.tokens = tokens;

        this.scheduleRender();
    }

    /**
     * Schedule a render (debounced)
     */
    private scheduleRender(): void {
        if (this.pendingUpdate) {
            return;
        }

        this.pendingUpdate = true;
        setTimeout(() => {
            this.render();
            this.pendingUpdate = false;
        }, 50);
    }

    /**
     * Render current tokens
     */
    async render(): Promise<void> {
        try {
            await this.renderer.render(this.context.buffer.tokens);

            if (this.context.options.autoScroll) {
                this.context.container.setScrollPerc(100);
            }
        } catch (error) {
            console.error('Render error:', error);
        }
    }

    /**
     * Clear all content
     */
    clear(): void {
        this.context.buffer.content = '';
        this.context.buffer.tokens = [];
        this.context.buffer.lastUpdate = Date.now();
        this.context.container.setContent('');
        this.context.screen.render();
    }

    /**
     * Start auto-rendering
     */
    startAutoRender(intervalMs: number = 50): void {
        this.stopAutoRender();
        this.updateInterval = setInterval(() => {
            this.render();
        }, intervalMs);
    }

    /**
     * Stop auto-rendering
     */
    stopAutoRender(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Get blessed screen instance
     */
    getScreen(): Widgets.Screen {
        return this.context.screen;
    }

    /**
     * Get container box
     */
    getContainer(): Widgets.BoxElement {
        return this.context.container;
    }

    /**
     * Get current buffer content
     */
    getContent(): string {
        return this.context.buffer.content;
    }

    /**
     * Get plugin registry for advanced usage
     */
    getPluginRegistry(): PluginRegistry | null {
        return this.pluginRegistry;
    }

    /**
     * Stream a structured AI SDK event
     */
    async streamEvent(event: StreamEvent): Promise<void> {
        await this.aiAdapter.processEvent(event);
    }

    /**
     * Stream multiple AI SDK events
     */
    async streamEvents(events: AsyncGenerator<StreamEvent>): Promise<void> {
        for await (const event of events) {
            await this.streamEvent(event);
        }
    }

    /**
     * Handle AI SDK stream with adapter
     */
    async* handleAISDKStream(stream: AsyncGenerator<StreamEvent>): AsyncGenerator<void> {
        for await (const event of stream) {
            await this.streamEvent(event);
            yield;
        }
    }

    /**
     * Update AI SDK adapter options
     */
    updateAIOptions(options: Partial<AISDKStreamAdapterOptions>): void {
        this.aiAdapter.updateOptions(options);
    }

    /**
     * Get AI SDK adapter options
     */
    getAIOptions(): AISDKStreamAdapterOptions {
        return this.aiAdapter.getOptions();
    }

    /**
     * Destroy and cleanup
     */
    async destroy(): Promise<void> {
        this.stopAutoRender();

        if (this.pluginRegistry) {
            await this.pluginRegistry.destroy();
        }

        this.context.screen.destroy();
    }
}

// Re-export all types and utilities
export * from './types';
export * from './types/stream-events';
export { StreamingMarkdownParser } from './parser/streaming-parser';
export { BlessedRenderer } from './renderer/blessed-renderer';
export { AISDKStreamAdapter } from './ai-sdk-adapter';
export { StreamProtocol } from './stream-protocol';
export * from './streamdown-compat';
export * from './errors';
export * from './events';
export * from './performance';
export * from './themes';
export * from './utils/shiki-ansi-renderer';
export * from './utils/math-unicode-renderer';
export * from './utils/mermaid-ascii-renderer';
export * from './utils/table-formatter-inline';
export * from './utils/syntax-highlighter';
export * from './streaming/stream-stats';
export * from './widgets/stream-indicator';
export * from './plugins/plugin-system-inline';
export * from './security/ansi-sanitizer';

// Re-export specific types
export type {
    EnhancedFeaturesConfig,
    TTYControlsConfig,
    MermaidTTYConfig,
    MathRenderConfig,
    SecurityConfig,
    KeyBindings,
    ComponentOverrides
} from './types';
