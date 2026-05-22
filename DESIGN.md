---
name: Startup OS
colors:
  background: "#080710"      # Deep Cosmic Space / Jet Black
  surface: "rgba(255, 255, 255, 0.03)" # Semi-transparent ultra-thin glass
  border: "rgba(255, 255, 255, 0.08)" # Crisp diamond thin outline
  text-primary: "#FFFFFF"    # Pristine white
  text-muted: "rgba(255, 255, 255, 0.4)" # Foggy silver for labels
  
  # Role-based Theme Palettes
  cfo:
    primary: "#00E5FF"       # Electric Cyber Cyan
    secondary: "#9D4EDD"     # Neon Amethyst Purple
    glow: "rgba(0, 229, 255, 0.15)"
  marketer:
    primary: "#FF5E36"       # Hyper Coral
    secondary: "#FF007F"     # Neon Hot Pink
    glow: "rgba(255, 94, 54, 0.15)"
  hr:
    primary: "#00FF87"       # Vivid Emerald Mint
    secondary: "#00E5FF"     # Cyber Teal
    glow: "rgba(0, 255, 135, 0.15)"
typography:
  fontFamily: "Outfit, Inter, system-ui, sans-serif"
  h1:
    fontSize: "2.5rem"
    fontWeight: "900"
    letterSpacing: "-0.03em"
  body-md:
    fontSize: "0.875rem"
    fontWeight: "500"
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "28px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "24px"
---

# Startup OS Design Specification

Welcome to the **Startup OS** Design System. This document serves as the absolute "source of truth" for the UI/UX refactoring of the Startup OS platform, which hosts the CFO, CMO, and CHRO workspaces.

## Visual Philosophy
"Cosmic Obsidian meets Radiant Fluidity." The UI must evoke a highly premium, futuristic command center. We achieve this through:
1. **True Jet-Black Backgrounds** (#080710) paired with large, highly-blurred backdrop radial glows mimicking nebula clouds.
2. **Glassmorphism:** All components use the `.glass-card` standard: a thin semi-transparent white background, a `backdrop-blur` of at least `20px`, and a precise `1px` border of `rgba(255, 255, 255, 0.08)`.
3. **Role-Based Neon Accent Fluidity:** The application dynamic colors transition smoothly based on the active workspace role:
   - **CFO:** Technical, quantitative, cyber-capitalist energy. Electric Cyan and Neon Purple.
   - **CMO:** Dynamic, creative, high-conversion energy. Hyper Coral and Neon Hot Pink.
   - **CHRO:** Humanistic, growth-focused, collaborative energy. Vivid Emerald Mint and Cyber Teal.
4. **Custom-Crafted High-End Imagery:** Absolutely NO generic icons. The primary branding features a 3D glassmorphic logo combining an abstract 'S' with glowing capital growth curves.

---

## Design System Tokens & Application

### 1. Typography Hierarchy
Use **Outfit** or **Plus Jakarta Sans** as the primary typeface:
- Headings (`h1`, `h2`) must use a heavy weight (`900` or `800`) with dynamic gradient text clipping: `bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic`.
- Body text should use a clean, medium weight (`500` or `400`) with fine spacing. Use `text-white/40` or `text-white/60` for auxiliary captions to maximize visual depth.

### 2. Glassmorphic Cards (`.glass-card`)
A standard card should not look muddy or flat. It must feel like floating glass:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  border-radius: 20px;
}
```
Add hover translations to interactive cards:
```css
.glass-card-interactive {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.glass-card-interactive:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px 0 rgba(var(--primary-rgb), 0.15);
}
```

### 3. High-Fidelity Buttons & Inputs
- **Primary Button (`.btn-primary`):** A full gradient button from `--primary` to `--secondary` with a strong drop shadow using the primary accent color. It must scale slightly (`scale-[1.02]`) on hover and shrink on press.
- **Secondary Button (`.btn-secondary`):** Border `1px solid rgba(255, 255, 255, 0.1)`, dark solid backplate, hover background white/5.
- **Form Inputs:** Fully transparent input field with `1px solid rgba(255, 255, 255, 0.08)` and focus state that transitions the border to `var(--primary)` with a subtle outer glow.

### 4. Interactive Micro-Animations
- **Role Switching:** Smooth fade and gradient transitions when active department changes.
- **Status Badges:** Use subtle pulsing animations for active indicators (e.g. `active-pulse`).
- **Scrollbars:** Rounded, thin, and styled in transparent black so they do not interrupt visual immersion.
