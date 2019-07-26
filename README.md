# TypeScript FSA [![npm version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]

A simple Flux Action Creator and Flux Reducers library for [@ngrx/store](https://github.com/ngrx/store). Its goal is to provide simple
yet type-safe experience with Flux actions.
Created actions are FSA-compliant:
 
```ts
interface FSAAction<P> {
  type: string;
  payload?: P;
  error?: boolean;
  meta?: Object;
}
``` 

It allows you to define reducers by chaining a series of handlers for different action
types and optionally providing an initial value.


This library is heavily inpired (with minor adaptations to make it @ngrx/store compatible) by two awesome librairies:
- [typescript-fsa](https://github.com/aikoven/typescript-fsa) by Daniel Lytkin
- [typescript-fsa-reducers](https://github.com/dphilipson/typescript-fsa-reducers) by David Philipson



## Table of Contents

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  * [Basic](#basic)
  * [Async Action Creators](#async-action-creators)
  * [Actions With Type Prefix](#actions-with-type-prefix)
  * [Reducers](#reducers)
    + [Without Reducers Chaining](#without-reducers-chaining)
    + [With Reducers Chaining](#with-reducers-chaining)
- [API](#api)
  * [Actions](#actions)
    + [`actionCreatorFactory(prefix?: string, defaultIsError?: Predicate): ActionCreatorFactory`](#actioncreatorfactoryprefix-string-defaultiserror-predicate-actioncreatorfactory)
    + [`isType(action: Action, actionCreator: ActionCreator): boolean`](#istypeaction-action-actioncreator-actioncreator-boolean)
  * [Starting a reducer chain](#starting-a-reducer-chain)
    + [`reducerWithInitialState(initialState)`](#reducerwithinitialstateinitialstate)
    + [`reducerWithoutInitialState()`](#reducerwithoutinitialstate)
    + [`upcastingReducer()`](#upcastingreducer)
  * [Reducer chain methods](#reducer-chain-methods)
    + [`.case(actionCreator, handler(state, payload) => newState)`](#caseactioncreator-handlerstate-payload--newstate)
    + [`.caseWithAction(actionCreator, handler(state, action) => newState)`](#casewithactionactioncreator-handlerstate-action--newstate)
    + [`.cases(actionCreators, handler(state, payload) => newState)`](#casesactioncreators-handlerstate-payload--newstate)
    + [`.casesWithAction(actionCreators, handler(state, action) => newState)`](#caseswithactionactioncreators-handlerstate-action--newstate)
    + [`.withHandling(updateBuilder(builder) => builder)`](#withhandlingupdatebuilderbuilder--builder)
    + [`.default(handler(state, action) => newState)`](#defaulthandlerstate-action--newstate)
    + [`.build()`](#build)

<!-- tocstop -->

## Installation

```
npm install --save ngrx-store-fsa-helpers
or
yarn add ngrx-store-fsa-helpers
```

## Usage

### Basic

```ts
import {actionCreatorFactory} from 'ngrx-store-fsa-helpers';

const actionCreator = actionCreatorFactory();

// Specify payload shape as generic type argument. 
const somethingHappened = actionCreator<{foo: string}>('SOMETHING_HAPPENED');

// Get action creator type.
console.log(somethingHappened.type);  // SOMETHING_HAPPENED

// Create action.
const action = somethingHappened({foo: 'bar'});
console.log(action);  // {type: 'SOMETHING_HAPPENED', payload: {foo: 'bar'}}  
```

### Async Action Creators

Async Action Creators are objects with properties `started`, `done` and 
`failed` whose values are action creators. 

`started` actions will have the following shape
```ts
interface FSAAction<P> {
  type: string;
  payload?: P;
  error?: boolean;
  meta?: Object | null;
}
``` 

`done` actions will have the following shape
```ts
interface SuccessFSAAction<P, S> {
  type: string;
  payload: {
               params?: P;
               result?: S;
           };
   error?: boolean;
  meta?: Object;
}
``` 

`failed` actions will have the following shape
```ts
interface FailureFSAAction<P, E> {
  type: string;
  payload: {
              params?: P;
              error?: E;
          };
  error: true;
  meta?: Object;
}
``` 

```ts
import {actionCreatorFactory} from 'ngrx-store-fsa-helpers';

const actionCreator = actionCreatorFactory();

// specify parameters and result shapes as generic type arguments
const doSomething = 
  actionCreator.async<{foo: string},   // parameter type
                      {bar: number},   // success type for field "result" in payload
                      {code: number}   // error type for field "error" in payload
                     >('DO_SOMETHING');

console.log(doSomething.started({foo: 'lol'}));
// {type: 'DO_SOMETHING_STARTED', payload: {foo: 'lol'}}

console.log(doSomething.done({
  params: {foo: 'lol'},
  result: {bar: 42},
});
// {type: 'DO_SOMETHING_DONE', payload: {
//   params: {foo: 'lol'},
//   result: {bar: 42},
// }}

console.log(doSomething.failed({
  params: {foo: 'lol'},
  error: {code: 42},    
});
// {type: 'DO_SOMETHING_FAILED', payload: {
//   params: {foo: 'lol'},
//   error: {code: 42},
// }, error: true}
```
  
### Actions With Type Prefix

You can specify a prefix that will be prepended to all action types. This is 
useful to namespace library actions as well as for large projects where it's 
convenient to keep actions near the component that dispatches them. 

```ts
// MyComponent.actions.ts
import {actionCreatorFactory} from 'ngrx-store-fsa-helpers';

const actionCreator = actionCreatorFactory('MyComponent');

const somethingHappened = actionCreator<{foo: string}>('SOMETHING_HAPPENED');

const action = somethingHappened({foo: 'bar'});
console.log(action);  
// {type: 'MyComponent/SOMETHING_HAPPENED', payload: {foo: 'bar'}}  
```

### Reducers

Suppose we have the setup:
``` ts
import {actionCreatorFactory} from 'ngrx-store-fsa-helpers';
const actionCreator = actionCreatorFactory();

interface State {
    name: string;
    balance: number;
    isFrozen: boolean;
}

const INITIAL_STATE: State = {
    name: "Untitled",
    balance: 0,
    isFrozen: false,
};

const setName = actionCreator<string>("SET_NAME");
function setNameHandler(state: State, name: string): State {
    return { ...state, name };
}

const addBalance = actionCreator<number>("ADD_BALANCE");
function addBalanceHandler(state: State, addedBalance: number): State {
    return { ...state, balance: state.balance + addedBalance };
}

const setIsFrozen = actionCreator<boolean>("SET_IS_FROZEN");
function setIsFrozenHandler(state: State, isFrozen: boolean): State {
    return { ...state, isFrozen };
}
```

#### Without Reducers Chaining

``` ts
import { Action } from '@ngrx/store';
import { isType } from 'ngrx-store-fsa-helpers';

function reducer(state = INITIAL_STATE, action: Action): State {
    if (isType(action, setName)) {
        return setNameHandler(state, action.payload);
    } else if (isType(action, addBalance)) {
        return addBalanceHandler(state, action.payload);
    } else if (isType(action, setIsFrozen)) {
        return setIsFrozenHandler(state, action.payload);
    } else {
        return state;
    }
}
```

#### With Reducers Chaining

``` ts
import { reducerWithInitialState } from 'ngrx-store-fsa-helpers';

const reducer = reducerWithInitialState(INITIAL_STATE)
    .case(setName, setNameHandler)
    .case(addBalance, addBalanceHandler)
    .case(setIsFrozen, setIsFrozenHandler);
```
Everything is typesafe. If the types of the action payload and handler don't line up, then
TypeScript will complain.

The reducer builders are immutable. Each call to `.case()` returns a new reducer rather than
modifying the callee.



## API

### Actions

#### `actionCreatorFactory(prefix?: string, defaultIsError?: Predicate): ActionCreatorFactory`

Creates Action Creator factory with optional prefix for action types.

* `prefix?: string`: Prefix to be prepended to action types.
* `defaultIsError?: Predicate`: Function that detects whether action is error
 given the payload. Default is `payload => payload instanceof Error`.

#### `isType(action: Action, actionCreator: ActionCreator): boolean`

Returns `true` if action has the same type as action creator. Defines 
[Type Guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
that lets TypeScript know `payload` type inside blocks where `isType` returned
`true`:

```ts
const somethingHappened = actionCreator<{foo: string}>('SOMETHING_HAPPENED');

if (isType(action, somethingHappened)) {
  // action.payload has type {foo: string};
}
```


### Starting a reducer chain

#### `reducerWithInitialState(initialState)`

Starts a reducer builder-chain which uses the provided initial state if passed
`undefined` as its state. For example usage, see the [Usage](#usage) section
above.

#### `reducerWithoutInitialState()`

Starts a reducer builder-chain without special logic for an initial state.
`undefined` will be treated like any other value for the state.

Redux seems to really want you to provide an initial state for your reducers.
Its `createStore` API encourages it and `combineReducers` function enforces it.
For the Redux author's reasoning behind this, see [this
thread](https://github.com/reactjs/redux/issues/514). For this reason,
`reducerWithInitialState` will likely be the more common choice, but the option
to not provide an initial state is there in case you have some means of
composing reducers for which initial state is unnecessary.

Note that since the type of the state cannot be inferred from the initial state,
it must be provided as a type parameter:

```javascript
const reducer = reducerWithoutInitialState<State>()
    .case(setName, setNameHandler)
    .case(addBalance, addBalanceHandler)
    .case(setIsFrozen, setIsFrozenHandler);
```

#### `upcastingReducer()`

Starts a builder-chain which produces a "reducer" whose return type is a
supertype of the input state. This is most useful for handling a state which may
be in one of several "modes", each of which responds differently to actions and
can transition to the other modes. Many applications will not have a use for
this.

Note that the function produced is technically not a reducer because the initial
and updated states are different types.

Example usage:

```javascript
type State = StoppedState | RunningState;

interface StoppedState {
    type: "STOPPED";
}

interface StartedState {
    type: "STARTED";
    count: number;
}

const INITIAL_STATE: State = { type: "STOPPED" };

const startWithCount = actionCreator<number>("START_WITH_COUNT");
const addToCount = actionCreator<number>("ADD_TO_COUNT");
const stop = actionCreator<void>("STOP");

function startWithCountHandler(state: StoppedState, count: number): State {
    return { type: "STARTED", count };
}

function addToCountHandler(state: StartedState, count: number): State {
    return { ...state, count: state.count + count };
}

function stopHandler(state: StartedState): State {
    return { type: "STOPPED" };
}

const stoppedReducer = upcastingReducer<StoppedState, State>()
    .case(startWithCount, startWithCountHandler);

const startedReducer = upcastingReducer<StartedState, State>()
    .case(addToCount, addToCountHandler)
    .case(stop, stopHandler);

function reducer(state = INITIAL_STATE, action: Redux.Action): State {
    if (state.type === "STOPPED") {
        return stoppedReducer(state, action);
    } else if (state.type === "STARTED") {
        return startedReducer(state, action);
    } else {
        throw new Error("Unknown state");
    }
}
```

### Reducer chain methods

#### `.case(actionCreator, handler(state, payload) => newState)`

Mutates the reducer such that it applies `handler` when passed actions matching
the type of `actionCreator`. For examples, see [Usage](#usage).

#### `.caseWithAction(actionCreator, handler(state, action) => newState)`

Like `.case()`, except that `handler` receives the entire action as its second
argument rather than just the payload. This is useful if you want to read other
properties of the action, such as `meta` or `error`, or if you want to pass the
entire action unmodified to some other function. For an example, see
[Usage](#usage).

#### `.cases(actionCreators, handler(state, payload) => newState)`

Like `.case()`, except that multiple action creators may be provided and the
same handler is applied to all of them. That is,

```javascript
reducerWithInitialState(initialState).cases(
    [setName, addBalance, setIsFrozen],
    handler,
);
```

is equivalent to

```javascript
reducerWithInitialState(initialState)
    .case(setName, handler)
    .case(addBalance, handler)
    .case(setIsFrozen, handler);
```

Note that the payload passed to the handler may be of the type of any of the
listed action types' payloads. In TypeScript terms, this means it has type `P1 | P2 | ...`, where `P1, P2, ...` are the payload types of the listed action
creators.

The payload type is inferred automatically for up to four action types. After
that, it must be supplied as a type annotation, for example:

```javascript
reducerWithInitialState(initialState).cases <
    { documentId: number } >
    ([
        selectDocument,
        editDocument,
        deleteDocument,
        sendDocument,
        archiveDocument,
    ],
    handler);
```

#### `.casesWithAction(actionCreators, handler(state, action) => newState)`

Like `.cases()`, except that the handler receives the entire action as its
second argument rather than just the payload.

#### `.withHandling(updateBuilder(builder) => builder)`

Convenience method which applies the provided function to the current builder
and returns the result. Useful if you have a sequence of builder updates (calls
to `.case()`, etc.) which you want to reuse across several reducers.

#### `.default(handler(state, action) => newState)`

Produces a reducer which applies `handler` when no previously added `.case()`,
`.caseWithAction()`, etc. matched. The handler is similar to the one in
`.caseWithAction()`. Note that `.default()` ends the chain and internally does
the same as [`.build()`](#build), because it is not intended that the chain be
mutated after calling `.default()`.

This is useful if you have a "delegate" reducer that should be called on any
action after handling a few specific actions in the parent.

```ts
const NESTED_STATE = {
    someProp: "hello",
};

const nestedReducer = reducerWithInitialState(NESTED_STATE)
    .case(...);

const INITIAL_STATE = {
    someOtherProp: "world"
    nested: NESTED_STATE
};

const reducer = reducerWithInitialState(INITIAL_STATE)
    .case(...)
    .default((state, action) => ({
        ...state,
        nested: nestedReducer(state.nested, action),
    }));
```

#### `.build()`

Returns a plain reducer function whose behavior matches the current state of the
reducer chain. Further updates to the chain (through calls to `.case()`) will
have no effect on this function.

There are two reasons you may want to do this:

1.  **You want to ensure that the reducer is not modified further**

    Calling `.build()` is an example of defensive coding. It prevents someone
    from causing confusing behavior by importing your reducer in an unrelated
    file and adding cases to it.

2.  **You want your package to export a reducer, but not have its types depend
    on `typescript-fsa-reducers`**

    If the code that defines a reducer and the code that uses it reside in
    separate NPM packages, you may run into type errors since the exported
    reducer has type `ReducerBuilder`, which the consuming package does not
    recognize unless it also depends on `typescript-fsa-reducers`. This is
    avoided by returning a plain function instead.

Example usage:

```javascript
const reducer = reducerWithInitialState(INITIAL_STATE)
    .case(setName, setNameHandler)
    .case(addBalance, addBalanceHandler)
    .case(setIsFrozen, setIsFrozenHandler)
    .build();
```

[npm-image]: https://badge.fury.io/js/ngrx-store-fsa-helpers.svg
[npm-url]: https://badge.fury.io/js/ngrx-store-fsa-helpers
[travis-image]: https://travis-ci.org/tblaisot/ngrx-store-fsa-helpers.svg?branch=master
[travis-url]: https://travis-ci.org/tblaisot/ngrx-store-fsa-helpers

