import {Action as NgRxStoreAction} from "@ngrx/store";

export interface FSAAction<P> extends NgRxStoreAction {
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

export function isType<P>(action: NgRxStoreAction,
                          actionCreator: ActionCreator<P>): action is FSAAction<P> {
    return action.type === actionCreator.type;
}

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
    <P>(type: string, commonMeta?: Object | null,
        error?: boolean): ActionCreator<P>;
    <P>(type: string, commonMeta?: Object | null,
        isError?: (payload: P) => boolean): ActionCreator<P>;

    async<P, S>(type: string,
                commonMeta?: Object | null): AsyncActionCreators<P, S, any>;
    async<P, S, E>(type: string,
                   commonMeta?: Object | null): AsyncActionCreators<P, S, E>;
}

declare const process: {
    env: {
        NODE_ENV?: string;
    };
};

export function actionCreatorFactory(prefix?: string | null,
                                     defaultIsError: (payload: any) => boolean = p => p instanceof Error,): ActionCreatorFactory {
    const actionTypes: { [type: string]: boolean } = {};

    const base = prefix ? `${prefix}/` : "";

    function actionCreator<P>(type: string, commonMeta?: Object | null,
                              isError: ((payload: P) => boolean) | boolean = defaultIsError,): ActionCreator<P> {
        const fullType = base + type;

        if (process.env.NODE_ENV !== 'production') {
            if (actionTypes[fullType])
                throw new Error(`Duplicate action type: ${fullType}`);

            actionTypes[fullType] = true;
        }

        return Object.assign(
            (payload: P, meta?: Object | null) => {
                const action: FSAAction<P> = {
                    type: fullType,
                    payload,
                };

                if (commonMeta || meta) {
                    action.meta = Object.assign({}, commonMeta, meta);
                }

                if (isError && (typeof isError === 'boolean' || isError(payload))) {
                    action.error = true;
                }

                return action;
            },
            {type: fullType},
        );
    }

    function asyncActionCreators<P, S, E>(type: string, commonMeta?: Object | null,): AsyncActionCreators<P, S, E> {
        return {
            type: base + type,
            started: actionCreator<P>(`${type}_STARTED`, commonMeta, false),
            done: actionCreator<SuccessFSAPayload<P, S>>(`${type}_DONE`, commonMeta, false),
            failed: actionCreator<FailureFSAPayload<P, E>>(`${type}_FAILED`, commonMeta, true),
        };
    }

    return Object.assign(actionCreator, {async: asyncActionCreators});
}
