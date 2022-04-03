import { App, MarkdownRenderChild, Notice, Plugin, PluginSettingTab } from 'obsidian';
import {randomUUID} from "crypto";
const jtab = require("jtab");
const OBSIDIAN_JTAB_CLASSES: {[jtype:string]: string} = {'jtab': "jtab", 'jtab-chordonly': "jtab chordonly", 'jtab-tabonly': "jtab tabsonly"};
const OBSIDIAN_JTAB_TYPES = Object.keys(OBSIDIAN_JTAB_CLASSES);


class ObsidianJTabBlock extends MarkdownRenderChild {
	renderId: string;
	constructor(
		public plugin: ObsidianJTab,
		public src: string,
		public containerEl: HTMLElement,
		public jtype: string
	) {
		super(containerEl);
		if (!OBSIDIAN_JTAB_TYPES.includes(jtype)) {
			throw new Error(`ObsidianJTabBlock: Unknown jTab type '${jtype}'`);
		}
		this.plugin = plugin;
		this.src = src;
		this.jtype = jtype;
		this.renderId = `jtab-${randomUUID()}`
	}

	onload(): void {
		this.renderJTab();
	}

	async renderJTab() {

		if (this.src.trim().length) {
			try {
				const jSrc = `<div class="${OBSIDIAN_JTAB_CLASSES[this.jtype]}">${this.src}</div>`;
				const jdiv = this.containerEl.createDiv({attr: {'id': this.renderId}});
				debugger;
				jtab.render(jdiv, "A B C" ); // jSrc);
			} catch (e) {
				this.renderJTabError(e);
			}
		}
	}

	renderJTabError(e: any) {
		const ediv = this.containerEl.createDiv({cls: 'jtab-error'});
		ediv.createDiv({cls: 'jtab-error-title', text: 'Error: Failed to generated jTab.'});
		ediv.createDiv({cls: 'jtab-error-message', text: `=> ${e.message}`});
		ediv.createEl('pre').createEl('code', {cls: 'jtab-error-src', text: `\`\`\`${this.jtype}\n${this.src}\n\`\`\``});
	}
}

export default class ObsidianJTab extends Plugin {
	async onload() {
		// This is just an informational page, no settings are loaded/saved
		this.addSettingTab(new ObsidianJTabSettingsTab(this.app, this));

		for (let jtype of OBSIDIAN_JTAB_TYPES) {
			this.registerMarkdownCodeBlockProcessor(jtype, (src, el, ctx) => {
				const handler = new ObsidianJTabBlock(this, src, el, jtype);
				ctx.addChild(handler);
			});	
		}
	}

	onunload() {

	}
}
class ObsidianJTabSettingsTab extends PluginSettingTab {
	// This is just an informational page, no settings are loaded/saved
	plugin: ObsidianJTab;

	constructor(app: App, plugin: ObsidianJTab) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Obsidian jTab'});
		let p = containerEl.createEl('p');
		p.createEl('span', {text: "The Obsidian jTab plugin is not affiliated in any way with jTab. It only adds jtab blocks to Obsidian."});

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
