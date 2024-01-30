// Created by dowoo on 2021-07-02
import {observer} from "mobx-react";
import React, {useEffect, useMemo, useRef} from "react";
import style from "./PianoRollContent.module.scss";
import {Util} from "@common/util/Util";
import PianoRollGrid from "./PianoRollGrid";
import {PianoRollVM} from "../../PianoRollVM";
import PianoRollNotes from "./PianoRollNotes";
import TimeBar from "../../../timeBar/timeBar";
import SelectRect from "./SelectRect";

interface IPianoRollContentProps {
    vm: PianoRollVM;
}

const PianoRollContent = observer((props: IPianoRollContentProps) => {
    const {scaleY, scaleX, end, setContentRef, keyCount, isPlaying} = props.vm;
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        ref.current && setContentRef(ref.current);
    }, [ref.current])

    const background = useMemo(() => {
        const white = "#f8f8f8";
        const black = "#dcdcdc";
        const height = scaleY * 7;

        const values = Array(12).fill(0)
            .map((v, i) => {
                const color = Util.isBlackKey(i) ? black : white;
                const isWhiteStreak = !Util.isBlackKey(i) && !Util.isBlackKey(i+1);

                return `${color} ${height * i}px, ${isWhiteStreak ? `${white} ${height * (i+1) - 1}px, ${black} ${height * (i+1) - 1}px, ${black} ${height * (i+1)}px, ` : ''}${color} ${height * (i+1)}px`
            }
        ).join(", ");
        return `repeating-linear-gradient(to top, ${values})`
    }, [scaleY, scaleX]);

    const height = useMemo(() => {
        return keyCount * 7 * scaleY;
    }, [scaleY])

    return (
        <div className={style.wrapper} ref={ref}>
            <div className={style.content} style={{background, height, width: end * scaleX}}>
                <PianoRollGrid vm={props.vm}/>
                <PianoRollNotes vm={props.vm}/>
                <SelectRect vm={props.vm}/>
            </div>
            {isPlaying &&
                <TimeBar vm={props.vm} height={height}/>
            }
        </div>
    );
});

export default PianoRollContent;