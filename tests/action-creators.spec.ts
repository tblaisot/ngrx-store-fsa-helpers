import {actionCreatorFactory, isType} from "../src/action-creators";

describe('isType', () => {
    it("", () => {
        const actionCreator = actionCreatorFactory();

        const action1 = actionCreator('ACTION_1');
        const action2 = actionCreator('ACTION_2');

        const action = action1();

        expect(isType(action, action1)).toBeTruthy();
        expect(isType(action, action2)).toBeFalsy();

    })

});

describe('basic', () => {
    it("", () => {
        const actionCreator = actionCreatorFactory();

        const someAction = actionCreator<{foo: string}>('ACTION_TYPE');

        expect(() => actionCreator('ACTION_TYPE')).toThrowError(
            'Duplicate action type: ACTION_TYPE');

        expect(someAction.type).toEqual('ACTION_TYPE');

        const action = someAction({foo: 'bar'});

        expect(action.type).toEqual('ACTION_TYPE');
        expect(action.error).toEqual(undefined);
        expect(action.meta).toEqual(undefined);
        expect(action.payload).toEqual({foo: 'bar'});

    })
});

describe('meta', () => {
    it("", () => {
        const actionCreator = actionCreatorFactory();

        const someAction = actionCreator('ACTION_TYPE');

        const action = someAction(undefined, {foo: 'bar'});

        expect(action.meta).toEqual({foo: 'bar'});

        const someActionWithMeta = actionCreator('ACTION_WITH_META', {foo: 'bar'});

        const actionWithMeta = someActionWithMeta(undefined);

        expect(actionWithMeta.meta).toEqual({foo: 'bar'});

        const actionWithExtraMeta = someActionWithMeta(undefined, {fizz: 'buzz'});

        expect(actionWithExtraMeta.meta).toEqual({foo: 'bar', fizz: 'buzz'});

    })
});

describe('error actions', () => {
    it("", () => {
        const actionCreator = actionCreatorFactory();

        const errorAction = actionCreator('ERROR_ACTION', null, true);

        const action = errorAction();

        expect(action.error).toBeTruthy();

        const inferredErrorAction = actionCreator<any>('INF_ERROR_ACTION', null);

        expect(inferredErrorAction({}).error).toBeFalsy();
        expect(inferredErrorAction(new Error()).error).toBeTruthy();

        const customErrorAction = actionCreator<{
            isError: boolean;
        }>('CUSTOM_ERROR_ACTION', null, payload => payload.isError);

        expect(customErrorAction({isError: false}).error).toBeFalsy();
        expect(customErrorAction({isError: true}).error).toBeTruthy();

        const actionCreator2 = actionCreatorFactory(null,
            payload => payload.isError);

        const customErrorAction2 = actionCreator2<{
            isError: boolean;
        }>('CUSTOM_ERROR_ACTION');

        expect(customErrorAction2({isError: false}).error).toBeFalsy();
        expect(customErrorAction2({isError: true}).error).toBeTruthy();

    })
});

describe('prefix', () => {
    it("", () => {
        const actionCreator = actionCreatorFactory('somePrefix');

        const someAction = actionCreator('SOME_ACTION');

        expect(someAction.type).toEqual('somePrefix/SOME_ACTION');

        const action = someAction();

        expect(action.type).toEqual('somePrefix/SOME_ACTION');

    })
});

describe('async', () => {
    it("", () => {
        const actionCreator = actionCreatorFactory('prefix');

        const asyncActions = actionCreator.async<
            {foo: string},
            {bar: string}
            >('DO_SOMETHING', {baz: 'baz'});

        expect(asyncActions.type).toEqual('prefix/DO_SOMETHING');
        expect(asyncActions.started.type).toEqual('prefix/DO_SOMETHING_STARTED');
        expect(asyncActions.done.type).toEqual('prefix/DO_SOMETHING_DONE');
        expect(asyncActions.failed.type).toEqual('prefix/DO_SOMETHING_FAILED');

        const started = asyncActions.started({foo: 'foo'});
        expect(started.type).toEqual('prefix/DO_SOMETHING_STARTED');
        expect(started.payload).toEqual({foo: 'foo'});
        expect(started.meta).toEqual({baz: 'baz'});
        expect(!started.error).toBeTruthy();

        const done = asyncActions.done({params: {foo: 'foo'}, result: {bar: 'bar'}});
        expect(!done.error).toBeTruthy();

        const failed = asyncActions.failed({params: {foo: 'foo'}, error: 'error'});
        expect(failed.error).toBeTruthy();

    })
});
