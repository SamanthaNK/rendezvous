import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

const loadState = () => {
    try {
        const serializedState = localStorage.getItem('rendezvous_auth');
        if (serializedState === null) {
            return undefined;
        }
        return { auth: JSON.parse(serializedState) };
    } catch (err) {
        console.error('Error loading state:', err);
        return undefined;
    }
};

const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state.auth);
        localStorage.setItem('rendezvous_auth', serializedState);
    } catch (err) {
        console.error('Error saving state:', err);
    }
};

const preloadedState = loadState();

export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
    devTools: process.env.NODE_ENV !== 'production',
});

store.subscribe(() => {
    saveState(store.getState());
});