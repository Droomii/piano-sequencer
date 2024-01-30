import {InstrumentService} from "./instrumentService";
import {EInstrumentTypeCode} from "@common/define/EInstrumentTypeCode";

class InstrumentServiceGroupInternal {
    readonly piano = new InstrumentService(EInstrumentTypeCode.PIANO);
}

export namespace InstrumentServiceGroup {
    export const instance = new InstrumentServiceGroupInternal();
}