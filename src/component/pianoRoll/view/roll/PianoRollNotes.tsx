import {observer} from "mobx-react";
import React from "react";
import Note from "../note/Note";
import {PianoRollVM} from "../../PianoRollVM";

interface IPianoRollNotesProps {
    vm: PianoRollVM;
}

const PianoRollNotes = observer((props: IPianoRollNotesProps) => {
    const {notes} = props.vm;
    return <>{notes.map((v, i) => <Note key={i} vm={v}/>)}</>
});

export default PianoRollNotes;