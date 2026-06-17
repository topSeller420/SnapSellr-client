import { Modal, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';


type ModalComponentProps = {
	visibleState: boolean;
	children: React.ReactNode;
	closeHandler: () => void;
	saveHandler: () => void;
};

/**
 * @description Reusable modal component for account settings. To be used for updating email, location, password, etc.
 * @param {boolean} props.visibleState - A boolean state to control the visibility of the modal.
 * @param {React.ReactNode} props.children - The content to be displayed inside the modal.
 * @param {() => void} props.closeHandler - A function to handle closing the modal.
 * @param {() => void} props.saveHandler - A function to handle saving changes in the modal.
 */
export function ModalComponent(props: ModalComponentProps) {
	// set default color theme to dark for now
	// const theme = useColorScheme() ?? 'light';
	const theme = 'dark';

	return (
		<Modal 
			visible={props.visibleState}
			animationType="slide"
			onRequestClose={props.closeHandler}
			transparent={true}
			>
			<View style={styles.modal}>
				<ThemedView style={styles.modalContainer}>
					{props.children}
					{/* <ThemedText style={styles.modalHeader}>
						Seller info
					</ThemedText>

					<View style={styles.modalButtonsContainer}>
						<Pressable onPress={props.closeHandler} style={styles.closeButtonContainer}>
							<ThemedText style={styles.closeButton}>Close</ThemedText>
						</Pressable>
						<Pressable onPress={props.saveHandler} style={styles.saveButtonContainer}>
							<ThemedText style={styles.saveButton}>Save</ThemedText>
						</Pressable>
					</View> */}
				</ThemedView>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
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
