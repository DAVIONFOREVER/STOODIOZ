# STOODIOZ — Retention, Prevention & Issue Handling Plan

**Plan mode only.** This document outlines how STOODIOZ will retain users, prevent issues, handle unhappy customers, and manage refunds and cancellations. No implementation yet.

---

## 1. Retention

**Goal:** Keep artists, engineers, producers, studios, videographers, and labels active and satisfied so they stay on the platform.

| Area | Strategy |
|------|----------|
| **Onboarding** | Clear first steps after signup (complete profile, add availability, book or list first session). Optional “success path” checklist. |
| **Communication** | In-app and/or email nudges: booking reminders, “your session is in 24h,” post-session “how was it?” and prompt for review. |
| **Value reminder** | For Pro subscribers: periodic reminder of benefits (e.g. job board access, lower fees, priority support). For studios/engineers: “You have X new inquiries.” |
| **Re-engagement** | If user is inactive (e.g. no login or no booking in 30–60 days): light-touch email or in-app message with a clear CTA (e.g. “See who’s booking near you,” “New studios in your area”). |
| **Community** | The Stage, masterclasses, and Aria help keep users in the app; highlight these in dashboards and after key actions (e.g. after booking: “Join The Stage while you wait”). |
| **Trust** | Visible reviews, clear cancellation/refund policy, and a single support channel (e.g. support@stoodioz.com) build trust and reduce churn. |

**Ownership:** Product + growth; support reinforces retention by resolving issues quickly.

---

## 2. Prevention

**Goal:** Reduce the likelihood of dissatisfaction, disputes, and refund requests before they happen.

| Area | Prevention measure |
|------|--------------------|
| **Expectations** | Before booking: show studio/engineer details, exact price, and cancellation policy. After payment: clear confirmation with date, time, location, and “what to expect.” |
| **Cancellation policy visibility** | Show the same rules everywhere a user can book or cancel: “Full refund if cancelled >48h before; 50% if 24–48h; no refund <24h.” Consider a short “Cancellation policy” link in booking modal and My Bookings. |
| **Technical reliability** | Monitor Stripe webhooks, wallet top-up, and booking confirmation flows. Alerts if webhooks fail or wallet balance doesn’t update so support can fix before user complains. |
| **Pro subscription clarity** | On subscription plans page: what they get, how to cancel, and when they’re charged (e.g. monthly). Send receipt and “how to cancel” in confirmation email or in-app. |
| **Wallet clarity** | After top-up: confirm new balance and show it in UI. If balance doesn’t update (e.g. webhook delay): clear message + “Contact support if this doesn’t update in a few minutes.” |
| **In-app help** | One obvious “Help” or “Contact support” entry (e.g. in menu or Inbox). Pre-fill context (user id, last booking, screen) so support can respond faster. |
| **Dispute prevention** | For studios/engineers: encourage communication in Inbox before session. For no-shows: define and display policy (e.g. “No-show = no refund; studio may mark as completed after X minutes”). |

**Ownership:** Product (UX copy + flows), Engineering (reliability), Support (first-line feedback into product).

---

## 3. Handling Unhappiness & App Issues

**Goal:** When someone is unhappy or hits an app issue, they have a clear path and we respond consistently.

### 3.1 Single support channel

- **Primary:** Email **support@stoodioz.com** (already in Privacy Policy and invite copy).
- **In-app:** Add a visible “Help” or “Contact support” that opens email or a simple form (subject + message, optional: attach screenshot). Form can send to support@stoodioz.com and optionally create an internal “ticket” or thread.

### 3.2 Categorization and response

| Category | Examples | Response aim |
|----------|----------|--------------|
| **Bug / app issue** | “Wallet didn’t update,” “Booking didn’t confirm,” “Can’t log in” | Acknowledge quickly; if payment-related, verify in Stripe/DB and fix or refund as needed. Follow up when resolved. |
| **Booking dispute** | “Studio cancelled last minute,” “Session wasn’t as described,” “I couldn’t make it” | Apply cancellation policy first; for extenuating cases (e.g. studio no-show), allow exception refund per policy below. |
| **Subscription issue** | “I cancelled but was charged,” “I want to cancel” | Verify subscription status and next billing; process cancellation and/or refund per subscription rules. |
| **Refund request** | “I want my money back” (booking / tip / beat / product / masterclass) | Route to refund rules below; respond with outcome and timeline. |
| **General feedback** | “Feature request,” “Something was confusing” | Thank user; log for product. No monetary commitment. |

### 3.3 Response standards (target)

- **First response:** Within 1 business day (e.g. “We got your message and are looking into it”).
- **Payment/refund issues:** Status update within 2 business days; refund execution per timeline below.
- **Escalation:** If user remains unhappy after resolution, define one escalation path (e.g. second-tier support or designated contact) and optional goodwill (e.g. wallet credit within limits).

### 3.4 What we do *not* do in this plan

- Implement automated refund logic in code (plan only).
- Add new payment providers or change Stripe flows (plan only).
- Legal/regulatory specifics (those belong in Terms of Service / Refund Policy with legal review).

---

## 4. Refunds

**Goal:** Clear, consistent rules so support and users know when refunds apply and how they’re processed.

### 4.1 Bookings (session fees)

- **Policy (already in app):**
  - **>48 hours before session:** Full refund.
  - **24–48 hours:** 50% refund.
  - **<24 hours:** No refund.
- **Process (plan):**
  1. User cancels in app → booking status set to CANCELLED (already implemented).
  2. Refund amount is determined by the same rules (as in `BookingCancellationModal`).
  3. **Gap:** App currently does not create a Stripe refund; only status is updated. **Plan:** Support (or an admin flow) will:
     - Calculate refund amount using the same 48h / 24h rules.
     - Create Stripe refund for that amount (original payment intent from the booking).
     - If payment was from wallet, credit wallet instead and document it.
  4. User is informed: “Your refund of $X has been processed; it may take 5–10 business days to appear on your card.”

**Exceptions (support discretion, document in ticket):**

- Studio/engineer no-show or last-minute cancellation by provider → full refund.
- Technical failure (e.g. double charge, payment taken but booking not confirmed) → full refund.
- Extreme circumstances (e.g. serious illness, bereavement) → case-by-case; can offer full or partial refund or wallet credit.

### 4.2 Subscriptions (Pro plans)

- **Cancellation:** User can cancel subscription; access continues until end of billing period (Stripe behavior).
- **Refunds:**
  - **Plan:** No automatic refund for “changed my mind” after subscription starts. Prorated or full refund only in exceptional cases (e.g. charged after cancellation, duplicate charge, or severe service failure). Document and approve (e.g. support lead) before issuing.
  - Process: Stripe refund for the subscription payment; optionally revoke Pro access immediately if refunding.

### 4.3 Wallet top-ups

- **Plan:** Wallet is for future use; no routine refunds for “I added too much” or “I don’t need it anymore.” Refunds only for:
  - Failed or duplicate top-up (refund to original payment method or re-credit wallet).
  - User never used wallet and requests withdrawal; treat as exception (e.g. one-time withdrawal to original payment method, with approval and possible fee).
- Process: Stripe refund and/or manual wallet balance adjustment in DB; document.

### 4.4 Tips

- **Plan:** Tips are voluntary and generally non-refundable. Refund only for clear error (e.g. wrong amount entered, duplicate tip) or fraud. Process: Stripe refund; document.

### 4.5 Beats / products / masterclasses

- **Plan:**
  - **Digital delivery:** Refunds only if delivery failed (e.g. link broken, file missing) and not fixed within a reasonable time (e.g. 48h). Otherwise no refund once delivered.
  - **Not yet delivered:** Full refund if order is cancelled before delivery.
- Process: Stripe refund; document. If wallet was used, credit wallet.

### 4.6 Refund execution (all types)

- **Who:** Designated support or admin; optionally finance for large or exception refunds.
- **How:** Stripe Dashboard or backend/API: create refund against the correct PaymentIntent or Charge. If wallet was debited, credit `profiles.wallet_balance` and log.
- **Timeline:** Process within 2–3 business days of approval; tell user “5–10 business days” for card to show it.
- **Logging:** Keep a simple log (e.g. spreadsheet or table): date, user id, order/booking id, amount, reason, approved by. Helps audits and dispute prevention.

---

## 5. Cancellations

**Goal:** Users can cancel where appropriate; we apply consistent rules and update systems correctly.

### 5.1 Booking cancellation (by user)

- **Who can cancel:** User who made the booking (artist/customer). Studios/engineers may have “decline” or “cancel” on their side; define in same policy (e.g. studio cancel = same refund rules for the customer).
- **Where:** My Bookings → Cancel → `BookingCancellationModal` (already implemented). User sees refund amount and policy and must confirm.
- **Backend (current):** `cancelBooking(bookingId)` sets status to CANCELLED. **Gap:** No automatic Stripe refund. **Plan:** As in §4.1: support or automated job applies refund per 48h/24h rules and processes refund via Stripe (or wallet credit).
- **Notifications (plan):** Notify the studio/engineer that the booking was cancelled (email or in-app). Optionally notify the customer: “Your booking was cancelled. Refund of $X will appear in 5–10 business days.”

### 5.2 Booking cancellation (by studio / engineer)

- **Plan:** Allow studio/engineer to cancel from their dashboard. Same refund rules apply for the customer (e.g. studio cancels 2 days before → full refund). Implement same refund logic and notifications as above; consider “cancelled by studio” flag for analytics and support.

### 5.3 Subscription cancellation

- **Plan:** User can cancel Pro subscription from account/settings or subscription management (Stripe Customer Portal or in-app link). No refund for remaining period; access until period end. Optional: “Pause” or “downgrade at period end” if you add it later.
- **Status:** Stripe sends `customer.subscription.deleted` or `subscription_status: 'cancelled'`; app should show “Cancelled” or “Active until [date]” and stop showing Pro benefits after that date.

### 5.4 Other “cancellations”

- **Wallet:** No “cancellation”; user uses balance or requests exception withdrawal per §4.3.
- **Tips / beats / products / masterclasses:** No recurring commitment; only refund rules in §4.4–4.5 apply.

---

## 6. Summary Table

| Topic | Key point |
|-------|-----------|
| **Retention** | Onboarding, reminders, value reminder, re-engagement, community, trust. |
| **Prevention** | Clear expectations, visible cancellation policy, reliable tech, in-app help, dispute prevention. |
| **Issues** | Single channel (support@stoodioz.com + in-app Help), categorize, respond within 1–2 business days, escalate if needed. |
| **Booking refunds** | >48h full, 24–48h 50%, <24h none; exceptions for provider no-show / tech failure. Implement actual Stripe refund (or wallet credit) alongside status update. |
| **Subscription refunds** | No routine refunds; only exceptions (e.g. charged after cancel, duplicate). |
| **Wallet / tips / digital** | Refund only for error, non-delivery, or approved exception. |
| **Booking cancellation** | User and provider can cancel; same refund rules; add Stripe refund + notifications. |
| **Subscription cancellation** | User cancels; access to period end; no refund for unused period. |

---

## 7. Next steps (when moving from plan to execution)

1. **Support:** Formalize support@stoodioz.com (e.g. shared inbox, templates for “We received your request,” “Refund processed”).
2. **In-app:** Add “Help” / “Contact support” with optional context (user id, last action).
3. **Refunds:** Implement Stripe refund (and wallet credit) for booking cancellations using existing 48h/24h logic; add logging.
4. **Notifications:** Add cancellation emails/in-app messages to studio and customer.
5. **Legal:** Add or update Terms of Service and Refund Policy to match this plan (legal review).
6. **Monitoring:** Alerts on webhook failures and wallet/booking sync issues to fix before users report them.

---

*Document: Retention, Prevention & Issue Handling Plan — plan mode only. Last updated: March 2025.*
