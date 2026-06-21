import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

type ScanMode = 'inventory' | 'pos';
type FlashMode = 'on' | 'off';

export default function ScanScreen() {
	const [permission, requestPermission] = useCameraPermissions();
	const [mode, setMode] = useState<ScanMode>('inventory');
	const [flash, setFlash] = useState<FlashMode>('off');
	const cameraRef = useRef<CameraView>(null);

	async function takePicture() {
		if (!cameraRef.current) return;
		const photo = await cameraRef.current.takePictureAsync();
		console.log(`[${mode.toUpperCase()}] photo captured:`, photo?.uri);
		// TODO: pass photo.uri into image recognition for inventory / POS flow
	}

	// Permission API still initialising
	if (!permission) {
		return <View style={styles.container} />;
	}

	// Camera access not yet granted — show request screen
	if (!permission.granted) {
		return (
			<SafeAreaView style={styles.permissionContainer}>
				<View style={styles.permissionIconContainer}>
					<IconSymbol name="camera" size={52} color={Colors.dark.icon} />
				</View>

				<ThemedText style={styles.permissionTitle}>Camera access needed</ThemedText>
				<ThemedText style={styles.permissionBody}>
					SnapSellr uses your camera to scan items for inventory management and point of sale.
				</ThemedText>

				<Pressable style={styles.grantButton} onPress={requestPermission}>
					<ThemedText style={styles.grantButtonText}>Grant Camera Access</ThemedText>
				</Pressable>
			</SafeAreaView>
		);
	}

	return (
		<View style={styles.container}>
			<CameraView ref={cameraRef} style={StyleSheet.absoluteFill} flash={flash} />

			<SafeAreaView edges={['top']} style={styles.topOverlay}>
				<View style={styles.topRow}>
					<View style={styles.topRowSide} />

					<View style={styles.modeToggle}>
						<Pressable
							style={[styles.modeButton, mode === 'inventory' && styles.modeButtonActive]}
							onPress={() => setMode('inventory')}
						>
							<ThemedText style={[styles.modeLabel, mode === 'inventory' && styles.modeLabelActive]}>
								Inventory
							</ThemedText>
						</Pressable>
						
						<Pressable
							style={[styles.modeButton, mode === 'pos' && styles.modeButtonActive]}
							onPress={() => setMode('pos')}
						>
							<ThemedText style={[styles.modeLabel, mode === 'pos' && styles.modeLabelActive]}>
								POS
							</ThemedText>
						</Pressable>
					</View>

					<Pressable
						style={styles.flashButton}
						onPress={() => setFlash(f => (f === 'on' ? 'off' : 'on'))}
					>
						<IconSymbol
							name={flash === 'on' ? 'bolt.fill' : 'bolt.slash'}
							size={22}
							color={flash === 'on' ? Colors.dark.tint : Colors.dark.icon}
						/>
					</Pressable>
				</View>
			</SafeAreaView>

			<SafeAreaView edges={['bottom']} style={styles.bottomOverlay}>
				<View style={styles.bottomRow}>
					<Pressable style={styles.captureButton} onPress={takePicture}>
						<View style={styles.captureInner} />
					</Pressable>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},

	// ── Permission screen ────────────────────────────────────────────────────
	permissionContainer: {
		flex: 1,
		backgroundColor: Colors.dark.background,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 40,
		gap: 16,
	},
	permissionIconContainer: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: '#242628',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	permissionTitle: {
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
	},
	permissionBody: {
		fontSize: 14,
		lineHeight: 22,
		color: Colors.dark.icon,
		textAlign: 'center',
	},
	grantButton: {
		marginTop: 8,
		backgroundColor: Colors.dark.saveButton.backgroundColor,
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 32,
	},
	grantButtonText: {
		fontWeight: '700',
		color: Colors.dark.saveButton.textColor,
	},

	// ── Top overlay ─────────────────────────────────────────────────────────
	topOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
	},
	topRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 12,
	},
	topRowSide: {
		width: 44,
	},
	modeToggle: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 24,
		padding: 3,
		marginHorizontal: 8,
	},
	modeButton: {
		flex: 1,
		paddingVertical: 8,
		borderRadius: 20,
		alignItems: 'center',
	},
	modeButtonActive: {
		backgroundColor: Colors.dark.tint,
	},
	modeLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.dark.text,
	},
	modeLabelActive: {
		color: '#151718',
	},
	flashButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(0, 0, 0, 0.45)',
		alignItems: 'center',
		justifyContent: 'center',
	},

	// ── Bottom overlay ───────────────────────────────────────────────────────
	bottomOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
	},
	bottomRow: {
		alignItems: 'center',
		paddingBottom: 24,
	},
	captureButton: {
		width: 72,
		height: 72,
		borderRadius: 36,
		borderWidth: 4,
		borderColor: Colors.dark.text,
		alignItems: 'center',
		justifyContent: 'center',
	},
	captureInner: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: Colors.dark.text,
	},
});
