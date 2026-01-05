import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import searchReducer from './searchSlice';

const loadState = () => {
    try {
        const authState = localStorage.getItem('rendezvous_auth');
        const searchState = localStorage.getItem('rendezvous_search');

        return {
            auth: authState ? JSON.parse(authState) : undefined,
            search: searchState ? JSON.parse(searchState) : undefined,
        };
    } catch (err) {
        console.error('Error loading state:', err);
        return undefined;
    }
};

const saveState = (state) => {
    try {
        localStorage.setItem('rendezvous_auth', JSON.stringify(state.auth));
        localStorage.setItem('rendezvous_search', JSON.stringify(state.search));
    } catch (err) {
        console.error('Error saving state:', err);
    }
};

const preloadedState = loadState();

export const store = configureStore({
    reducer: {
        auth: authReducer,
        search: searchReducer,
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
