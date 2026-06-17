import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AccountState = {
	email: string;
	city: string;
	state: string;
	radius: number;
};

const initialState: AccountState = {
	email: '',
	city: '',
	state: '',
	radius: 0,
};

const accountSlice = createSlice({
	name: 'account',
	initialState,
	reducers: {
		setEmail: (state, action: PayloadAction<string>) => {
			state.email = action.payload;
		},
		setCity: (state, action: PayloadAction<string>) => {
			state.city = action.payload;
		},
		setState: (state, action: PayloadAction<string>) => {
			state.state = action.payload;
		},
		setRadius: (state, action: PayloadAction<number>) => {
			state.radius = action.payload;
		},
		setAccountInfo: (state, action: PayloadAction<Partial<AccountState>>) => {
			Object.assign(state, action.payload);
		},
		resetAccount: () => initialState,
	},
});

export const {
	setEmail,
	setCity,
	setState,
	setRadius,
	setAccountInfo,
	resetAccount,
} = accountSlice.actions;

export default accountSlice.reducer;
