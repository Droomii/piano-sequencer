import {computed, observable} from "mobx";

export abstract class Initializable {
    private _isInitialized: boolean = false;

    initialize() {
        this._isInitialized = true;
    }

    get isInitialized(): boolean {
        return this._isInitialized;
    }
}