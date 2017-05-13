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

### `actionCreatorFactory(prefix?: string, defaultIsError?: Predicate): ActionCreatorFactory`

Creates Action Creator factory with optional prefix for action types.

* `prefix?: string`: Prefix to be prepended to action types.
* `defaultIsError?: Predicate`: Function that detects whether action is error
 given the payload. Default is `payload => payload instanceof Error`.

### `isType(action: Action, actionCreator: ActionCreator): boolean`

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

### `reducerWithInitialState(initialState)`

Starts a reducer builder-chain which uses the provided initial state if passed `undefined` as its
state. For example usage, see the "Usage" section above.

### `reducerWithoutInitialState()`

Starts a reducer builder-chain without special logic for an initial state. `undefined` will be
treated like any other value for the state.

Redux seems to really want you to provide an initial state for your reducers. Its `createStore` API
encourages it and `combineReducers` function enforces it. For the Redux author's reasoning behind
this, see [this thread](https://github.com/reactjs/redux/issues/514). For this reason,
`reducerWithInitialState` will likely be the more common choice, but the option to not provide an
initial state is there in case you have some means of composing reducers for which initial state is
unnecessary.

Note that since the type of the state cannot be inferred from the initial state, it must be provided
as a type parameter:
``` javascript
const reducer = reducerWithoutInitialState<State>()
    .case(setName, setNameHandler)
    .case(addBalance, addBalanceHandler)
    .case(setIsFrozen, setIsFrozenHandler);
```

### `upcastingReducer()`

Starts a reducer builder-chain which produces a reducer whose return type is a supertype of the
input state. This is most useful for handling a state which may be in one of several "modes", each
of which responds differently to actions and can transition to the other modes. Many programs will
not have a use for this.

Example usage:
``` ts
type State = StoppedState | RunningState;

interface StoppedState {
    type: "STOPPED";
}

interface StartedState {
    type: "STARTED";
    count: number;
}

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

function reducer(state: State, action: Action): State {
    if (state.type === "STOPPED") {
        return stoppedReducer(state, action);
    } else if (state.type === "STARTED") {
        return startedReducer(state, action);
    } else {
        throw new Error("Unknown state");
    }
}
```

[npm-image]: https://badge.fury.io/js/ngrx-store-fsa-helpers.svg
[npm-url]: https://badge.fury.io/js/ngrx-store-fsa-helpers
[travis-image]: https://travis-ci.org/tblaisot/ngrx-store-fsa-helpers.svg?branch=master
[travis-url]: https://travis-ci.org/tblaisot/ngrx-store-fsa-helpers

