import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ListSettingsState = {
	generateName: boolean;
	generateDescription: boolean;
	generateItemDetails: boolean;
	returnPolicyEnabled: boolean;
	returnPolicy: string;
	nameAndLogo: {
		storeName: string;
		storeLogoUrl: string;
	};
	sellerInfoEnabled: boolean;
	isLoaded: boolean;
};

const initialState: ListSettingsState = {
	generateName: false,
	generateDescription: false,
	generateItemDetails: false,
	returnPolicyEnabled: false,
	returnPolicy: '',
	nameAndLogo: {
		storeName: '',
		storeLogoUrl: '',
	},
	sellerInfoEnabled: false,
	isLoaded: false,
};

const listSettingsSlice = createSlice({
	name: 'listSettings',
	initialState,
	reducers: {
		setListSettings: (state, action: PayloadAction<Partial<ListSettingsState>>) => {
			Object.assign(state, action.payload);
			state.isLoaded = true;
		},
		resetListSettings: () => initialState,
	},
});

export const { setListSettings, resetListSettings } = listSettingsSlice.actions;
export default listSettingsSlice.reducer;
