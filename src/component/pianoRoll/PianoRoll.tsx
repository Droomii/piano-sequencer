import React, {useEffect, useRef, useState} from "react";
import style from "./PianoRoll.module.scss"
import {observer} from "mobx-react";
import Keys from "./view/keys/Keys";
import PianoRollContent from "./view/roll/PianoRollContent";
import {PianoRollVM} from "./PianoRollVM";
import PianoRollToolbar from "./view/toolbar/PianoRollToolbar";

const PianoRoll = observer(() => {
    const ref = useRef<HTMLDivElement>(null);
    const [vm] = useState(new PianoRollVM());
    const {scaleX, scaleY, tempo, playback, isPlaying, clickMode} = vm;
    useEffect(() => {
        ref.current && vm.initialize(ref.current);
    }, [ref.current])

    return (
        <>
            <div ref={ref} className={style.container}>
                <PianoRollToolbar vm={vm}/>
                <div className={style.rulerWrapper}/>
                <div className={style.keyNoteWrapper}>
                    <Keys vm={vm}/>
                    <PianoRollContent vm={vm}/>
                </div>
            </div>

        </>
    )
});


export default PianoRoll;