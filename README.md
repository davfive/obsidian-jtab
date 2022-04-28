### Obsidian jTab Guide

Obsidian jTab adds the ability to show guitar chords and tabs directly in your notes.

It uses the [jTab](https://jtab.tardate.com/) library to render the chords/tabs.

#### jTab codeblocks

* ```` ```jtab````  
  jTab lines will be rendered. jTab auto-detects if chords, tabs, or both are present.
  
* ```` ```jtab-examples````  
  Type an empty codeblock to see all of the [jTab examples](https://jtab.tardate.com/examples.htm)
  

#### Enhancements specific to Obsidian jTab
1. _Supports multiple jTab lines per codeblock_  
   Each jTab line in a codeblock will be individually rendered. Blank lines will be ignored.

2. _Supports markdown in codeblocks_  
   Lines starting with \`#&lt;space&gt;\` (\`# \`) are rendered as markdown inside the rendered codeblock

3. _Choose your own colors_
   Choose from Normal (old-school black on white), Themed (follows your theme's colors), or set your own custom colors for background, lines, text, chord dots, and chord dot text. Try it out in settings.

4. _Quick access to jtab-examples_  
   Change any jtab codeblock language to jtab-examples (with your jTab still inside) and it will render the examples AND preserve your jTab when you go to edit it again.

#### jTab Color Schemes
jTab colors are now fully customizable. Normal for the old-school black on white look, Themed will follow your theme colors, or go crazy and mix 'em up yourself. If you select Normal or Themed and then just modify one color, it'll automatically switch to custom from there.

![Color Settings Panel](https://raw.githubusercontent.com/davfive/obsidian-jtab/main/docs/images/settings-colors-panel.jpg)

#### Learning jTab
The [jTab Home Page](https://jtab.tardate.com/) has a [notation guide](https://jtab.tardate.com/index.htm#notation) and plenty of [examples](https://jtab.tardate.com/examples.htm).

You can put all of the examples from the jTab website directly into your notes by simply adding this:
~~~~
```jtab-examples
```
~~~~

#### jTab rendering caveats
* _Is it "responsive"?_  
  The underlying jTab library isn't responsive (i.e., auto-resizing based on mobile, broswer widths) so your mileage may vary on mobile devices.

* _Rendering too wide?_  
  The width of jTab renderings are as long as you make the jTab. It's up to you to break long jTab across multiple lines.

* _What about chordonly and tabonly classes mentioned on the jTab site?_  
  The jTab library auto-detects if there are chords and/or tabs when rendering jTab. The chordonly and tabonly classes mentioned on the examples page do not affect the rendered image. They are a legacy helper classes when the rendered image's enclosing div/parent couldn't properly auto-adjust for the height of the image. With modern broswers these classes no longer needed.

#### Rendered jTab Examples

__jTab with only chords__
~~~~
```jtab
E / / / A7 / B7 /
```
~~~~
![codeblock jtab chords](https://raw.githubusercontent.com/davfive/obsidian-jtab/main/docs/images/codeblock-jtab-chords-only.jpg)

__jTab with only tabs__ (haha)
~~~~
```jtab
$4.7 $3.5 $2.5 $1.5 $1.7.$4.6 $2.5 $3.5 $1.7 | $1.8.$4.5 $2.5 $3.5 $1.8 $1.2.$4.4 $2.3 $3.2 $1.2 | $1.0.$4.3 $2.1 $3.2 $2.1 . $1.0 $2.1 $3.2 | $2.0.$3.0.$5.2 $2.1.$3.2.$5.0 $2.1.$3.2.$5.0 . $3.2.$5.0
```
~~~~
![codeblock jtab tabs](https://raw.githubusercontent.com/davfive/obsidian-jtab/main/docs/images/codeblock-jtab-tab-only.jpg)

__jTab with chords and tabs__
~~~~
```jtab
Bm $3 4 4h5p3h4 5 $2 3 5 7 7h8p7 5/7 ||
```
~~~~
![codeblock jtab](https://raw.githubusercontent.com/davfive/obsidian-jtab/main/docs/images/codeblock-jtab-chords-and-tabs.jpg)

__jTab examples codeblock__
~~~~
```jtab-examples
```
~~~~
![codeblock jtab-examples](https://raw.githubusercontent.com/davfive/obsidian-jtab/main/docs/images/codeblock-jtab-examples.jpg)
	
#### Open Source Attributions

_Used by Obsidian jTab_
* [jTab](https://jtab.tardate.com/)
  * License LGPL v2.1 (it's in it's [js file](https://github.com/tardate/jtab/blob/master/javascripts/jtab.js), not in a normal GitHub license file
  	Per LGPL rules, jTab is used unmodified *execpt*I do not modify the jTab source code other than to
	* Disable jtab.renderimplicit() from running oninit. (it searches page for jtab elements and auto-renders them)
	* Wrap library in ES6 to be allow use with node/ts

_Used by jTab library_
* [Raphael](https://github.com/DmitryBaranovskiy/raphael)
  * [MIT License](https://github.com/DmitryBaranovskiy/raphael/blob/master/license.txt)
* [jQuery](https://jquery.com/) - required by jTab - not used in my code
  * [MIT License](https://github.com/jquery/jquery/blob/main/LICENSE.txt)

