import { ActionCreator, AnyAction, FSAAction } from "./action-creators";
export interface ReducerBuilder<InS extends OutS, OutS> {
    case<P>(actionCreator: ActionCreator<P>, handler: Handler<InS, OutS, P>): ReducerBuilder<InS, OutS>;
    caseWithAction<P>(actionCreator: ActionCreator<P>, handler: Handler<InS, OutS, FSAAction<P>>): ReducerBuilder<InS, OutS>;
    build(): (state: InS, action: {
        type: any;
    }) => OutS;
    (state: InS, action: AnyAction): OutS;
}
export interface Handler<InS extends OutS, OutS, P> {
    (state?: InS, payload?: P): OutS;
}
export declare function reducerWithInitialState<S>(initialState: S): ReducerBuilder<S, S>;
export declare function reducerWithoutInitialState<S>(): ReducerBuilder<S, S>;
export declare function upcastingReducer<InS extends OutS, OutS>(): ReducerBuilder<InS, OutS>;
