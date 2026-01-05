import { createSlice } from '@reduxjs/toolkit';

const MAX_HISTORY_ITEMS = 10;

const initialState = {
    searchHistory: [],
    recentQuery: null,
    loading: false,
    error: null,
};

const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        addToHistory: (state, action) => {
            const query = action.payload.trim();
            if (!query) return;

            state.searchHistory = state.searchHistory.filter((item) => item !== query);

            state.searchHistory.unshift(query);

            if (state.searchHistory.length > MAX_HISTORY_ITEMS) {
                state.searchHistory = state.searchHistory.slice(0, MAX_HISTORY_ITEMS);
            }
        },
        removeFromHistory: (state, action) => {
            state.searchHistory = state.searchHistory.filter(
                (item) => item !== action.payload
            );
        },
        clearHistory: (state) => {
            state.searchHistory = [];
        },
        setRecentQuery: (state, action) => {
            state.recentQuery = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const {
    addToHistory,
    removeFromHistory,
    clearHistory,
    setRecentQuery,
    setLoading,
    setError,
} = searchSlice.actions;

export const selectSearchHistory = (state) => state.search.searchHistory;
export const selectRecentQuery = (state) => state.search.recentQuery;
export const selectSearchLoading = (state) => state.search.loading;
export const selectSearchError = (state) => state.search.error;

export default searchSlice.reducer;