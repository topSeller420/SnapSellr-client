/**
 * Scan screen — camera implementation is chosen at bundle time:
 *   __DEV__  → expo-camera   (simulators, Expo Go, fast iteration)
 *   production → react-native-vision-camera  (real devices, hardware focus, higher quality)
 *
 * Both share the same UI shell (framing guide, focus ring, mode toggle, flash).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
	runOnJS,
	useAnimatedProps,
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
	/** Active gesture — tap for focus, or Simultaneous(tap, pinch) when zoom is enabled. */
	tapGesture: any; // accepts TapGesture | SimultaneousGesture
	/** Reanimated style for the focus ring. */
	focusRingStyle: ReturnType<typeof useAnimatedStyle>;
	mode: ScanMode;
	setMode: (m: ScanMode) => void;
	flash: FlashState;
	setFlash: (updater: (f: FlashState) => FlashState) => void;
	onCapture: () => void;
	/** Optional zoom level badge rendered between the framing guide and capture button. */
	zoomIndicator?: React.ReactNode;
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
	zoomIndicator,
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

			{/* Zoom level badge — positioned between framing guide and capture button */}
			{zoomIndicator && (
				<View style={styles.zoomIndicatorContainer} pointerEvents="none">
					{zoomIndicator}
				</View>
			)}

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

/** Normalised crop region (0..1) relative to the displayed image area. */
type CropRegion = { x: number; y: number; size: number };

interface PhotoPreviewProps {
	uri: string;
	mode: ScanMode;
	onRetake: () => void;
	/** Called with the 1:1 crop region the user positioned, or undefined if
	 *  layout info wasn't available yet (extremely rare edge case). */
	onConfirm: (crop?: CropRegion) => void;
}

/**
 * Full-screen preview shown after capture. The user can:
 *   • Pinch the photo to zoom in and inspect detail.
 *   • Pan (1-finger drag) to reframe after zooming.
 *   • Drag the 1:1 crop box to select the region for image recognition.
 *   • Drag the ◢ corner handle to resize the crop box.
 * "Identify" passes the normalised CropRegion downstream.
 */
function PhotoPreview({ uri, mode, onRetake, onConfirm }: PhotoPreviewProps) {
	// ── Container dimensions (populated on layout, used to clamp gestures) ────
	const containerW = useSharedValue(0);
	const containerH = useSharedValue(0);

	// ── Image zoom + pan ──────────────────────────────────────────────────────
	const imgScale    = useSharedValue(1);
	const savedScale  = useSharedValue(1);
	const imgTx       = useSharedValue(0);
	const imgTy       = useSharedValue(0);
	const savedTx     = useSharedValue(0);
	const savedTy     = useSharedValue(0);

	// ── Crop box (1:1) ─────────────────────────────────────────────────────────
	const cropSz      = useSharedValue(0); // initialised to 0; set on first layout
	const cropL       = useSharedValue(0);
	const cropT       = useSharedValue(0);
	const savedCropSz = useSharedValue(0);
	const savedCropL  = useSharedValue(0);
	const savedCropT  = useSharedValue(0);

	// ── Animated styles ───────────────────────────────────────────────────────
	const imgStyle = useAnimatedStyle(() => ({
		transform: [
			{ scale: imgScale.value },
			{ translateX: imgTx.value },
			{ translateY: imgTy.value },
		],
	}));

	const cropBoxStyle = useAnimatedStyle(() => ({
		position: 'absolute' as const,
		left:   cropL.value,
		top:    cropT.value,
		width:  cropSz.value,
		height: cropSz.value,
	}));

	// Four dim panels that surround the clear crop window
	const topDimStyle = useAnimatedStyle(() => ({
		position: 'absolute' as const,
		left: 0, right: 0, top: 0,
		height: Math.max(0, cropT.value),
	}));
	const leftDimStyle = useAnimatedStyle(() => ({
		position: 'absolute' as const,
		left: 0,
		top:    Math.max(0, cropT.value),
		width:  Math.max(0, cropL.value),
		height: Math.max(0, cropSz.value),
	}));
	const rightDimStyle = useAnimatedStyle(() => ({
		position: 'absolute' as const,
		right: 0,
		top:    Math.max(0, cropT.value),
		width:  Math.max(0, containerW.value - cropL.value - cropSz.value),
		height: Math.max(0, cropSz.value),
	}));
	const bottomDimStyle = useAnimatedStyle(() => ({
		position: 'absolute' as const,
		left: 0, right: 0,
		top:    Math.max(0, cropT.value + cropSz.value),
		bottom: 0,
	}));

	// ── Gestures ──────────────────────────────────────────────────────────────
	const MIN_CROP = 80;

	// Pinch to zoom the photo (1× – 5×)
	const imgPinch = Gesture.Pinch()
		.onStart(() => { savedScale.value = imgScale.value; })
		.onUpdate((e) => {
			imgScale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 5);
		});

	// 1-finger pan to reframe (useful after zooming in)
	const imgPan = Gesture.Pan()
		.minPointers(1).maxPointers(1)
		.onStart(() => { savedTx.value = imgTx.value; savedTy.value = imgTy.value; })
		.onUpdate((e) => {
			imgTx.value = savedTx.value + e.translationX;
			imgTy.value = savedTy.value + e.translationY;
		});

	const imageGesture = Gesture.Simultaneous(imgPinch, imgPan);

	// Drag the crop box to reposition it within the container
	const cropPan = Gesture.Pan()
		.onStart(() => { savedCropL.value = cropL.value; savedCropT.value = cropT.value; })
		.onUpdate((e) => {
			cropL.value = Math.min(
				Math.max(savedCropL.value + e.translationX, 0),
				containerW.value - cropSz.value,
			);
			cropT.value = Math.min(
				Math.max(savedCropT.value + e.translationY, 0),
				containerH.value - cropSz.value,
			);
		});

	// Drag the ◢ corner handle (diagonal) to resize the crop box
	const cornerResize = Gesture.Pan()
		.onStart(() => { savedCropSz.value = cropSz.value; })
		.onUpdate((e) => {
			const delta = (e.translationX + e.translationY) / 2;
			const maxSz = Math.min(containerW.value, containerH.value);
			const newSz = Math.min(Math.max(savedCropSz.value + delta, MIN_CROP), maxSz);
			// Clamp position so the box never leaves the container
			cropL.value = Math.min(cropL.value, containerW.value - newSz);
			cropT.value = Math.min(cropT.value, containerH.value - newSz);
			cropSz.value = newSz;
		});

	// ── Helpers ───────────────────────────────────────────────────────────────
	function initCropBox(width: number, height: number) {
		// Start at 72% of the shorter edge, centred
		const sz = Math.min(width, height) * 0.72;
		cropSz.value      = sz;
		savedCropSz.value = sz;
		cropL.value       = (width  - sz) / 2;
		savedCropL.value  = cropL.value;
		cropT.value       = (height - sz) / 2;
		savedCropT.value  = cropT.value;
	}

	function handleConfirm() {
		const crop: CropRegion | undefined = containerW.value > 0
			? {
				x:    cropL.value / containerW.value,
				y:    cropT.value / containerH.value,
				size: cropSz.value / Math.min(containerW.value, containerH.value),
			  }
			: undefined;
		onConfirm(crop);
	}

	return (
		<Modal visible animationType="fade" statusBarTranslucent>
			{/* Modal renders in a separate native window — the GestureHandlerRootView
			    in app/_layout.tsx doesn't cover it, so every Gesture.* handler inside
			    the Modal is unregistered unless we add a new root here. */}
			<GestureHandlerRootView style={previewStyles.gestureRoot}>
				<View style={previewStyles.container}>
					{/* Top bar: mode badge */}
					<SafeAreaView edges={['top']} style={previewStyles.topBar}>
						<View style={previewStyles.modeBadge}>
							<ThemedText style={previewStyles.modeBadgeText}>
								{mode === 'inventory' ? 'Inventory' : 'POS'}
							</ThemedText>
						</View>
					</SafeAreaView>

					{/* ── Image area ─────────────────────────────────────────────── */}
					<GestureDetector gesture={imageGesture}>
						<View
							style={previewStyles.imageContainer}
							onLayout={({ nativeEvent: { layout: { width, height } } }) => {
								containerW.value = width;
								containerH.value = height;
								// Only set up on first layout so user adjustments are preserved
								if (cropSz.value === 0) initCropBox(width, height);
							}}
						>
							{/* The photo, scaled and panned by the image gesture */}
							<Animated.View style={[StyleSheet.absoluteFill, imgStyle]}>
								<Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
							</Animated.View>

							{/* Dim panels outside the crop window */}
							<Animated.View style={[previewStyles.dimPanel, topDimStyle]}    pointerEvents="none" />
							<Animated.View style={[previewStyles.dimPanel, leftDimStyle]}   pointerEvents="none" />
							<Animated.View style={[previewStyles.dimPanel, rightDimStyle]}  pointerEvents="none" />
							<Animated.View style={[previewStyles.dimPanel, bottomDimStyle]} pointerEvents="none" />

							{/* Crop box: drag to move, corner handle to resize */}
							<GestureDetector gesture={cropPan}>
								<Animated.View style={cropBoxStyle}>
									{/* L-shaped corner brackets — yellow to distinguish from viewfinder */}
									<View style={[previewStyles.cropBracketH, { top: 0, left: 0 }]} />
									<View style={[previewStyles.cropBracketV, { top: 0, left: 0 }]} />
									<View style={[previewStyles.cropBracketH, { top: 0, right: 0 }]} />
									<View style={[previewStyles.cropBracketV, { top: 0, right: 0 }]} />
									<View style={[previewStyles.cropBracketH, { bottom: 0, left: 0 }]} />
									<View style={[previewStyles.cropBracketV, { bottom: 0, left: 0 }]} />
									<View style={[previewStyles.cropBracketH, { bottom: 0, right: 0 }]} />
									<View style={[previewStyles.cropBracketV, { bottom: 0, right: 0 }]} />

									{/* ◢ resize handle at bottom-right corner */}
									<GestureDetector gesture={cornerResize}>
										<View style={previewStyles.resizeHandle}>
											<ThemedText style={previewStyles.resizeHandleIcon}>◢</ThemedText>
										</View>
									</GestureDetector>
								</Animated.View>
							</GestureDetector>
						</View>
					</GestureDetector>

					{/* Gesture hint */}
					<ThemedText style={previewStyles.hint}>
						Drag box to reposition · Drag ◢ to resize · Pinch to zoom
					</ThemedText>

					{/* Bottom bar: action buttons */}
					<SafeAreaView edges={['bottom']} style={previewStyles.bottomBar}>
						<View style={previewStyles.actions}>
							<Pressable style={previewStyles.retakeButton} onPress={onRetake}>
								<ThemedText style={previewStyles.retakeText}>Retake</ThemedText>
							</Pressable>
							<Pressable style={previewStyles.confirmButton} onPress={handleConfirm}>
								<ThemedText style={previewStyles.confirmText}>Identify</ThemedText>
							</Pressable>
						</View>
					</SafeAreaView>
				</View>
			</GestureHandlerRootView>
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
				onConfirm={(crop) => {
					console.log(`[DEV][${mode.toUpperCase()}] confirmed:`, capturedUri, 'crop:', crop);
					setCapturedUri(null);
					// TODO: pass capturedUri + crop into image recognition for inventory / POS flow
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

	// ── Zoom ─────────────────────────────────────────────────────────────────────
	// zoomLevel drives the Camera's zoom prop via useAnimatedProps — fully on the
	// UI thread so every pinch frame updates the hardware lens without a JS round-trip.
	// baseZoom captures the zoom at the moment the pinch starts so subsequent scale
	// deltas are applied multiplicatively from that snapshot.
	const minZoom: number = device?.minZoom ?? 1;
	const maxZoom: number = Math.min(device?.maxZoom ?? 8, 8); // cap at 8× for usability

	const zoomLevel = useSharedValue(1);
	const baseZoom = useSharedValue(1);
	const zoomBadgeOpacity = useSharedValue(0.65); // subtle at rest
	const zoomBadgeScale = useSharedValue(1);
	const [zoomDisplay, setZoomDisplay] = useState('1.0×');

	// Animated zoom badge style — becomes fully opaque + slightly larger while pinching
	const zoomBadgeAnimStyle = useAnimatedStyle(() => ({
		opacity: zoomBadgeOpacity.value,
		transform: [{ scale: zoomBadgeScale.value }],
	}));

	function setZoomText(val: number) {
		setZoomDisplay(`${val.toFixed(1)}×`);
	}

	// Animated camera props — drives zoom directly on the UI thread
	const AnimatedCamera = useMemo(() => Animated.createAnimatedComponent(Camera), [Camera]);
	const animatedCameraProps = useAnimatedProps(() => ({ zoom: zoomLevel.value }));

	const pinchGesture = Gesture.Pinch()
		.onBegin(() => {
			baseZoom.value = zoomLevel.value;
			// Make badge prominent while actively zooming
			zoomBadgeOpacity.value = withTiming(1, { duration: 150 });
			zoomBadgeScale.value = withTiming(1.15, { duration: 150 });
		})
		.onUpdate((event) => {
			const newZoom = Math.min(Math.max(baseZoom.value * event.scale, minZoom), maxZoom);
			zoomLevel.value = newZoom;
			runOnJS(setZoomText)(newZoom);
		})
		.onEnd(() => {
			// Return to subtle resting state after a brief hold
			zoomBadgeOpacity.value = withDelay(1200, withTiming(0.65, { duration: 400 }));
			zoomBadgeScale.value = withDelay(1200, withTiming(1, { duration: 400 }));
		});

	const [mode, setMode] = useState<ScanMode>('inventory');
	const [flash, setFlash] = useState<FlashState>('off');
	const [capturedUri, setCapturedUri] = useState<string | null>(null);
	const cameraRef = useRef<InstanceType<typeof Camera>>(null);

	// ── AppState lifecycle ───────────────────────────────────────────────────────
	// isCameraReady drives both whether the Camera is mounted AND whether to show
	// the "Freeing the camera" spinner in place of the viewfinder.
	//
	// State machine:
	//   active (first launch)  → isCameraReady = true  (camera mounts immediately)
	//   active → background    → isCameraReady = false (Camera unmounted; OS takes ownership)
	//   background → active    → isCameraReady = false (spinner visible)
	//                            300 ms later → isCameraReady = true (camera remounts)
	const [isCameraReady, setIsCameraReady] = useState(true);
	const appStateRef = useRef(AppState.currentState);

	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextState) => {
			if (nextState.match(/background|inactive/)) {
				// App is leaving the foreground — unmount the camera immediately so
				// the OS can hand the hardware to whichever app the user switches to.
				setIsCameraReady(false);
			} else if (
				appStateRef.current.match(/background|inactive/) &&
				nextState === 'active'
			) {
				// App is returning to foreground. isCameraReady is already false
				// (set above when we went to background), so the spinner is visible.
				// Wait 300 ms for the OS to fully release the previous session block
				// before remounting the Camera component.
				const timer = setTimeout(() => setIsCameraReady(true), 300);
				appStateRef.current = nextState;
				return () => clearTimeout(timer);
			}
			appStateRef.current = nextState;
		});

		return () => subscription.remove();
	}, []);

	// ── Camera error handler ─────────────────────────────────────────────────────
	// Vision Camera fires this with a CameraRuntimeError when it cannot acquire or
	// maintain the hardware session (e.g. CAMERA_ALREADY_IN_USE). Instead of an
	// alert, we show the same "Freeing the camera" spinner and schedule a recovery
	// cycle — the UI stays coherent without interrupting the user with a dialog.
	function handleCameraError(error: unknown) {
		console.warn('[PROD] Camera error:', error instanceof Error ? error.message : String(error));
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

	// Allow tap (focus) and pinch (zoom) to run at the same time
	const combinedGesture = Gesture.Simultaneous(tapGesture, pinchGesture);

	async function onCapture() {
		try {
			const photo = await cameraRef.current?.takePhoto({
				qualityPrioritization: 'quality',
				flash: flash === 'on' ? 'on' : 'off',
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
				onConfirm={(crop) => {
					console.log(`[PROD][${mode.toUpperCase()}] confirmed:`, capturedUri, 'crop:', crop);
					setCapturedUri(null);
					// TODO: pass capturedUri + crop into image recognition for inventory / POS flow
				}}
			/>
		);
	}

	// Camera is releasing (background transition or recovering from error).
	// Show a non-disruptive spinner instead of a dialog so the user can see
	// the app is actively freeing the hardware resource.
	if (!isCameraReady) {
		return (
			<View style={styles.cameraLoadingContainer}>
				<ActivityIndicator size="large" color={Colors.dark.tint} />
				<ThemedText style={styles.cameraLoadingText}>Freeing the camera</ThemedText>
			</View>
		);
	}

	return (
		<CameraShell
			cameraNode={
				// Camera is only mounted when isCameraReady is true (guarded above),
				// so isActive no longer needs to include isCameraReady.
				<AnimatedCamera
					ref={cameraRef}
					device={device}
					format={format}
					isActive={isFocused && !capturedUri}
					photo={true}
					videoStabilizationMode="auto"
					onError={handleCameraError}
					style={StyleSheet.absoluteFill}
					animatedProps={animatedCameraProps}
				/>
			}
			tapGesture={combinedGesture}
			focusRingStyle={focusRingStyle}
			mode={mode}
			setMode={setMode}
			flash={flash}
			setFlash={setFlash}
			onCapture={onCapture}
			zoomIndicator={
				<Animated.View style={[styles.zoomBadge, zoomBadgeAnimStyle]}>
					<ThemedText style={styles.zoomBadgeText}>{zoomDisplay}</ThemedText>
				</Animated.View>
			}
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
const CROP_BRACKET_LEN   = 22;
const CROP_BRACKET_THICK = 3;

const previewStyles = StyleSheet.create({
	gestureRoot: {
		flex: 1,
	},
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
	// The image container fills all space between topBar and bottomBar.
	// overflow:'hidden' clips the photo when zoomed so it stays within its bounds.
	imageContainer: {
		flex: 1,
		width: '100%',
		overflow: 'hidden',
	},
	// Semi-transparent dim panel covering areas outside the crop window
	dimPanel: {
		backgroundColor: 'rgba(0, 0, 0, 0.55)',
	},
	// Yellow L-shaped corner brackets on the crop box — distinct from the
	// white viewfinder brackets so users can tell them apart at a glance.
	cropBracketH: {
		position: 'absolute',
		width: CROP_BRACKET_LEN,
		height: CROP_BRACKET_THICK,
		backgroundColor: Colors.dark.tint,
	},
	cropBracketV: {
		position: 'absolute',
		width: CROP_BRACKET_THICK,
		height: CROP_BRACKET_LEN,
		backgroundColor: Colors.dark.tint,
	},
	// ◢ resize handle in the bottom-right corner of the crop box.
	// Positioned so it overlaps the bracket to form a clear drag target.
	resizeHandle: {
		position: 'absolute',
		bottom: -4,
		right: -4,
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	resizeHandleIcon: {
		fontSize: 18,
		color: Colors.dark.tint,
		lineHeight: 20,
	},
	// Short instruction line between the image area and the action buttons
	hint: {
		fontSize: 11,
		color: Colors.dark.icon,
		textAlign: 'center',
		paddingVertical: 8,
		paddingHorizontal: 16,
	},
	bottomBar: {
		paddingTop: 4,
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

	// ── Camera loading / freeing screen ──────────────────────────────────────────
	cameraLoadingContainer: {
		flex: 1,
		backgroundColor: '#000',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
	},
	cameraLoadingText: {
		fontSize: 15,
		fontWeight: '500',
		color: Colors.dark.icon,
	},

	// ── Zoom indicator ─────────────────────────────────────────────────────────
	// Absolutely centred between the framing guide and the capture button.
	// Visible at rest (0.65 opacity) so users know pinch-to-zoom is available;
	// becomes fully opaque and slightly larger while pinching.
	zoomIndicatorContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: '25%',
		alignItems: 'center',
	},
	zoomBadge: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 20,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.2)',
		paddingVertical: 6,
		paddingHorizontal: 16,
	},
	zoomBadgeText: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.dark.text,
		letterSpacing: 0.3,
	},
});
