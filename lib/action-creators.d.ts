export interface AnyAction {
    type: any;
}
export interface FSAAction<P> extends AnyAction {
    type: string;
    payload?: P;
    error?: boolean;
    meta?: Object | null;
}
export interface SuccessFSAPayload<P, S> {
    params?: P;
    result?: S;
}
export interface FailureFSAPayload<P, E> {
    params?: P;
    error?: E;
}
export declare function isType<P>(action: AnyAction, actionCreator: ActionCreator<P>): action is FSAAction<P>;
export interface ActionCreator<P> {
    type: string;
    (payload?: P, meta?: Object | null): FSAAction<P>;
}
export interface AsyncActionCreators<P, S, E> {
    type: string;
    started: ActionCreator<P>;
    done: ActionCreator<SuccessFSAPayload<P, S>>;
    failed: ActionCreator<FailureFSAPayload<P, E>>;
}
export interface ActionCreatorFactory {
    <P>(type: string, commonMeta?: Object | null, error?: boolean): ActionCreator<P>;
    <P>(type: string, commonMeta?: Object | null, isError?: (payload: P) => boolean): ActionCreator<P>;
    async<P, S>(type: string, commonMeta?: Object | null): AsyncActionCreators<P, S, any>;
    async<P, S, E>(type: string, commonMeta?: Object | null): AsyncActionCreators<P, S, E>;
}
export declare function actionCreatorFactory(prefix?: string | null, defaultIsError?: (payload: any) => boolean): ActionCreatorFactory;
