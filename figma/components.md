# Figma component checklist

Build these by hand in Figma. Names and variant values below come from `src/components/ui/`; use `figma/design-tokens.json` for colour, radius, spacing, type and motion. Every interactive component needs a visible focus ring and at least a 44 px hit area (48 px for primary shop actions).

| Component (source file) | Variants | States to draw |
| --- | --- | --- |
| `Button` (`Button.tsx`) | `variant: solid \| outline \| ghost`; `size: sm \| md \| lg`; `fullWidth`, `leftIcon`, `rightIcon` | default, hover, disabled, loading (spinner + `aria-busy`), destructive solid/outline hover |
| `IconButton` (`IconButton.tsx`) | `variant: ghost \| outline`; `size` (glyph px, default 22) | default, hover, disabled, focus |
| `Input` (`Input.tsx`) | `icon`, `hideLabel`; text, tel, email, number | default, focus, filled, error (`aria-invalid`), hint, disabled, required |
| `Textarea` (`Textarea.tsx`) | hint / error text | default, focus, filled, error, disabled, required |
| `Select` (`Select.tsx`) | `placeholder`, per-option `disabled` | default, open list, selected, error, disabled, focus |
| `Checkbox` (`Checkbox.tsx`) | native checked | unchecked, checked, indeterminate if needed, focus, disabled |
| `Toggle` (`Toggle.tsx`) | `checked`, `description` | off, on, focus, disabled |
| `RadioPills` (`RadioPills.tsx`) | option list, per-option `disabled` | unselected, selected, focus, disabled |
| `Chip` (`Chip.tsx`) | `selected`, `disabled` | default, selected (checkmark), hover, disabled |
| `QuantityStepper` (`QuantityStepper.tsx`) | `min`, `max`, `disabled` | default, minus disabled at min, plus disabled at max, bump feedback |
| `SwatchPicker` (`SwatchPicker.tsx`) | swatch `name` + `hex` | unselected, selected (checkmark), focus |
| `RangeSlider` (`RangeSlider.tsx`) | two thumbs, `step`, `formatValue` | default, each thumb focused, filled rail |
| `Card` (`Card.tsx`) | `padded` | plain, padded |
| `Badge` (`Badge.tsx`) | `count`, `max` (99+), `showZero`, `label` | hidden (count ≤ 0), count, 99+ |
| `Avatar` (`Avatar.tsx`) | `size: md \| lg`; `src` or initials | image, initials fallback, md, lg |
| `StatusChip` (`StatusChip.tsx`) | `tone: success \| warning \| error \| info \| pending`; optional `icon` | one per tone, with icon + text + colour |
| `ProgressBar` (`ProgressBar.tsx`) | `max`, `showValue` | empty, partial, complete, with/without value label |
| `Skeleton` (`Skeleton.tsx`) | `variant: line \| card \| row \| image`; `count`, `width`, `height` | one per variant, pulse |
| `EmptyState` (`EmptyState.tsx`) | `icon`, optional `action` | without action, with action |
| `ErrorState` (`ErrorState.tsx`) | `title`, `icon`, optional `onRetry` | without retry, with outline retry button |
| `OfflineBanner` (`OfflineBanner.tsx`) | `lastUpdated` | no timestamp, with last-updated timestamp |
| `PhotoPlaceholder` (`PhotoPlaceholder.tsx`) | `tone: sand \| rose \| sage \| sky \| lilac \| grey`; `width`, `height` | one per tone |
| `MapPlaceholder` (`MapPlaceholder.tsx`) | `caption`, `progress` (0–1) | default, with caption, progress variants |
| `Toast` (`ToastProvider` + `useToast`) | up to 3 stacked messages | appear, visible, close, auto-dismiss |
| `Dialog` (`Dialog.tsx`) | `title`, `children`, `footer` | closed (not mounted), open with focus trap, Escape close |
| `ConfirmDialog` (`ConfirmDialog.tsx`) | `destructive`, `loading`, custom labels | default, destructive, loading (cancel disabled) |
| `Sheet` (`Sheet.tsx`) | `title`, `children`, `footer` | closed, open bottom sheet (mobile), open side drawer (≥768) |
| `Stepper` (`Stepper.tsx`) | `vertical`, step `state: done \| current \| upcoming`; optional `time` | horizontal and vertical, one per step state |
| `Tabs` (`Tabs.tsx`) | `active`, keyboard arrow navigation | default, active underline, focus |
| `Img` (`Img.tsx`) | `priority`, `sizes` | real image (`url`), tone placeholder (`url: null`), loading eager/lazy |
| `Rating` (`Rating.tsx`) | `compact`, `count` | 0–5 stars in 0.1 steps, numeric on/off |
| `PriceTag` (`PriceTag.tsx`) | `mrpPaise`, `showOff` | price only, MRP strikethrough, discount pill |
| `Timer` (`Timer.tsx`) | `endsAt`, `label`, `onExpire` | normal (clock), urgent ≤2 min (alert), ended |
| `AnnouncementBar` (`AnnouncementBar.tsx`) | `ctaLabel`, `ctaHref`, `dismissible` | default, dismissed (not rendered), CTA hover, close |
| `Breadcrumb` (`Breadcrumb.tsx`) | items with optional `to` | link hover, current (`aria-current="page"`), separator |
| `Marquee` (`Marquee.tsx`) | `label`, duplicated track | scrolling, paused on hover/focus, reduced-motion static |
| `LanguageSwitch` (`LanguageSwitch.tsx`) | `en`, `hi` | active (`aria-pressed`), inactive, focus |
| `SkipLink` (`SkipLink.tsx`) | `targetId` | hidden, visible on focus |

Icon geometry for every `IconName` is exported to `figma/icons/` by `npm run tokens`; layer names in the SVGs match the file names. `Button.module.css` is legacy CSS and is not used by `Button.tsx`; do not document it as a separate component.
