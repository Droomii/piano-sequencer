import {makeAutoObservable} from "mobx";

export class KeyVM {


    constructor() {
        makeAutoObservable(this, undefined, {autoBind: true});
    }
}