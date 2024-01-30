// Created by dowoo on 2021-07-03
import {observer} from "mobx-react";
import React, {useEffect, useRef} from "react";
import style from "./Note.module.scss";
import {NoteVM} from "./NoteVM";
import classNames from "classnames";

interface INoteProps {
    vm: NoteVM;
}

const Note = observer((props: INoteProps) => {
    const {pitch, start, duration, startDrag, scaleY, isSelected, scaleX} = props.vm;
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current)
            props.vm.ref = ref.current;
    }, [ref.current, isSelected])

    return (
        <div className={classNames(style.note, isSelected ? style.selected : null)}
             ref={ref}
             onMouseDown={e => startDrag(e, "move")}
             style={{
                 bottom: pitch * scaleY * 7,
                 left: start * scaleX,
                 width: duration * scaleX,
                 height: scaleY * 7
             }}>
            <div onMouseDown={e => startDrag(e, "start")} className={style.edge}/>
            <div onMouseDown={e => startDrag(e, "end")} className={style.edge}/>
        </div>
    );
});

export default Note;