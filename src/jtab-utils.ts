import Color from 'color'
import {IjTabColors} from './jtab-settings'

export {jtab} from './jtab-tardate'

// Ideally I would just pull this verbatim from the README.md file but esbuild won't let me
export const jTabAboutMarkdown = `
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

3. _Added jtab-chords codeblock_
   Use 'jtab-chords' codeblock to show ALL named chords that can be used in a jtab codeblock. As with the jtab-examples codeblock, your codeblock content will be preserved.

4. _Fully customizable colors in settings_
   Choose from Normal (black on white), Themed (follows your theme's colors), or set your own custom colors for background, lines, text, chord dots, and chord dot text. Try it out in settings.

5. _Quick access to jtab-examples_
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

export function unsetJTabColorStyles(colors: IjTabColors, el: HTMLElement): void {
    if (el) {
        // Get rid of all jtab-colors classes
        const regx = new RegExp('\\bjtab-colors-[^ ]*[ ]?\\b', 'g')
        el.className = el.className.replace(regx, '')

        // Gte rid of all --jtab-colors variables
        if (colors.customColors) {
            Object.keys(colors.customColors).forEach(key => {
                el.style.removeProperty(`--jtab-colors-${key.toLowerCase()}`)
            })
        }
    }
}

export function setJTabColorStyles(colors: IjTabColors, el: HTMLElement): void {
    if (el) {
        unsetJTabColorStyles(colors, el);

        el.addClass(colors.className)
        if (colors.className == 'jtab-colors-custom') {
            Object.keys(colors.customColors).forEach(key => {
                el.style.setProperty(`--jtab-colors-${key.toLowerCase()}`, colors.customColors[key])
            })
        }
    }
}

export function parseColorToHexa(colorText: string): string {
    try {
        return Color(colorText).hex()
    }
    catch (e) {
        return null
    }
}
