import { readFileSync } from 'fs';
import { App, MarkdownRenderChild, Plugin, PluginSettingTab } from 'obsidian';
import {jtab} from './assets/js/jtab.tardate'
const OBSIDIAN_JTAB_CLASSES: {[jtype:string]: string} = {'jtab': "jtab", 'jtab-chordonly': "jtab chordonly", 'jtab-tabonly': "jtab tabsonly"};
const OBSIDIAN_JTAB_TYPES = Object.keys(OBSIDIAN_JTAB_CLASSES);
const OBSIDIAN_JTAB_ABOUT = `
<h3>About Obsidian jTab</h3>
The Obsidian jTab plugin is not affiliated in any way with jTab.
It only adds jtab code blocks to Obsidian.

<h4>Learning jTab<h4>
Visit jTab's home page for <a href="https://jtab.tardate.com/">instructions</a>
and <a href="https://jtab.tardate.com/examples.htm">examples</a>.

<p>
This plugin's source code can be found on 
<a href="https://github.com/davfive/obsidian-jtab">GitHub</a>.
</p>
`

class ObsidianJTabCodeBlock extends MarkdownRenderChild {
	private _jTabDestroyListener: () => void = null;
	private _jTabDiv: HTMLElement = null;
	constructor(
		public plugin: ObsidianJTabPlugin,
		public src: string,
		public containerEl: HTMLElement,
		public jtype: string
	) {
		super(containerEl);
		if (!OBSIDIAN_JTAB_TYPES.includes(this.jtype)) {
			throw new Error(`Unknown jTab type '${this.jtype}'`);
		}
	}

	async onload() {
		const srcLines = this.src.split('\n').filter(e => e.trim().length);
		if (srcLines.length) {
			this._jTabDiv = this.containerEl.createDiv();
			// Raphael will only render SVGs on existing DOM elements
			this._jTabDestroyListener = this._jTabDiv.onNodeInserted(() => {
				try {
					srcLines.forEach((srcLine) => {
						const tgtDiv = this._jTabDiv.createDiv({
							cls: OBSIDIAN_JTAB_CLASSES[this.jtype]
						});
			
						jtab.render(tgtDiv, srcLine);
						if (!tgtDiv.classList.contains("rendered")) {
							throw new Error("Invalid jTab syntax");
						}	
					});
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
	}

	private _displayJTabError(e: any): void {
		this._jTabDiv = this.containerEl.createDiv({cls: 'jtab-error'});
		this._jTabDiv.createDiv({cls: 'jtab-error-title', text: 'Error: Failed to generated jTab'});
		this._jTabDiv.createDiv({cls: 'jtab-error-message', text: `=> ${e.message}`});			
		this._jTabDiv.createEl('pre').createEl('code', {cls: 'jtab-error-src', text: `\`\`\`${this.jtype}\n${this.src}\n\`\`\``});
		const help = this._jTabDiv.createSpan({cls: 'jtab-error-help'})
		help.createEl('a', {href: 'https://jtab.tardate.com/examples.htm', text: 'Examples'});
		help.createSpan({text: " • "});
		help.createEl('a', {href: 'https://github.com/davfive/obsidian-jtab/issues', text: 'Issues'});
	}
}

class ObsidianJTabSettingsTab extends PluginSettingTab {
	// This is just an informational page, no settings are loaded/saved
	plugin: ObsidianJTabPlugin;

	constructor(app: App, plugin: ObsidianJTabPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createDiv({}, el => {
			el.innerHTML = OBSIDIAN_JTAB_ABOUT
		})
	}
}

export default class ObsidianJTabPlugin extends Plugin {
	async onload() {
		// This is just an informational page, no settings are loaded/saved
		this.addSettingTab(new ObsidianJTabSettingsTab(this.app, this));

		for (let jtype of OBSIDIAN_JTAB_TYPES) {
			this.registerMarkdownCodeBlockProcessor(jtype, (src, el, ctx) => {
				const handler = new ObsidianJTabCodeBlock(this, src, el, jtype);
				ctx.addChild(handler);
			});	
		}

		this.addCommand({
			id: "obsidian-jtab-insert-examples",
			name: "Obsidian jTab: Insert examples",
			editorCallback: (editor) => {
				editor.replaceRange(OBSIDIAN_JTAB_ABOUT, editor.getCursor())
			},
		  });
	}

	async onunload() {
		// No cleanup required at the plugin level
	}
}
