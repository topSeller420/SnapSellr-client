import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

function Section({ title, children }: { title: string; children: string }) {
	return (
		<View style={styles.section}>
			<ThemedText style={styles.sectionHeader}>{title}</ThemedText>
			<ThemedText style={styles.body}>{children}</ThemedText>
		</View>
	);
}

export default function PrivacyPolicy() {
	return (
		<ParallaxScrollView>
			<ThemedText style={styles.title}>Privacy Policy</ThemedText>
			<ThemedText style={styles.lastUpdated}>Last updated: June 2026</ThemedText>

			<Section title="1. Information We Collect">
				We collect information you provide directly, such as your name, email address, city, state, and any content you add to your listings. We also collect usage data to improve the app experience.
			</Section>

			<Section title="2. How We Use Your Information">
				Your information is used to operate and improve SnapSellr, communicate with you about your account, and display your listings to potential buyers. We do not sell your personal data.
			</Section>

			<Section title="3. Data Sharing">
				We do not share your personal information with third parties except as necessary to operate the service (e.g., hosting providers) or as required by law. Listing content you make public is visible to other users.
			</Section>

			<Section title="4. Data Retention">
				We retain your data for as long as your account is active. If you delete your account, your personal information and listings will be permanently removed from our systems within 30 days.
			</Section>

			<Section title="5. Security">
				We implement reasonable technical and organizational measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
			</Section>

			<Section title="6. Your Rights">
				You have the right to access, correct, or delete the personal data we hold about you. You can update most information directly in the app under Account Settings, or contact us to request deletion.
			</Section>

			<Section title="7. Changes to This Policy">
				We may update this Privacy Policy from time to time. We will notify you of significant changes through the app. Continued use after changes are posted constitutes your acceptance.
			</Section>

			<Section title="8. Contact">
				If you have questions or concerns about this Privacy Policy, please contact us at privacy@snapsellr.com.
			</Section>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	title: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 4,
	},
	lastUpdated: {
		fontSize: 13,
		color: Colors.dark.icon,
		marginBottom: 8,
	},
	section: {
		gap: 8,
	},
	sectionHeader: {
		fontSize: 13,
		fontWeight: '600',
		letterSpacing: 0.4,
		color: Colors.dark.icon,
	},
	body: {
		fontSize: 14,
		lineHeight: 22,
	},
});
