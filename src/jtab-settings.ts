import { App, MarkdownRenderer, Plugin, PluginSettingTab } from 'obsidian';

export const ObsidianJTabClassMap: {[jtype:string]: string} = {
	'jtab': "jtab", 
	'jtab-examples': 'jtab'
};
export const ObsidianJTabTypes = Object.keys(ObsidianJTabClassMap);

// Ideally I would just pull this verbatim from the README.md file but esbuild won't let me
const OBSIDIAN_JTAB_ABOUT = `
### Obsidian jTab Guide

Obsidian jTab adds the ability to show guitar chords and tabs directly in your notes.

It uses the [jTab](https://jtab.tardate.com/) library to render the chords/tabs.

#### jTab codeblocks

* \`\`\`\` \`\`\`jtab\`\`\`\`
  jTab lines will be rendered. jTab auto-detects if chords, tabs, or both are present.

* \`\`\`\` \`\`\`jtab-examples\`\`\`\`
  Type an empty codeblock to see all of the [jTab examples](https://jtab.tardate.com/examples.htm)

#### Enhancements specific to Obsidian jTab
1. _Supports multiple jTab lines per codeblock_
   Each jTab line in a codeblock will be individually rendered

2. _Supports markdown in codeblocks_
   Lines starting with \`#<space>\` (\`# \`) are rendered as markdown inside the rendered codeblock

3. _Quick access to jtab-examples_
   Change any jtab codeblock language to jtab-examples (with your jTab still inside) and it will render the examples AND preserve your jTab when you go to edit it again.

#### Learning jTab
The [jTab Home Page](https://jtab.tardate.com/) has a [notation guide](https://jtab.tardate.com/index.htm#notation) and plenty of [examples](https://jtab.tardate.com/examples.htm).

You can put all of the examples from the jTab website directly into your notes by simply adding this:
~~~
\`\`\`jtab-examples
\`\`\`
~~~

#### jTab rendering caveats
* _Is it "responsive"?_
  The underlying jTab library isn't responsive (i.e., auto-resizing based on mobile, broswer widths) so your mileage may vary on mobile devices.

* _Rendering too wide?_
  The width of jTab renderings are as long as you make the jTab. It's up to you to break long jTab across multiple lines.

* _What about chordonly and tabonly classes mentioned on the jTab site?_
  The jTab library auto-detects if there are chords and/or tabs when rendereing jTab. On the examples page it mentions using chordonly and tabonly classes. They have no effect on the generated tab. They are only there to adust the height of the surrounding div to match the height of the generaged svg. With modern broswers these classes no longer needed.

#### Obsidian jTab on GitHub
This plugin's source code and issue tracker can be found on [GitHub](https://github.com/davfive/obsidian-jtab)
`

export class ObsidianJTabSettingsTab extends PluginSettingTab {
	// This is just an informational page, no settings are loaded/saved
    plugin: Plugin
	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		const el = containerEl.createDiv({cls: 'jtab-settings markdown-rendered'});
		MarkdownRenderer.renderMarkdown(OBSIDIAN_JTAB_ABOUT, el, null, null)
	}
}