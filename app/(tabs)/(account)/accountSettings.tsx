import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { LinkButton } from '../../../components/ui/linkButton';

import type { Seller } from '@/apis/schemas/sellerSchema';
import { getSellerProfileAPI, updateSellerProfileAPI } from '@/apis/sellerController';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setAccountInfo, type AccountState } from '@/redux/slices/accountSlice';

function hasCompleteAccountState(account: AccountState): boolean {
	return Boolean(account.email && account.city && account.state && account.radius);
}

export default function AccountSettings() {
	const dispatch = useAppDispatch();
	const account = useAppSelector(state => state.account);

	const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
	const [emailValue, setEmailValue] = useState('');
	const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
	const [cityValue, setCityValue] = useState('');
	const [stateValue, setStateValue] = useState('');
	const [radiusValue, setRadiusValue] = useState('');

	useEffect(() => {
		if (hasCompleteAccountState(account)) {
			setEmailValue(account.email);
			setCityValue(account.city);
			setStateValue(account.state);
			setRadiusValue(String(account.radius));

			return;
		}

		getAccountSettings();
	}, []);

	function getAccountSettings() {
		const pathVariables = {
			id: "bd28da97-116d-4955-bbc5-7128e0c8f005"
		};
		getSellerProfileAPI(pathVariables, (response: Seller) => {
			console.log("response: ", response);

			const email = response.email ?? '';
			const city = response.city ?? '';
			const state = response.state ?? '';

			setEmailValue(email);
			setCityValue(city);
			setStateValue(state);

			dispatch(setAccountInfo({
				email,
				city,
				state,
				radius: account.radius,
			}));
		});
	}

	function updateAccountSettings(fieldChangesToValues: { [key: string]: unknown }) {
		const pathVariables = {
			id: "bd28da97-116d-4955-bbc5-7128e0c8f005"
		};
		const payload = {
			email: emailValue,
			city: cityValue,
			state: stateValue,
		};
		Object.assign(payload, fieldChangesToValues);

		updateSellerProfileAPI(pathVariables, payload, (response: string) => {
			console.log("update response: ", response);
		});
	}

	function openEmailModal() {
		setIsEmailModalVisible(true);
	}

	function closeEmail() {
		setIsEmailModalVisible(false);
	}

	function saveEmail() {
		setIsEmailModalVisible(false);
		updateAccountSettings({
			email: emailValue,
		});

		dispatch(setAccountInfo({ email: emailValue }));
	}

	function openLocationModal() {
		setIsLocationModalVisible(true);
	}

	function closeLocation() {
		setIsLocationModalVisible(false);
	}

	function saveLocation() {
		const radius = Number(radiusValue) || 0;
		
		setIsLocationModalVisible(false);
		updateAccountSettings({
			city: cityValue,
			state: stateValue,
		});
		dispatch(setAccountInfo({
			city: cityValue,
			state: stateValue,
			radius,
		}));
	}

	return (
		<ParallaxScrollView>
			<Modal
				visible={isEmailModalVisible}
				animationType="slide"
				onRequestClose={closeEmail}
				transparent={true}
			>
				<View style={styles.modal}>
					<ThemedView style={styles.modalContainer}>
						<ThemedText style={styles.modalHeader}>
							Update email
						</ThemedText>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setEmailValue(text)}
							value={emailValue}
							placeholder="Your email here..."
							placeholderTextColor={Colors.dark.modal.text}
							keyboardType="email-address"
							autoCapitalize="none"
						/>
						<View style={styles.modalButtonsContainer}>
							<Pressable onPress={closeEmail} style={styles.closeButtonContainer}>
								<ThemedText style={styles.closeButton}>Close</ThemedText>
							</Pressable>
							<Pressable onPress={saveEmail} style={styles.saveButtonContainer}>
								<ThemedText style={styles.saveButton}>Save</ThemedText>
							</Pressable>
						</View>
					</ThemedView>
				</View>
			</Modal>
			<Modal
				visible={isLocationModalVisible}
				animationType="slide"
				onRequestClose={closeLocation}
				transparent={true}
			>
				<View style={styles.modal}>
					<ThemedView style={styles.modalContainer}>
						<ThemedText style={styles.modalHeader}>
							Update location
						</ThemedText>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setCityValue(text)}
							value={cityValue}
							placeholder="Your city here..."
							placeholderTextColor={Colors.dark.modal.text}
						/>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setStateValue(text)}
							value={stateValue}
							placeholder="Your state here..."
							placeholderTextColor={Colors.dark.modal.text}
						/>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setRadiusValue(text)}
							value={radiusValue}
							placeholder="Search radius (miles)..."
							placeholderTextColor={Colors.dark.modal.text}
							keyboardType="numeric"
						/>
						<View style={styles.modalButtonsContainer}>
							<Pressable onPress={closeLocation} style={styles.closeButtonContainer}>
								<ThemedText style={styles.closeButton}>Close</ThemedText>
							</Pressable>
							<Pressable onPress={saveLocation} style={styles.saveButtonContainer}>
								<ThemedText style={styles.saveButton}>Save</ThemedText>
							</Pressable>
						</View>
					</ThemedView>
				</View>
			</Modal>

			<ThemedText>
				Profile
			</ThemedText>

			<TouchableOpacity
				style={styles.linkButton}
				onPress={openEmailModal}
				activeOpacity={0.8}
			>
				<View style={styles.linkButtonContent}>
					<IconSymbol
						name="envelope"
						size={18}
						weight="medium"
						color={Colors.dark.icon}
						style={{ marginTop: 3.5 }}
					/>
					<ThemedText type="defaultSemiBold">Update email</ThemedText>
				</View>
				<IconSymbol
					name="chevron.right"
					size={18}
					weight="medium"
					color={Colors.dark.icon}
					style={{ marginTop: 3.5 }}
				/>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.linkButton}
				onPress={openLocationModal}
				activeOpacity={0.8}
			>
				<View style={styles.linkButtonContent}>
					<IconSymbol
						name="location"
						size={18}
						weight="medium"
						color={Colors.dark.icon}
						style={{ marginTop: 3.5 }}
					/>
					<ThemedText type="defaultSemiBold">Update location</ThemedText>
				</View>
				<IconSymbol
					name="chevron.right"
					size={18}
					weight="medium"
					color={Colors.dark.icon}
					style={{ marginTop: 3.5 }}
				/>
			</TouchableOpacity>

			<LinkButton title="Update password" type="lock" route="/accountSettings/password"/>

			<ThemedText>
				Legal
			</ThemedText>
			<LinkButton title="Terms and Conditions" type="location" route="/accountSettings/termsNConditions"/>
			<LinkButton title="Privacy Policy" type="lock" route="/accountSettings/privacyPolicy"/>

			<ThemedText>
				Delete account
			</ThemedText>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	linkButton: {
		borderColor: Colors.dark.border,
		borderWidth: 1,
		borderRadius: 16,
		paddingVertical: 12,
		paddingHorizontal: 16,
		display: 'flex',
		justifyContent: 'space-between',
		flexDirection: 'row',
		gap: 6,
	},
	linkButtonContent: {
		display: 'flex',
		flexDirection: 'row',
		gap: 12,
	},

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
	textInput: {
		color: Colors.dark.modal.text,
		borderWidth: 1,
		borderColor: Colors.dark.modal.text,
		borderRadius: 10,
		paddingVertical: 14,
		paddingHorizontal: 10,
		marginBottom: 12,
		width: '100%',
	},
	modalButtonsContainer: {
		fontWeight: 'bold',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		gap: 20,
		justifyContent: 'space-between',
		marginTop: 32,
		width: '100%',
	},
	closeButtonContainer: {
		borderWidth: 1,
		borderColor: Colors.dark.cancelButton.borderColor,
		borderRadius: 10,
		paddingVertical: 4,
		flexGrow: 1,
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
		flexGrow: 1,
	},
	saveButton: {
		textAlign: 'center',
		fontWeight: 'bold',
		color: Colors.dark.saveButton.textColor,
	},
});
