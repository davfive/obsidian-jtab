# How I added jTab Color Settings in Obsidian
>This is a how-to guide on how I implemented a live preview in settings and self-updating codeblocks on the fly

I just released Obsidian jTab 1.0.5 with a new settings panel for custom colors that had some odd requirements that I thought I'd share in case anyone could use the ideas (or give me tips on how to do it better).

Note: as time passes and these files change, some of these permalinks might be a bit, but not too far off, from the line number

# Why custom colors

Many Obsidian users love their colors and themes and tweaking until nothing more can be tweaked. After getting a request from @RobColes I noodled around a bit and came up with this.

# Software requirements

1. Three color modes: Classic, Themed, Custom
2. Wanted to tie together an addText (input) and addText (color)
3. Wanted a live preview in settings but not update notes until leave settings
4. Delayed saving of settings until user leaves panel
5. Have all codeblocks auto-update (without me looking for them in open notes)

# Final screenshot
Here's what it looks like finished

![Color Settings Panel](https://raw.githubusercontent.com/davfive/obsidian-jtab/main/docs/images/settings-colors-panel.jpg)

# Implementation Details
1. Three color modes  
   I don't need to say anything here, just a standard `new Settings().addDropdown` ([view code](https://github.com/davfive/obsidian-jtab/blob/main/src/jtab-settings.ts#L104))

2. Tie together addText input box with color picker  
   To get the color picker, I simply did a standard `new Settings(txt => txt.addText())` but then did this to make it a color picker, did `txt.inputEl.type = 'color'` ([View code](https://github.com/davfive/obsidian-jtab/blob/main/src/jtab-settings.ts#L182))

   To tie them together, I used each other's onCallback to update the other one's settings ([view code](https://github.com/davfive/obsidian-jtab/blob/main/src/jtab-settings.ts#L173))

3. Live preview color updates  
   To get the svgs into settings, I created that svg from a rendered jTab codeblock, saved it as an svg and imported it into a sibling div next to my custom colors settings. ([view code](https://github.com/davfive/obsidian-jtab/blob/main/src/jtab-settings.ts#L179))

   To update the svg with the colors from Classic or Themed (without updating settings and losing existing custom fields) I color the live preview then copy the calculated color values from the DOM to the custom color fields ([view code](https://github.com/davfive/obsidian-jtab/blob/main/src/jtab-settings.ts#L179))

   To update the live preview when someone actually enters a new custom color, I save the settings then update the preview element normally (same way I do with the codeblocks) ([view code](https://github.com/davfive/obsidian-jtab/blob/main/src/jtab-settings.ts#L179))


4. Delayed saving of settings until user leaves panel  
   For this I do write to the `this.plugin.settings` object, I just don't save it.

   I override `PluginSettingTab::hide()` so that I know whenever someone leaves my settings panel. I save off a snapshot of settings before they enter using `lodash::cloneDeep` and then use `lodash::isEqual` to check if they changed anything before I call `this.plugin.saveSettings()` ([view code](https://github.com/davfive/obsidian-jtab/blob/main/src/jtab-settings.ts#L159)

5. Have all codeblocks auto-update (without me looking for them in open notes)  
   I really wanted the codeblocks to update with the new colors as soon as they left the settings. Since it's not possible to update css class styles on the fly for custom colors, I had to use color vars directly on the code blocks for custom colors (`--jtab-colors-*`) (see code)

   With those in place, I can set the colors on any codeblock to Classic, Themed, or Custom, with a single method call auto-update any jtab codeblock ([view code](https://github.com/davfive/obsidian-jtab/blob/main/src/jtab-utils.ts#L69))

   All that's left was to auto-update the codeblocks (or better yet, have them auto-update themselves). Instead of looping through active notes, finding the codeblocks, blah, blah, I simply created an `rxjs BehaviorSubject` that each codeblock subscribes to. Then I simply broadcast updates to them with `BehaviourSubject.next(this.plugin.settings)` and they update themselves.
   
   View code
   * [Create BehaviorSubject](https://github.com/davfive/obsidian-jtab/blob/main/src/main.ts#L14)
   * [Broacast Updates](https://github.com/davfive/obsidian-jtab/blob/main/src/main.ts#L39)
   * [Codeblock Subscribe](https://github.com/davfive/obsidian-jtab/blob/main/src/main.ts#L14)
   * [Codeblock Unsubscribe](https://github.com/davfive/obsidian-jtab/blob/main/src/jtab-codeblock.ts#L132)
