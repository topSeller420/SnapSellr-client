import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Tooltip } from '@/components/ui/tooltip';
import { Colors } from '@/constants/theme';

import type { SellerListingSettings } from '@/apis/schemas/sellerListingSettingsSchema';
import { getSellerListingSettingsAPI, updateSellerListingSettingsAPI } from '@/apis/sellerListingSettingsController';

export default function ListSettings() {
	// set default color theme to dark for now
	// const theme = useColorScheme() ?? 'light';
	const theme = 'dark';

	// Listing toggles
	const [nameEnabled, setNameEnabled] = useState(false);
	const toggleNameSwitch = () => {
		setNameEnabled(previousState => !previousState);
	};
	const [descriptionEnabled, setDescriptionEnabled] = useState(false);
	const toggleDescriptionSwitch = () => setDescriptionEnabled(previousState => !previousState);
	const [detailsEnabled, setDetailsEnabled] = useState(false);
	const toggleDetailsSwitch = () => setDetailsEnabled(previousState => !previousState);

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

	useEffect(() => {
		getListingSettings();
	}, []);

	function getListingSettings() {
		const pathVariables = {
			id: "2622ea56-8d94-4164-8518-3d2637033103"
		};
		getSellerListingSettingsAPI(pathVariables, (response: SellerListingSettings) => {
			// {
			// 	"auto_generate_description": false,
			// 	"auto_generate_details": false,
			// 	"auto_generate_title": false,
				
			// 	"auto_include_return_policy": true,
			// 	"auto_include_store_logo": true,
			// 	"auto_include_store_name": true,
				
			// 	"created_at": "2026-03-10T23:10:42.542Z",
			// 	"id": "bf8df769-7b99-4ab0-bc66-49fa3a05ab10",
				
			// 	"return_policy_text": "We offer a 30-day return policy for all items.",
			// 	"store_logo_url": "https://example.com/logo.png",
			// 	"store_name": "John's Store"
			// }
			console.log("response: ", response);

			setNameEnabled(response.auto_generate_title ?? false);
			setDescriptionEnabled(response.auto_generate_description ?? false);
			setDetailsEnabled(response.auto_generate_details ?? false);

			setReturnPolicyEnabled(response.auto_include_return_policy ?? false);
			setSellerInfoEnabled((response.auto_include_store_name && response.auto_include_store_logo) ?? false);

			setReturnPolicyValue(response.return_policy_text ?? '');
			setSellerNameValue(response.store_name ?? '');
			setSellerLogoValue(response.store_logo_url ?? '');
		});
	}

	function updateListingSettings(fieldChangesToValues: { [key: string]: any }) {
		const pathVariables = {
			id: "5fcd21c9-a3f2-4d73-9da3-26eb4c868886"
		};
		let payload = {
			auto_generate_title: nameEnabled,
			auto_generate_description: descriptionEnabled,
			auto_generate_details: detailsEnabled,

			auto_include_return_policy: returnPolicyEnabled,
			auto_include_store_name: sellerInfoEnabled,
			auto_include_store_logo: sellerInfoEnabled,

			return_policy_text: returnPolicyValue,
			store_name: sellerNameValue,
			store_logo_url: sellerLogoValue
		};
		Object.assign(payload, fieldChangesToValues);

		updateSellerListingSettingsAPI(pathVariables, payload, (response: string) => {
			console.log("update response: ", response);
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
		setReturnPolicyEnabled(true);
		updateListingSettings({
			auto_include_return_policy: returnPolicyEnabled,
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
		updateListingSettings({
			auto_include_store_name: sellerInfoEnabled,
			auto_include_store_logo: sellerInfoEnabled,
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
						<ThemedText style={styles.modalHeader}>
							Return policy
						</ThemedText>
						<TextInput style={styles.textArea}
							onChangeText={text => setReturnPolicyValue(text)}
        					value={returnPolicyValue}
							placeholder="Your custom return policy here..."
							placeholderTextColor={Colors.dark.modal.text}
							multiline={true}
						/>
						<View style={styles.modalButtonsContainer}>
							<Pressable onPress={closeReturnPolicy} style={styles.closeButtonContainer}>
								<ThemedText style={styles.closeButton}>Close</ThemedText>
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
						<ThemedText style={styles.modalHeader}>
							Seller info
						</ThemedText>
						<TextInput style={styles.textInput}
							onChangeText={text => setSellerNameValue(text)}
        					value={sellerNameValue}
							placeholder="Your store name here..."
							placeholderTextColor={Colors.dark.modal.text}
						/>
						<TextInput style={styles.textInput}
							onChangeText={text => setSellerLogoValue(text)}
        					value={sellerLogoValue}
							placeholder="Your store logo URL here..."
							placeholderTextColor={Colors.dark.modal.text}
						/>
						<View style={styles.modalButtonsContainer}>
							<Pressable onPress={closeSellerInfo} style={styles.closeButtonContainer}>
								<ThemedText style={styles.closeButton}>Close</ThemedText>
							</Pressable>
							<Pressable onPress={saveSellerInfo} style={styles.saveButtonContainer}>
								<ThemedText style={styles.saveButton}>Save</ThemedText>
							</Pressable>
						</View>
					</ThemedView>
				</View>
			</Modal>

			<Pressable>
				<ThemedView>
					<View style={styles.sectionHeaderContainer}>
						<ThemedText style={styles.settingSectionHeader}>
							LISTING
						</ThemedText>

						<Tooltip content="These are automatically applied to each new listing" position="right">
							<IconSymbol
								name={'info.circle'}
								size={18}
								weight="medium"
								color={Colors[theme].icon}
							/>
						</Tooltip>
					</View>

					<View style={styles.settingSection}>
						<ThemedText style={styles.listSettingsText}>
							Generate item's name
						</ThemedText>
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
						<ThemedText style={styles.listSettingsText}>
							Generate item's description
						</ThemedText>
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
						<ThemedText style={styles.listSettingsText}>
							Generate item's details
						</ThemedText>
						<Switch
							trackColor={{false: Colors[theme].switchToggle.trackFalse, true: Colors[theme].switchToggle.trackTrue}}
							thumbColor={Colors[theme].switchToggle.thumb}
							style={{ height: 32,transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
							ios_backgroundColor={Colors[theme].switchToggle.ios_backgroundColor}
							onValueChange={toggleDetailsSwitch}
							value={detailsEnabled}
						/>
					</View>
				</ThemedView>

				<ThemedView>
					<View style={styles.sectionHeaderContainer}>
						<ThemedText style={styles.settingSectionHeader}>
							SELLER
						</ThemedText>

						<Tooltip content="These will appear at the bottom of each item's description" position="right">
							<IconSymbol
								name={'info.circle'}
								size={18}
								weight="medium"
								color={Colors[theme].icon}
							/>
						</Tooltip>
					</View>

					<View style={styles.settingSection}>
						<ThemedText style={styles.listSettingsText}>
							Include return policy
						</ThemedText>
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
						<ThemedText style={styles.listSettingsText}>
							Include name and logo
						</ThemedText>
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
		padding: 0
	},
	sectionHeaderContainer: {
		backgroundColor: Colors.dark.sectionHeader.backgroundColor,
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
	},
	settingSectionHeader: {
		fontSize: 12,
		fontWeight: 600,
		padding: 12,
	},
	settingSection: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingVertical: 4,
	},
	listSettingsText: {
		fontSize: 13,
		fontWeight: 'bold',
	},

	// Modal styles
	modal: {
		backgroundColor: 'rgba(0, 0, 0, 0.75)', 
		color: Colors.dark.modal.text,
		height: '100%',
		width: '100%',
	},
	modalContainer: {
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'column',

		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		backgroundColor: Colors.dark.modal.background,
		padding: 32,
		position: 'absolute',
		bottom: 0,
		height: '40%',
		width: '100%',
	},
	modalHeader: {
		fontSize: 24,
		fontWeight: 'bold',
		marginTop: 20,
		marginBottom: 36,
	},
	textArea: {
		color: Colors.dark.modal.text,
		borderWidth: 1,
		borderColor: Colors.dark.modal.text,
		borderRadius: 10,
		paddingVertical: 14,
		paddingHorizontal: 10,
		// for Android only
		textAlignVertical: 'top',
		height: 100,
		width: '100%'
	},
	textInput: {
		color: Colors.dark.modal.text,
		borderWidth: 1,
		borderColor: Colors.dark.modal.text,
		borderRadius: 10,
		paddingVertical: 14,
		paddingHorizontal: 10,
		marginBottom: 12,
		width: '100%'
	},
	modalButtonsContainer: {
		fontWeight: 'bold',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		gap: 20,
		justifyContent: 'space-between',
		marginTop: 32,
		width: '100%'
	},
	closeButtonContainer: {
		borderWidth: 1,
		borderColor: Colors.dark.cancelButton.borderColor,
		borderRadius: 10,
		paddingVertical: 4,
		flexGrow: 1
	},
	closeButton: {
		textAlign: 'center',
		fontWeight: 'bold',
		color: Colors.dark.cancelButton.textColor,
	},
	saveButtonContainer: {
		borderRadius: 10,
		backgroundColor: Colors.dark.saveButton.backgroundColor,
		paddingVertical: 4,
		flexGrow: 1
	},
	saveButton: {
		textAlign: 'center',
		fontWeight: 'bold',
		color: Colors.dark.saveButton.textColor,
	}
});
