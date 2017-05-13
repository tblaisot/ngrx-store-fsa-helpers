"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var action_creators_1 = require("./action-creators");
function reducerWithInitialState(initialState) {
    return makeReducer(initialState);
}
exports.reducerWithInitialState = reducerWithInitialState;
function reducerWithoutInitialState() {
    return makeReducer();
}
exports.reducerWithoutInitialState = reducerWithoutInitialState;
function upcastingReducer() {
    return makeReducer();
}
exports.upcastingReducer = upcastingReducer;
function makeReducer(initialState) {
    var cases = [];
    var reducer = getReducerFunction(initialState, cases);
    reducer.caseWithAction = function (actionCreator, handler) {
        cases.push({ actionCreator: actionCreator, handler: handler });
        return reducer;
    };
    reducer.case = function (actionCreator, handler) {
        return reducer.caseWithAction(actionCreator, function (state, action) { return handler(state, action ? action.payload : undefined); });
    };
    reducer.build = function () { return getReducerFunction(initialState, cases.slice()); };
    return reducer;
}
function getReducerFunction(initialState, cases) {
    return function (state, action) {
        if (state === void 0) { state = initialState; }
        for (var i = 0, length = cases.length; i < length; i++) {
            var _a = cases[i], actionCreator = _a.actionCreator, handler = _a.handler;
            if (action_creators_1.isType(action, actionCreator)) {
                return handler(state, action);
            }
        }
        return state;
    };
}
