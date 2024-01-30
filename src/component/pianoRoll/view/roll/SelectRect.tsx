import React from "react";
import style from "./SelectRect.module.scss"
import {observer} from "mobx-react";
import {PianoRollVM} from "../../PianoRollVM";

interface ISelectRectProps {
    vm: PianoRollVM;
}

const SelectRect = observer((props: ISelectRectProps) => {

    const {isSelectDragging, selectRectX1: left, selectRectY1: top, selectRectWidth: width, selectRectHeight: height} = props.vm;
    return (
        <>{isSelectDragging && <div onDragStart={e => e.preventDefault()} className={style.selectRect} style={{left, top, width, height}}/>}</>
    )
});

export default SelectRect;