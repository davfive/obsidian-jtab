import {Subscription} from 'rxjs';
import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {jTabTypes, jTabClassMap} from './jtab-settings'
import {setJTabColorStyles} from './jtab-utils'
import jTabPlugin from './main'
import {jtab} from './assets/js/jtab.tardate'

const OBSIDIAN_JTAB_EXAMPLES_CODEBLOCK_SRC = `
# ### jTab Examples
# ----
# Examples from the [jTab website](https://jtab.tardate.com/) <br/>  

# #### Implicit render a chord-only phrase
# \`E / / / | A7 / B7 / ||\`
E / / / | A7 / B7 / ||

# #### Implicitly render a custom named chord
# \`%7/2.X/X.7/3.7/4.6/1.X/X[Bm7b5]\`
%7/2.X/X.7/3.7/4.6/1.X/X[Bm7b5]

# #### Implicitly render a tab-only phrase
# \`$4.7/9.$3.6/8 .$2.5/7 9p7 $2.9.$3.9.$4.9\`
$4.7/9.$3.6/8.$2.5/7 9p7 $2.9.$3.9.$4.9

# #### Implicitly render a mixed chord and a tab phrase
# \`Bm $3 4 4h5p3h4 5 $2 3 5 7 7h8p7 5/7 ||\`
Bm $3 4 4h5p3h4 5 $2 3 5 7 7h8p7 5/7 ||

# #### A simple three note sequence on the B (2nd) string
# \`$B 0 1 3 | $2 5 3 0 ||\`
$B 0 1 3 | $2 5 3 0 ||

# #### A sequence of notes across two strings
# Demonstrates using both 654321 and EADGBe for string numbering.
# \`$2 0 1 3 $1 0 1 3/5 | $B 0 1 3 $e 0 1 3/5 ||\`
$2 0 1 3 $1 0 1 3/5 | $B 0 1 3 $e 0 1 3/5 ||

# #### More than one note at a time in tab
# \`$3.6.$2.5h7 $1 5 $2 7 | $4.7/9.$3.6/8.$2.5/7 9p7 $2.9.$3.9.$4.9 ||\`
$3.6.$2.5h7 $1 5 $2 7 | $4.7/9.$3.6/8.$2.5/7 9p7 $2.9.$3.9.$4.9 ||

# #### Shorthand tab notation for all strings
# \`022100 / / / X02220 / 8.10.10.9.8.8 / ||\`
022100 / / / X02220 / 8.10.10.9.8.8 / ||

# #### CAGED notation
# \`C:1 C:2 C:3 C:4 C:5\`
C:1 C:2 C:3 C:4 C:5
# \`C:6 C:7 C:8 C:9 C:10\`
C:6 C:7 C:8 C:9 C:10
# \`Cm:1 Cm:2 Cm:3 Cm:4 Cm:5\`
Cm:1 Cm:2 Cm:3 Cm:4 Cm:5
# \`Eb7:1 Eb7:2 Eb7:3 Eb7:4 Eb7:5\`
Eb7:1 Eb7:2 Eb7:3 Eb7:4 Eb7:5
`
type CodeBlockPart = {type:string, src:string};
export class jTabCodeBlockRenderer extends MarkdownRenderChild {
	private _jTabDestroyListener: () => void = null;
	private _jTabDiv: HTMLElement = null;
	private _settingsUpdatesSub: Subscription;

	constructor(
		public plugin: jTabPlugin,
		public src: string,
		public containerEl: HTMLElement,
		public jtype: string
	) {
		super(containerEl);
		if (!jTabTypes.includes(this.jtype)) {
			throw new Error(`Unknown jTab type '${this.jtype}'`);
		}
		this._settingsUpdatesSub = null;
	}

	async onload() {
		if (this.jtype === 'jtab-examples') {
			// Show examples. See https://jtab.tardate.com/examples.htm
			this.src = OBSIDIAN_JTAB_EXAMPLES_CODEBLOCK_SRC;
		}
		const codeBlockParts = this._parseCodeBlock()
		if (codeBlockParts.length) {
			this._jTabDiv = this.containerEl.createDiv({cls: 'jtab-codeblock'});
			// Raphael will only render SVGs on existing DOM elements
			this._jTabDestroyListener = this._jTabDiv.onNodeInserted(() => {
				try {
					codeBlockParts.forEach(codeBlockPart => {
						let tgtDiv: HTMLElement;
						switch (codeBlockPart.type) {
							case 'markdown':
								tgtDiv = this._jTabDiv.createDiv({cls: 'jtab-markdown'});
								MarkdownRenderer.renderMarkdown(codeBlockPart.src, tgtDiv, null, this)
								break;
							case 'jtab':
								tgtDiv = this._jTabDiv.createDiv({
									cls: [
										'jtab-renderer', 
										jTabClassMap[this.jtype]
									].join(' ')
								});
					
								jtab.render(tgtDiv, codeBlockPart.src);
								if (!tgtDiv.classList.contains("rendered")) {
									throw new Error("Invalid jTab syntax");
								}
								break;
						}
					});
					this._settingsUpdatesSub = this.plugin.settingsUpdates.subscribe({
						next: (settings) => setJTabColorStyles(settings.colors, this._jTabDiv)
					})
				} catch (e) {
					this._cleanup();
					this._displayJTabError(e);
				}
			}, true);
		}
	}

	async onunload() {
		this._cleanup();
	}

	private _cleanup() {
		if (this._jTabDiv) {
			this._jTabDiv.detach();
			this._jTabDiv = null;
		}
		if (this._jTabDestroyListener) {
			this._jTabDestroyListener();
			this._jTabDestroyListener = null;
		}
		if (this._settingsUpdatesSub) {
			this._settingsUpdatesSub.unsubscribe();
		}
	}

	private _displayJTabError(e: Error): void {
        this._jTabDiv = this.containerEl.createDiv({cls: 'jtab-error markdown-rendered'}, el => {
            el.createDiv({cls: 'jtab-error-title', text: 'Error: Failed to generated jTab'});
            el.createDiv({cls: 'jtab-error-message', text: `=> ${e.message}`});
            el.createDiv({cls: 'jtab-error-src'}, el => {
                el.createEl('pre', {}, el => {
                    el.createEl('code', {text: `\`\`\`${this.jtype}\n${this.src.trim()}\n\`\`\``});
                    el.createSpan({cls: 'jtab-error-help'}, el => {
                        el.createEl('a', {href: 'https://jtab.tardate.com/examples.htm', text: 'Examples'});
                    });
                });
            });
        });
	}

	private _parseCodeBlock(): Array<CodeBlockPart> {
		const parts: Array<CodeBlockPart> = [];
		this.src.split('\n').filter(l => l.trim().length).forEach((line) => {
            const part = this._parseCodeBlockLine(line);
            if (!parts.length || parts.last().type === 'jtab' || part.type === 'jtab') {
				parts.push(part)
            } else {
                // Previous line was markdown, merge them
                parts.last().src += '\n' + part.src
            }
		})
		return parts
	}

    private _parseCodeBlockLine(line: string): CodeBlockPart {
        return {
            type: line.startsWith('# ') ? 'markdown' : 'jtab',
            src: line.replace(/^# /, '')
        }
    }
}
