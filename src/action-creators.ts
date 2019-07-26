import { Action as NgRxStoreAction } from "@ngrx/store";


export interface AnyAction extends NgRxStoreAction {
    type: any;
}

export type Meta = null | { [key: string]: any };

export interface FSAAction<Payload> extends NgRxStoreAction {
    type: string;
    payload: Payload;
    error?: boolean;
    meta?: Meta;
}

export type SuccessFSAPayload<Params, Result> =
    ({ params: Params } | (Params extends void ? { params?: Params } : never)) &
    ({ result: Result } | (Result extends void ? { result?: Result } : never));

export type FailureFSAPayload<Params, Error> =
    ({ params: Params } | (Params extends void ? { params?: Params } : never)) &
    { error: Error };


/**
 * Returns `true` if action has the same type as action creator.
 * Defines Type Guard that lets TypeScript know `payload` type inside blocks
 * where `isType` returned `true`.
 *
 * @example
 *
 *    const somethingHappened =
 *      actionCreator<{foo: string}>('SOMETHING_HAPPENED');
 *
 *    if (isType(action, somethingHappened)) {
 *      // action.payload has type {foo: string}
 *    }
 */
export function isType<Payload>(action: NgRxStoreAction,
                                actionCreator: ActionCreator<Payload>): action is FSAAction<Payload> {
    return action.type === actionCreator.type;
}

export interface ActionCreator<Payload> {
    type: string;

    (payload?: Payload, meta?: Meta): FSAAction<Payload>;
}

export interface AsyncActionCreators<Params, Result, Error = {}> {
    type: string;
    started: ActionCreator<Params>;
    done: ActionCreator<SuccessFSAPayload<Params, Result>>;
    failed: ActionCreator<FailureFSAPayload<Params, Error>>;
}


export interface ActionCreatorFactory {
    /**
     * Creates Action Creator that produces actions with given `type` and payload
     * of type `Payload`.
     *
     * @param type Type of created actions.
     * @param commonMeta Metadata added to created actions.
     * @param isError Defines whether created actions are error actions.
     */<Payload = void>(
        type: string, commonMeta?: Meta, isError?: boolean,
    ): ActionCreator<Payload>;

    /**
     * Creates Action Creator that produces actions with given `type` and payload
     * of type `Payload`.
     *
     * @param type Type of created actions.
     * @param commonMeta Metadata added to created actions.
     * @param isError Function that detects whether action is error given the
     *   payload.
     */<Payload = void>(
        type: string, commonMeta?: Meta,
        isError?: (payload: Payload) => boolean,
    ): ActionCreator<Payload>;

    /**
     * Creates three Action Creators:
     * * `started: ActionCreator<Params>`
     * * `done: ActionCreator<{params: Params, result: Result}>`
     * * `failed: ActionCreator<{params: Params, error: Error}>`
     *
     * Useful to wrap asynchronous processes.
     *
     * @param type Prefix for types of created actions, which will have types
     *   `${type}_STARTED`, `${type}_DONE` and `${type}_FAILED`.
     * @param commonMeta Metadata added to created actions.
     */
    async<Params, Result, Error = {}>(
        type: string, commonMeta?: Meta,
    ): AsyncActionCreators<Params, Result, Error>;
}


declare const process: {
    env: {
        NODE_ENV?: string;
    };
};

/**
 * Creates Action Creator factory with optional prefix for action types.
 * @param prefix Prefix to be prepended to action types as `<prefix>/<type>`.
 * @param defaultIsError Function that detects whether action is error given the
 *   payload. Default is `payload => payload instanceof Error`.
 */
export function actionCreatorFactory(prefix?: string | null,
                                     defaultIsError: (payload: any) => boolean = p => p instanceof Error): ActionCreatorFactory {
    const actionTypes: { [type: string]: boolean } = {};

    const base = prefix ? `${prefix}/` : "";

    function actionCreator<Payload>(type: string, commonMeta?: Meta,
                                    isError: ((payload: Payload) => boolean) | boolean = defaultIsError,): ActionCreator<Payload> {
        const fullType = base + type;

        if (process.env.NODE_ENV !== 'production') {
            if (actionTypes[fullType])
                throw new Error(`Duplicate action type: ${fullType}`);

            actionTypes[fullType] = true;
        }

        return Object.assign(
            (payload: Payload, meta?: Meta) => {
                const action: FSAAction<Payload> = {
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
            {
                type: fullType,
                toString: () => fullType
            },
        ) as ActionCreator<Payload>;
    }

    function asyncActionCreators<Params, Result, Error>(
        type: string, commonMeta?: Meta,
    ): AsyncActionCreators<Params, Result, Error> {
        return {
            type: base + type,
            started: actionCreator<Params>(`${type}_STARTED`, commonMeta, false),
            done: actionCreator<SuccessFSAPayload<Params, Result>>(
                `${type}_DONE`, commonMeta, false,
            ),
            failed: actionCreator<FailureFSAPayload<Params, Error>>(
                `${type}_FAILED`, commonMeta, true,
            ),
        };
    }

    return Object.assign(actionCreator, {async: asyncActionCreators});
}
