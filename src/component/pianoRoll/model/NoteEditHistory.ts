import IEditHistory from "@common/define/IEditHistory";
import {NoteVM} from "../view/note/NoteVM";
import {PianoRollVM} from "../PianoRollVM";
import {ENoteEditType} from "../define/ENoteEditType";


export interface NoteEditDetail {
    editType: ENoteEditType;
    pitchDiff?: number;
    durationDiff?: number;
    startDiff?: number;
}

class NoteEditHistory implements IEditHistory<NoteVM, PianoRollVM, NoteEditDetail> {
    targetNotes: NoteVM[];
    constructor(public detail: NoteEditDetail, ...notes: NoteVM[]) {
        this.targetNotes = notes;
    }

    undo(parent: PianoRollVM): void {
        switch(this.detail.editType) {
            case ENoteEditType.ADD:
                parent.undoAddNotes(...this.targetNotes);
                break;
            case ENoteEditType.REMOVE:
                parent.pasteNotes(this.targetNotes);
                break;
            case ENoteEditType.EDIT:
                this.targetNotes.forEach(this.undoEdit.bind(this));
        }
    }

    redo(parent: PianoRollVM): void {
        switch(this.detail.editType) {
            case ENoteEditType.ADD:
                parent.pasteNotes(this.targetNotes);
                break;
            case ENoteEditType.REMOVE:
                parent.undoAddNotes(...this.targetNotes);
                break;
            case ENoteEditType.EDIT:
                this.targetNotes.forEach(this.redoEdit.bind(this));
        }
    }

    private undoEdit(note: NoteVM) {
        if (this.detail.editType !== ENoteEditType.EDIT) return;
        note.pitch -= this.detail.pitchDiff!;
        note.start -= this.detail.startDiff!;
        note.duration -= this.detail.durationDiff!;
    }

    private redoEdit(note: NoteVM) {
        if (this.detail.editType !== ENoteEditType.EDIT) return;
        note.pitch += this.detail.pitchDiff!;
        note.start += this.detail.startDiff!;
        note.duration += this.detail.durationDiff!;
    }
}

export default NoteEditHistory;