/* eslint-disable no-param-reassign */
// import { INCREMENT_COUNTER, DECREMENT_COUNTER } from './actionTypes'
import produce, { original } from 'immer'
import { getMax, getMin } from './selectors'
import { EntityReducerAction, SystemState } from './types'

const initialState = {
  entities: {
    Mike: {
      components: [
        {
          type: 'account',
        },
      ],
      inventory: {
        ExampleFund: 1,
        ExampleToken: 0,
        ExampleNFT: 0,
        ExampleManualShop: 1,
      },
      permissions: [
        {
          type: 'PK',
          action: '*',
          key: 'Mikes Key',
        },
        {
          action: 'deposit',
          type: 'any',
        },
      ],
    },
    Alice: {
      components: [
        {
          type: 'account',
        },
      ],
      inventory: {},
      permissions: [
        {
          type: 'PK',
          action: '*',
          key: 'Alices Key',
        },
        {
          action: 'deposit',
          type: 'any',
        },
      ],
    },
    ExampleToken: {
      components: [
        {
          type: 'token', // Ownable
          balanceCheck: [
            {
              address: 'Mike',
              min: -1000,
            },
            {
              address: '*',
              min: 0,
              max: Number.MAX_SAFE_INTEGER,
            },
          ],
        },
      ],
      permissions: [], // This entity is set in stone
    },
    ExampleToken2: {
      components: [
        {
          type: 'token', // Ownable
          balanceCheck: [
            {
              address: 'ExampleShop',
              min: -100,
            },
            {
              address: 'ExampleManualShop',
              min: -100,
            },
            {
              address: '*',
              min: 0,
              max: Number.MAX_SAFE_INTEGER,
            },
          ],
        },
      ],
      permissions: [], // This entity is set in stone
    },
    ExampleNFT: {
      components: [
        {
          type: 'token', // Ownable
          balanceCheck: [
            {
              address: 'Mike',
              min: -1,
            },
            {
              address: '*',
              min: 0,
              max: 1,
            },
          ],
        },
      ],
      permissions: [], // This entity is set in stone
    },
    ExampleFund: {
      inventory: {
        ExampleFund: -1,
      },
      permissions: [
        {
          type: 'ownership',
          token: 'ExampleFund',
          action: '*',
        },
        {
          action: 'deposit',
          type: 'any',
        },
      ],
      components: [
        {
          type: 'account',
        },
        {
          type: 'token', // Ownable
          balanceCheck: [
            {
              address: 'ExampleFund',
              min: -1000,
            },
            {
              address: '*',
              min: 0,
              max: Number.MAX_SAFE_INTEGER,
            },
          ],
        },
      ],
    },
    ExampleShop: {
      components: [
        {
          type: 'account',
        },
        {
          type: 'action',
          actionName: 'buy',
        },
      ],
      actions: {
        buy: {
          involvedEntities: ['ExampleToken', 'ExampleToken2', 'ExampleShop'],
          actions: [
            {
              type: 'reserve',
              payload: {
                token: 'ExampleToken',
                amount: 10,
              },
            },
            {
              type: 'action-auth',
            },
            {
              type: 'reserve',
              payload: {
                token: 'ExampleToken2',
                toAccount: 'ExampleStore',
                amount: 10,
              },
            },
            {
              type: 'request',
              payload: {
                token: 'ExampleToken',
                fromAccount: 'ExampleStore',
                amount: 10,
              },
            },
            {
              type: 'unauth',
            },
            {
              type: 'request',
              payload: {
                token: 'ExampleToken2',
                amount: 10,
              },
            },
          ],
        },
      },
      inventory: {
        ExampleToken2: 0,
      },
      permissions: [
        {
          type: 'action',
          action: '*',
        },
        {
          action: 'buy',
          type: 'any',
        },
      ],
    },
    ExampleManualShop: {
      components: [
        {
          type: 'account',
        },
        {
          type: 'action',
          actionName: 'buy',
        },
        {
          type: 'token',
          balanceCheck: [
            {
              address: 'ExampleManualShop',
              min: -1,
            },
            {
              address: '*',
              min: 0,
              max: 1,
            },
          ],
        }
      ],
      actions: {
        buy: {
          involvedEntities: ['ExampleToken', 'ExampleToken2', 'ExampleManualShop'],
          actions: [
            {
              type: 'reserve',
              payload: {
                token: 'ExampleToken',
                amount: 10,
              },
            },
            {
              type: 'pause-auth',
            },
            {
              type: 'reserve',
              payload: {
                token: 'ExampleToken2',
                toAccount: 'ExampleStore',
                amount: 10,
              },
            },
            {
              type: 'request',
              payload: {
                token: 'ExampleToken',
                fromAccount: 'ExampleStore',
                amount: 10,
              },
            },
            {
              type: 'unauth',
            },
            {
              type: 'request',
              payload: {
                token: 'ExampleToken2',
                amount: 10,
              },
            },
          ],
        },
      },
      inventory: {
        ExampleToken2: 0,
        ExampleManualShop: -1,
      },
      permissions: [
        {
          action: 'buy',
          type: 'any',
        },
        {
          type: 'ownership',
          token: 'ExampleManualShop',
          action: '*',
        },
      ],
    },
  },

  involvedEntities: [] as string[],
  actions: [] as any[],
  privilegeStack: [] as any[],
}

/*
{
  type: 'transcation',
  payload: {
    signedBy: 'Mike',
    involvedEntities: [
      'ExampleToken',
      'Alice',
      'Mike'
    ],
    actions: [
      {
        type: 'transfer',
        payload: {
          token: 'ExampleToken',
          toAccount: 'Alice',
          fromAccount: 'Mike',
          amount: 10
        }
      }
    ]
  }
}
*/

const handlePrivilege = (
  state: SystemState['entitySystem'],
  privilegeStack: any[],
  act: any,
  actionSpace: string
) => {
  if (act.type === 'pkauth') {
    const permission = state.entities[act.payload.authAs].permissions.find(
      ({ type, key }) => type === 'PK' && key === act.payload.key
    )
    if (!permission) {
      throw Error('No Permission')
    }
    return [[act.payload.authAs, permission.action], ...privilegeStack]
  }

  if (act.type === 'action-auth') {
    const permission = state.entities[actionSpace].permissions.find(
      ({ type }) => type === 'action'
    )
    if (!permission) {
      throw Error('No Permission')
    }
    return [[actionSpace, permission.action], ...privilegeStack]
  }

  if (act.type === 'ownership-auth') {
    const permission = state.entities[act.payload.authAs].permissions.find(
      ({ type, token }) => type === 'ownership' && token === act.payload.token
    )
    if (!permission) {
      throw Error('No Permission')
    }
    const currentEntity = privilegeStack[0][0]
    const CEInventory = state.entities[currentEntity]?.inventory ?? {}
    if (
      (CEInventory[permission.token ?? ''] ?? 0) < (permission.threshold ?? 0)
    ) {
      throw Error('Not enough Tokens to have permission')
    }
    return [[act.payload.authAs, permission.action], ...state.privilegeStack]
  }

  if (act.type === 'unauth') {
    return [...privilegeStack].slice(1)
  }
  return privilegeStack
}

function balanceCheck(state: any, accountId: string, TokenId: string) {
  const inventory = state.entities[accountId]?.inventory
  console.log('BALANCECH', inventory)

  if (!inventory) {
    return
  }

  const balance = inventory[TokenId]
  const tokenSettings = state.entities[TokenId]?.components.find(
    ({ type }: { type: string }) => type === 'token'
  )
  if (!tokenSettings) {
    return
  }
  const min = getMin(accountId, TokenId)({ entitySystem: state })

  if (balance < min) {
    throw new Error(
      `${accountId} is lower than min balance of ${min} for ${TokenId}`
    )
  }
  const max = getMax(accountId, TokenId)({ entitySystem: state })

  if (balance > max) {
    throw new Error(
      `${accountId} is higer than max balance of ${max} for ${TokenId}`
    )
  }

  console.log(accountId, TokenId, balance, min, max)
}

function proccessActions(
  draftState: SystemState['entitySystem'],
  actions: any[],
  IE: string[],
  transcationId: string,
  privStack: any[] = [],
  actionSpace = ''
) {
  let privilageStack = privStack

  for (let i = 0; i < actions.length; i += 1) {
    const A = actions[i]
    privilageStack = handlePrivilege(draftState, privilageStack, A, actionSpace)
    if (privilageStack[0]) {
      const activeAccount = privilageStack[0][0]
      if (
        privilageStack[0][1] !== '*' &&
        privilageStack[0][1] !== A.type &&
        !draftState.entities[activeAccount]?.permissions?.find(
          (perm) =>
            perm.type === 'any' &&
            (perm.action === '*' || perm.action === A.type)
        )
      ) {
        throw new Error('Dont have privalage for action')
      }

      if(A.type === 'resume') {
        const { pausedState } = draftState.entities[A.payload.transcation] ?? {};
        proccessActions(draftState, pausedState.remainingActions, IE, A.payload.transcation,  [privilageStack[0], ...pausedState.privilageStack], pausedState.actionSpace)
        for (let x = 0; x < IE.length; x += 1) {
          if (draftState.entities[A.payload.transcation].inventory?.[IE[x]]) {
            throw new Error(`${IE[i]} not allowed transcation`)
          }
        }
        delete draftState.entities[A.payload.transcation];
      }


      if(A.type === 'pause-auth') {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw {
          type: 'pause',
          privilageStack,
          actionSpace,
          remainingActions: actions.slice(i + 1),  
        }
      }

      const transfer = (
        fromInv: any,
        toInv: any,
        token: string,
        amount: number
      ) => {
        if (!fromInv) {
          throw new Error(`No from Inventory`)
        }
        if (!toInv) {
          throw new Error(`No to Inventory`)
        }
        fromInv[token] = fromInv[token] || 0
        toInv[A.payload.token] = toInv[token] || 0
        fromInv[A.payload.token] -= amount
        toInv[A.payload.token] += amount
      }

      if (A.type === 'transfer') {
        if (
          !IE.includes(A.payload.token) ||
          !IE.includes(A.payload.toAccount) ||
          !IE.includes(activeAccount)
        ) {
          throw Error('Trying todo a transfer on assest not listed')
        }
        transfer(
          draftState.entities[activeAccount].inventory,
          draftState.entities[A.payload.toAccount].inventory,
          A.payload.token,
          A.payload.amount
        )
      }
      if (A.type === 'reserve') {
        if (!IE.includes(A.payload.token)) {
          throw Error(`IE doesnt have ${A.payload.token}`)
        }
        if (!IE.includes(activeAccount)) {
          throw Error(`IE doesnt have ${activeAccount}`)
        }
        transfer(
          draftState.entities[activeAccount].inventory,
          draftState.entities[transcationId].inventory,
          A.payload.token,
          A.payload.amount
        )
      }

      if (A.type === 'request') {
        if (!IE.includes(A.payload.token) || !IE.includes(activeAccount)) {
          throw Error('Trying todo a transfer on assest not listed')
        }
        transfer(
          draftState.entities[transcationId].inventory,
          draftState.entities[activeAccount].inventory,
          A.payload.token,
          A.payload.amount
        )
      }
    }

    /*
     type: 'run-action',
                            payload: {
                              entity: address,
                              action: comp.actionName,
                            },
                            */
    if (A.type === 'run-action') {
      const actionInfo = ((draftState.entities[A.payload.entity] ?? {})
        ?.actions ?? {})[A.payload.action]
      if (!actionInfo) {
        throw new Error('No Action Info')
      }
      proccessActions(
        draftState,
        actionInfo.actions,
        IE,
        transcationId,
        privilageStack,
        A.payload.entity
      )
    }
    console.log(transcationId, A.type, '<<', privilageStack);

  }
}

function doTranscation(
  state: SystemState['entitySystem'],
  actions: { type: string; payload: any }[],
  IE: string[]
) {
  return produce(state, (draftState: any) => {
    console.log('Do Transcation', IE)
    const transcationId = `${Math.floor(Math.random() * 1000000000)}`

    if (draftState.entities[transcationId]) {
      throw new Error('Transcation open with this ID')
    }

    draftState.entities[transcationId] = {
      components: [
        {
          type: 'account',
        },
        {
          type: 'transcation',
        },
      ],
      inventory: {},
      permissions: [
        { "type": "any", action: 'resume'}
      ],
    }

    try {
    proccessActions(draftState, actions, IE, transcationId)
    } catch(e) {
      if(e.type === 'pause') {
        draftState.entities[transcationId].pausedState = {
          privilageStack: e.privilageStack,
          actionSpace: e.actionSpace,
          remainingActions: e.remainingActions,
          involvedEntities: IE,
        }
        
        for (let i = 0; i < IE.length; i += 1) {
          if ((draftState.entities[transcationId].inventory[IE[i]] || 0) < 0) {
            console.warn(`${IE[i]} left in negitive transcation`)
            // eslint-disable-next-line
            draftState.entities = original(draftState).entities; 
            return;
          }
          for (let j = 0; j < IE.length; j += 1) {
            try {
              balanceCheck(draftState, IE[i], IE[j])
            } catch (er) {
              console.warn(er, 'ERER')
              // eslint-disable-next-line
              draftState.entities = original(draftState).entities;
              return
            }
          }
          return;
        }
      } else {
      throw e;
      }
    }

    console.log('PRoccesed Ations')

    for (let i = 0; i < IE.length; i += 1) {
      if (draftState.entities[transcationId].inventory[IE[i]]) {
        console.warn(`${IE[i]} left in transcation`)
        // eslint-disable-next-line
        draftState.entities = original(draftState).entities; 
        return;
      }
      for (let j = 0; j < IE.length; j += 1) {
        try {
          balanceCheck(draftState, IE[i], IE[j])
        } catch (e) {
          console.warn(e, 'ERER')
          // eslint-disable-next-line
          draftState.entities = original(draftState).entities;
          return
        }
      }
    }
    delete draftState.entities[transcationId];

  })
}

export default (
  state: SystemState['entitySystem'] = initialState,
  action: EntityReducerAction
) => {
  switch (action.type) {
    case 'addAction': {
      const involvedEntities = new Set(state.involvedEntities)
      action.payload.involvedEntities.forEach((entity: string) =>
        involvedEntities.add(entity)
      )

      const out = {
        ...state,
        involvedEntities: Array.from(involvedEntities),
        actions: [...state.actions, action.payload.action],
        privilegeStack: handlePrivilege(
          state,
          state.privilegeStack,
          action.payload.action,
          ''
        ),
      }

      if (action.payload.action.type === 'run-action') {
        const actionInfo = (state.entities[action.payload.action.payload.entity]
          ?.actions ?? {})[action.payload.action.payload.action]

        actionInfo.involvedEntities.forEach((entity: string) =>
          involvedEntities.add(entity)
        )

        actionInfo.actions.reduce((currentState, act) => {
          return {
            ...currentState,
            privilegeStack: handlePrivilege(
              state,
              currentState.privilegeStack,
              act,
              action.payload.action.payload.entity
            ),
          }
        }, out)
      }

      return out
    }
    case 'submitTranscation': {
      return {
        ...doTranscation(state, state.actions, state.involvedEntities),
        involvedEntities: [],
        actions: [],
        privilegeStack: [],
      }
    }
    case 'transcation': {
      return doTranscation(
        state,
        action.payload.actions,
        action.payload.involvedEntities
      )
    }
    default:
      return state
  }
}
