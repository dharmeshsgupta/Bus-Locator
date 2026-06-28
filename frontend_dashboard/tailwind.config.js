/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Professional Minimalist Black, Grey, and Ocean Blue Shaded Palette
        "primary":                    "#2563eb", // Deep sapphire brand blue
        "on-primary":                 "#ffffff",
        "primary-container":          "#eff6ff", // Soft pastel blue wash (surgical)
        "on-primary-container":       "#1d4ed8", // Deep blue text
        "inverse-primary":            "#93c5fd",
        "primary-fixed":              "#eff6ff",
        "primary-fixed-dim":          "#93c5fd",
        "on-primary-fixed":           "#1e3a8a",
        "on-primary-fixed-variant":   "#1d4ed8",

        "secondary":                  "#4b5563", // Professional Slate Grey
        "on-secondary":               "#ffffff",
        "secondary-container":        "#f3f4f6", // Clean neutral low-contrast wash
        "on-secondary-container":     "#1f2937",
        "secondary-fixed":            "#f3f4f6",
        "secondary-fixed-dim":        "#e5e7eb",
        "on-secondary-fixed":         "#1f2937",
        "on-secondary-fixed-variant": "#4b5563",

        "tertiary":                   "#1e40af", // Accent deep navy blue
        "on-tertiary":                "#ffffff",
        "tertiary-container":         "#dbeafe",
        "on-tertiary-container":      "#1e40af",
        "tertiary-fixed":             "#dbeafe",
        "tertiary-fixed-dim":         "#93c5fd",
        "on-tertiary-fixed":          "#1e40af",
        "on-tertiary-fixed-variant":  "#1d4ed8",

        "surface":                    "#ffffff", // Industry-standard pure white card surface
        "surface-dim":                "#f4f4f7",
        "surface-bright":             "#ffffff",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#f8f8fb", // Subtle warm-slate card wash
        "surface-container":          "#f1f1f5",
        "surface-container-high":     "#e4e4e9",
        "surface-container-highest":  "#d4d4db",
        "surface-variant":            "#f8f8fb",
        "surface-tint":               "#2563eb",

        "on-surface":                 "#0f172a", // Slate 900 for high-contrast professional text
        "on-surface-variant":         "#475569", // Slate 600 for secondary text
        "inverse-surface":            "#0f172a",
        "inverse-on-surface":         "#f8f8fb",

        "background":                 "#f9f9fb", // Premium high-grade light slate-grey background
        "on-background":              "#0f172a",

        "outline":                    "#cbd5e1", // Slate 300 border
        "outline-variant":            "#e2e2e9", // Clean, thin slate border

        // Toggle active state pastel color
        "toggle-active":              "#2563eb", // Punchy Blue-600 for toggle states

        "error":                      "#ef4444",
        "on-error":                   "#ffffff",
        "error-container":            "#fef2f2",
        "on-error-container":         "#991b1b",

        // Status colors
        "success":                    "#15803d",
        "success-bg":                 "#f0fdf4",
        "warning":                    "#d97706",
        "warning-bg":                 "#fffbeb",
        "info":                       "#2563eb",
        "info-bg":                    "#eff6ff",
        "danger":                     "#dc2626",
        "danger-bg":                  "#fef2f2",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg":      "0.5rem",
        "xl":      "0.75rem",
        "2xl":     "1rem",
        "3xl":     "1.5rem",
        "full":    "9999px",
      },
      spacing: {
        "xs":             "4px",
        "sm":             "8px",
        "md":             "16px",
        "lg":             "24px",
        "xl":             "32px",
        "gutter":         "16px",
        "margin-mobile":  "16px",
        "margin-desktop": "32px",
        "max-width":      "1440px",
      },
      maxWidth: {
        "xs": "20rem",
        "sm": "24rem",
        "md": "28rem",
        "lg": "32rem",
        "xl": "36rem",
        "2xl": "42rem",
      },
      fontFamily: {
        sans:     ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:     ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        "label-md":           ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
        "body-sm":            ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-lg":            ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-md":        ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg":        ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "mono-sm":            ["13px", { lineHeight: "18px", fontWeight: "400" }],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-progress': 'slideProgress 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideProgress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
    },
  },
  plugins: [],
}
