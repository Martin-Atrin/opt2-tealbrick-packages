/* clerk-appearance.ts — Tealbrick theme for every Clerk component (C138). PROPOSAL for @opt2-tealbrick/ui.
   Target: @clerk/react 6.17.8 (Clerk core 3, as installed in opt2-tealbrick-portal-gui; @clerk/shared 4.40.0).
   Checked against the installed types (node_modules/@clerk/react/dist/types-*.d.mts: `Variables` ~L10500, `ElementsConfig`
   ~L9866, `Theme`/`Appearance` ~L10667/L10848). Core-3 names only: `options` (not `layout`), `theme` (not `baseTheme`),
   colorForeground / colorInput / colorMutedForeground (not colorText / colorInputBackground / colorTextSecondary).
   Docs: https://clerk.com/docs/guides/customizing-clerk/appearance-prop/overview
   Rules: brick 6px for buttons/inputs/cards/tabs/menus/modals; pill only for badges; state pairs from tokens (AA, C128);
   Nunito; labels 800, body 400; no Clerk logo (our lockup sits outside the card); light + dark from tokens.ts.
   Usage (GUI): <ClerkProvider appearance={clerkAppearance(theme)} …> once, so SignIn, SignUp and UserProfile all match. */
import { resolved, resolvedDark, cssVar } from './tokens.ts';

type Css = Record<string, string | number | Record<string, string | number>>;
export type ClerkAppearance = {
  variables: Record<string, string | Record<string, string | number>>;
  elements: Record<string, string | Css>;
  options: Record<string, string | boolean>;
  cssLayerName?: string;
};

const v = cssVar; // elements are applied as classes on our page, so CSS variables follow the live theme
const focus = { outline: `${v('focusWidth')} solid ${v('focus')}`, outlineOffset: v('focusOffsetTight') };
const brickButton = (fill: string, on: string, hoverFill: string, hoverOn: string, edge?: string): Css => ({
  borderRadius: v('radiusBrick'), minHeight: v('target'), padding: `0 ${v('controlPad')}`, fontWeight: 800, fontSize: v('textControl'),
  lineHeight: 1, textTransform: 'none', letterSpacing: 0, background: fill, color: on, boxShadow: edge ? `inset 0 0 0 ${v('hair')} ${edge}` : 'none',
  '&:hover': { background: hoverFill, color: hoverOn }, '&:focus-visible': focus,
});

export const clerkAppearance = (theme: 'light' | 'dark' = 'light'): ClerkAppearance => {
  const t = theme === 'dark' ? resolvedDark : resolved; // Clerk derives shades from variables, so they must be literal colours
  return {
    cssLayerName: 'clerk', // our tokens/components win over Clerk's defaults without !important
    variables: {
      colorPrimary: t.primaryFill, colorPrimaryForeground: t.primaryOn,
      colorBackground: t.tile, colorForeground: t.ink, colorMuted: t.plate, colorMutedForeground: t.muted,
      colorInput: t.fieldFill, colorInputForeground: t.fieldOn, colorBorder: t.lineStrong, colorRing: t.focus,
      colorDanger: t.brick, colorSuccess: t.tealInk, colorWarning: t.brickInk, // three roles only: no yellow
      colorNeutral: t.ink, colorShadow: t.shadowInk, colorModalBackdrop: t.film,
      fontFamily: t.font, fontFamilyButtons: t.font, fontFamilyMono: t.fontMono,
      fontSize: { xs: '0.8125rem', sm: '0.875rem', md: '0.9375rem', lg: '1rem', xl: '1.25rem' },
      fontWeight: { normal: 400, medium: 700, semibold: 800, bold: 900 },
      borderRadius: t.radiusBrick, spacing: '1rem',
    },
    elements: {
      // surfaces (brick)
      rootBox: { width: '100%' },
      cardBox: { borderRadius: v('radiusBrick'), boxShadow: v('ringStrong'), width: '100%', maxWidth: '440px' },
      card: { borderRadius: v('radiusBrick'), background: v('tile'), boxShadow: 'none', padding: `${v('s8')} ${v('s8')} ${v('s6')}` },
      headerTitle: { fontWeight: 900, fontSize: v('textH2'), letterSpacing: v('trackingHead'), color: v('ink') },
      headerSubtitle: { color: v('inkSoft'), fontSize: v('textLabel') },
      footer: { background: v('paper'), borderRadius: `0 0 ${v('radiusBrick')} ${v('radiusBrick')}` },
      footerActionText: { color: v('muted') },
      footerActionLink: { color: v('link'), fontWeight: 800, textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '5px', textDecorationColor: v('linkUnderline'), '&:hover': { textDecorationColor: 'currentColor', color: v('link') } },
      dividerLine: { background: v('line'), height: v('hair') },
      dividerText: { color: v('muted'), fontWeight: 700, fontSize: v('textTag') },
      // buttons (brick; state pairs)
      formButtonPrimary: brickButton(v('primaryFill'), v('primaryOn'), v('primaryHoverFill'), v('primaryHoverOn')),
      socialButtonsBlockButton: brickButton(v('secondaryFill'), v('secondaryOn'), v('secondaryHoverFill'), v('secondaryHoverOn'), v('secondaryEdge')),
      socialButtonsBlockButtonText: { fontWeight: 800, fontSize: v('textControl') },
      formButtonReset: brickButton(v('quietFill'), v('quietOn'), v('quietHoverFill'), v('quietHoverOn'), v('quietEdge')),
      profileSectionPrimaryButton: brickButton(v('secondaryFill'), v('secondaryOn'), v('secondaryHoverFill'), v('secondaryHoverOn'), v('secondaryEdge')),
      button__danger: brickButton(v('dangerFill'), v('dangerOn'), v('dangerHoverFill'), v('dangerHoverOn'), v('dangerEdge')),
      // fields (brick)
      formFieldLabel: { fontWeight: 800, fontSize: v('textLabel'), color: v('ink') },
      formFieldInput: { borderRadius: v('radiusBrick'), minHeight: v('target'), padding: `0.07em 14px 0`, fontSize: v('textControl'), background: v('fieldFill'), color: v('fieldOn'), border: 0, boxShadow: `inset 0 0 0 ${v('hair')} ${v('fieldEdge')}`, '&:hover': { boxShadow: `inset 0 0 0 ${v('hair')} ${v('fieldHoverEdge')}` }, '&:focus': { ...focus, boxShadow: `inset 0 0 0 ${v('hair')} ${v('fieldEdge')}` } },
      formFieldInput__error: { boxShadow: `inset 0 0 0 2px ${v('fieldInvalidEdge')}` },
      formFieldErrorText: { color: v('dangerInk'), fontWeight: 700, fontSize: v('textTag') },
      formFieldAction: { color: v('link'), fontWeight: 800 },
      otpCodeFieldInput: { borderRadius: v('radiusBrick'), boxShadow: `inset 0 0 0 ${v('hair')} ${v('fieldEdge')}`, fontFamily: v('fontMono'), fontSize: '1.375rem' },
      identityPreview: { borderRadius: v('radiusBrick'), boxShadow: v('ringStrong') },
      // pills: badges only (state)
      badge: { borderRadius: v('radiusPill'), minHeight: '28px', padding: '0 12px', fontWeight: 700, fontSize: v('textControl'), lineHeight: 1, background: v('statusIdleFill'), color: v('statusIdleOn'), boxShadow: `inset 0 0 0 ${v('hair')} ${v('statusIdleEdge')}` },
      badge__primary: { background: v('statusLiveFill'), color: v('statusLiveOn'), boxShadow: `inset 0 0 0 ${v('hair')} ${v('statusLiveEdge')}` },
      badge__actionRequired: { background: v('statusNeedsYouFill'), color: v('statusNeedsYouOn'), boxShadow: `inset 0 0 0 ${v('hair')} ${v('statusNeedsYouEdge')}` },
      // UserProfile: navbar and tabs are bricks (C126); sections are hairline ruled
      navbar: { background: v('paper'), boxShadow: v('hairRight') },
      navbarButton: { borderRadius: v('radiusBrick'), minHeight: v('target'), fontWeight: 700, fontSize: v('textControl'), color: v('tabOn'), '&:hover': { background: v('tabHoverFill'), color: v('tabHoverOn') } },
      navbarButton__active: { background: v('tabCurrentFill'), color: v('tabCurrentOn') },
      tabButton: { borderRadius: v('radiusBrick'), fontWeight: 700 },
      page: { gap: v('s6') },
      profileSection: { boxShadow: v('hairTop'), paddingTop: v('s5') },
      profileSectionTitleText: { fontWeight: 900, fontSize: '1.125rem', color: v('ink') },
      profileSectionItem: { color: v('inkSoft') },
      // floating: menus, modals (brick + the one float shadow)
      menuButton: { borderRadius: v('radiusBrick') },
      menuList: { borderRadius: v('radiusBrick'), background: v('tile'), boxShadow: v('shadowFloat'), padding: '6px' },
      menuItem: { borderRadius: v('radiusBrick'), fontWeight: 700, color: v('optionOn'), '&:hover': { background: v('optionHoverFill'), color: v('optionHoverOn') } },
      menuItem__destructive: { color: v('dangerInk') },
      modalBackdrop: { background: v('scrim') },
      modalContent: { borderRadius: v('radiusBrick'), boxShadow: v('shadowFloat') },
      alert: { borderRadius: v('radiusBrick'), background: v('statusNeedsYouFill'), color: v('statusNeedsYouOn') },
      avatarBox: { borderRadius: v('radiusBrick') }, // avatars are square bricks (icon-only rule)
      userButtonTrigger: { borderRadius: v('radiusBrick'), '&:focus-visible': focus },
      table: { borderCollapse: 'collapse' },
    },
    options: {
      logoPlacement: 'none', // the Tealbrick lockup sits on our page, outside the card
      socialButtonsVariant: 'blockButton', socialButtonsPlacement: 'top',
      shimmer: false, animations: true, // Clerk's own transitions are short; our reduced-motion rule still applies on the page
      unsafe_disableDevelopmentModeWarnings: false,
    },
  };
};

export const clerkAppearanceLight = clerkAppearance('light');
export const clerkAppearanceDark = clerkAppearance('dark');
