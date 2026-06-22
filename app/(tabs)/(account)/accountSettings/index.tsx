import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinkButton } from '@/components/ui/linkButton';
import { Colors } from '@/constants/theme';

import type { Seller } from '@/apis/schemas/sellerSchema';
import { deleteSellerProfileAPI, getSellerProfileAPI, updateSellerProfileAPI } from '@/apis/sellerController';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setAccountInfo, type AccountState } from '@/redux/slices/accountSlice';

function hasCompleteAccountState(account: AccountState): boolean {
	return Boolean(account.email && account.city && account.state && account.radius);
}

export default function AccountSettingsIndex() {
	const dispatch = useAppDispatch();
	const account = useAppSelector(state => state.account);
	const { bottom: safeAreaBottom } = useSafeAreaInsets();

	const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
	const [emailValue, setEmailValue] = useState('');
	const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
	const [cityValue, setCityValue] = useState('');
	const [stateValue, setStateValue] = useState('');
	const [radiusValue, setRadiusValue] = useState('');
	const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
	const [currentPasswordValue, setCurrentPasswordValue] = useState('');
	const [newPasswordValue, setNewPasswordValue] = useState('');
	const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

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
			id: "7d120fd0-672a-4259-a9e0-ff16fb183758"
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
			id: "7d120fd0-672a-4259-a9e0-ff16fb183758"
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

	function openPasswordModal() {
		setIsPasswordModalVisible(true);
	}

	function closePassword() {
		setIsPasswordModalVisible(false);
		setCurrentPasswordValue('');
		setNewPasswordValue('');
		setConfirmPasswordValue('');
	}

	function savePassword() {
		setIsPasswordModalVisible(false);
		updateAccountSettings({
			current_password: currentPasswordValue,
			password: newPasswordValue,
		});
		setCurrentPasswordValue('');
		setNewPasswordValue('');
		setConfirmPasswordValue('');
	}

	function confirmDeleteAccount() {
		setIsDeleteModalVisible(true);
	}

	function cancelDeleteAccount() {
		setIsDeleteModalVisible(false);
	}

	function deleteAccount() {
		const pathVariables = {
			id: "7d120fd0-672a-4259-a9e0-ff16fb183758"
		};
		deleteSellerProfileAPI(pathVariables, (response: string) => {
			console.log("delete response: ", response);
			setIsDeleteModalVisible(false);
		});
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
		<ParallaxScrollView style={styles.overrideParallaxScrollView}>
			<Modal
				visible={isEmailModalVisible}
				animationType="slide"
				onRequestClose={closeEmail}
				transparent={true}
			>
				<View style={styles.modal}>
					<ThemedView style={[styles.modalContainer, { paddingBottom: safeAreaBottom + 24 }]}>
						<View style={styles.dragHandle} />
						<ThemedText style={styles.modalHeader}>Update email</ThemedText>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setEmailValue(text)}
							value={emailValue}
							placeholder="Email address"
							placeholderTextColor={Colors.dark.border}
							keyboardType="email-address"
							autoCapitalize="none"
						/>
						<View style={styles.modalButtonsContainer}>
							<Pressable onPress={closeEmail} style={styles.closeButtonContainer}>
								<ThemedText style={styles.closeButton}>Cancel</ThemedText>
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
					<ThemedView style={[styles.modalContainer, { paddingBottom: safeAreaBottom + 24 }]}>
						<View style={styles.dragHandle} />
						<ThemedText style={styles.modalHeader}>Update location</ThemedText>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setCityValue(text)}
							value={cityValue}
							placeholder="City"
							placeholderTextColor={Colors.dark.border}
						/>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setStateValue(text)}
							value={stateValue}
							placeholder="State"
							placeholderTextColor={Colors.dark.border}
						/>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setRadiusValue(text)}
							value={radiusValue}
							placeholder="Search radius (miles)"
							placeholderTextColor={Colors.dark.border}
							keyboardType="numeric"
						/>
						<View style={styles.modalButtonsContainer}>
							<Pressable onPress={closeLocation} style={styles.closeButtonContainer}>
								<ThemedText style={styles.closeButton}>Cancel</ThemedText>
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

			<Modal
				visible={isPasswordModalVisible}
				animationType="slide"
				onRequestClose={closePassword}
				transparent={true}
			>
				<View style={styles.modal}>
					<ThemedView style={[styles.modalContainer, { paddingBottom: safeAreaBottom + 24 }]}>
						<View style={styles.dragHandle} />
						<ThemedText style={styles.modalHeader}>Update password</ThemedText>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setCurrentPasswordValue(text)}
							value={currentPasswordValue}
							placeholder="Current password"
							placeholderTextColor={Colors.dark.border}
							secureTextEntry={true}
						/>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setNewPasswordValue(text)}
							value={newPasswordValue}
							placeholder="New password"
							placeholderTextColor={Colors.dark.border}
							secureTextEntry={true}
						/>
						<TextInput
							style={styles.textInput}
							onChangeText={text => setConfirmPasswordValue(text)}
							value={confirmPasswordValue}
							placeholder="Confirm new password"
							placeholderTextColor={Colors.dark.border}
							secureTextEntry={true}
						/>
						<View style={styles.modalButtonsContainer}>
							<Pressable onPress={closePassword} style={styles.closeButtonContainer}>
								<ThemedText style={styles.closeButton}>Cancel</ThemedText>
							</Pressable>
							<Pressable onPress={savePassword} style={styles.saveButtonContainer}>
								<ThemedText style={styles.saveButton}>Save</ThemedText>
							</Pressable>
						</View>
					</ThemedView>
				</View>
			</Modal>

			<TouchableOpacity
				style={styles.linkButton}
				onPress={openPasswordModal}
				activeOpacity={0.8}
			>
				<View style={styles.linkButtonContent}>
					<IconSymbol
						name="lock"
						size={18}
						weight="medium"
						color={Colors.dark.icon}
						style={{ marginTop: 3.5 }}
					/>
					<ThemedText type="defaultSemiBold">Update password</ThemedText>
				</View>
				<IconSymbol
					name="chevron.right"
					size={18}
					weight="medium"
					color={Colors.dark.icon}
					style={{ marginTop: 3.5 }}
				/>
			</TouchableOpacity>

			<ThemedText>
				Legal
			</ThemedText>
			<LinkButton title="Terms and Conditions" type="location" route="/accountSettings/termsNCondition"/>
			<LinkButton title="Privacy Policy" type="lock" route="/accountSettings/privacyPolicy"/>

			<Modal
				visible={isDeleteModalVisible}
				animationType="slide"
				onRequestClose={cancelDeleteAccount}
				transparent={true}
			>
				<View style={styles.modal}>
					<ThemedView style={[styles.modalContainer, { paddingBottom: safeAreaBottom + 24 }]}>
						<View style={styles.dragHandle} />
						<View style={styles.deleteModalIconContainer}>
							<IconSymbol
								name="exclamationmark.triangle"
								size={28}
								weight="medium"
								color="#D32F2F"
							/>
						</View>
						<ThemedText style={styles.modalHeader}>Delete account</ThemedText>
						<ThemedText style={styles.deleteWarningText}>
							This action is permanent and cannot be undone. Your account, all listings, and any associated data will be immediately and irreversibly deleted.
						</ThemedText>
						<View style={styles.modalButtonsContainer}>
							<Pressable onPress={cancelDeleteAccount} style={styles.closeButtonContainer}>
								<ThemedText style={styles.closeButton}>Cancel</ThemedText>
							</Pressable>
							<Pressable onPress={deleteAccount} style={styles.deleteButtonContainer}>
								<ThemedText style={styles.deleteButton}>Delete</ThemedText>
							</Pressable>
						</View>
					</ThemedView>
				</View>
			</Modal>

			<TouchableOpacity
				style={styles.deleteAccountButton}
				onPress={confirmDeleteAccount}
				activeOpacity={0.8}
			>
				<View style={styles.linkButtonContent}>
					<IconSymbol
						name="trash"
						size={18}
						weight="medium"
						color="#D32F2F"
						style={{ marginTop: 3.5 }}
					/>
					<ThemedText style={styles.deleteAccountButtonText}>Delete account</ThemedText>
				</View>
			</TouchableOpacity>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	overrideParallaxScrollView: {
		flex: 1,
		paddingTop: 20,
		paddingRight: 32,
		paddingBottom: 32,
		paddingLeft: 32,
		gap: 16,
		overflow: 'hidden'
	},
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
	deleteAccountButton: {
		borderColor: '#D32F2F',
		borderWidth: 1,
		borderRadius: 16,
		paddingVertical: 12,
		paddingHorizontal: 16,
		flexDirection: 'row',
		gap: 6,
	},
	deleteAccountButtonText: {
		fontWeight: '600',
		color: '#D32F2F',
	},
	deleteModalIconContainer: {
		alignSelf: 'flex-start',
		marginBottom: 12,
	},
	deleteWarningText: {
		fontSize: 14,
		color: Colors.dark.icon,
		lineHeight: 20,
		marginBottom: 4,
	},
	deleteButtonContainer: {
		borderRadius: 12,
		backgroundColor: '#D32F2F',
		paddingVertical: 14,
		flexGrow: 1,
	},
	deleteButton: {
		textAlign: 'center',
		fontWeight: '700',
		color: '#FFFFFF',
	},
});
