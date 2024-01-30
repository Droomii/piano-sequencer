// Created by dowoo on 2021-07-25
import {observer} from "mobx-react";
import React, {useMemo} from "react";
import style from './PianoRollToolbar.module.scss';
import {PianoRollVM} from "../../PianoRollVM";

interface IPianoRollToolbarProps {
    vm: PianoRollVM;
}

const PianoRollToolbar = observer((props: IPianoRollToolbarProps) => {
    const {vm} = props;
    const {scaleX, clickMode, scaleY, isPlaying, playback, tempo, rawQuantum} = vm;

    const scaleXInput = useMemo(() =>
        <li>
            <span>X: </span>
            <input type={"number"} step={0.1} min={0.1} max={10} value={scaleX}
                   onChange={v => vm.scaleX = Number(v.target.value)}/>
        </li>
    , [scaleX]);

    const scaleYInput = useMemo(() => (
        <li>
            <span>Y: </span>
            <input type={"number"} step={0.1} min={1} max={3} value={scaleY}
                   onChange={v => vm.scaleY = Number(v.target.value)}/>
        </li>
    ), [scaleY])

    const tempoInput = useMemo(() => (
        <li>
            <span>Tempo: </span>
            <input type={"number"} step={1} min={1} max={200} value={tempo}
                   onChange={v => vm.tempo = Number(v.target.value)}/>
        </li>

    ), [tempo])

    const playButton = useMemo(() => (
        <li>
            <button className={isPlaying ? style.active : undefined} onClick={playback}>
                {isPlaying ? '정지 (Spacebar)' : '재생 (Spacebar)'}
            </button>
        </li>

    ), [isPlaying])

    const editMode = useMemo(() => (
        <li><span>편집 모드: </span>
            <button className={clickMode === 1 ? style.active : undefined}
                    onClick={_ => vm.clickMode = 1}>
                그리기
            </button>
            <button className={clickMode === 2 ? style.active : undefined}
                    onClick={_ => vm.clickMode = 2}>
                선택
            </button>
        </li>
    ), [clickMode])

    const quantumMode = useMemo(() => (
        <li>
            <span>음표 단위: </span>
            <input type={"number"} step={1} min={1} max={32} value={rawQuantum}
                   onChange={v => vm.rawQuantum = Number(v.target.value)}/>
        </li>
    ), [rawQuantum])

    return (
        <ul className={style.toolbarWrapper}>
            {scaleXInput}
            {scaleYInput}
            {playButton}
            {tempoInput}
            {quantumMode}
            {editMode}
        </ul>
    );
});

export default PianoRollToolbar;