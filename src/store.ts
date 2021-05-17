import { combineReducers, createStore } from 'redux'
import { devToolsEnhancer } from 'redux-devtools-extension'
import { CounterReducer, EntityReducer } from './features/counter'

/* Create root reducer, containing all features of the application */
const rootReducer = combineReducers({
  localTranscation: CounterReducer,
  entitySystem: EntityReducer,
})

const store = createStore(
  rootReducer,
  /* preloadedState, */ devToolsEnhancer({})
)

export default store
