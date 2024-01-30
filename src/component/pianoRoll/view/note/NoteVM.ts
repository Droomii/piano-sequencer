import {makeAutoObservable, reaction, runInAction} from "mobx";
import {PianoRollVM} from "../../PianoRollVM";
import React from "react";
import {Util} from "@common/util/Util";
import {NoteAudioEvent} from "@common/define/NoteAudioEvent";
import NoteEditHistory from "../../model/NoteEditHistory";
import {ENoteEditType} from "../../define/ENoteEditType";

const NOTE_DEFAULT_WIDTH = 7;

export class NoteVM {

    private _ref?: HTMLDivElement;
    private _isSelected: boolean = false;
    private _notePlayEvent: NoteAudioEvent | null = null;

    constructor(
        private parentVM: PianoRollVM,
        private _pitch: number,
        private _start: number,
        private _duration: number,
        initEvent?: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) {

        makeAutoObservable(this, undefined, {autoBind: true});

        if (initEvent) {
            this.select();
            this.startDrag(initEvent, "end", true);
        }
    }

    set ref(val: HTMLDivElement) {
        this._ref = val;
    }

    startDrag(e: React.MouseEvent<HTMLDivElement, MouseEvent>, dragType: "start" | "end" | "move", initMove = false) {
        if (!this.isSelected && !e.ctrlKey) {
            this.parentVM.deselectAll();
        }
        this.select();
        e.stopPropagation();
        if (e.target !== e.currentTarget || e.buttons !== 1) return;
        if (this._ref && e.detail === this.parentVM.clickMode && dragType === "move") {
            this.remove();
            return;
        }
        this.play();
        const clickedNoteOffset = this.quantize((e.clientX - e.currentTarget.getBoundingClientRect().left) / this.scaleX, Math.floor);
        let changed = false;
        const originalStart = this.start;
        const originalDuration = this.duration;
        const originalPitch = this.pitch;
        const dragListener = (e: MouseEvent) => {
            changed = true;
            try {
                const {
                    top: parentTop = 0,
                    height: parentHeight = 0,
                    left: parentLeft = 0,
                    width: parentWidth = 0
                } = this._ref?.parentElement?.getBoundingClientRect()!;
                const bottom = Math.min(Math.max(0, parentHeight - e.clientY + parentTop), parentHeight - this.height);
                const left = Math.round(Math.min(parentWidth, Math.max(0, e.clientX - parentLeft)) / this.scaleX);
                switch (dragType) {
                    case "start":
                        this.stretchBackward(left);
                        break;
                    case "end":
                        this.setEnd(left);
                        break;
                    case "move":
                        this.move(Math.floor(bottom / (this.scaleY * 7)), left - clickedNoteOffset)
                }
            } catch (e) {
                return;
            }

        }

        const mouseupListener = (e: MouseEvent) => {
            window.removeEventListener("mousemove", dragListener);
            window.removeEventListener("mouseup", mouseupListener);
            if (!changed && !e.ctrlKey) {
                runInAction(() => {
                    this.parentVM.deselectAll();
                    this.select();
                })
            }
            if (changed && !initMove) {
                const pitchDiff = this.pitch - originalPitch;
                const durationDiff = this.duration - originalDuration;
                const startDiff = this.start - originalStart;
                this.parentVM.pushHistory(new NoteEditHistory({
                    editType: ENoteEditType.EDIT, pitchDiff, durationDiff, startDiff
                }, this, ...this.otherSelectedNotes))
            }
            this.parentVM.notes.forEach(v => v.release());
            this.parentVM.sortNotes();
        }
        window.addEventListener("mousemove", dragListener);
        window.addEventListener("mouseup", mouseupListener)
    }

    private quantize(value: number, quantizeFunc = Math.ceil) {

        return quantizeFunc(value / this.quantum) * this.quantum;
    }

    move(pitch: number, start: number, propagate = true) {
        const beforePitch = this.pitch;
        const beforeStart = this.start;
        const validStart = propagate ? this.toValidStart(start) : start;
        let startDiff = validStart - beforeStart;
        let pitchDiff = pitch - beforePitch;
        if (!startDiff && !pitchDiff) return;
        if (propagate) {
            if (this.otherSelectedNotes.some(v => !v.isValidStart(startDiff))) {
                startDiff = 0;
            }
            if (this.otherSelectedNotes.some(v => !v.isValidPitch(pitchDiff))) {
                pitchDiff = 0;
            }
            this.otherSelectedNotes.forEach(v => v.move( v.pitch + pitchDiff,v.start + startDiff, false));
        }
        pitchDiff && propagate && this.release();
        this.start += startDiff;
        this.pitch += pitchDiff;
        pitchDiff && propagate && this.play();
    }

    get pitch(): number {
        return this._pitch;
    }

    get scaleY() {
        return this.parentVM.scaleY;
    }

    get scaleX() {
        return this.parentVM.scaleX;
    }

    get quantum() {
        return this.parentVM.quantum;
    }

    set pitch(value: number) {
        if (value < 0 || value > this.parentVM.keyCount - 1) return;
        this._pitch = value;
    }

    isValidPitch(value: number) {
        return this.pitch + value >= 0 && this.pitch + value <= this.parentVM.keyCount - 1
    }

    get start(): number {
        return this._start;
    }

    set start(value: number) {
        this._start = value;
    }

    stretchBackward(value: number, propagate: boolean = true) {
        const before = this.start;
        const quantizedStart = this.toValidStart(value, false);
        const diff = quantizedStart - before;
        if (!diff) {
            return;
        }

        if (propagate) {
            if (this.otherSelectedNotes.some(v => !v.isValidStart(diff, false))) {
                return;
            }
            this.otherSelectedNotes.forEach(v => v.stretchBackward(v.start + diff, false));
        }

        this.start = quantizedStart;
        this.duration += before - this.start;
    }

    toValidStart(value: number, isMove = true): number {
        const quantizedValue = this.quantize(value, Math.floor);
        if (!isMove && quantizedValue >= this.end) return this.end - this.quantum;
        if (this.isLaterThanEnd(quantizedValue + this.duration)) return this.parentVM.end - this.duration;

        return Util.relu(quantizedValue);
    }

    isValidStart(value: number, isMove = true): boolean {
        const quantizedValue = this.start + value;
        return !this.isLaterThanEnd(quantizedValue + this.duration)
            && (isMove || quantizedValue < this.end)
            && quantizedValue >= 0
    }

    isLaterThanEnd(value: number) {
        return value >= this.parentVM.end;
    }

    get duration(): number {
        return this._duration;
    }

    set duration(value: number) {
        this._duration = this.toValidDuration(value);
    }

    toValidDuration(value: number): number {
        const quantizedValue = this.quantize(value);
        if (this.isNotPositive(quantizedValue)) return this.quantum;
        if (this.isDurationTooLong(quantizedValue)) return this.parentVM.end - this.start;
        return quantizedValue;
    }

    isNotPositive(value: number): boolean {
        return value <= 0;
    }

    isDurationTooLong(value: number): boolean {
        return this.start + value > this.parentVM.end;
    }

    isValidDuration(value: number): boolean {
        const quantizedValue = this.quantize(value);
        return !(this.isNotPositive(quantizedValue) || this.isDurationTooLong(quantizedValue));
    }

    setEnd(val: number, propagate = true) {
        const originalDuration = this.duration;
        const newDuration = this.toValidDuration(val - this.start);
        const diff = newDuration - originalDuration;
        if (propagate) {
            if (!diff || this.otherSelectedNotes.some(v => {
                return !v.isValidDuration(v.duration + diff)
            })) return;
            this.otherSelectedNotes.forEach(v => v.duration += diff);
        }

        this.duration = newDuration;
    }

    get end(): number {
        return this.start + this.duration;
    }

    remove() {
        this.parentVM.removeNotes(this);
    }

    get height(): number {
        return NOTE_DEFAULT_WIDTH * this.scaleY;
    }

    get width(): number {
        return this.duration * this.scaleX;
    }

    get isSelected(): boolean {
        return this._isSelected;
    }

    async play() {
        this._notePlayEvent = await this.parentVM.playNote(this._pitch);
    }

    release() {
        this._notePlayEvent && this.parentVM.releaseNote(this._notePlayEvent);
    }

    select() {
        this._isSelected = true;
    }

    deselect() {
        this._isSelected = false;
    }

    get otherSelectedNotes(): NoteVM[] {
        return this.parentVM.notes.filter(v => v.isSelected && v !== this);
    }
}
