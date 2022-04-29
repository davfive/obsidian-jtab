import { Plugin } from 'obsidian';
import { BehaviorSubject } from 'rxjs'
import { jTabSettingsTab, jTabTypes, IjTabSettings, jTabSettingsDefaults, jTabColorSchemes} from './jtab-settings';
import { jTabCodeBlockRenderer } from './jtab-codeblock';
import { parseColorToHexa } from './jtab-utils'


export default class jTabPlugin extends Plugin {
	settings: IjTabSettings;
	settingsUpdates: BehaviorSubject<IjTabSettings>;

	async onload() {
		await this.loadSettings();
		this.settingsUpdates = new BehaviorSubject(this.settings);

		// This is just an informational page, no settings are loaded/saved
		this.addSettingTab(new jTabSettingsTab(this.app, this));

		for (const jtype of jTabTypes) {
			this.registerMarkdownCodeBlockProcessor(jtype, (src, el, ctx) => {
				const handler = new jTabCodeBlockRenderer(this, src, el, jtype);
				ctx.addChild(handler);
			});	
		}
	}

	async onunload() {
		// No cleanup required at the plugin level
	}

	async loadSettings() {
		this.settings = Object.assign({}, jTabSettingsDefaults, await this.loadData());
		this._ensureValidSettings()
	}

	async saveSettings() {
		this._ensureValidSettings()
		await this.saveData(this.settings);
		this.settingsUpdates.next(this.settings);
	}

	private _ensureValidSettings() {
		// Known color schemes
		if (! [...jTabColorSchemes.values()].includes(this.settings.colors.className)) {
			this.settings.colors.className = jTabColorSchemes.get("Classic")
		}

		// Known custom colors
		if (Object.values(this.settings.colors.customColors).some(v => {
			return null == parseColorToHexa(v)
		})) {
			this.settings = Object.assign({}, jTabSettingsDefaults.colors.customColors);
		}
	}
}
