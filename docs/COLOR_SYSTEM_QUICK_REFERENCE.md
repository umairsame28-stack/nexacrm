# NexaCRM Color System - Quick Reference

**Last Updated:** 2026-08-04  
**Version:** 2.0 (Indigo/Violet Premium)

---

## Brand Colors

### Primary - Indigo
```
Default:  #6366F1  rgb(99 102 241)   bg-primary
Hover:    #4F46E5  rgb(79 70 229)    bg-primary-hover
Active:   #4338CA  rgb(67 56 202)    bg-primary-active
Soft:     #EEF2FF  rgb(238 242 255)  bg-primary-soft
```

### Accent - Violet
```
Default:  #8B5CF6  rgb(139 92 246)   bg-accent
Hover:    #7C3AED  rgb(124 58 237)   bg-accent-hover
Soft:     #F3E8FF  rgb(243 232 255)  bg-accent-soft
```

---

## Semantic Colors

### Success - Green
```
Default:  #10B981  rgb(16 185 129)   bg-success
Soft:     #ECFDF5  rgb(236 253 245)  bg-success-soft
Text:     #FFFFFF  rgb(255 255 255)  text-success-foreground
```

### Warning - Amber
```
Default:  #F59E0B  rgb(245 158 11)   bg-warning
Soft:     #FFFBEB  rgb(255 251 235)  bg-warning-soft
Text:     #FFFFFF  rgb(255 255 255)  text-warning-foreground
```

### Danger - Red
```
Default:  #EF4444  rgb(239 68 68)    bg-destructive
Soft:     #FEF2F2  rgb(254 242 242)  bg-destructive-soft
Text:     #FFFFFF  rgb(255 255 255)  text-destructive-foreground
```

### Info - Blue
```
Default:  #3B82F6  rgb(59 130 246)   bg-info
Soft:     #EFF6FF  rgb(239 246 255)  bg-info-soft
Text:     #FFFFFF  rgb(255 255 255)  text-info-foreground
```

---

## Neutral Colors

### Light Mode
```
Background:      #F6F7FB  rgb(246 247 251)  bg-background
Foreground:      #0F172A  rgb(15 23 42)    text-foreground
Card:            #FFFFFF  rgb(255 255 255)  bg-card
Muted:           #F1F5F9  rgb(241 245 249)  bg-muted
Muted Text:      #64748B  rgb(100 116 139) text-muted-foreground
Border:          #E2E8F0  rgb(226 232 240)  border-border
```

### Dark Mode
```
Background:      #0B1020  rgb(11 16 32)    bg-background
Foreground:      #F8FAFC  rgb(248 250 252) text-foreground
Card:            #111827  rgb(17 24 39)    bg-card
Muted:           #334155  rgb(51 65 85)    bg-muted
Muted Text:      #94A3B8  rgb(148 163 184) text-muted-foreground
Border:          #263247  rgb(38 50 71)    border-border
```

---

## Chart Colors

```
Chart 1:  #6366F1  rgb(99 102 241)   bg-chart-1  Primary Indigo
Chart 2:  #8B5CF6  rgb(139 92 246)   bg-chart-2  Accent Violet
Chart 3:  #3B82F6  rgb(59 130 246)   bg-chart-3  Info Blue
Chart 4:  #10B981  rgb(16 185 129)   bg-chart-4  Success Green
Chart 5:  #F59E0B  rgb(245 158 11)   bg-chart-5  Warning Amber
Chart 6:  #EF4444  rgb(239 68 68)    bg-chart-6  Danger Red
```

---

## Usage Guidelines

### Buttons

#### Primary Button
```tsx
<Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
  Primary Action
</Button>
```

#### Secondary Button
```tsx
<Button variant="outline">
  Secondary Action
</Button>
```

#### Destructive Button
```tsx
<Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
  Delete
</Button>
```

### Badges

#### Success Badge
```tsx
<Badge className="bg-success-soft text-success">
  Active
</Badge>
```

#### Warning Badge
```tsx
<Badge className="bg-warning-soft text-warning">
  Pending
</Badge>
```

#### Danger Badge
```tsx
<Badge className="bg-destructive-soft text-destructive">
  Critical
</Badge>
```

### Cards
```tsx
<div className="bg-card border border-border rounded-lg p-6">
  <h3 className="text-foreground font-semibold">Card Title</h3>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Gradients
```tsx
// Primary Indigo gradient
<div className="gradient-primary">Content</div>

// Accent Violet gradient
<div className="gradient-accent">Content</div>

// Brand (Indigo to Violet)
<div className="gradient-brand">Content</div>
```

---

## Charts (Recharts)

### Using RGB Tokens
```tsx
<CartesianGrid stroke="rgb(var(--border))" />
<XAxis tick={{ fill: 'rgb(var(--foreground))', opacity: 0.6 }} />
<Tooltip contentStyle={{
  background: 'rgb(var(--card))',
  border: '1px solid rgb(var(--border))'
}} />
<Area stroke="rgb(var(--chart-1))" fill="url(#gradient)" />
```

### ❌ NEVER Use HSL
```tsx
// WRONG - Do not use
<CartesianGrid stroke="hsl(var(--border))" />

// CORRECT - Use RGB
<CartesianGrid stroke="rgb(var(--border))" />
```

---

## Rules

### ✅ DO
- Use semantic token classes (`bg-primary`, `text-foreground`)
- Use RGB format: `rgb(var(--token) / <alpha-value>)`
- Preserve semantic meaning (success = green, danger = red)
- Test in both light and dark mode
- Use chart tokens for data visualization
- Follow 70/20/10 visual balance (70% neutral, 20% typography, 10% brand)

### ❌ DON'T
- Use hardcoded hex colors
- Use HSL format: `hsl(var(--token))`
- Replace semantic colors with brand colors
- Override user-configured colors
- Make everything purple
- Use `!important` for color overrides
- Create component-specific duplicate palettes

---

## Common Patterns

### Active Navigation Item
```tsx
<Link className={cn(
  "px-3 py-2 rounded-lg",
  isActive 
    ? "bg-primary/10 text-primary" 
    : "text-muted-foreground hover:text-foreground"
)}>
  Dashboard
</Link>
```

### Status Indicators
```tsx
// Success
<div className="flex items-center gap-2 text-success">
  <CheckCircle className="h-4 w-4" />
  <span>Completed</span>
</div>

// Warning
<div className="flex items-center gap-2 text-warning">
  <AlertCircle className="h-4 w-4" />
  <span>Pending</span>
</div>

// Danger
<div className="flex items-center gap-2 text-destructive">
  <XCircle className="h-4 w-4" />
  <span>Failed</span>
</div>
```

### Hover Effects
```tsx
<div className="bg-card hover:bg-primary/5 border border-border hover:border-primary/20 transition-all">
  Interactive Card
</div>
```

---

## Quick Troubleshooting

### Colors Look Wrong
1. Check if using RGB format (not HSL)
2. Verify token exists in `globals.css`
3. Check dark mode variant
4. Ensure Tailwind config includes token

### Chart Colors Not Working
1. Use `rgb(var(--chart-N))` format
2. Never use `hsl(var(--chart-N))`
3. Check Recharts component props
4. Verify gradient definitions

### Dark Mode Issues
1. Check `.dark` class applied to root
2. Verify dark mode tokens defined
3. Test contrast ratios
4. Check if using semantic tokens

---

## Migration Checklist

When adding new components:
- [ ] Use semantic token classes
- [ ] Avoid hardcoded hex colors
- [ ] Use RGB format (not HSL)
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Verify focus states
- [ ] Check hover states
- [ ] Ensure sufficient contrast
- [ ] Preserve semantic meaning
- [ ] Follow 70/20/10 balance

---

**Quick Access:**
- Full documentation: `docs/GLOBAL_COLOR_SYSTEM_TRANSFORMATION.md`
- Audit details: `docs/GLOBAL_COLOR_SYSTEM_AUDIT.md`
- Calendar fix: `docs/CALENDAR_COLOR_SYSTEM_FIX.md`
