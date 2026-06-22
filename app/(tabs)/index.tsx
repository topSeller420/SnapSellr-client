/**
 * Scan screen — camera implementation is chosen at bundle time:
 *   __DEV__  → expo-camera   (simulators, Expo Go, fast iteration)
 *   production → react-native-vision-camera  (real devices, hardware focus, higher quality)
 *
 * Both share the same UI shell (framing guide, focus ring, mode toggle, flash).
 */

import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

// ── Shared constants ──────────────────────────────────────────────────────────
type ScanMode = 'inventory' | 'pos';
type FlashState = 'on' | 'off';

const GUIDE_SIZE = 260;
const BRACKET_LEN = 28;
const BRACKET_THICK = 3;
const FOCUS_BOX = 76;

// ── Shared permission-denied screen ──────────────────────────────────────────
function PermissionScreen({ onRequest }: { onRequest: () => void }) {
	return (
		<SafeAreaView style={styles.permissionContainer}>
			<View style={styles.permissionIconContainer}>
				<IconSymbol name="camera" size={52} color={Colors.dark.icon} />
			</View>
			<ThemedText style={styles.permissionTitle}>Camera access needed</ThemedText>
			<ThemedText style={styles.permissionBody}>
				SnapSellr uses your camera to scan items for inventory management and point of sale.
			</ThemedText>
			<Pressable style={styles.grantButton} onPress={onRequest}>
				<ThemedText style={styles.grantButtonText}>Grant Camera Access</ThemedText>
			</Pressable>
		</SafeAreaView>
	);
}

// ── Shared camera shell (all overlay UI) ─────────────────────────────────────
interface CameraShellProps {
	/** The raw camera viewfinder node — rendered below all overlays. */
	cameraNode: React.ReactNode;
	/** Tap gesture used to trigger the focus ring animation. */
	tapGesture: ReturnType<typeof Gesture.Tap>;
	/** Reanimated style for the focus ring. */
	focusRingStyle: ReturnType<typeof useAnimatedStyle>;
	mode: ScanMode;
	setMode: (m: ScanMode) => void;
	flash: FlashState;
	setFlash: (updater: (f: FlashState) => FlashState) => void;
	onCapture: () => void;
}

function CameraShell({
	cameraNode,
	tapGesture,
	focusRingStyle,
	mode,
	setMode,
	flash,
	setFlash,
	onCapture,
}: CameraShellProps) {
	return (
		<View style={styles.container}>
			{/* Camera + gesture detector */}
			<GestureDetector gesture={tapGesture}>
				<View style={StyleSheet.absoluteFill}>
					{cameraNode}
					<Animated.View pointerEvents="none" style={[styles.focusRing, focusRingStyle]} />
				</View>
			</GestureDetector>

			{/* Centered framing guide */}
			<View style={styles.framingContainer} pointerEvents="none">
				<View style={styles.framingSquare}>
					<View style={[styles.bracketH, { top: 0, left: 0 }]} />
					<View style={[styles.bracketV, { top: 0, left: 0 }]} />
					<View style={[styles.bracketH, { top: 0, right: 0 }]} />
					<View style={[styles.bracketV, { top: 0, right: 0 }]} />
					<View style={[styles.bracketH, { bottom: 0, left: 0 }]} />
					<View style={[styles.bracketV, { bottom: 0, left: 0 }]} />
					<View style={[styles.bracketH, { bottom: 0, right: 0 }]} />
					<View style={[styles.bracketV, { bottom: 0, right: 0 }]} />
				</View>
			</View>

			{/* Top: mode toggle + flash */}
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

			{/* Bottom: capture button */}
			<SafeAreaView edges={['bottom']} style={styles.bottomOverlay}>
				<View style={styles.bottomRow}>
					<Pressable style={styles.captureButton} onPress={onCapture}>
						<View style={styles.captureInner} />
					</Pressable>
				</View>
			</SafeAreaView>
		</View>
	);
}

// ── Photo preview helpers ─────────────────────────────────────────────────────

/**
 * Normalises a captured photo path to a URI that React Native's <Image>
 * accepts on both platforms.
 *
 * expo-camera  → already returns a complete file:// URI on both platforms.
 * vision-camera v4 → returns a raw absolute path (/var/…, /data/…).
 *   iOS: Image accepts raw paths, but file:// is still the safe choice.
 *   Android: Image REQUIRES the file:// scheme, otherwise it silently fails.
 */
function toImageUri(path: string): string {
	if (path.startsWith('file://') || path.startsWith('http')) {
		return path;
	}
	// path is an absolute OS path (starts with '/') → prepend file://
	// file:// + /absolute/path = file:///absolute/path  ✓
	return `file://${path}`;
}

interface PhotoPreviewProps {
	uri: string;
	mode: ScanMode;
	onRetake: () => void;
	onConfirm: () => void;
}

/**
 * Full-screen preview shown after capture so the user can verify the shot
 * before it's passed to image recognition. Retake dismisses back to the
 * camera; Use Photo forwards the URI downstream.
 */
function PhotoPreview({ uri, mode, onRetake, onConfirm }: PhotoPreviewProps) {
	// Render inside a full-screen Modal so the view is lifted above the
	// absolutely-positioned tab bar layer. Without this, the tab bar floats
	// over the bottom buttons regardless of how much padding is applied.
	// SafeAreaView inside the Modal handles the device's own safe area
	// (home indicator, gesture bar) independently of the app's navigation.
	return (
		<Modal visible animationType="fade" statusBarTranslucent>
			<View style={previewStyles.container}>
				{/* Top bar: mode badge */}
				<SafeAreaView edges={['top']} style={previewStyles.topBar}>
					<View style={previewStyles.modeBadge}>
						<ThemedText style={previewStyles.modeBadgeText}>
							{mode === 'inventory' ? 'Inventory' : 'POS'}
						</ThemedText>
					</View>
				</SafeAreaView>

				{/* Photo — fills space between bars.
				    resizeMode="contain" preserves the sensor's true aspect ratio
				    so no pixels are cropped or stretched to fit the screen. */}
				<Image
					source={{ uri }}
					style={previewStyles.image}
					resizeMode="contain"
				/>

				{/* Bottom bar: action buttons */}
				<SafeAreaView edges={['bottom']} style={previewStyles.bottomBar}>
					<View style={previewStyles.actions}>
						<Pressable style={previewStyles.retakeButton} onPress={onRetake}>
							<ThemedText style={previewStyles.retakeText}>Retake</ThemedText>
						</Pressable>
						<Pressable style={previewStyles.confirmButton} onPress={onConfirm}>
							<ThemedText style={previewStyles.confirmText}>Use Photo</ThemedText>
						</Pressable>
					</View>
				</SafeAreaView>
			</View>
		</Modal>
	);
}

// ── Dev implementation: expo-camera ──────────────────────────────────────────
// Works on iOS Simulator, Android Emulator, and Expo Go.
// Focus ring is visual-only (expo-camera has no imperative focus API).
function DevScanScreen() {
	const { CameraView, useCameraPermissions } = require('expo-camera');

	const [permission, requestPermission] = useCameraPermissions();
	const [mode, setMode] = useState<ScanMode>('inventory');
	const [flash, setFlash] = useState<FlashState>('off');
	const [capturedUri, setCapturedUri] = useState<string | null>(null);
	const cameraRef = useRef<InstanceType<typeof CameraView>>(null);

	const focusX = useSharedValue(0);
	const focusY = useSharedValue(0);
	const focusOpacity = useSharedValue(0);
	const focusScale = useSharedValue(1);

	const focusRingStyle = useAnimatedStyle(() => ({
		opacity: focusOpacity.value,
		transform: [
			{ translateX: focusX.value - FOCUS_BOX / 2 },
			{ translateY: focusY.value - FOCUS_BOX / 2 },
			{ scale: focusScale.value },
		],
	}));

	const tapGesture = Gesture.Tap().onEnd((event) => {
		focusX.value = event.x;
		focusY.value = event.y;
		focusOpacity.value = 1;
		focusScale.value = 1.5;
		focusScale.value = withTiming(1, { duration: 200 });
		focusOpacity.value = withDelay(400, withTiming(0, { duration: 400 }));
	});

	async function onCapture() {
		try {
			const photo = await cameraRef.current?.takePictureAsync();
			if (photo?.uri) {
				// expo-camera already returns a full file:// URI on both platforms
				setCapturedUri(toImageUri(photo.uri));
			}
		} catch (e) {
			console.warn('Capture failed:', e);
		}
	}

	if (!permission) return <View style={styles.container} />;
	if (!permission.granted) return <PermissionScreen onRequest={requestPermission} />;

	if (capturedUri) {
		return (
			<PhotoPreview
				uri={capturedUri}
				mode={mode}
				onRetake={() => setCapturedUri(null)}
				onConfirm={() => {
					console.log(`[DEV][${mode.toUpperCase()}] confirmed:`, capturedUri);
					setCapturedUri(null);
					// TODO: pass capturedUri into image recognition for inventory / POS flow
				}}
			/>
		);
	}

	return (
		<CameraShell
			cameraNode={
				<CameraView ref={cameraRef} style={StyleSheet.absoluteFill} flash={flash} />
			}
			tapGesture={tapGesture}
			focusRingStyle={focusRingStyle}
			mode={mode}
			setMode={setMode}
			flash={flash}
			setFlash={setFlash}
			onCapture={onCapture}
		/>
	);
}

// ── Production implementation: react-native-vision-camera v4 ─────────────────
// Requires a native build (EAS Build or expo run:*).
//
// Quality improvements applied:
//   1. useCameraFormat — explicitly selects the device's highest photo resolution
//      instead of letting the library pick a default streaming profile.
//   2. takePhoto qualityPrioritization:'quality' — enables the phone's native
//      hardware sharpening, stabilization, and multi-frame processing.
//   3. videoStabilizationMode:"auto" — activates optical or digital hardware
//      stabilization on devices that support it.
//   4. When rendering the captured photo.path in an <Image>, always set
//      resizeMode="contain" (or "cover") with an explicit aspect ratio so Android
//      doesn't silently compress or stretch the pixel data.
function ProdScanScreen() {
	const {
		Camera,
		useCameraDevice,
		useCameraFormat,
		useCameraPermission,
	} = require('react-native-vision-camera');
	const { useIsFocused } = require('@react-navigation/native');

	const { hasPermission, requestPermission } = useCameraPermission();
	const device = useCameraDevice('back');
	const isFocused = useIsFocused();

	// (1) Pick the format with the absolute highest photo dimensions the
	//     hardware supports rather than a default streaming profile.
	const format = useCameraFormat(device, [
		{ photoResolution: 'max' },
		{ videoResolution: 'max' }
	]);

	const [mode, setMode] = useState<ScanMode>('inventory');
	const [flash, setFlash] = useState<FlashState>('off');
	const [capturedUri, setCapturedUri] = useState<string | null>(null);
	const cameraRef = useRef<InstanceType<typeof Camera>>(null);

	// ── (1) AppState guard ──────────────────────────────────────────────────────
	// Track whether the camera is safe to activate. Starts true on first mount
	// (no competing app on launch). Whenever the app returns from background we
	// immediately pause the camera, then re-enable it after a 300 ms buffer
	// (step 2) that gives the OS time to release the previous session block.
	const [isCameraReady, setIsCameraReady] = useState(true);
	const appStateRef = useRef(AppState.currentState);

	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextState) => {
			if (
				appStateRef.current.match(/background|inactive/) &&
				nextState === 'active'
			) {
				// (2) 300 ms buffer — lets the OS fully tear down the native camera
				// session that was acquired by whatever app was in the foreground.
				setIsCameraReady(false);
				const timer = setTimeout(() => setIsCameraReady(true), 300);
				appStateRef.current = nextState;
				return () => clearTimeout(timer);
			}
			appStateRef.current = nextState;
		});

		return () => subscription.remove();
	}, []);

	// ── (3) onError handler ─────────────────────────────────────────────────────
	// Vision Camera fires this with a CameraRuntimeError when it fails to acquire
	// or maintain the camera session (e.g. CAMERA_ALREADY_IN_USE). We show an
	// informative alert and schedule another readiness cycle so the user can
	// recover by simply waiting a moment.
	function handleCameraError(error: unknown) {
		const msg = error instanceof Error ? error.message : String(error);
		console.warn('[PROD] Camera error:', msg);
		Alert.alert(
			'Camera busy',
			'The camera is still releasing from another app. Please wait a moment and try again.',
			[{ text: 'OK' }],
		);
		// Reset ready state and retry after a slightly longer delay (500 ms) to
		// account for the extra round-trip through the error path.
		setIsCameraReady(false);
		setTimeout(() => setIsCameraReady(true), 500);
	}

	const focusX = useSharedValue(0);
	const focusY = useSharedValue(0);
	const focusOpacity = useSharedValue(0);
	const focusScale = useSharedValue(1);

	const focusRingStyle = useAnimatedStyle(() => ({
		opacity: focusOpacity.value,
		transform: [
			{ translateX: focusX.value - FOCUS_BOX / 2 },
			{ translateY: focusY.value - FOCUS_BOX / 2 },
			{ scale: focusScale.value },
		],
	}));

	// Routes tap coordinates to the hardware lens (v4 API: camera.focus()).
	// Must run on the JS thread because the camera ref is not worklet-accessible.
	function triggerHardwareFocus(x: number, y: number) {
		cameraRef.current?.focus({ x, y }).catch(() => {});
	}

	const tapGesture = Gesture.Tap().onEnd((event) => {
		focusX.value = event.x;
		focusY.value = event.y;
		focusOpacity.value = 1;
		focusScale.value = 1.5;
		focusScale.value = withTiming(1, { duration: 200 });
		focusOpacity.value = withDelay(400, withTiming(0, { duration: 400 }));
		runOnJS(triggerHardwareFocus)(event.x, event.y);
	});

	async function onCapture() {
		try {
			const photo = await cameraRef.current?.takePhoto({
				qualityPrioritization: 'quality',
				flash: flash === 'on' ? 'on' : 'off',
				enableShutterSound: true,
			});
			if (photo?.path) {
				setCapturedUri(toImageUri(photo.path));
			}
		} catch (e) {
			console.warn('Capture failed:', e);
		}
	}

	if (!hasPermission) return <PermissionScreen onRequest={requestPermission} />;
	if (!device) {
		return (
			<SafeAreaView style={styles.permissionContainer}>
				<ThemedText style={styles.permissionTitle}>No camera found</ThemedText>
				<ThemedText style={styles.permissionBody}>
					This device doesn't appear to have a usable back camera.
				</ThemedText>
			</SafeAreaView>
		);
	}

	if (capturedUri) {
		return (
			<PhotoPreview
				uri={capturedUri}
				mode={mode}
				onRetake={() => setCapturedUri(null)}
				onConfirm={() => {
					console.log(`[PROD][${mode.toUpperCase()}] confirmed:`, capturedUri);
					setCapturedUri(null);
					// TODO: pass capturedUri into image recognition for inventory / POS flow
				}}
			/>
		);
	}

	return (
		<CameraShell
			cameraNode={
				<Camera
					ref={cameraRef}
					device={device}
					format={format}
					// isActive incorporates all three guards:
					//   isFocused     — tab is visible
					//   isCameraReady — OS buffer has elapsed after foreground transition
					//   !capturedUri  — sensor powers down while previewing the photo
					isActive={isFocused && isCameraReady && !capturedUri}
					photo={true}
					videoStabilizationMode="auto"
					onError={handleCameraError}
					style={StyleSheet.absoluteFill}
				/>
			}
			tapGesture={tapGesture}
			focusRingStyle={focusRingStyle}
			mode={mode}
			setMode={setMode}
			flash={flash}
			setFlash={setFlash}
			onCapture={onCapture}
		/>
	);
}

// ── Entry point ───────────────────────────────────────────────────────────────
// Metro bundles only the branch that matches __DEV__ at build time, so each
// build only includes the camera library it actually needs.
export default function ScanScreen() {
	// return __DEV__ ? <DevScanScreen /> : <ProdScanScreen />;
	// Can only be used for android for now
	return <ProdScanScreen />;
}

// ── Photo preview styles ──────────────────────────────────────────────────────
const previewStyles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	topBar: {
		alignItems: 'center',
		paddingTop: 12,
		paddingBottom: 8,
	},
	modeBadge: {
		backgroundColor: 'rgba(0, 0, 0, 0.55)',
		borderRadius: 20,
		paddingVertical: 6,
		paddingHorizontal: 18,
	},
	modeBadgeText: {
		fontSize: 13,
		fontWeight: '600',
		color: Colors.dark.text,
	},
	// flex: 1 fills all space between topBar and bottomBar.
	// resizeMode="contain" (set inline) letterboxes the image so the sensor's
	// true aspect ratio is preserved — no pixel cropping or stretching.
	image: {
		flex: 1,
		width: '100%',
	},
	bottomBar: {
		paddingTop: 16,
	},
	actions: {
		flexDirection: 'row',
		gap: 12,
		paddingHorizontal: 24,
		paddingBottom: 24,
	},
	retakeButton: {
		flex: 1,
		backgroundColor: '#242628',
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	retakeText: {
		fontWeight: '500',
		color: Colors.dark.text,
	},
	confirmButton: {
		flex: 1,
		backgroundColor: Colors.dark.saveButton.backgroundColor,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	confirmText: {
		fontWeight: '700',
		color: Colors.dark.saveButton.textColor,
	},
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
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
	focusRing: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: FOCUS_BOX,
		height: FOCUS_BOX,
		borderWidth: 2,
		borderColor: Colors.dark.tint,
		borderRadius: 4,
		backgroundColor: 'transparent',
	},
	framingContainer: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
	},
	framingSquare: {
		width: GUIDE_SIZE,
		height: GUIDE_SIZE,
	},
	bracketH: {
		position: 'absolute',
		width: BRACKET_LEN,
		height: BRACKET_THICK,
		backgroundColor: 'rgba(255, 255, 255, 0.85)',
	},
	bracketV: {
		position: 'absolute',
		width: BRACKET_THICK,
		height: BRACKET_LEN,
		backgroundColor: 'rgba(255, 255, 255, 0.85)',
	},
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
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.22)',
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
	bottomOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
	},
	bottomRow: {
		alignItems: 'center',
		paddingBottom: 80,
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
