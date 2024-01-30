import React, {useEffect} from "react";
import style from "./Main.module.scss"
import {observer} from "mobx-react";
import PianoRoll from "../component/pianoRoll/PianoRoll";

const Main = observer(() => {

    useEffect(() => {
        window.addEventListener('dragstart', e => e.preventDefault());
    }, [])

    return (
        <div className={style.container}>
            <div className={style.right}>
                <PianoRoll/>
            </div>
        </div>
    )
});

export default Main