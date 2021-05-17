import { INCREMENT_COUNTER, DECREMENT_COUNTER } from './actionTypes'

interface IncrementCounterAction {
  type: typeof INCREMENT_COUNTER
}
interface DecrementCounterAction {
  type: typeof DECREMENT_COUNTER
}
export type CounterActionTypes = IncrementCounterAction | DecrementCounterAction

export type EntityReducerAction =
  | {
      type: 'transcation'
      payload: {
        involvedEntities: string[]
        actions: {
          payload: any
          type: string
        }[]
      }
    }
  | {
      type: 'addAction'
      payload: {
        involvedEntities: string[]
        action: {
          payload: any
          type: string
        }
      }
    } | {
      type: 'submitTranscation'
    }

    type Action = any;


export interface SystemState {
  entitySystem: {
    entities: {
      [key: string]: {
        components: { type: string, balanceCheck?: { address: string, min?: number, max?: number}[], actionName?: string }[]
        inventory?: { [key: string]: number }
        permissions: { type: string; action: string; key?: string, token?: string, threshold?: number }[],
        actions?: { [key: string]: { actions: Action[], involvedEntities: string[] }}
        pausedState?: any
      }
    }
    involvedEntities: string[]
    actions: Action[]
    privilegeStack: [string, string][]
  }
}


