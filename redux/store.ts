import { configureStore } from '@reduxjs/toolkit';

import accountReducer from './slices/accountSlice';

export const store = configureStore({
  reducer: {
    account: accountReducer,
  }
})

// Infer the type of `store`
export type AppStore = typeof store
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = typeof store.dispatch
// Same for the `RootState` type
export type RootState = ReturnType<typeof store.getState>