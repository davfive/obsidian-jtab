import { App, MarkdownRenderChild, Notice, Plugin, PluginSettingTab } from 'obsidian';
import {randomUUID} from "crypto";
import $ from "jquery";
const jQuery = $;
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
		console.log(randomUUID())
	}

	onload(): void {
		this.renderJTab();
	}

	async renderJTab() {
        const empty = this.containerEl.createSpan({
            text: "Invalid jTab. Please check your syntax and try again."
        });

		if (this.src.trim().length) {
			try {
				const jdiv = this.containerEl.createDiv({
					attr: {'id': this.renderId}, 
					cls: OBSIDIAN_JTAB_CLASSES[this.jtype], 
					text: `${this.renderId}: ${this.src}`
				});
				this.registerDomEvent(jdiv, 'load', (ev) => {
					new Notice('Here');
				});

				empty.detach();
			} catch (e) {
				console.error(e);
				new Notice(`Obsidian jTab Error:\nInvalid ${this.jtype} block =>\n${this.src?.trim()}`);
			}
		}
		this.registerEvent(
            this.plugin.app.workspace.on(`${this.renderId}:unload`, () => {
                this.containerEl.empty();
                this.containerEl.createEl("pre").createEl("code", {
                    text: `\`\`\`${this.jtype}\n${this.src}\`\`\``
                });
            })
        );
	}

}

export default class ObsidianJTab extends Plugin {
	async onload() {
		// This is just an informational page, no settings are loaded/saved
		this.addSettingTab(new ObsidianJTabSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

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
