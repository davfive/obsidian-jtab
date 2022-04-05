import { App, MarkdownRenderChild, Notice, Plugin, PluginSettingTab } from 'obsidian';
const jtab = require("jtab");
const OBSIDIAN_JTAB_CLASSES: {[jtype:string]: string} = {'jtab': "jtab", 'jtab-chordonly': "jtab chordonly", 'jtab-tabonly': "jtab tabsonly"};
const OBSIDIAN_JTAB_TYPES = Object.keys(OBSIDIAN_JTAB_CLASSES);

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

		containerEl.createEl('h2', {text: 'Obsidian jTab'});
		let p = containerEl.createEl('p');
		p.createEl('p', {text: "The Obsidian jTab plugin is not affiliated in any way with jTab. It only adds jtab blocks to Obsidian."});

		p = containerEl.createEl('p');
		p.createEl('span', {text: "Visit jTab's home page for "});
		p.createEl('a', {href: 'https://jtab.tardate.com/', text: 'instructions'});
		p.createEl('span', {text: ' and '});
		p.createEl('a', {href: 'https://jtab.tardate.com/examples.htm', text: 'examples'});
		p.createEl('span', {text: '.'});

		p = containerEl.createEl('p');
		p.createEl('span', {text: "This plugin's source code can be found on "});
		p.createEl('a', {href: 'https://github.com/davfive/obsidian-jtab', text: 'GitHub'});
		p.createEl('span', {text: '.'});
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
	}

	async onunload() {
		// No cleanup required at the plugin level
	}
}
