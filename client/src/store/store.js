import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import searchReducer from './searchSlice';
import viewReducer from './viewSlice';

const loadState = () => {
    try {
        const authState = localStorage.getItem('rendezvous_auth');
        const searchState = localStorage.getItem('rendezvous_search');
        const viewState = localStorage.getItem('rendezvous_view');

        return {
            auth: authState ? JSON.parse(authState) : undefined,
            search: searchState ? JSON.parse(searchState) : undefined,
            view: viewState ? JSON.parse(viewState) : undefined,
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
        localStorage.setItem('rendezvous_view', JSON.stringify(state.view));
    } catch (err) {
        console.error('Error saving state:', err);
    }
};

const preloadedState = loadState();

export const store = configureStore({
    reducer: {
        auth: authReducer,
        search: searchReducer,
        view: viewReducer,
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
