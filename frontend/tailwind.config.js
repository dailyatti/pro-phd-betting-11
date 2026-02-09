/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                app: "var(--bg-app)",
                panel: "var(--bg-panel)",
                elevated: "var(--bg-elevated)",
                primary: "var(--text-primary)",
                secondary: "var(--text-secondary)",
                tertiary: "var(--text-tertiary)",
                gold: {
                    DEFAULT: "var(--accent-gold)",
                    dim: "var(--accent-gold-dim)",
                    text: "var(--text-gold)",
                },
                cyan: {
                    DEFAULT: "var(--accent-cyan)",
                    dim: "var(--accent-cyan-dim)",
                },
                emerald: "var(--accent-emerald)",
                rose: "var(--accent-rose)",
            },
            borderColor: {
                subtle: "var(--border-subtle)",
                gold: "var(--border-gold)",
                cyan: "var(--border-cyan)",
            },
            boxShadow: {
                'glow-gold': "var(--shadow-glow-gold)",
                'glow-cyan': "var(--shadow-glow-cyan)",
            },
        },
    },
    plugins: [],
}
