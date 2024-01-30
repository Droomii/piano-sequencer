import {NoteVM} from "../../component/pianoRoll/view/note/NoteVM";
import {PianoRollVM} from "../../component/pianoRoll/PianoRollVM";
import NoteEditHistory, {NoteEditDetail} from "../../component/pianoRoll/model/NoteEditHistory";

type HistoryTargetType = NoteVM;
type ContainerHistoryType = PianoRollVM;
type HistoryDetailType = NoteEditDetail;

export default interface IEditHistory<T extends HistoryTargetType,
                                      C extends ContainerHistoryType,
                                      H extends HistoryDetailType> {
    targetNotes: T[];
    undo(parent: C): void;
    redo(parent: C): void;
    detail: H;
}