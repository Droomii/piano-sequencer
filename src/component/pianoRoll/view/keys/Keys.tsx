import React, {useEffect, useRef} from "react";
import style from "./Keys.module.scss"
import {observer} from "mobx-react";
import {Util} from "@common/util/Util";
import Key from "./Key";
import {PianoRollVM} from "../../PianoRollVM";

interface IKeysProps {
    vm: PianoRollVM;
}



const Keys = observer((props: IKeysProps) => {
    const {keyCount, setKeysRef} = props.vm;
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ref.current && setKeysRef(ref.current);
    }, [ref.current])

    return (
        <div  className={style.wrapper}>
            <div className={style.container} ref={ref}>
                <div className={style.keys} >
                    {Array(keyCount).fill(null).map((v, i) => {
                        return <Key key={i} idx={i} vm={props.vm}/>
                    }).reverse()}
                </div>
            </div>
        </div>
    )
});

export default Keys;