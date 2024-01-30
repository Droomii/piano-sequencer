import {makeAutoObservable} from "mobx";
import {NoteAudioEvent} from "@common/define/NoteAudioEvent";
import {NoteVM} from "../../component/pianoRoll/view/note/NoteVM";
import {EInstrumentTypeCode} from "@common/define/EInstrumentTypeCode";

const TICK = 96;

export class InstrumentService {
    private readonly _audioBuffers: Promise<AudioBuffer>[];
    private _bufferSources: NoteAudioEvent[] = [];
    private _ctx: AudioContext = new AudioContext();
    private _playbackNotes: Promise<NoteAudioEvent>[] = [];
    constructor(inst: EInstrumentTypeCode) {
        this._audioBuffers = Array(85).fill(0).map(async (v, i) => {
            const arrBuff = await fetch(`/assets/audio/${inst}/${String(i).padStart(2, '0')}.ogg`)
                .then(val => val.arrayBuffer());
            return this._ctx.decodeAudioData(arrBuff);
        });
        makeAutoObservable<this, '_audioURIs' | '_audios' | '_playbackNotes'>(this, {
            _audioURIs: false,
            _audios: false,
            _playbackNotes: false
        }, {autoBind: true});
    }

    async pressKey(key: number, delay: number = this._ctx.currentTime) {
        if (this._bufferSources.length > 10) {
            this.release(this._bufferSources.shift());
        }
        const event = await this.play(key, delay);
        this._bufferSources.push(event);
        return event;
    }

    releaseKey(target: number | NoteAudioEvent) {
        if (typeof target === "number") {
            this._bufferSources = this._bufferSources.filter(v => {
                if (v.key === target) {
                    this.release(v);
                    return false;
                }
                return true;
            })
            return;
        }
        this.release(target);
    }

    async play(key: number, delay: number = this._ctx.currentTime): Promise<NoteAudioEvent> {
        const source = this._ctx.createBufferSource();
        const gain = this._ctx.createGain();
        source.buffer = await this._audioBuffers[key];
        source.connect(gain);
        gain.connect(this._ctx.destination);
        source.start(delay);
        return {source, key, gain: gain.gain};
    }



    private release(event?: NoteAudioEvent, delay: number = this._ctx.currentTime) {
        if (!event) return;
        const {gain, source} = event;
        source.stop(this._ctx.currentTime + (delay ?? 0) + 0.2);
        gain.linearRampToValueAtTime(0, delay + 0.2)
    }

    private static sustain(event: NoteAudioEvent, until: number) {
        event.gain.linearRampToValueAtTime(1, until);
    }


    get keyCount(): number {
        return 85;
    }

    playback(notes: ReadonlyArray<NoteVM>, ticksPerSec: number) {
        if (notes.length === 0) return;
        const delay = this._ctx.currentTime;
        const finalEndSec = notes.map(v => v.end).reduce((i1, i2) => Math.max(i1, i2)) / ticksPerSec;
        this._playbackNotes = notes.map(async ({pitch, start, end}) => {
            const startSec = delay + start / ticksPerSec
            const endSec = delay + end / ticksPerSec;
            const event = await this.play(pitch, startSec);
            InstrumentService.sustain(event, endSec);
            this.release(event, endSec);
            return event;
        });
        return new Promise<void>(resolve => setTimeout(resolve, (finalEndSec) * 1000));
    }

    stopPlayback() {
        this._playbackNotes.forEach(async v => {
            const event = await v;
            event.gain.cancelScheduledValues(0);
            this.release(event);
        })
    }
}