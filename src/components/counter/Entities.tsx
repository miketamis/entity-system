import React, { Fragment, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectors } from '../../features/counter'
import { getMin } from '../../features/counter/selectors'
import { SystemState } from '../../features/counter/types'

function AssestPicker({
  state,
  name,
  label,
  value,
  onValueChange,
}: {
  label?: string
  name?: string
  state: SystemState
  value: string
  onValueChange: (val: string) => void
}) {
  const entities = Object.keys(state.entitySystem.entities).map((address) => {
    const activeAccount = (state.entitySystem.privilegeStack[0] ?? [])[0]

    const min = getMin(activeAccount, address)(state)

    const avaliableBalance =
      ((state.entitySystem.entities[activeAccount]?.inventory ?? {})[address] ??
        0) - min
    return {
      address,
      avaliableBalance,
    }
  })

  useEffect(() => {
    onValueChange(
      entities.find(({ avaliableBalance }) => avaliableBalance > 0)?.address ||
        ''
    )
  }, [])
  return (
    <div className="">
      <label htmlFor={name}>{label}</label>
      <select
        className="browser-default"
        name={name}
        value={value}
        onChange={({ target }) => onValueChange(target.value)}
      >
        <option value="" disabled selected>
          Choose an Assest
        </option>
        {entities.map(
          ({ avaliableBalance, address }) =>
            avaliableBalance > 0 && (
              <option value={address}>
                {address} ({avaliableBalance})
              </option>
            )
        )}
      </select>
    </div>
  )
}

AssestPicker.defaultProps = {
  label: 'Token',
  name: 'token',
}

function Transfer({
  address,
  accountSettings,
  signerPermissions,
}: {
  address: string
  accountSettings: any
  signerPermissions: (entityId: string, action: string) => any
}) {
  const dispatch = useDispatch()
  const [token, setToken] = useState('ExampleToken')
  const [toAccount, setToAccount] = useState('Alice')
  const [amountString, setAmount] = useState('10')
  const entities = useSelector(selectors.getEntities)
  const wholeState = useSelector((state: SystemState) => state)

  const tokenEntitySettings = entities[token]?.components.find(
    ({ type }) => type === 'token'
  )
  const fromAccountSettings = entities[address]?.components.find(
    ({ type }) => type === 'account'
  )
  const toAccountSettings = entities[toAccount]?.components.find(
    ({ type }) => type === 'account'
  )

  const amount = parseInt(amountString, 10)

  return (
    <div>
      TRANSFFER {address} {JSON.stringify(accountSettings)}
      <form>
        <AssestPicker
          state={wholeState}
          onValueChange={setToken}
          value={token}
        />

        <label htmlFor="to">
          To
          <input
            name="to"
            type="text"
            onChange={(event) => {
              setToAccount(event.target.value)
            }}
            value={toAccount}
          />
        </label>
        <label htmlFor="amount">
          To
          <input
            name="amount"
            type="text"
            onChange={(event) => {
              setAmount(event.target.value)
            }}
            value={amountString}
          />
        </label>
        <button
          className="btn"
          type="button"
          disabled={
            !tokenEntitySettings ||
            !fromAccountSettings ||
            !toAccountSettings ||
            !amount ||
            !signerPermissions(address, 'withdraw') ||
            !signerPermissions(toAccount, 'deposit')
          }
          onClick={() =>
            dispatch({
              type: 'addAction',
              payload: {
                involvedEntities: [token, toAccount, address],
                action: {
                  type: 'transfer',
                  payload: { token, toAccount, fromAccount: address, amount },
                },
              },
            })
          }
        >
          Transfer
        </button>
      </form>
    </div>
  )
}

const Entities: React.FC = () => {
  const entities = useSelector(selectors.getEntities)
  const [authedAs, permission] = useSelector(
    (state: SystemState) => state.entitySystem.privilegeStack[0] || ['', '']
  )

  const wholeState = useSelector((state: SystemState) => state)
  const dispatch = useDispatch()

  const signerPermissions = (entityId: string, action: string) =>
    (entityId === authedAs && permission === '*') ||
    permission === action ||
    entities[entityId]?.permissions?.find(
      (perm) =>
        perm.type === 'any' && (perm.action === '*' || perm.action === action)
    )

  return (
    <Fragment>
      <div className="row">
        <div className="col s12 m6">
          <h2>Transcation</h2>
          <button
            className="btn"
            type="button"
            onClick={() => dispatch({ type: 'submitTranscation' })}
          >
            Submit Transcation
          </button>
          <h3>Involved Entities</h3>
          {wholeState.entitySystem.involvedEntities.join(' ')}
          <h3>Actions</h3>
          {wholeState.entitySystem.actions.map((action, index) => (
            <div className="card">
              <h4>
                {index}: {action.type}
              </h4>
              {JSON.stringify(action.payload, null, 2)}
            </div>
          ))}
          <h2>Entities</h2>
          {Object.entries(entities).map(([address, entity]) => {
            const accountSettings = entity.components.find(
              ({ type }) => type === 'account'
            )
            const tokenSettings = entity.components.find(
              ({ type }) => type === 'token'
            )
            return (
              <div className="card">
                <div className="card-content">
                  <h4>{address}</h4>
                  {entity.components.find(({ type }) => type === 'transcation') && <div>
                  <h5>privilage Stack</h5> {JSON.stringify(entity.pausedState.privilageStack)}
                  <h5>Action Space</h5> {entity.pausedState.actionSpace}
                  <h5>Involved Entities</h5> {entity.pausedState.involvedEntities.join(' ')}
                  <h5>Remaining Actions</h5>
                    {
                      entity.pausedState.remainingActions.map((action: any, index: number) => (
                        <div className="card">
                          <h4>
                            {index}: {action.type}
                          </h4>
                          {JSON.stringify(action.payload, null, 2)}
                        </div>
                      ))}
                    
                    </div>
                   }
                  {tokenSettings && JSON.stringify(tokenSettings)}
                  {accountSettings && (
                    <div>
                      <h5>Inventory</h5>
                      <table>
                        <tr>
                          <th>Entity</th>
                          <th>Balance</th>
                          <th>Avalable Balance</th>
                        </tr>
                        {Object.entries(entity.inventory ?? {}).map(
                          ([assest, amount]) => (
                            <tr>
                              <td>{assest}</td>
                              <td>{amount}</td>
                              <td>{amount - getMin(address, assest)(wholeState)}</td>
                            </tr>
                          )
                        )}
                      </table>
                    </div>
                  )}
                  <h5>Permissions</h5>
                      <table>
                        <tr>
                          <th>Type</th>
                          <th>Granted By</th>
                          <th>Granted Action</th>
                        </tr>
                        {entity.permissions.map(
                          ( perm) => (
                            <tr>
                              <td>{perm.type}</td>
                              <td>{(() => {
                                if(perm.type === 'PK') {
                                  return `${perm.key}`
                                }
                                if(perm.type === 'any') {
                                  return '*'
                                }
                                if(perm.type === 'ownership') {
                                  return `at least ${perm.threshold || 1} of ${perm.token}`
                                }
                                return ''
                                })()}
                                </td>
                                <td>{perm.action}</td>

                            </tr>
                          )
                        )}
                      </table>
                  <h5>Actions</h5>
                  {
                     entity.components.find(({ type }) => type === 'transcation') && <button type="button" className="btn"  onClick={() => {
                      dispatch({
                        type: 'addAction',
                        payload: {
                          involvedEntities:  entity.pausedState.involvedEntities,
                          action: {
                            type: 'resume', 
                            payload: {
                              transcation: address,
                            }
                          },
                        },
                      })

                    }}>
                       Resume
                     </button>
                  }
                  {
                    entity.components.map((comp) => {
                      if(comp.type !== 'action') {
                        return null;

                      }

                      if(!signerPermissions(address, comp.actionName || '')) {
                        return null;
                      }

                      return <button type="button" className="btn" onClick={() => {
                        dispatch({
                          type: 'addAction',
                          payload: {
                            involvedEntities: entity.actions?.[comp.actionName || '']?.involvedEntities,
                            action: {
                              type: 'run-action',
                              payload: {
                                entity: address,
                                action: comp.actionName,
                              },
                            },
                          },
                        })

                      }}>{comp.actionName}</button>
                    })
                  }
                  {accountSettings &&
                    !!signerPermissions(address, 'withdraw') && (
                      <Transfer
                        signerPermissions={signerPermissions}
                        address={address}
                        accountSettings={accountSettings}
                      />
                    )}
                  {entity.permissions.map((perm) => {
                    if (perm.type === 'PK') {
                      return (
                        <div>
                          <button
                            className="btn"
                            type="button"
                            onClick={() => {
                              dispatch({
                                type: 'addAction',
                                payload: {
                                  involvedEntities: [address],
                                  action: {
                                    type: 'pkauth',
                                    payload: {
                                      authAs: address,
                                      key: perm.key,
                                    },
                                  },
                                },
                              })
                            }}
                          >
                            PK Auth Key: {perm.key}
                          </button>
                        </div>
                      )
                    }
                    if (
                      perm.type === 'ownership' &&
                      (entities[authedAs]?.inventory?.[perm.token || ''] || 0) >
                        (perm.threshold || 0)
                    ) {
                      return (
                        <div>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              dispatch({
                                type: 'addAction',
                                payload: {
                                  involvedEntities: [address],
                                  action: {
                                    type: 'ownership-auth',
                                    payload: {
                                      authAs: address,
                                      token: perm.token,
                                    },
                                  },
                                },
                              })
                            }}
                          >
                            Ownership via Token: {perm.token}
                          </button>
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Fragment>
  )
}

export default Entities
