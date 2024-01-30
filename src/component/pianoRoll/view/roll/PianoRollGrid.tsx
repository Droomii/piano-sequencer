import React, {useMemo} from "react";
import {observer} from "mobx-react";
import style from "./PianoRollGrid.module.scss";
import {PianoRollVM} from "../../PianoRollVM";

interface IPianoRollGridProps {
    vm: PianoRollVM
}

const PianoRollGrid = observer((props: IPianoRollGridProps) => {
    const {denominator, numerator, scaleX, quantum, handleMouseDownBackground, end} = props.vm;
    const grid = useMemo(() => {
        return `repeating-linear-gradient(90deg, gray, gray 1px, transparent 1px, transparent ${96 * scaleX * numerator / denominator * 4}px), 
        repeating-linear-gradient(90deg, lightgray, lightgray 1px, transparent 1px, transparent ${96 * scaleX / denominator * 4}px),
        repeating-linear-gradient(90deg, #e9e9e9, #e9e9e9 1px, transparent 1px, transparent ${quantum * scaleX}px)`
    }, [scaleX, quantum])

    return (
        <div onMouseDown={handleMouseDownBackground}
             onDragStart={e => e.preventDefault()}
             className={style.pianoRollGrid}
             style={{background: grid, width: end * scaleX}}/>
    )
});
// 귀찮다
export default PianoRollGrid;