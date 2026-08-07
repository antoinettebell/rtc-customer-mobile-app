# Customer App Regression Checklist

Run this checklist before installing a customer-app regression build on Round Da Corner's iPhone.

## Build identity

- [ ] Confirm the working branch is `main` and matches `origin/main`.
- [ ] Record the customer-app commit included in the build.
- [ ] Confirm the target is Round Da Corner's iPhone (`00008110-000241603E46401E`).
- [ ] Run the customer-app lint and automated discount tests.

## Event creation

- [ ] Create Event displays all six steps: Event Details, Guests & VIP, Free Food, Vendor Needs, Budget & Documents, and Review & Submit.
- [ ] Back and Continue preserve values entered on earlier steps.
- [ ] Save Draft, Clear Event, Review, and Submit behave correctly.
- [ ] Ticket sales can be enabled and GA/VIP quantities and prices can be entered.
- [ ] GA-only, VIP-only, and GA + VIP ticket configurations validate correctly.
- [ ] Fully catered and catered VIP configurations calculate guest budgets correctly.
- [ ] A separate VIP vendor changes the calculated vendor requirement correctly.
- [ ] Vendors may apply for eligible GA, VIP, or both opportunities.

## Event and ticket management

- [ ] An eligible customer can open an event and select Buy Tickets.
- [ ] Buy Tickets is unavailable after ticket sales close.
- [ ] My Tickets is reachable from Profile and displays purchased tickets.
- [ ] The coordinator can share the ticketed event invitation.
- [ ] The coordinator can open Scan Event Tickets during the allowed check-in window.
- [ ] The coordinator can close ticket sales without closing ticket check-in.
- [ ] The coordinator can close ticket check-in separately.
- [ ] Cancelling a ticketed event shows the refund confirmation and result.

## Menu and checkout

- [ ] Required menu selections cannot be skipped.
- [ ] Quantity changes create the expected number of configurable items.
- [ ] Separately customized copies retain distinct selections in the cart and checkout.
- [ ] Vendor combo configuration agrees with backend validation.

## Device handoff

- [ ] Build succeeds for the physical-device Debug configuration.
- [ ] Install succeeds on Round Da Corner's iPhone.
- [ ] Confirm the installed bundle identifier and installation timestamp.
- [ ] Report any item that requires live backend or device verification instead of marking it passed.
