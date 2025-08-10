import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))',
					glow: 'hsl(var(--primary-glow))',
					soft: 'hsl(var(--primary-soft))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					soft: 'hsl(var(--accent-soft))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 20px hsl(var(--primary-glow) / 0.3)' 
					},
					'50%': { 
						boxShadow: '0 0 40px hsl(var(--primary-glow) / 0.6)' 
					}
				},
				'slide-up': {
					'from': { 
						opacity: '0', 
						transform: 'translateY(20px)' 
					},
					'to': { 
						opacity: '1', 
						transform: 'translateY(0)' 
					}
				},
				'slide-in': {
					'from': { 
						opacity: '0', 
						transform: 'translateX(-20px)' 
					},
					'to': { 
						opacity: '1', 
						transform: 'translateX(0)' 
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'bounce-soft': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' }
				},
				'glow-pulse': {
					'0%, 100%': { 
						filter: 'brightness(1) saturate(1)' 
					},
					'50%': { 
						filter: 'brightness(1.1) saturate(1.2)' 
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'slide-up': 'slide-up 0.5s ease-out',
				'slide-in': 'slide-in 0.4s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
				'glow-pulse': 'glow-pulse 3s ease-in-out infinite'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-success': 'var(--gradient-success)',
				'gradient-soft': 'var(--gradient-soft)'
			},
			boxShadow: {
				'card': 'var(--shadow-card)',
				'glow': 'var(--shadow-glow)',
				'soft': 'var(--shadow-soft)',
				'intense': 'var(--shadow-intense)',
				'floating': 'var(--shadow-floating)'
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)',
				'spring': 'var(--transition-spring)',
				'bounce': 'var(--transition-bounce)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
