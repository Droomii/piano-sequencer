import {makeAutoObservable} from "mobx";
import React from "react";
import {NoteVM} from "./view/note/NoteVM";
import {InstrumentServiceGroup} from "../../service/instrument/InstrumentServiceGroup";
import {NoteAudioEvent} from "@common/define/NoteAudioEvent";
import NoteEditHistory from "./model/NoteEditHistory";
import {ENoteEditType} from "./define/ENoteEditType";

const TICK = 96;

type Denominators = 1 | 2 | 4 | 8 | 16;
const quantumUnits = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
enum ClickMode {
    DRAW = 1,
    SELECT
}

export class PianoRollVM {
    private _instService = InstrumentServiceGroup.instance.piano;
    private _scaleX: number = 2;
    private _scaleY: number = 2;
    private _notes: NoteVM[] = [];
    private _containerRef: HTMLDivElement | null = null;
    private _contentRef: HTMLDivElement | undefined;
    private _keysRef: HTMLDivElement | undefined;
    private _tempo: number = 120;
    private _end = 96 * 24;
    private _isPlaying = false;
    private _interruptPlayback?: (value: boolean | PromiseLike<boolean> ) => void;
    private _history: NoteEditHistory[] = [];
    private _undoHistory: NoteEditHistory[] = [];

    private _isSelectDragging = false;
    private _selectRectX1 = 0;
    private _selectRectY1 = 0;
    private _selectRectX2 = 0;
    private _selectRectY2 = 0;

    private _clickMode: ClickMode = ClickMode.DRAW;

    numerator: number = 4;
    denominator: Denominators = 4;
    private _quantumIdx: number = 7;

    constructor() {
        makeAutoObservable(this, undefined, {autoBind: true});
    }

    initialize(ref: HTMLDivElement) {
        this._containerRef = ref;

        window.addEventListener('keydown', this.handleKeyDown)
    }


    private handleKeyDown(e: KeyboardEvent) {
        if (document.activeElement !== document.body) return;
        switch(e.key.toLowerCase()) {
            case "delete":
            case "backspace":
                this.removeNotes(...this.selectedNotes)
                break;
            case "1":
                this.clickMode = 1;
                break;
            case '2':
                this.clickMode = 2;
                break;
            case ' ':
                e.preventDefault();
                this.playback();
                break;
            case 'a':
                e.preventDefault();
                if (e.ctrlKey)
                    this.notes.forEach(v => v.select());
                break;
            case 'z':
                if (e.ctrlKey && e.shiftKey) {
                    const undoHistory = this._undoHistory.pop();
                    if (undoHistory) {
                        undoHistory.redo(this);
                        this._history.push(undoHistory);
                    }
                } else if (e.ctrlKey) {
                    const history = this._history.pop();
                    if (history) {
                        history.undo(this);
                        this._undoHistory.push(history)
                    }
                }
        }

    }

    private syncScroll() {
        if (!(this._contentRef && this._keysRef)) return;
        let ignoreScrollEvent = false;

        const listener = (e: Event) => {
            if (e.currentTarget === null
            || !this._contentRef
            || !this._keysRef) return;
            const target1 = e.currentTarget === this._contentRef ? this._contentRef : this._keysRef
            const target2 = e.currentTarget === this._contentRef ? this._keysRef : this._contentRef

            let ignore = ignoreScrollEvent;
            ignoreScrollEvent = false;
            if (ignore) return;
            ignoreScrollEvent = true;
            target2.scrollTop = target1.scrollTop;
        }
        this._keysRef.addEventListener("scroll", listener);
        this._contentRef.addEventListener("scroll", listener);
    }

    setContentRef(el: HTMLDivElement) {
        this._contentRef = el;
        this.syncScroll();
    }

    setKeysRef(el: HTMLDivElement) {
        this._keysRef = el;
        this.syncScroll();
    }

    get scaleX(): number {
        return this._scaleX;
    }

    set scaleX(val: number) {
        this._scaleX = val;
    }

    get scaleY(): number {
        return this._scaleY;
    }

    set scaleY(val: number) {
        this._scaleY = val;
    }

    get notes(): ReadonlyArray<NoteVM> {
        return this._notes;
    }

    get quantum(): number {
        return TICK / this.rawQuantum * 4;
    }

    get rawQuantum(): number {
        return quantumUnits[this._quantumIdx];
    }

    set rawQuantum(val: number) {
        if (this.rawQuantum > val) {
            this._quantumIdx--;
        } else if (this.rawQuantum < val) {
            this._quantumIdx++;
        }
        this._quantumIdx = this._quantumIdx >= quantumUnits.length
            ? quantumUnits.length -1
            : this._quantumIdx < 0
                ? 0
                : this._quantumIdx;
    }

    quantizeX(val: number) {
        return Math.ceil(val / this.quantum) * this.quantum;
    }

    readonly handleMouseDownBackground = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.buttons !== 1) return;

        if (this.clickMode === ClickMode.SELECT && e.detail === 1) {
            const {top, left, height} = e.currentTarget.getBoundingClientRect()
            this.selectRectX1 = this.selectRectX2 = e.clientX - left;
            this.selectRectY1 = this.selectRectY2 = e.clientY - top;
            const scaledHeight = height / this.scaleY / 7;
            const initSelectedNotes = this.notes.filter(v => v.isSelected);

            const dragListener = (e: MouseEvent) => {
                this.isSelectDragging = true;
                this.selectRectX2 = e.clientX - left;
                this.selectRectY2 = e.clientY - top;
                this._notes.forEach(v => {
                    if (e.ctrlKey && initSelectedNotes.some(note => note === v)) {
                        v.select();
                        return;
                    }

                    const scaledY1 = scaledHeight - this.scaledRectY1;
                    const scaledY2 = scaledHeight - this.scaledRectY2;
                    if (v.start < this.scaledRectX2
                        && v.end > this.scaledRectX1
                        && v.pitch <= scaledY1
                        && v.pitch >= scaledY2)
                        v.select();
                    else v.deselect();
                });
            }

            const mouseupListener = () => {
                window.removeEventListener("mousemove", dragListener);
                window.removeEventListener("mouseup", mouseupListener);
                if (this.isSelectDragging)
                    this.isSelectDragging = false;
                else this.deselectAll();
            }
            window.addEventListener("mousemove", dragListener);
            window.addEventListener("mouseup", mouseupListener)

            return;
        }

        this.deselectAll();
        if (e.detail !== this.clickMode) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.x) / this.scaleX;
        const y = rect.bottom - e.clientY;
        const pitch = this.getPitch(y);
        const quantizedX = this.getQuantizedX(x);
        this.addNote(pitch, quantizedX, e);
    }

    deselectAll() {
        this._notes.forEach(v => v.deselect());
    }

    get selectedNotes() {
        return this._notes.filter(v => v.isSelected);
    }

    addNote(pitch: number, quantizedX: number, e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        const newNote = new NoteVM(this, pitch, quantizedX, this.quantum, e);
        this.pushHistory(new NoteEditHistory({
            editType: ENoteEditType.ADD
        }, newNote))
        this._notes.push(newNote);
    }

    sortNotes() {
        this._notes.sort((a, b) => a.start - b.start);
    }


    private getPitch(y: number) {
        return Math.floor(y / (7 * this.scaleY));
    }

    private getQuantizedX(x: number) {
        return Math.floor(x / (this.quantum)) * (this.quantum);
    }

    get end(): number {
        return this._end;
    }

    get keyCount(): number {
        return this._instService.keyCount;
    }

    playNote(idx: number) {
        return this._instService.pressKey(idx);
    }

    releaseNote(idx: number | NoteAudioEvent) {
        this._instService.releaseKey(idx);
    }

    removeNotes(...notes: NoteVM[]) {
        this.undoAddNotes(...notes);
        this.pushHistory(new NoteEditHistory({
            editType: ENoteEditType.REMOVE
        }, ...notes))
    }

    undoAddNotes(...notes: NoteVM[]) {
        this._notes = this._notes.filter(v => !notes.includes(v));
    }

    get tempo(): number {
        return this._tempo;
    }

    set tempo(value: number) {
        this._tempo = value;
    }

    get isPlaying() {
        return this._isPlaying;
    }

    set isPlaying(val: boolean) {
        this._isPlaying = val;
    }

    async playback() {
        if (this.isPlaying) {
            this.stopPlayback();
            return;
        }
        this.isPlaying = true;
        const interruptPromise = new Promise<boolean>(resolve => {
            this._interruptPlayback = resolve;
        })
        const playbackPromise = this._instService.playback(this.notes, this.ticksPerSec);
        const res = await Promise.race([interruptPromise, playbackPromise]);
        if (res) return;
        this.isPlaying = false;
    }

    stopPlayback() {
        this._interruptPlayback!(true);
        this._instService.stopPlayback();
        this.isPlaying = false;
    }

    get clickMode() {
        return this._clickMode;
    }

    set clickMode(value: number) {
        this._clickMode = value;
    }

    get finalEndSec(): number {
        return this.noteEnd / this.ticksPerSec;
    }


    get noteEnd(): number {
        if(this._notes.length === 0) return 0;
        return this._notes.map(v => v.end).reduce((i1, i2) => Math.max(i1, i2));
    }

    get ticksPerSec(): number {
        return TICK * this._tempo / 60;

    }

    get isSelectDragging(): boolean {
        return this._isSelectDragging;
    }

    set isSelectDragging(value: boolean) {
        this._isSelectDragging = value;
    }

    set selectRectX1(value: number) {
        this._selectRectX1 = value;
    }

    set selectRectY1(value: number) {
        this._selectRectY1 = value;
    }

    set selectRectX2(value: number) {
        this._selectRectX2 = value;
    }

    set selectRectY2(value: number) {
        this._selectRectY2 = value;
    }

    get selectRectX1() {
        return Math.min(this._selectRectX1, this._selectRectX2);
    }

    get selectRectY1() {
        return Math.min(this._selectRectY1, this._selectRectY2);
    }

    get selectRectX2() {
        return Math.max(this._selectRectX1, this._selectRectX2);
    }

    get selectRectY2() {
        return Math.max(this._selectRectY1, this._selectRectY2);
    }

    get scaledRectX1() {
        return this.selectRectX1 / this.scaleX;
    }

    get scaledRectY1() {
        return Math.floor(this.selectRectY1 / this.scaleY / 7 + 1);
    }

    get scaledRectX2() {
        return this.selectRectX2 / this.scaleX;
    }

    get scaledRectY2() {
        return Math.floor(this.selectRectY2 / this.scaleY / 7 + 1);
    }

    private selectIfInArea(note: NoteVM) {
        if (note.start < this.scaledRectX2
            && note.end > this.scaledRectX1
            && note.pitch < this.scaledRectY1 && note.pitch > this.scaledRectY2)
            note.select();
        else note.deselect();
    }

    get selectRectWidth() {
        return Math.abs(this._selectRectX1 - this._selectRectX2);
    }

    get selectRectHeight() {
        return Math.abs(this._selectRectY1 - this._selectRectY2);
    }

    pasteNotes(targetNotes: NoteVM[]) {
        this._notes.push(...targetNotes);
        this.sortNotes();
    }

    pushHistory(history: NoteEditHistory) {
        this._history.push(history);
        if (this._history.length > 100)
            this._history.shift();
        this._undoHistory = [];
    }
}