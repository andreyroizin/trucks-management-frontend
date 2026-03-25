# Quotes (Offerte) — R38

## Purpose

Allow admins to create, manage, and track professional quotes (offertes) for potential customers. Supports PDF generation and status lifecycle tracking.

## Status

Phase 1 implemented. Quote-to-trip conversion deferred to Phase 3.

## Frontend Components

### Pages

| Route | File | Description |
|-------|------|-------------|
| `/quotes` | `app/[locale]/quotes/page.tsx` | List all quotes with search, status filter, pagination |
| `/quotes/create` | `app/[locale]/quotes/create/page.tsx` | Create new quote form |
| `/quotes/[id]` | `app/[locale]/quotes/[id]/page.tsx` | Quote detail with status actions |
| `/quotes/edit/[id]` | `app/[locale]/quotes/edit/[id]/page.tsx` | Edit draft quote |

### Components

| Component | File | Description |
|-----------|------|-------------|
| `QuoteForm` | `components/QuoteForm.tsx` | Shared form for create/edit with dynamic line items |

### Hooks

| Hook | File | Endpoint |
|------|------|----------|
| `useQuotes` | `hooks/useQuotes.ts` | `GET /quotes` |
| `useQuoteDetail` | `hooks/useQuoteDetail.ts` | `GET /quotes/{id}` |
| `useCreateQuote` | `hooks/useCreateQuote.ts` | `POST /quotes` |
| `useUpdateQuote` | `hooks/useUpdateQuote.ts` | `PUT /quotes/{id}` |
| `useUpdateQuoteStatus` | `hooks/useUpdateQuoteStatus.ts` | `PUT /quotes/{id}/status` |
| `useDeleteQuote` | `hooks/useDeleteQuote.ts` | `DELETE /quotes/{id}` |
| `useDownloadQuotePdf` | `hooks/useDownloadQuotePdf.ts` | `GET /quotes/{id}/pdf` |

### Types

- `types/quote.ts` — `QuoteDto`, `QuoteSummaryDto`, `QuoteLineItemDto`, `QuotesListResponse`, `CreateQuoteRequest`, `QuoteStatus`

## Workflow

1. Admin creates quote → status = Draft
2. Admin fills in company, customer, line items, validity date
3. Quote can be edited while in Draft
4. Admin marks as Sent → status = Sent (read-only)
5. Customer responds → admin marks as Accepted or Rejected
6. Any status can revert to Draft for corrections
7. PDF can be downloaded at any status

## Backend Endpoints

See `docs/api/ENDPOINTS.md` for the full list of 7 quote endpoints.
