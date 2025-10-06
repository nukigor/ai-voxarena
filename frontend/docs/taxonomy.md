# Taxonomy Page

This page lists taxonomy terms filtered by category.

## Location
- `app/taxonomy/page.tsx`

## API
- `GET /api/taxonomy/categories` → `string[]` of distinct categories.
- `GET /api/taxonomy/terms?category=...&page=1&pageSize=20` → paginated terms.

## UI
- Category filter uses existing `SingleSelect` component.
- Table uses Tailwind template and shows:
  - Checkbox
  - Term
  - Slug
  - Is active
  - Description (first 100 chars with “more/less” toggle)
  - Created at
  - Edit link
- Buttons above table:
  - **Delete** (disabled until one or more rows selected; no action wired yet)
  - **Add term** (opens modal in future; currently a placeholder button)

## Pagination
- 20 items per page using the shared `Pagination` component.