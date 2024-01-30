// Created by dowoo on 2021-07-25
import {observer} from "mobx-react";
import React, {CSSProperties, useEffect, useRef, useState} from "react";
import {PianoRollVM} from "../pianoRoll/PianoRollVM";
import styles from './timeBar.module.scss';

interface Props {
    vm: PianoRollVM;
    height: number;
}

const TimeBar = observer((props: Props) => {
    const {height, vm} = props;
    const [startTime] = useState(performance.now());
    const [left, setLeft] = useState(0);

    useEffect(() => {
        const callback = () => {
            const now = Math.floor(performance.now() - startTime) / 1000;
            setLeft(now * vm.ticksPerSec * vm.scaleX);
            timeout = setTimeout(callback, 1000 / 60);
        }
        let timeout = setTimeout(callback, 1000 / 60);
        return () => clearTimeout(timeout);
    }, [])

    return (
        <div className={styles.timeBar} style={{height, left}}/>
    );
});

export default TimeBar;