import { Plugin } from 'obsidian';
import { ObsidianJTabSettingsTab, ObsidianJTabTypes } from './jtab-settings'
import { ObsidianJTabCodeBlockRenderer } from './jtab-codeblock'

export default class ObsidianJTabPlugin extends Plugin {
	async onload() {
		// This is just an informational page, no settings are loaded/saved
		this.addSettingTab(new ObsidianJTabSettingsTab(this.app, this));

		for (const jtype of ObsidianJTabTypes) {
			this.registerMarkdownCodeBlockProcessor(jtype, (src, el, ctx) => {
				const handler = new ObsidianJTabCodeBlockRenderer(this, src, el, jtype);
				ctx.addChild(handler);
			});	
		}
	}

	async onunload() {
		// No cleanup required at the plugin level
	}
}
