import { cloneDeep } from 'lodash';
import { ChordLibrary, WesternScale } from "./jtab.library";
/**
 * JTab - Javascript/CSS Guitar Chord and Tab Notation for the Web.
 * Version 1.3.1
 * Written by Paul Gallagher (http://tardate.com), 2009. (original version and maintainer)
 * Contributions:
 *   Jason Ong (https://github.com/jasonong)
 *   Bruno Bornsztein (https://github.com/bborn)
 *   Binary Bit LAN (https://github.com/binarybitlan)
 * See:
 *   http://jtab.tardate.com : more information on availability, configuration and use.
 *   http://github.com/tardate/jtab/tree/master : source code repository, wiki, documentation
 *
 * This library also depends on the following two libraries that must be loaded for it to work:
 *   jQuery - http://www.jquery.com/
 *   Raphael - http://raphaeljs.com/
 *
 *
 * This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General
 * Public License as published by the Free Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License along with this library; if not, write to
 * the Free Software Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
 */

import Raphael from "raphael"
declare module "raphael" {
  // See raphael.d.ts for the typescript recommendation
  interface RaphaelPaper {
    tabtype: number;
    has_chord: boolean;
    has_tab: boolean;
    debug: boolean;
    scale: number;
    margin_top: number;
    margin_bottom: number;
    margin_left: number;
    margin_right: number;
    current_offset: number;
    string_spacing: number;
    strings_drawn: number;
    fret_spacing: number;
    frets_drawn: number;
    note_radius: number;
    fret_width: number;
    fret_height: number;
    chord_width: number;
    chord_height: number;
    tab_current_string: number;
    tab_margin_top: number;
    tab_top: number;
    tab_spacing: number;
    tab_height: number;
    tab_char_width: number;
    total_height: number;
    color: string;
    fingering_text_color: string;
    tab_text_color: string;
    debug_grid(width: number): void;
    increment_offset(width: number): void;
    svg_params(x: number, y: number, l1: number, l2: number): string;
    chord_fretboard(position: number, chord_name: string): void;
    stroke(): void;
    bar(): void;
    doublebar(): void;
    chord_note(position: number, string_number: number, note: [number, number]): void;
    tab_extend(width: number): void;
    tab_start(): void;
    draw_tab_note(a: number, b: number, c: number): void;
  }
}

type JtabStringSpecType = [number] | [number, number]; // [fret[, finger]]
type JtabChordSpecType = [number, ...Array<JtabStringSpecType>];

type JtabChordSetNameType = 'chord' | 'caged' | 'custom';
type JtabChordSetType = Partial<Record<JtabChordSetNameType, JtabChordSpecType>>;
type JtabChordLibraryType = {[index: string]: JtabChordSetType};

Array.prototype.max_chars = function() {
  let max = this[0].length;
  for (let i = 1; i < this.length; i++) if (this[i].length > max) max = this[i].length;
  return max;
}

export class Jtab {
  static Version = '1.3.1';
  static Strings: {
    AboutDialog : '<html><head><title>About jTab</title></head><body style=""><p style="">jTab version: {V}</p><p><a href="http://jtab.tardate.com" target="_blank">http://jtab.tardate.com</a></p><p><input type="button" class="close" value="OK" onClick="window.close()"/></p></body></html>'
  };
  Chords: JtabChordLibraryType = ChordLibrary;
  element_count = 0; //TODO

  getChordList() {
    const sortOrder: Array<string> = []
    'CDEFGAB'.split('').forEach(k => ['','#','b'].forEach(a => ['','m'].forEach(mm => sortOrder.push(k+a+mm))))
    const chordBase = (chordName: string) => (chordName.match(/^([CDEFGAB][#b]{0,1}(?:m(?!aj))?)/)||[])[0]
    const chordSortValue = (chordName: string) => sortOrder.indexOf(chordBase(chordName))
    const sortChords = (a: string, b: string) => chordSortValue(a) - chordSortValue(b)

    return Object.keys(this.Chords).sort(sortChords)
  }

  isValidStringSpec(stringSpec: JtabStringSpecType) {
    if (! Array.isArray(stringSpec) || [1,2].includes(stringSpec.length)) {
      return false
    }
    const [fret, finger] = stringSpec
    if (! Number.isNumber(fret) || fret < -1) {
      return false
    }
    if ([-1, 0].includes(fret) && finger != null) {
      return false
    }
    if (fret > 0 && !Number.isNumber(finger)) {
      return false
    }
    return true
  }

  isValidChordSpec(chordSpec: JtabChordSpecType) {
    if (! Array.isArray(chordSpec) || chordSpec.length !== 7) {
      return false
    }


    const baseFret = chordSpec[0]
    if (!Number.isInteger(baseFret) || baseFret < 0) {
      return false
    }
    
    return chordSpec.slice(1).every((pair: [number, number]) => this.isValidStringSpec(pair))
  }

  /*
    * Usage: jtab.AddChord("ChordName", Chord-Array)
    * Example of Add: jtab.AddChord("Dsus4l", {
    *    open: [ 0, [-1 ],  [-1 ],  [3,2],  [2,1],  [3,3],  [3,4] ], 
    *    caged: [ 12, [-1,-1],  [-1,-1],  [12,1],  [14,2],  [15,3],  [15,4] ]
    * });
    * Example of Update: jtab.AddChord("A", {open: [ 0, [-1],  [0  ],  [2,3],  [2,2],  [2,1],  [0  ]})
    */
  AddChord(chordName: string, chordSet: JtabChordSetType): boolean {
    for (const setType in chordSet) {
      if (! this.isValidChordSpec(chordSet[setType as JtabChordSetNameType])) {
        return false;
      }
    }

    this.Chords[chordName] = chordSet;
    return true;
  }
}

//
// define jtabChord class
// public members:
//  isValid        = whether valid chord defined
//  isCaged        = whether chord is CAGED type
//  isCustom       = whether chord is a custom fingering
//  fullChordName  = full chord name, including position e.g. D#m7:3
//  chordName      = chord name, without position e.g. D#m7
//  baseName       = translated chord name (B <-> #), without position e.g. Ebm7
//  rootNote       = root note e.g. D#
//  rootExt        = root note extension e.g. m7
//  cagedBaseShape = caged base shape e.g. D
//  cagedBaseFret  = caged base fret e.g. 0
//  cagedPos       = caged position e.g. 3
//
export class JtabChord {

}


const {jtab, jtabChord} = (function() {

  //
  // define the jtab class
  //
  
  const jtab = {

    
  };

  //
  // define Array utility functions
  //


  function jtabChord (token: string) {

    this.scale = cloneDeep(WesternScale);
    this.baseNotes = this.scale.BaseNotes;
    this.baseChords = jtab.Chords;
    this.chordArray = null;
    this.isValid = false;

    this.fullChordName = token;
    this.isCustom = ( this.fullChordName.match( /%/ ) != null )
    this.isCaged = ( this.fullChordName.match( /:/ ) != null )


    if (this.isCaged) {
      const parts = this.fullChordName.split(':');
      this.chordName = parts[0];
      this.cagedPos = parts[1];
    } else if (this.isCustom){
      const parts = this.fullChordName.match( /\[(.+?)\]/ );
      if(parts){
        this.chordName = parts[1];
      } else {
        this.chordName = '';
      }
    } else {
      this.chordName = this.fullChordName;
      this.cagedPos = 1;
    }
    this.rootExt = this.chordName.replace(/^[A-G#b]{1,2}/,'');
    this.rootNote = this.chordName.substr(0, this.chordName.length - this.rootExt.length);
    const baseNoteInfo = this.baseNotes[this.rootNote];
    if (baseNoteInfo) {
      this.baseName = baseNoteInfo[0] + this.rootExt;
      this.cagedBaseShape = baseNoteInfo[1];
      this.cagedBaseFret = baseNoteInfo[2];
    } else {
      this.cagedBaseShape = '';
      this.cagedBaseFret = 0;
    }

    if ( ( this.isCaged ) && ( this.cagedPos > 1 ) ) {
      this.setCagedChordArray();
    } else if (this.isCustom){
      this.setCustomChordArray();
    } else {
      this.setChordArray(this.baseName);
    }
  }

  jtabChord.prototype.setCustomChordArray = function(){
    this.chordArray = this.parseCustomChordArrayFromToken();
  };

  jtabChord.prototype.parseCustomChordArrayFromToken = function() {
    const notes = this.fullChordName.replace(/(%|\[.+\])/g, '');
    const pairs = notes.split('.');
    if (pairs.length < 6){
      this.isValid = false;
      return;
    }
    this.isValid = true;

    const array = [];
    for (let i = 0; i < pairs.length; i++){
      let pair = pairs[i].split('/')
      if (pair[0].match(/X/)){
        pair = [-1]
      }
      array.push(pair)
    }

    // fingeredFrets = array.reject(function(p){
    //   return p.length === 1
    // }).collect(function(p){
    //   return parseInt(p[0])
    //   }).flatten().without(0,-1)

    // `array` is an array of string/fretnumber pairs like [0,1].
    //find all the fret positions which arent X or 0. I'm sure there's a better way to do this.
    const fingeredFrets = array
      .filter(pair => pair.length != 1)
      .map(pair => parseInt(pair[0]))
      .filter(i => i > 0) // -1=X, 0=open

    const min = Math.min(...fingeredFrets)

    array.unshift(min-1);
    return array;
  };

  jtabChord.prototype.setChordArray = function(chordName: string) { // clones chord array (position 0) from chord ref data into this object
    this.chordArray = [];
    if (this.baseChords[chordName] === undefined ) {
      this.isValid = false;
      return;
    }
    this.isValid = true;
    let modelRef;
    if ('custom' in this.baseChords[chordName]) {
      modelRef = this.baseChords[chordName].custom;
    } else if ('chord' in this.baseChords[chordName]) {
      modelRef = this.baseChords[chordName].chord;
    } else {
      this.isValid = false;
      return;
    }

    this.chordArray = JSON.parse(JSON.stringify(modelRef));
  };

  jtabChord.prototype.setCagedChordArray = function() {
    if ( ! this.cagedBaseShape.match( /[CAGED]/ ) ) return;
    let caged_index = "CAGED".indexOf(this.cagedBaseShape) + 1; // get 1-based index
    const fret_widths = [3,2,3,2,2];

    let starting_fret = this.cagedBaseFret;

    for (let i = 1; i < this.cagedPos ; i++) {
      const index = (caged_index - 1) % 5;
      caged_index  = ( caged_index >= 5) ? 1 : caged_index + 1;
      starting_fret += fret_widths[index];
    }

    const modelChord =  "CAGED".charAt(caged_index - 1) + this.rootExt;
    this.setChordArray(modelChord);
    this.shiftChordArray(starting_fret,modelChord);
  };

  jtabChord.prototype.shiftChordArray = function(atFret: number, modelChord: string) { // shift chord to new fret position
    const initFret = this.chordArray[0];
    if (atFret != initFret) {
      const use_caged_fingering = this.isCaged && this.cagedPos > 0 && 'caged' in this.baseChords[modelChord];

      this.chordArray[0] = atFret - 1;
      for (let i = 1; i < this.chordArray.length ; i++) {
        const fret = this.chordArray[i][0] >= 0 ? this.chordArray[i][0] + atFret - initFret : this.chordArray[i][0];
        const finger = (use_caged_fingering) ? this.baseChords[modelChord].caged[i][1] : this.chordArray[i][1];
        this.chordArray[i] = [fret, finger];
      }
    }
  };



  //
  // define extensions to the Raphael class
  //
  Raphael.fn.tabtype = 0;  // 0 = none, 1 = tab & chord, 2 = chord, 3 = tab
  Raphael.fn.has_chord = false;
  Raphael.fn.has_tab = false;

  Raphael.fn.debug = false;
  Raphael.fn.scale = 1;
  Raphael.fn.margin_top = 36;
  Raphael.fn.margin_bottom = 10;
  Raphael.fn.margin_left = 16;
  Raphael.fn.margin_right = 10;

  Raphael.fn.current_offset = Raphael.fn.margin_left;

  Raphael.fn.string_spacing = 16;
  Raphael.fn.strings_drawn = 6;
  Raphael.fn.fret_spacing = 16;
  Raphael.fn.frets_drawn = 4;
  Raphael.fn.note_radius = 7;

  Raphael.fn.fret_width = Raphael.fn.string_spacing * ( Raphael.fn.strings_drawn - 1 );
  Raphael.fn.fret_height = Raphael.fn.fret_spacing * (Raphael.fn.frets_drawn + 0.5);
  Raphael.fn.chord_width = Raphael.fn.margin_left + Raphael.fn.fret_width + Raphael.fn.string_spacing + Raphael.fn.margin_right;
  Raphael.fn.chord_height = Raphael.fn.margin_top + Raphael.fn.fret_height + Raphael.fn.margin_bottom;

  Raphael.fn.tab_current_string = 0; // 1,2,3,4,5,6 or 0 = not set
  Raphael.fn.tab_margin_top = 10;
  Raphael.fn.tab_top = Raphael.fn.chord_height + Raphael.fn.tab_margin_top;
  Raphael.fn.tab_spacing = Raphael.fn.fret_spacing;
  Raphael.fn.tab_height = Raphael.fn.tab_spacing * 5;
  Raphael.fn.tab_char_width = 8;

  Raphael.fn.total_height = Raphael.fn.tab_top + Raphael.fn.tab_height + Raphael.fn.margin_bottom;

  Raphael.fn.color = "#000";
  Raphael.fn.fingering_text_color = "#fff";
  Raphael.fn.tab_text_color = "#000";


  // debug helper - puts grid marks on the rendered image
  Raphael.fn.debug_grid = function (width) {
    // h ticks
    this.path(this.svg_params(this.current_offset, 0,0,4)).attr({stroke: this.color, "stroke-width":0.2 })
    this.path(this.svg_params(  this.current_offset + this.margin_left, 0,0,2)).attr({stroke: this.color, "stroke-width":0.2 })
    this.path(this.svg_params(  this.current_offset + width - this.margin_right, 0,0,2)).attr({stroke: this.color, "stroke-width":0.2 })
    // v ticks
    if (this.tabtype == 3) {
      this.path(this.svg_params(this.current_offset, this.tab_margin_top,2,0)).attr({stroke: this.color, "stroke-width":0.2 })
    } else {
      this.path(this.svg_params(this.current_offset, this.margin_top,2, 0)).attr({stroke: this.color, "stroke-width":0.2 })
    }
  }


  // step the current position for drawing
  Raphael.fn.increment_offset = function (width) {
    if (width == null) width = this.chord_width
    if (this.debug) this.debug_grid(width);
    this.current_offset += width;
    this.setSize( this.current_offset, this.total_height );
  }

  Raphael.fn.svg_params = function(x,y,l1,l2) {
    // http://www.w3.org/TR/SVG/paths.html#PathData --helpful reading
    const move_line_to = "m"+x+" "+y+"l"+l1+" "+l2
    if(arguments.length == 4) return move_line_to
  }

  // draw the fretboard
  Raphael.fn.chord_fretboard = function ( position, chord_name ) {
    const fret_left = this.current_offset + this.margin_left;
    // conventional fret labels
    const fret_labels = [ '', '', '', 'III', '', 'V', '', 'VII', '', 'IX', '', '', 'XII', '', '', 'XV', '', 'XVII', '', 'XIX', '', 'XXI', '' ];
    // alternative friendly fret labels. Currently disabled, maybe bring these back as a configurable option?
    // const fret_labels = [ '', '1fr', '2fr', '3fr', '4fr', '5fr', '6fr', '7fr', '8fr', '9fr', '10fr', '11fr', '12fr', '13fr', '14fr', '15fr', '16fr', '17fr', '18fr', '19fr', '20fr', '21fr', '' ];

    this.text( // chord name
      fret_left + 2.5 * this.string_spacing,
      this.margin_top - 20,
      chord_name).attr({fill: this.tab_text_color, "font-size":"20px"});

    const stroke_width = position == 0 ? 3 : 0  // nut
    const chord_fretboard_path = this.path(this.svg_params(fret_left,this.margin_top,this.string_spacing * (this.strings_drawn - 1),0))
    chord_fretboard_path.attr({stroke: this.color, "stroke-width":stroke_width })

    for (let i = 0; i <= this.frets_drawn; i++ ) { // frets

      this.path(this.svg_params(fret_left,this.margin_top + (i * this.fret_spacing),this.string_spacing * (this.strings_drawn - 1), 0))

      const pos = ( fret_labels[ position + i ] === undefined ) ? '' : fret_labels[ position + i ];

      if ( pos.length > 0 ) { // draw fret position
        this.text(
            fret_left + this.fret_width + this.string_spacing * 1.0,
            this.margin_top + ( ( i - 0.5 ) * this.fret_spacing),
            pos).attr({stroke: this.tab_text_color, "font-size":"12px"});
      }
    }
    for (let i = 0; i < this.strings_drawn; i++ ) {
      this.path(this.svg_params(fret_left + (i * this.string_spacing),this.margin_top,0, this.fret_spacing * (this.frets_drawn + 0.5)))  // strings
    }
    this.tab_extend(this.chord_width); // extend the tab if present
  }


  // draw a stroke (/)
  Raphael.fn.stroke = function () {

    if (this.has_tab) {
      const width = this.tab_char_width * 3;
      // extend tab
      this.tab_extend(width);
      //  stroke
      const stroke_path = this.path(this.svg_params(this.current_offset + this.tab_char_width, this.tab_top  + (3.5 * this.tab_spacing),this.tab_char_width, - 2 * this.tab_spacing))
          stroke_path.attr({stroke: this.tab_text_color, "stroke-width":4 })

      this.increment_offset(width);
    } else if (this.has_chord) {
      const dx = this.string_spacing;
      const dy = 2 * this.fret_spacing;
      this.path(this.svg_params(this.current_offset + this.margin_left,
                          this.margin_top + this.fret_spacing + dy,dx,-dy)).attr({stroke: this.tab_text_color, "stroke-width":4 })

      this.increment_offset(  this.margin_left + dx + this.margin_right );
    }
  }


  // draw a bar
  Raphael.fn.bar = function () {
    let bar_stroke
    if (this.has_tab) {
      const width = this.tab_char_width * 2;
      // extend tab
      this.tab_extend(width);
      bar_stroke = this.path(this.svg_params(this.current_offset + this.tab_char_width, this.tab_top,0, this.tab_height))
      this.increment_offset(width);

    } else if (this.has_chord) {
      const fret_left = this.current_offset + this.margin_left;
      bar_stroke = this.path(this.svg_params(fret_left, this.margin_top,0, 0, this.fret_height))
      this.increment_offset( this.margin_left + this.margin_right );
    }
    bar_stroke.attr({stroke: this.color, "stroke-width":1 })
  }


  // draw double bar
  Raphael.fn.doublebar = function () {
    let path_1, path_2
    if (this.has_tab) {
      const width = this.tab_char_width + 8;
      // extend tab
      this.tab_extend(width);

      //  bar
      path_1 = this.path(this.svg_params(this.current_offset + this.tab_char_width, this.tab_top,0, this.tab_height))
      path_2 = this.path(this.svg_params(this.current_offset + this.tab_char_width + 6, this.tab_top,0, this.tab_height  ))
      this.increment_offset(width);

    } else if (this.has_chord) {
      const left = this.current_offset + this.margin_left;

      path_1 = this.path(this.svg_params(left, this.margin_top,0, this.fret_height))
      path_2 = this.path(this.svg_params(left + 6, this.margin_top,0, this.fret_height))

      this.increment_offset( this.margin_left + 6 + this.margin_right );
    }
    path_1.attr({stroke: this.color, "stroke-width":1 })
    path_2.attr({stroke: this.color, "stroke-width":4 })
  }


  // draw a note in a chord
  Raphael.fn.chord_note = function (position, string_number, note) {
    // NB: internal string_number in chords counts from low to high
    const fret_number = note[0];
    const fret_left = this.current_offset + this.margin_left;

    if (fret_number < 0 ) {
      // muted/not played
      this.text(fret_left + (string_number - 1) * this.string_spacing, this.margin_top - 8, "x").attr({stroke: this.tab_text_color, "font-size":"9px"});
    } else if (fret_number == 0 ) {
      // open
      this.text(fret_left + (string_number - 1) * this.string_spacing, this.margin_top - 8, "o").attr({stroke: this.tab_text_color, "font-size":"9px"});
    } else {
      const fret_dy = (fret_number - position - 0.5) * this.fret_spacing;
      //const circle =
      this.circle(
        fret_left + (string_number - 1) * this.string_spacing,
        this.margin_top + fret_dy, this.note_radius).attr({stroke: this.color, fill: this.color});
      if ( ! (note[1] === undefined) ) {
        this.text( fret_left + (string_number - 1) * this.string_spacing,
        this.margin_top + fret_dy, note[1] ).attr({fill: this.fingering_text_color, "font-size":"12px"});
      }
    }

    if ( this.has_tab && fret_number >= 0 ) {
      this.draw_tab_note( (this.strings_drawn - string_number + 1), fret_number, this.margin_left + this.string_spacing * 2.5 );
    }
  }


  // extend the tab drawing area
  Raphael.fn.tab_extend = function (width) {
    if (this.has_tab == false) return;
    for (let i = 0; i < this.strings_drawn; i++ ) {
      this.path(this.svg_params(this.current_offset, this.tab_top  + (i * this.tab_spacing),width, 0)).attr({stroke: this.color})
    }
  }


  // start the tab
  Raphael.fn.tab_start = function () {
    if (this.has_tab == false) return;
    const width = this.tab_char_width * 3;
    //  start bar
    this.path(this.svg_params(this.current_offset, this.tab_top,0, this.tab_height)).attr({stroke: this.color, "stroke-width":1 })

    // extend tab
    this.tab_extend(width);

    //write TAB
    this.text(this.current_offset + this.tab_char_width, this.tab_top + this.tab_spacing * 1.5, "T").attr({stroke: this.color, "font-size":"14px"});
    this.text(this.current_offset + this.tab_char_width, this.tab_top + this.tab_spacing * 2.5, "A").attr({stroke: this.color, "font-size":"14px"});
    this.text(this.current_offset + this.tab_char_width, this.tab_top + this.tab_spacing * 3.5, "B").attr({stroke: this.color, "font-size":"14px"});
    this.increment_offset(width);

  }


  // draw an individual note in the tab
  Raphael.fn.draw_tab_note = function (string_number, token, left_offset) {
    // NB: internal string_number in tab counts from high to low
    this.text(this.current_offset + left_offset,
            this.tab_top + this.tab_spacing * (string_number - 1),
            token).attr({fill: this.color, "font-size":"16px"});
  }

  // gets string number from token $[1-6|EADGBe]
  Raphael.fn.get_string_number = function (token) {
    let string_number = null;
    if ( token.match( /^\$[1-6]/ ) != null ) {
      string_number = token.substr(1,1);
    } else if ( token.match( /^\$[EADGBe]/ ) != null ) {
      string_number =  6 - "EADGBe".indexOf(token.substr(1,1));
    }
    return string_number;
  }


  // identify if full chord of notes specified i.e. A:1 = X02220 or C:4 = 8.10.10.9.8.8
  // returns:
  //   false = not a full chord representation
  //   array = array of notes (low to high)
  Raphael.fn.get_fullchord_notes = function (token) {
    let rc = false;
    // eslint-disable-next-line no-useless-escape
    if ( token.match(/[^\.xX0-9]/) != null ) {
      rc = false;
    } else {
      if ( token.match( /\./ ) != null ) {
        rc = token.split('.');
      } else {
        rc = token.split('');
      }
      if (rc.length != 6) rc = false;
    }
    return rc;
  }


  // draw a token on the tab
  Raphael.fn.tab_note = function (token) {
    if (this.has_tab == false) return;

    if ( token.match( /\$/ ) != null ) { // contains a string specifier
      if ( token.match( /\./ ) != null ) { // is a multi-string specifier
        const parts = token.split(".");
        let width = 2;
        for (let i = 0; i < parts.length ; i++) { // get the max length of the multi-string specifiers
          if ( parts[i].length > width ) width = parts[i].length;
        }
        width *= this.tab_char_width + 1;
        this.tab_extend( width );
        for (let i = 0; i < parts.length ; i++) {
          const part = parts[i];
          const string_number = this.get_string_number(part);
          if (string_number != null) {
            this.tab_current_string = string_number;
          } else if ( this.tab_current_string > 0 )  {
            this.draw_tab_note( this.tab_current_string, part, width * 0.5 );
          }
        }
        this.increment_offset( width );

      } else { // just a string setting
        this.tab_current_string = this.get_string_number(token);
      }
    } else {
      const fullchord_notes = this.get_fullchord_notes(token);
      if ( fullchord_notes ) {
        const max_chars = fullchord_notes.max_chars();
        const width = this.tab_char_width * (max_chars + 2);
        this.tab_extend( width );
        for (let i = 0; i < fullchord_notes.length ; i++) {
          this.draw_tab_note( 6 - i, fullchord_notes[i], width * 0.5 );
        }
        this.increment_offset( width );
      } else if ( this.tab_current_string > 0 ) { // else draw literal, but only if a current string selected
        const width = this.tab_char_width * ( token.length + 2 );
        this.tab_extend( width );
        this.draw_tab_note( this.tab_current_string, token, width * 0.5 );
        this.increment_offset( width );
      }
    }
  }


  // main drawing routine entry point: to render a token - chord or tab
  Raphael.fn.render_token = function (token) {

    const c = new jtabChord(token);

    if ( c.isValid ) { // draw chord
      const chord = c.chordArray;
      // this.chord_fretboard(chord[0], c.fullChordName );
      this.chord_fretboard(chord[0], c.chordName );
      for (let i = 1; i < chord.length ; i++) {
        this.chord_note(chord[0], i, chord[i]);
      }
      this.increment_offset();

    } else {
      if (token == "/" ) {
        this.stroke();
      } else if (token == "|" ) {
        this.bar();
      } else if (token == "||" ) {
        this.doublebar();
      } else if ( this.has_tab ) {
        this.tab_note( token );
      }

    }
  }


  //
  // add jtab class methods
  //


  // determine nature of the token stream
  // returns:
  //   1 : chord and tab present
  //   2 : chord only
  //   3 : tab only
  //   0 : unknown
  jtab.characterize = function (notation) {
    let tabtype = 0;

    if(notation == undefined){
      notation = '';
    }

    const gotCustomChord = ( notation.match( /[%]([0-4|T|X])?/ )   != undefined );
    // eslint-disable-next-line no-useless-escape
    const gotNormalChord = ( notation.match( /[^\$][A-G]|^[A-G]/ )  != undefined );
    // eslint-disable-next-line no-useless-escape
    const gotTab = ( ( notation.match( /\$/ ) != null ) || ( notation.match( /[^%][0-9|Xx|\.]{6,}/ ) != null ) );
    const gotChord =  gotNormalChord || gotCustomChord ;

    // set defaults - apply scaling here (TODO)
    Raphael.fn.current_offset = Raphael.fn.margin_left;
    if ( gotChord && gotTab ) { // chord and tab
      tabtype = 1;
      Raphael.fn.has_chord = true;
      Raphael.fn.has_tab = true;
      Raphael.fn.tab_top = Raphael.fn.chord_height + Raphael.fn.tab_margin_top;
      Raphael.fn.total_height = Raphael.fn.tab_top + Raphael.fn.tab_height + Raphael.fn.margin_bottom;
    } else if ( gotChord ) { // chord only
      tabtype = 2;
      Raphael.fn.has_chord = true;
      Raphael.fn.has_tab = false;
      Raphael.fn.tab_top = Raphael.fn.chord_height + Raphael.fn.tab_margin_top;
      Raphael.fn.total_height = Raphael.fn.chord_height;
    } else if ( gotTab ) { // tab only
      tabtype = 3;
      Raphael.fn.has_chord = false;
      Raphael.fn.has_tab = true;
      Raphael.fn.tab_top = Raphael.fn.tab_margin_top;
      Raphael.fn.total_height = Raphael.fn.tab_top + Raphael.fn.tab_height + Raphael.fn.margin_bottom;
    }
    Raphael.fn.tabtype = tabtype;
    return tabtype;
  }

  // utility function to get calculated style based on given element
  jtab.getStyle = function (element, style) {
    let value = element.css(style);
    if(!value) {
      if(document.defaultView) {
        value = document.defaultView.getComputedStyle(element[0], "").getPropertyValue(style);
      } else if(element.currentStyle) {
        value = element.currentStyle[style];
      }
    }

    return value;
  }

  // set color pallette for the jtab rendering
  jtab.setPalette = function (element) {
    let fgColor = jtab.getStyle( document.querySelector(element), 'color' );
    if (!fgColor) {
      fgColor = '#000';
    }
    Raphael.fn.color = fgColor;
    Raphael.fn.tab_text_color = fgColor;

    let bgColor = jtab.getStyle( document.querySelector(element), 'background-color' );
    if (!bgColor || (bgColor == 'transparent') || (bgColor == 'rgba(0, 0, 0, 0)')) {
      bgColor = '#fff';
    }
    Raphael.fn.fingering_text_color = bgColor;
  }

  // Render the tab for a given +element+.
  // +element+ is a DOM node
  // +notation_text+ is the optional notation to render (if not specified, +element+ text content will be used)
  // After rendering, the +element+ will be given the additional "rendered" class.
  jtab.render = function (element,notation_text) {

    const notation = notation_text || document.querySelector(element).text() || '';

    const tabtype = jtab.characterize( notation );
    if (tabtype == 0 ) return;

    const rndID="builder_"+jtab.element_count++;

    // add the Raphael canvas in its own DIV. this gets around an IE6 issue with not removing previous renderings
    const canvas_holder = document.querySelector('<div id="'+rndID+'"></div>').css({height: Raphael.fn.total_height});

    document.querySelector(element).html(canvas_holder);
    jtab.setPalette(element);
    canvas = Raphael(rndID, 80, Raphael.fn.total_height );
    canvas.tab_start();

    const tokens = notation.split(/\s/);
    for(let i = 0; i < tokens.length; i++) {
      canvas.render_token(tokens[i]);
    }
    document.querySelector(element).addClass('rendered');
  }

  // Render all nodes with class 'jtab'.
  // +within_scope+ is an optional selector that will restrict rendering to only those nodes contained within.
  jtab.renderimplicit = function() {
    document.querySelector('.jtab').not('.rendered').each( function(name, index) { jtab.render(this); } );
  }

  // initialize jtab library.
  // Sets up to run implicit rendering on window.onload


  window.onload = function() {
    jtab.renderimplicit();
  }

  return {jtab, jtabChord}
})();

export {jtab, jtabChord}