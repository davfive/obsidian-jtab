import { App, MarkdownRenderer, PluginSettingTab, Setting, TextComponent, DropdownComponent} from 'obsidian'
import {jTabAboutMarkdown, parseColorToHexa, setJTabColorStyles} from './jtab-utils'
import jTabPlugin from './main'
import ChordExampleSVG from '../assets/img/jtab-example-chord.svg'
import TabExampleSVG from '../assets/img/jtab-example-tab.svg'
import {cloneDeep, isEqual} from 'lodash'

export interface IjTabCustomColors {
	[index:string]:string,
	background: string,
	lines: string,
	text: string,
	chordDot: string,
	chordDotText: string,
}

export interface IjTabColors {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[index:string]: any,
	className: string,
	customColors: IjTabCustomColors
}

export interface IjTabSettings {
	version: number,
	colors: IjTabColors,
}

export const jTabClassMap: {[jtype:string]: string} = {
	'jtab': "jtab", 
	'jtab-examples': 'jtab',
	'jtab-chords': 'jtab'
}
export const jTabTypes = Object.keys(jTabClassMap)

export const jTabColorSchemes = new Map<string, string>([
	// Using Map to preserve order since this is the dropdown
	["Classic", "jtab-colors-classic"],
	["Themed", "jtab-colors-themed"],
	["Custom", "jtab-colors-custom"]
])

export const jTabSettingsDefaults: IjTabSettings = {
	version: 1,
	colors: {
		className: 'jtab-colors-classic',
		customColors: {
			background: 'white',
			lines: 'black',
			text: 'black',
			chordDot: 'black',
			chordDotText: 'white',
		}
	},
}

interface IcolorFieldInfo {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key:string]: any
	name: string,
	colorText: TextComponent,
	colorPicker: TextComponent
}

interface IcolorFieldsInfo {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key:string]: IcolorFieldInfo
}

export class jTabSettingsTab extends PluginSettingTab {
    plugin: jTabPlugin
	_settingsSnapshot: IjTabSettings
	_colorTypeDropdown: DropdownComponent
	_colorFieldsInfo: IcolorFieldsInfo
	_elColorExamples: HTMLElement

	constructor(app: App, plugin: jTabPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this._settingsSnapshot = cloneDeep(this.plugin.settings);
		this._colorTypeDropdown = null;
		this._colorFieldsInfo = {
			background: {name: 'Background', colorText: null, colorPicker: null },
			lines: {name: 'Lines', colorText: null, colorPicker: null },
			text: {name: 'Text', colorText: null, colorPicker: null },
			chordDot: {name: 'Chord Dot', colorText: null, colorPicker: null },
			chordDotText: {name: 'Chord Dot Text', colorText: null, colorPicker: null },
		};
		this._elColorExamples = null;
	}

	display(): void {
		const {containerEl} = this

		containerEl.empty()
		containerEl.addClass('jtab-settings-page')

		// Settings Form (create top level divs here to preserve order and give access to callbacks)
		const elSettings = containerEl.createDiv({cls: 'jtab-settings'})

		new Setting(elSettings.createDiv())
			.setHeading()
			.setName('Obsidian jTab Settings')

		// Color Scheme Type Chooser
		new Setting(elSettings.createDiv())
			.setName('Color Scheme')
			.setDesc('Specify how you want jTab tabs and chords to show in the notes')
			.addDropdown(d => {
				this._colorTypeDropdown = d
				for (const [name, cls] of jTabColorSchemes.entries()) {
					d.addOption(cls, name)
				}
				d.setValue(this.plugin.settings.colors.className)
				d.onChange(async v => {
					this.plugin.settings.colors.className = v
					setJTabColorStyles(this.plugin.settings.colors, this._elColorExamples)
					this._copyColorStylesToFields();
				})
			});

		// Color Details Sections (examples and color fields)
		const elColorDetails = elSettings.createDiv({cls: 'jtab-settings-colors-details'});
		this._elColorExamples = elColorDetails.createDiv({cls: 'jtab-settings-colors-examples'});

		// Example SVGs
		([ChordExampleSVG, TabExampleSVG]).forEach((svgstr, i) => {
			const svgdoc = new DOMParser().parseFromString(svgstr, 'application/xml');
			const svgnode = document.importNode(svgdoc.documentElement, true);
			this._elColorExamples.createDiv({cls: "jtab-renderer jtab rendered"})
				.createDiv({attr: {id: `builder_${i}`}})
				.appendChild(svgnode);
		});
	
		// Color Fields
		const elColorFields = elColorDetails.createDiv({cls: 'jtab-settings-colors-fields'})
		Object.keys(this._colorFieldsInfo).forEach(field => {
			new Setting(elColorFields)
				.setName(this._colorFieldsInfo[field].name)
				.addText(textField => this._addColorTextField(field, textField))
				.addText(textField => this._addColorPickerField(field, textField))
		})

		// Update colors once the examples and color fields are in the DOM
		this._elColorExamples.onNodeInserted(() => {
			setJTabColorStyles(this.plugin.settings.colors, this._elColorExamples)
			this._copyColorStylesToFields()
		});

		// About/Guide Section
		new Setting(containerEl.createDiv())
			.setHeading()
			.setName('Obsidian jTab Guide')

		MarkdownRenderer.renderMarkdown(
			jTabAboutMarkdown, 
			containerEl.createDiv({cls: 'jtab-about'}),
			null, null);
	}

	async hide() {
		// Hijack hide so I know when to save the settings and am not
		// broadcasting changes while people are still tinkering
		if (! isEqual(this.plugin.settings, this._settingsSnapshot)) {
			await this.plugin.saveSettings();
			this._settingsSnapshot = cloneDeep(this.plugin.settings);
		}
		super.hide()
	}

	private _addColorPickerField(field: string, textField: TextComponent) {
		this._colorFieldsInfo[field].colorPicker = textField
		textField
			.setValue(this.plugin.settings.colors[field])
			.onChange(async v => {
				this.plugin.settings.colors.className = 'jtab-colors-custom'
				this._colorTypeDropdown.setValue(this.plugin.settings.colors.className)
				this.plugin.settings.colors[field] = v	
				this._colorFieldsInfo[field].colorText.setValue(v)

				this._saveAllColorFieldsAsCustom()
				setJTabColorStyles(this.plugin.settings.colors, this._elColorExamples)
			})
		textField.inputEl.type = 'color' // Make it a color picker
	}

	private _addColorTextField(field: string, textField: TextComponent) {
		this._colorFieldsInfo[field].colorText = textField
		textField
			.setValue(this.plugin.settings.colors[field])
			.onChange(async v => {
				const color = parseColorToHexa(v)
				if (color) {
					this.plugin.settings.colors.className = 'jtab-colors-custom'
					this._colorTypeDropdown.setValue(this.plugin.settings.colors.className)
					this.plugin.settings.colors.customColors[field] = color
					this._colorFieldsInfo[field].colorPicker.setValue(color)
	
					this._saveAllColorFieldsAsCustom()
					setJTabColorStyles(this.plugin.settings.colors, this._elColorExamples)
				}
			})	
	}			

	private _copyColorStylesToFields() {
		// _copyColorStylesToFields() temporarily updates the color fields
		// to display what is showing in the example. This is so as to not
		// overwrite the saved settings for custom just by viewing Classic
		// or themed. If someone actually modifies a color field, the
		// color fields will all be saved-as to the settings with
		// _saveAllColorFieldsAsCustom
		const setFieldColor = (field: string, color: string) => {
			const hexa = parseColorToHexa(color)
			if (hexa) {
				this._colorFieldsInfo[field].colorText.setValue(hexa)
				this._colorFieldsInfo[field].colorPicker.setValue(hexa)
			}
		}
		const svgSel = (sel: string) => `.jtab-settings-colors-examples svg ${sel}`
		const colorValue = (sel: string, prop: string): string => {
			try {
				const cssObj = window.getComputedStyle(document.querySelector(sel))
				return parseColorToHexa(cssObj.getPropertyValue(prop))
			}
			catch (err) {
				return null
			}
		}
		
		setFieldColor('background', colorValue('.jtab-settings-colors-examples', 'background-color'))
		setFieldColor('lines', colorValue(svgSel('path'), 'stroke'))
		setFieldColor('text', colorValue(svgSel('text'), 'fill'))
		setFieldColor('chordDot', colorValue(svgSel('circle'), 'fill'))
		setFieldColor('chordDotText', colorValue(svgSel('circle + text'), 'fill'))
	}

	private _saveAllColorFieldsAsCustom() {
		Object.keys(this._colorFieldsInfo).forEach(field => {
			const color = this._colorFieldsInfo[field].colorText.getValue()
			if (parseColorToHexa(color)) {
				// Only do it if the color is valid
				this.plugin.settings.colors.customColors[field] = color;
			}
		})
	}

}

