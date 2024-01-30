// Created by kdw0601 on 2021-07-02
import {observer} from "mobx-react";
import React, {CSSProperties, useState} from "react";
import style from "./Key.module.scss";
import classNames from "classnames";
import {InstrumentServiceGroup} from "../../../../service/instrument/InstrumentServiceGroup";
import {PianoRollVM} from "../../PianoRollVM";
import {Util} from "@common/util/Util";

interface IKeyProps {
    idx: number;
    vm: PianoRollVM;
}


const Key = observer((props: IKeyProps) => {
    const {idx, vm: {scaleY, playNote, releaseNote, keyCount}} = props;
    const black = Util.isBlackKey(idx);
    const [mouseOver, setMouseOver] = useState(false);
    const [keyDown, setKeyDown] = useState(false);

    const isLastKey = idx === keyCount - 1;

    const inlineStyle: CSSProperties = {
        height: (isLastKey ? 7 : 12) * scaleY
    }
    if (black) {
        inlineStyle.bottom = 7 * scaleY * idx;
        inlineStyle.height = 7 * scaleY;
    }

    const cls = classNames(style.key, black ? style.black : null,
        mouseOver ? style.mouseOver : null,
        keyDown ? style.keyDown : null
    )

    return (
        <div onMouseOver={e => {
            if (e.buttons === 1){
                setKeyDown(true);
                playNote(idx);
            }
            setMouseOver(true)
        }}
             onMouseOut={e => {
                 setMouseOver(false);
                 setKeyDown(false);
                 releaseNote(idx);
             }}
             onMouseDown={e => {
                 playNote(idx);
                 setKeyDown(true);
             }}
             onMouseUp={e => {
                 setKeyDown(false);
                 InstrumentServiceGroup.instance.piano.releaseKey(idx);
             }}
             className={cls} style={inlineStyle}/>
    );
});

export default Key;
