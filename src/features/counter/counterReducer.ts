/*
{
  type: 'addAction',
  payload: {
    involvedEntities: [
      'ExampleToken',
      'Alice',
      'Mike'
    ],
    action: {
      type: 'transfer',
      payload: {
        token: 'ExampleToken',
        toAccount: 'Alice',
        fromAccount: 'Mike',
        amount: 10
      }
    }
  }
}
*/

const initialState = {
  involvedEntities: [] as string[],
  actions: [] as any[],
  privilegeStack: [] as any[],
}

export default (state = initialState, action: any) => {
  switch (action.type) {

    default:
      return state
  }
}
