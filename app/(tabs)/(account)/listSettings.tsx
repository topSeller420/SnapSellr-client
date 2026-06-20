import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Tooltip } from '@/components/ui/tooltip';
import { Colors } from '@/constants/theme';

import type { SellerListingSettings } from '@/apis/schemas/sellerListingSettingsSchema';
import { getSellerListingSettingsAPI, updateSellerListingSettingsAPI } from '@/apis/sellerListingSettingsController';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setListSettings } from '@/redux/slices/listSettingsSlice';

export default function ListSettings() {
	// set default color theme to dark for now
	// const theme = useColorScheme() ?? 'light';
	const theme = 'dark';

	const dispatch = useAppDispatch();
	const listSettings = useAppSelector(state => state.listSettings);

	// Listing toggles
	const [nameEnabled, setNameEnabled] = useState(false);
	const toggleNameSwitch = () => {
		const newVal = !nameEnabled;
		setNameEnabled(newVal);

		dispatch(setListSettings({ generateName: newVal }));
	};
	const [descriptionEnabled, setDescriptionEnabled] = useState(false);
	const toggleDescriptionSwitch = () => {
		const newVal = !descriptionEnabled;
		setDescriptionEnabled(newVal);

		dispatch(setListSettings({ generateDescription: newVal }));
	};
	const [detailsEnabled, setDetailsEnabled] = useState(false);
	const toggleDetailsSwitch = () => {
		const newVal = !detailsEnabled;
		setDetailsEnabled(newVal);
		
		dispatch(setListSettings({ generateItemDetails: newVal }));
	};

	// Seller toggles
	// Return policy
	const [returnPolicyEnabled, setReturnPolicyEnabled] = useState(false);
	const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
	const [returnPolicyValue, setReturnPolicyValue] = useState('');
	// Seller info
	const [sellerInfoEnabled, setSellerInfoEnabled] = useState(false);
	const [isSellerInfoModalVisible, setSellerInfoModalVisible] = useState(false);
	const [sellerNameValue, setSellerNameValue] = useState('');
	const [sellerLogoValue, setSellerLogoValue] = useState('');

	const getListingSettings = useCallback(() => {
		const pathVariables = {
			id: "6cd7f79f-3c38-412e-a38f-61280c54636d"
		};
		getSellerListingSettingsAPI(pathVariables, (response: SellerListingSettings) => {
			console.log("response: ", response);

			dispatch(setListSettings({
				generateName: response.auto_generate_title ?? false,
				generateDescription: response.auto_generate_description ?? false,
				generateItemDetails: response.auto_generate_details ?? false,
				
				returnPolicyEnabled: response.auto_include_return_policy ?? false,
				returnPolicy: response.return_policy_text ?? '',
				nameAndLogo: {
					storeName: response.store_name ?? '',
					storeLogoUrl: response.store_logo_url ?? '',
				},
				sellerInfoEnabled: (response.auto_include_store_name && response.auto_include_store_logo) ?? false,
			}));
		});
	}, [dispatch]);

	useEffect(() => {
		if (!listSettings.isLoaded) {
			getListingSettings();
		}
	}, [listSettings.isLoaded, getListingSettings]);

	useEffect(() => {
		if (listSettings.isLoaded) {
			setNameEnabled(listSettings.generateName);
			setDescriptionEnabled(listSettings.generateDescription);
			setDetailsEnabled(listSettings.generateItemDetails);
			setReturnPolicyEnabled(listSettings.returnPolicyEnabled);
			setReturnPolicyValue(listSettings.returnPolicy);
			setSellerInfoEnabled(listSettings.sellerInfoEnabled);
			setSellerNameValue(listSettings.nameAndLogo.storeName);
			setSellerLogoValue(listSettings.nameAndLogo.storeLogoUrl);
		}
	}, [listSettings]);

	function updateListingSettings(fieldChangesToValues: { [key: string]: any }) {
		const pathVariables = {
			id: "6cd7f79f-3c38-412e-a38f-61280c54636d"
		};
		let payload = {
			auto_include_return_policy: returnPolicyEnabled,
			auto_include_store_name: sellerInfoEnabled,
			auto_include_store_logo: sellerInfoEnabled,

			return_policy_text: returnPolicyValue,
			store_name: sellerNameValue,
			store_logo_url: sellerLogoValue
		};
		Object.assign(payload, fieldChangesToValues);

		updateSellerListingSettingsAPI(pathVariables, payload, (response: any) => {
			console.log("update response: ", response);

			const responsePayload = typeof response === 'object' && response !== null ? response : payload;
			dispatch(setListSettings({
				returnPolicyEnabled: responsePayload.auto_include_return_policy ?? payload.auto_include_return_policy,
				returnPolicy: responsePayload.return_policy_text ?? payload.return_policy_text,
				nameAndLogo: {
					storeName: responsePayload.store_name ?? payload.store_name,
					storeLogoUrl: responsePayload.store_logo_url ?? payload.store_logo_url,
				},
				sellerInfoEnabled: (responsePayload.auto_include_store_name && responsePayload.auto_include_store_logo) ?? (payload.auto_include_store_name && payload.auto_include_store_logo),
			}));
		});
	}

	const toggleReturnPolicySwitch = () => {
		if (!returnPolicyEnabled) {
			!returnPolicyEnabled && setIsReturnModalVisible(true);
		}
		else {
			setReturnPolicyEnabled(previousState => !previousState);
			updateListingSettings({
				auto_include_return_policy: !returnPolicyEnabled
			});
		}
	};

	function closeReturnPolicy() {
		setIsReturnModalVisible(false);
		setReturnPolicyEnabled(false);
	}

	function saveReturnPolicy() {
		setIsReturnModalVisible(false);
		// Immediately set enabled locally and in Redux (optimistic)
		setReturnPolicyEnabled(true);
		dispatch(setListSettings({ returnPolicyEnabled: true, returnPolicy: returnPolicyValue }));
		updateListingSettings({
			auto_include_return_policy: true,
			return_policy_text: returnPolicyValue
		});
	}

	const toggleSellerInfoSwitch = () => {
		if (!sellerInfoEnabled) {
			!sellerInfoEnabled && setSellerInfoModalVisible(true);
		}
		else {
			setSellerInfoEnabled(previousState => !previousState);
			updateListingSettings({
				auto_include_store_name: !sellerInfoEnabled,
				auto_include_store_logo: !sellerInfoEnabled
			});
		}
	};

	function closeSellerInfo() {
		setSellerInfoModalVisible(false);
		setSellerInfoEnabled(false);
	}

	function saveSellerInfo() {
		setSellerInfoModalVisible(false);
		// Immediately set enabled locally and in Redux (optimistic)
		setSellerInfoEnabled(true);
		dispatch(setListSettings({
			sellerInfoEnabled: true,
			nameAndLogo: { storeName: sellerNameValue, storeLogoUrl: sellerLogoValue }
		}));
		updateListingSettings({
			auto_include_store_name: true,
			auto_include_store_logo: true,
			store_name: sellerNameValue,
			store_logo_url: sellerLogoValue
		});
	}


	return (
		<ParallaxScrollView style={styles.container}>
			<Modal
				visible={isReturnModalVisible}
				animationType="slide"
				onRequestClose={closeReturnPolicy}
				transparent={true}
				>
				<View style={styles.modal}>
					<ThemedView style={styles.modalContainer}>
						<View style={styles.dragHandle} />
						<ThemedText style={styles.modalHeader}>Return policy</ThemedText>
						<TextInput style={styles.textArea}
							onChangeText={text => setReturnPolicyValue(text)}
        					value={returnPolicyValue}
							placeholder="Describe your return policy..."
							placeholderTextColor={Colors.dark.border}
							multiline={true}
						/>
						<View style={styles.modalButtonsContainer}>
							<Pressable onPress={closeReturnPolicy} style={styles.closeButtonContainer}>
								<ThemedText style={styles.closeButton}>Cancel</ThemedText>
							</Pressable>
							<Pressable onPress={saveReturnPolicy} style={styles.saveButtonContainer}>
								<ThemedText style={styles.saveButton}>Save</ThemedText>
							</Pressable>
						</View>
					</ThemedView>
				</View>
			</Modal>
			<Modal
				visible={isSellerInfoModalVisible}
				animationType="slide"
				onRequestClose={closeSellerInfo}
				transparent={true}
				>
				<View style={styles.modal}>
					<ThemedView style={styles.modalContainer}>
						<View style={styles.dragHandle} />
						<ThemedText style={styles.modalHeader}>Seller info</ThemedText>
						<TextInput style={styles.textInput}
							onChangeText={text => setSellerNameValue(text)}
        					value={sellerNameValue}
							placeholder="Store name"
							placeholderTextColor={Colors.dark.border}
						/>
						<TextInput style={styles.textInput}
							onChangeText={text => setSellerLogoValue(text)}
        					value={sellerLogoValue}
							placeholder="Logo URL"
							placeholderTextColor={Colors.dark.border}
						/>
						<View style={styles.modalButtonsContainer}>
							<Pressable onPress={closeSellerInfo} style={styles.closeButtonContainer}>
								<ThemedText style={styles.closeButton}>Cancel</ThemedText>
							</Pressable>
							<Pressable onPress={saveSellerInfo} style={styles.saveButtonContainer}>
								<ThemedText style={styles.saveButton}>Save</ThemedText>
							</Pressable>
						</View>
					</ThemedView>
				</View>
			</Modal>

			<Pressable>
				<ThemedView style={styles.sectionCard}>
					<View style={styles.sectionHeaderContainer}>
						<ThemedText style={styles.settingSectionHeader}>LISTING</ThemedText>
						<Tooltip content="These are automatically applied to each new listing" position="right">
							<IconSymbol
								name={'info.circle'}
								size={16}
								weight="medium"
								color={Colors[theme].icon}
							/>
						</Tooltip>
					</View>

					<View style={styles.settingSection}>
						<ThemedText style={styles.listSettingsText}>Generate item's name</ThemedText>
						<Switch
							trackColor={{false: Colors[theme].switchToggle.trackFalse, true: Colors[theme].switchToggle.trackTrue}}
							thumbColor={Colors[theme].switchToggle.thumb}
							style={{ height: 32, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
							ios_backgroundColor={Colors[theme].switchToggle.ios_backgroundColor}
							onValueChange={toggleNameSwitch}
							value={nameEnabled}
						/>
					</View>

					<View style={styles.settingSection}>
						<ThemedText style={styles.listSettingsText}>Generate item's description</ThemedText>
						<Switch
							trackColor={{false: Colors[theme].switchToggle.trackFalse, true: Colors[theme].switchToggle.trackTrue}}
							thumbColor={Colors[theme].switchToggle.thumb}
							style={{ height: 32, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
							ios_backgroundColor={Colors[theme].switchToggle.ios_backgroundColor}
							onValueChange={toggleDescriptionSwitch}
							value={descriptionEnabled}
						/>
					</View>

					<View style={styles.settingSection}>
						<ThemedText style={styles.listSettingsText}>Generate item's details</ThemedText>
						<Switch
							trackColor={{false: Colors[theme].switchToggle.trackFalse, true: Colors[theme].switchToggle.trackTrue}}
							thumbColor={Colors[theme].switchToggle.thumb}
							style={{ height: 32, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
							ios_backgroundColor={Colors[theme].switchToggle.ios_backgroundColor}
							onValueChange={toggleDetailsSwitch}
							value={detailsEnabled}
						/>
					</View>
				</ThemedView>

				<ThemedView style={styles.sectionCard}>
					<View style={styles.sectionHeaderContainer}>
						<ThemedText style={styles.settingSectionHeader}>SELLER</ThemedText>
						<Tooltip content="These will appear at the bottom of each item's description" position="right">
							<IconSymbol
								name={'info.circle'}
								size={16}
								weight="medium"
								color={Colors[theme].icon}
							/>
						</Tooltip>
					</View>

					<View style={styles.settingSection}>
						<ThemedText style={styles.listSettingsText}>Include return policy</ThemedText>
						<Switch
							trackColor={{false: Colors[theme].switchToggle.trackFalse, true: Colors[theme].switchToggle.trackTrue}}
							thumbColor={Colors[theme].switchToggle.thumb}
							style={{ height: 32, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
							ios_backgroundColor={Colors[theme].switchToggle.ios_backgroundColor}
							onValueChange={toggleReturnPolicySwitch}
							value={returnPolicyEnabled}
						/>
					</View>

					<View style={styles.settingSection}>
						<ThemedText style={styles.listSettingsText}>Include name and logo</ThemedText>
						<Switch
							trackColor={{false: Colors[theme].switchToggle.trackFalse, true: Colors[theme].switchToggle.trackTrue}}
							thumbColor={Colors[theme].switchToggle.thumb}
							style={{ height: 32, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
							ios_backgroundColor={Colors[theme].switchToggle.ios_backgroundColor}
							onValueChange={toggleSellerInfoSwitch}
							value={sellerInfoEnabled}
						/>
					</View>
				</ThemedView>
			</Pressable>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 0,
	},
	sectionCard: {
		borderRadius: 16,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: Colors.dark.border,
		marginBottom: 16,
	},
	sectionHeaderContainer: {
		backgroundColor: Colors.dark.sectionHeader.backgroundColor,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 10,
		gap: 8,
	},
	settingSectionHeader: {
		fontSize: 11,
		fontWeight: '600',
		letterSpacing: 0.8,
		color: Colors.dark.icon,
	},
	settingSection: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: Colors.dark.border,
	},
	listSettingsText: {
		fontSize: 15,
		fontWeight: '500',
	},

	// Modal styles
	modal: {
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		height: '100%',
		width: '100%',
	},
	modalContainer: {
		flexDirection: 'column',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		backgroundColor: Colors.dark.modal.background,
		paddingTop: 12,
		paddingHorizontal: 24,
		paddingBottom: 40,
		position: 'absolute',
		bottom: 0,
		width: '100%',
	},
	dragHandle: {
		width: 36,
		height: 4,
		borderRadius: 2,
		backgroundColor: Colors.dark.border,
		alignSelf: 'center',
		marginBottom: 24,
	},
	modalHeader: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 20,
	},
	textArea: {
		color: Colors.dark.text,
		backgroundColor: '#242628',
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 16,
		textAlignVertical: 'top',
		height: 110,
		width: '100%',
		fontSize: 15,
	},
	textInput: {
		color: Colors.dark.text,
		backgroundColor: '#242628',
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 16,
		marginBottom: 10,
		width: '100%',
		fontSize: 15,
	},
	modalButtonsContainer: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 24,
		width: '100%',
	},
	closeButtonContainer: {
		backgroundColor: '#242628',
		borderRadius: 12,
		paddingVertical: 14,
		flexGrow: 1,
	},
	closeButton: {
		textAlign: 'center',
		fontWeight: '500',
		color: Colors.dark.text,
	},
	saveButtonContainer: {
		borderRadius: 12,
		backgroundColor: Colors.dark.saveButton.backgroundColor,
		paddingVertical: 14,
		flexGrow: 1,
	},
	saveButton: {
		textAlign: 'center',
		fontWeight: '700',
		color: Colors.dark.saveButton.textColor,
	},
});
