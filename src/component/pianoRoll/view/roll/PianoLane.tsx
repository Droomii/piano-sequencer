// Created by dowoo on 2021-07-02
import {observer} from "mobx-react";
import React from "react";
import style from "./PianoLane.module.scss";
import classNames from "classnames";
import Note from "../note/Note";

interface IPianoLaneProps {
    black: boolean;
}


const PianoLane = observer((props: IPianoLaneProps) => {
    const {black} = props;



    return (
        <div className={classNames(style.lane, black ? style.black : style.white)}>
        </div>
    );
});

export default PianoLane;