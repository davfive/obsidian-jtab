import { App, MarkdownRenderer, PluginSettingTab, Setting } from 'obsidian'
import {jTabAboutMarkdown} from './jtab-utils'
import jTabPlugin from './main'

export interface IjTabCustomColors {
	[index:string]:string,
	background?: string,
	lines?: string,
	text?: string,
	chordDot?: string,
	chordDotText?: string,
}

export interface IjTabColors {
	[index:string]: unknown,
	className: string,
	customColors?: IjTabCustomColors
}

export interface IjTabSettings {
	version: number,
	colors: IjTabColors,
}


export const jTabClassMap: {[jtype:string]: string} = {
	'jtab': "jtab", 
	'jtab-examples': 'jtab'
}
export const jTabTypes = Object.keys(jTabClassMap)


export const jTabSettingsDefaults: IjTabSettings = {
	version: 1,
	colors: {className: 'jtab-colors-normal'}
}

export class jTabSettingsTab extends PluginSettingTab {
    plugin: jTabPlugin

	constructor(app: App, plugin: jTabPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const {containerEl} = this

		containerEl.empty()
		containerEl.addClass('jtab-settings-page')

		// Settings Form (create top level divs here to preserve order and give access to callbacks)
		const elSettings = containerEl.createDiv({cls: 'jtab-settings'})
		elSettings.createEl('h2', 'Obsidian jTab Settings')
		const elColorChooser = elSettings.createDiv()
		const elAbout = containerEl.createDiv({cls: 'jtab-about'})
		MarkdownRenderer.renderMarkdown(jTabAboutMarkdown, elAbout, null, null)

		new Setting(elColorChooser)
			.setName('jTab Color Scheme')
			.setDesc('Specify how you want jTab tabs and chords to show in the notes')
			.addDropdown(d => {
				d.addOption('jtab-colors-normal', 'Normal')
				d.addOption('jtab-colors-themed', 'Themed')
				d.setValue(this.plugin.settings.colors.className)
				d.onChange(async v => {
					this.plugin.settings.colors.className = v
					await this.plugin.saveSettings()
				})
			})

	}
}
