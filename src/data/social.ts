export type SocialLink = {
	platform: string;
	handle: string;
	href: string;
	icon: string;
};

export const socialLinks = {
	tiktok: {
		platform: "TikTok",
		handle: "@aheartwellendinghq",
		href: "https://www.tiktok.com/@aheartwellendinghq",
		icon: "tiktok",
	},
	instagram: {
		platform: "Instagram",
		handle: "@aheartwellendingband",
		href: "https://www.instagram.com/aheartwellendingband/",
		icon: "instagram",
	},
	spotify: {
		platform: "Spotify",
		handle: "A Heartwell Ending",
		href: "https://open.spotify.com/artist/0F7x26QGWIimVu4XnOiXkA",
		icon: "spotify",
	},
	appleMusic: {
		platform: "Apple Music",
		handle: "A Heartwell Ending",
		href: "https://music.apple.com/us/artist/a-heartwell-ending/168815027",
		icon: "apple-music",
	},
} satisfies Record<string, SocialLink>;
