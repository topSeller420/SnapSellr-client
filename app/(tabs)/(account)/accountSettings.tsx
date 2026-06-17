import { Modal, Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LinkButton } from '../../../components/ui/linkButton';

export default function AccountSettings() {
	return (
		<ParallaxScrollView>
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

			<ThemedText>
				Profile
			</ThemedText>
			
			<LinkButton title="Update email" type="envelope" route="/accountSettings/email"/>
			<LinkButton title="Update location" type="location" route="/accountSettings/location"/>
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

});