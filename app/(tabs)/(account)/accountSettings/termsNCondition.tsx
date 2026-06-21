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

export default function TermsAndConditions() {
	return (
		<ParallaxScrollView style={styles.overrideParallaxScrollView}>
			<ThemedText style={styles.title}>Terms and Conditions</ThemedText>
			<ThemedText style={styles.lastUpdated}>Last updated: June 2026</ThemedText>

			<Section title="1. Acceptance of Terms">
				By accessing or using SnapSellr, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the app.
			</Section>

			<Section title="2. Use of the Service">
				SnapSellr provides tools for sellers to create and manage marketplace listings. You agree to use the service only for lawful purposes and in a manner that does not infringe the rights of others.
			</Section>

			<Section title="3. User Accounts">
				You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use.
			</Section>

			<Section title="4. Listings and Content">
				You retain ownership of the content you submit. By posting listings, you grant SnapSellr a non-exclusive license to display that content within the app. You are solely responsible for ensuring your listings are accurate and lawful.
			</Section>

			<Section title="5. Prohibited Activities">
				You may not use SnapSellr to post fraudulent, misleading, or illegal listings; to harass or harm other users; or to attempt to gain unauthorized access to any part of the service.
			</Section>

			<Section title="6. Limitation of Liability">
				SnapSellr is provided "as is" without warranties of any kind. To the fullest extent permitted by law, SnapSellr shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
			</Section>

			<Section title="7. Changes to These Terms">
				We may update these Terms at any time. Continued use of the app after changes are posted constitutes your acceptance of the revised Terms.
			</Section>

			<Section title="8. Contact">
				If you have questions about these Terms, please contact us at support@snapsellr.com.
			</Section>
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
