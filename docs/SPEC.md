LocalFit: Requirements, Features, and Interface Specification

This is a working specification for a hyperlocal fashion marketplace built for urgent occasions. “LocalFit” is a placeholder name, so rename it as needed. The source document points to three design priorities: speed to outfit, confidence in fit (try at the door), and trust built by making local shops visible.

1. Key takeaways from the source document

Existing apps each solve part of the problem. Fashion marketplaces have large catalogs but slow delivery. Quick-commerce apps are fast but carry thin fashion ranges. Try-and-buy and rental services are slow by design. Local discovery tools show shops but have no live stock or payment. LocalFit’s gap is the combination of real-time stock from nearby shops, a try-before-you-keep window at the door, and occasion-first browsing.

The document also sets requirements for four user groups (buyers, shopkeepers, riders, and internal operations) and lists features grouped into beta, second phase, and later. Three decisions were left open: cash on delivery, the default charge when a trial expires, and whether alterations and rentals are in scope. Section 2 proposes defaults for these.

2. Assumptions and proposed defaults
Decision	Proposed beta default	Reason
Cash on delivery (COD)	Try-at-door orders require prepaid payment. Standard orders allow COD only after a buyer’s first successful prepaid order, with a value cap for new accounts.	Limits return and fraud losses where a rider must carry goods to the door.
Trial expiry and default charge	Unkept items return with the rider and no charge applies. The buyer sees this on the checkout screen before paying.	Gives buyers a clear, low-risk promise. Section 8.2 covers the payment mechanics.
Alterations	Out of beta. Offered manually through a partner in phase 2.	Requires a partner network and pricing that the beta doesn’t need.
Rental	Out of scope.	Adds cleaning, damage, and deposit rules.
Shop fees	Commission on completed sales only, with no listing fee during beta. Exact rate set by the business team.	Lowers the barrier to shop onboarding.
Platforms	Buyers: Android, iOS, and mobile web. Shops: Android app with offline mode, plus a web dashboard. Riders: lightweight Android app. Admin: web console.	Matches each group’s devices and connectivity.

Payment note: card pre-authorization holds are standard, but UPI generally does not offer a card-style hold. Confirm with the payment gateway which methods support holds. If UPI doesn’t, trial orders paid by UPI will use the charge-then-refund model in Section 8.2.

3. Scope by phase

Must have for the single-city beta:

Occasion-based browsing and shop discovery within each shop’s service radius
Live stock with counter-sale synchronization
Try-at-doorstep with clear trial terms
UPI and card payments, with COD as a limited option
Live tracking, OTP handover, and handover photos
Snap & List for shopkeepers, with offline saving
Basic dispute handling and a clear returns policy

Second phase: alteration pickup (through a partner), shop-hold reservations, video try-on calls, fit reviews, back-in-stock and price-drop alerts, shopkeeper sales insights, demand alerts, and corporate or group ordering.

Later: rental, WhatsApp ordering, shop loyalty, styling services, and multi-city expansion.

4. Roles and access
Role	Who they are	Sign-in method	Main capabilities
Buyer	Shoppers using the app	Phone number with OTP, or Google sign-in. Guests can browse.	Browse, buy, try at door, track, return, review
Shopkeeper	Owner or staff of a shop	Phone OTP plus shop verification	List, manage stock, counter sales, accept orders, payouts
Rider	Delivery partner	Phone OTP plus document verification	Pickups, drops, OTP handover, earnings, safety
Admin (ops)	Internal staff	Single sign-on with two-factor authentication	Verify shops, resolve disputes, manage refunds and payouts, monitor operations
Super admin	Internal leadership	Same as admin, with extra approval	Configure fees, trial terms, COD rules, and staff roles

Admin roles are split by permission: support agent, verifier, finance, dispute lead, and super admin. Each agent sees only the data their role needs. Every admin action is written to an audit log.

5. Login and onboarding flow
                    ┌──────────────────────┐
                    │   App opens (any     │
                    │   role / guest)      │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Language selection   │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Welcome screen:      │
                    │ Sign in / Browse     │
                    └───┬──────────────┬───┘
               Browse   │              │ Sign in
                        │      ┌───────▼────────┐
                        │      │ Enter phone →  │
                        │      │ Verify OTP     │
                        │      └───────┬────────┘
                        │              │
                        │      ┌───────▼────────┐        ┌──────────────────┐
                        │      │ Known account? │──No───►│ Create profile   │
                        │      └───────┬────────┘        │ (name, city,     │
                        │              │ Yes             │ consent screens) │
                        │              │                 └────────┬─────────┘
                        │      ┌───────▼────────┐                  │
                        │      │ Role check     │◄─────────────────┘
                        │      └┬──────┬──────┬─┘
                        │       │      │      │
                        │  Buyer│  Shop│  Rider│   (Admin uses
                        │       │      │      │    the web console
                        │       ▼      ▼      ▼    with SSO + 2FA)
                        │   Home   Shop     Rider
                        │          Console   Task list
                        ▼
                  Guest browse
                  (limited: no
                   checkout,
                   no wishlist)

Requirements for this flow:

AUTH-01: OTP sign-in works on weak networks. The app retries the SMS or WhatsApp OTP path after a timeout.
AUTH-02: Location permission is requested with an explanation. Guests can browse with an approximate location.
AUTH-03: Consent screens for location tracking, marketing messages, and data use are separate from the terms. Each can be changed later in settings.
AUTH-04: Shopkeepers register through a separate path that requires shop details, GST number if applicable, identity documents, and a scheduled sample visit before listing goes live.
AUTH-05: Riders register with identity documents, a selfie match, and a vehicle declaration. Accounts stay inactive until approved.
AUTH-06: Admin accounts use single sign-on with two-factor authentication and are created only by a super admin.
AUTH-07: A user with multiple roles (for example, a shop owner who also buys) switches roles from the profile menu without re-entering OTP.
6. Screen map by role
6.1 Buyer app
Buyer App
├── Welcome / Sign in
├── Home
│   ├── "Need it today" strip (live ETA)
│   ├── Occasion hubs (Party tonight, Farewell, Festive kurta, Engagement)
│   ├── Search (text and voice, local languages)
│   └── Nearby shops
├── Occasion hub page
│   └── Items ranked by availability, fit, and ETA
├── Search results
│   └── Filters: size, colour, price, shop distance, ETA, fit tags
├── Product detail
│   ├── Photos (real shop photos first)
│   ├── Shop card (name, photos, rating, distance)
│   ├── Stock badge ("3 left in your size, 2 km away", with timestamp)
│   ├── Size guide and fit tags
│   ├── Delivery promise (ETA window)
│   ├── Try-at-door toggle with terms summary
│   └── Add to bag / Save to wishlist
├── Shop profile
├── Bag (items grouped by shop; separate deliveries shown)
├── Checkout
│   ├── Address and delivery promise
│   ├── Payment (UPI, cards, wallets, COD where allowed)
│   ├── Trial terms (default outcome stated before payment)
│   └── Place order
├── Order confirmation
├── Order tracking
│   ├── Live map and rider ETA countdown
│   ├── Rider contact and OTP display
│   └── Support
├── Try window (for try-at-door orders)
│   ├── Item list with Keep / Return toggles
│   ├── Timer and default-outcome notice
│   ├── Request size swap
│   └── Confirm decisions
├── Returns
│   ├── Reason selection and photos
│   └── Schedule doorstep pickup
├── Orders (history, invoices, reorder)
├── Wishlist and alerts
├── Reviews (write after delivery)
├── Support (chat or call, linked to an order)
└── Profile
    ├── Addresses
    ├── Payment methods
    ├── Language and notifications
    ├── Privacy (location, marketing consent, data download, delete account)
    └── Switch role
6.2 Shopkeeper console
Shop Console
├── Shop signup and verification status
├── Dashboard
│   ├── New orders awaiting acceptance (with countdown)
│   ├── Low-stock and conflict alerts
│   └── Today's sales and earnings
├── Snap & List
│   ├── Camera capture → auto-filled fields
│   ├── Enter sizes and colours with quantities
│   ├── Save offline / publish
│   └── Draft queue
├── Inventory
│   ├── Items by SKU, size, colour
│   ├── Quantity, price, hide or show
│   └── "Sold in shop" (counter sale)
├── Orders
│   ├── Accept or decline (with reason)
│   ├── Pack and mark ready
│   └── Handover (rider OTP and scan)
├── Returns received
│   ├── Inspect, add photos
│   └── Accept or dispute
├── Payouts
│   ├── Settlement report (sales, returns, deductions, payout dates)
│   └── Download statement
├── Shop settings
│   ├── Service radius and hours
│   ├── Staff accounts
│   └── Bank and tax details
├── Reviews and buyer issues
└── Support (local language, phone)
6.3 Rider app
Rider App
├── Sign in and document status
├── Go online / offline
├── Task list (ordered, with directions)
│   ├── Pickup task
│   │   ├── Scan items
│   │   ├── Shop confirmation / OTP
│   │   └── Pickup photo
│   ├── Drop task
│   │   ├── Buyer OTP
│   │   ├── Handover photo
│   │   └── Trial timer (if try-at-door)
│   └── Return pickup task
│       ├── Scan returned items
│       └── Hand over at shop
├── Waiting timer and compensation claim
├── Earnings (per trip, bonuses, payout schedule)
├── Safety
│   ├── SOS
│   ├── Support line
│   └── Safe-zone guidance for late deliveries
└── Profile and documents
6.4 Admin console
Admin Console
├── Live dashboard
│   ├── Map of active orders and riders
│   ├── Late order alerts
│   └── Stock conflicts
├── Shops
│   ├── Onboarding queue (documents, sample visit)
│   ├── Approve / reject / suspend
│   └── Product authenticity flags
├── Orders
│   ├── Search and filter
│   ├── Event timeline (every state change with timestamp)
│   └── Reassign rider, cancel, or override
├── Disputes
│   ├── Case queue (with SLA timers)
│   ├── Evidence viewer (photos, GPS, timestamps, OTP logs)
│   └── Decide and trigger refund
├── Returns and refunds
├── Payouts and settlements
│   ├── Run, hold, and reconcile
│   └── Finance export
├── Riders
│   ├── Verification queue
│   ├── Ratings, incidents, penalties
│   └── Availability by zone
├── Buyers and risk
│   ├── Risk scores (address, history, order value)
│   ├── COD limits and blocks
│   └── Account actions
├── Campaigns and occasion hubs
├── Configuration (radius, fees, trial terms, COD rules) [super admin]
├── Staff and roles [super admin]
└── Audit log and reports
7. Functional requirements by role

Priority codes: M = must have for beta, S = second phase, L = later.

7.1 Buyers
ID	Requirement	Priority
BUY-01	Home shows occasion hubs first, then categories.	M
BUY-02	Search supports text and voice in the city’s main languages.	M
BUY-03	Product pages show real shop photos, shop name, rating, distance, and a stock badge with a timestamp.	M
BUY-04	Product pages show a delivery ETA window before the buyer adds an item to the bag.	M
BUY-05	Size guide and fit tags (for example, “runs small”) are visible on every product.	M
BUY-06	Try-at-door can be turned on per item. Its terms appear before the buyer confirms.	M
BUY-07	Bag groups items by shop and shows when items will arrive separately.	M
BUY-08	Checkout shows the trial’s default outcome and the difference between an authorization hold and a charge.	M
BUY-09	Live tracking shows the rider’s location, ETA countdown, and handover OTP.	M
BUY-10	During a trial, the buyer can mark items to keep or return, request a size swap, and see the remaining time.	M
BUY-11	Returns can be requested in-app with a reason and photos, and a doorstep pickup can be scheduled.	M
BUY-12	Wishlist and saved sizes. Alerts for back-in-stock and price drops.	S
BUY-13	Reviews and fit feedback after delivery.	S
BUY-14	Order support is available from any order screen in the local language.	M
BUY-15	Works on mid-range Android phones and 4G with minimal data use. Images are compressed, and the app caches the last known stock state.	M
BUY-16	Guest browsing without sign-in. Checkout requires sign-in.	M
BUY-17	Buyers can download their data and delete their account from settings.	M
7.2 Shopkeepers
ID	Requirement	Priority
SHOP-01	Snap & List: a garment is listed from a phone camera in under one minute, with fields pre-filled where possible.	M
SHOP-02	Listings can be saved offline and sync when a connection returns.	M
SHOP-03	Stock is tracked by SKU, size, and colour.	M
SHOP-04	“Sold in shop” reduces stock and removes the item from online sale immediately.	M
SHOP-05	Shops can hide items, change prices, and set their service radius and hours.	M
SHOP-06	New orders show a countdown. The shop accepts or declines with a reason. Unaccepted orders are released after the timeout.	M
SHOP-07	Handover uses the rider’s OTP and item scan, with a photo at pickup.	M
SHOP-08	A settlement report shows sales, returns, deductions, and payout dates.	M
SHOP-09	Returned items are inspected at the shop, with photos, before a return is accepted or disputed.	M
SHOP-10	Large buttons, local language, and minimal typing.	M
SHOP-11	Sales insights, restock suggestions, and demand alerts.	S
SHOP-12	Simple bookkeeping export for accountants.	S
SHOP-13	Multiple counters under one account (mall-outlet mode).	L
7.3 Riders
ID	Requirement	Priority
RIDE-01	Ordered task list showing pickup and drop, with navigation links.	M
RIDE-02	Pickup requires item scan and shop confirmation.	M
RIDE-03	Drop requires buyer OTP and a handover photo.	M
RIDE-04	Trial timer is visible on drop tasks, and the rider can confirm the buyer’s decisions.	M
RIDE-05	Waiting time is tracked, and compensation applies after the set threshold.	M
RIDE-06	Earnings per trip, bonus breakdown, and payout schedule.	M
RIDE-07	SOS, support line, and safe-zone guidance for late-night deliveries.	M
RIDE-08	Runs on basic Android phones with low battery use (location pings batched by trip state).	M
RIDE-09	Return pickups are a task type with scan and hand-over to the shop.	M
7.4 Admin and operations
ID	Requirement	Priority
ADM-01	Live map of active orders, rider availability, and late orders.	M
ADM-02	Shop verification queue: identity, GST where applicable, sample visit, and product checks.	M
ADM-03	Dispute cases show photos, timestamps, GPS, OTP logs, and the full event history.	M
ADM-04	Refunds, returns, and payouts require a reason and are recorded in an audit trail.	M
ADM-05	Stock conflict queue: online orders for items sold at the counter.	M
ADM-06	Rider verification and performance management.	M
ADM-07	Fraud risk scores and COD limits by account and address.	M
ADM-08	Configuration of radius, fees, trial terms, and COD rules, with change history.	M
ADM-09	Role-based permissions for all admin screens.	M
ADM-10	Occasion hub and campaign management.	S
8. Core flowcharts
8.1 Buyer journey: discovery to order
   Open app
       │
       ▼
   Home ──► Occasion hub ("Party tonight")
       │          │
       │          ▼
       │     Ranked items (stock, fit, ETA)
       │          │
       ▼          ▼
   Search ◄──── Filter: size, colour, price, distance
       │
       ▼
   Product detail
   ├── Stock badge: "3 left in your size, 2 km"
   ├── Fit tags and size guide
   ├── ETA window: "arrives in 45-60 min"
   └── Try-at-door? [toggle] → terms shown
       │
       ▼
   Add to bag ──► Stock reserved for 10 min
       │
       ▼
   Bag (grouped by shop)
       │
       ▼
   Checkout
   ├── Address check (is it inside shop radius?)
   ├── Payment method
   │     ├── Try-at-door: prepaid required
   │     └── Standard: UPI / card / wallet / COD (if eligible)
   ├── Trial terms and default outcome shown
   └── Confirm and pay
       │
       ├── Payment fails ──► Retry or change method (stock kept 10 min)
       │
       ▼
   Order placed ──► Shop has accept window
       │
       ├── Shop declines or times out ──► Refund + suggest alternatives
       │
       ▼
   Tracking (see 8.2 and 8.4)
8.2 Try-at-doorstep lifecycle

This is the most important flow in the product. Its states and payment rules must be implemented exactly.

  PLACED (payment held or charged, see payment rules below)
     │
     ▼
  SHOP_ACCEPTED ──► PACKED ──► RIDER_ASSIGNED ──► PICKED_UP
                                                     │
                                                     ▼
                                              IN_TRANSIT (live map)
                                                     │
                                                     ▼
                                              ARRIVED (buyer notified)
                                                     │
                                                     ▼
                                              BUYER OTP ENTERED
                                                     │
                                                     ▼
                                              TRIAL_ACTIVE (timer starts)
                                                     │
                       ┌─────────────────────────────┴──────────────────┐
                       │                                                │
            Buyer marks each item:                       Timer ends with unmarked items
            KEEP or RETURN, then confirms                (default: unmarked = RETURN)
                       │                                                │
                       └────────────────────┬───────────────────────────┘
                                            ▼
                                   DECISIONS_LOCKED
                                            │
                    ┌───────────────────────┼─────────────────────────┐
                    │                       │                         │
              Kept items              Returned items            Size swap requested
                    │                       │                         │
                    ▼                       ▼                         ▼
           Rider collects           Rider returns to bag       Rider leaves swap
           payment for kept         (returned items stay       item, takes old
           items only               with rider)                one back as return
                    │                       │                         │
                    ▼                       ▼                         ▼
             Capture / keep          Release hold or            New item authorized
             payment                 refund returned items      at door; old item
                    │                       │                   returned
                    └───────────────────────┼─────────────────────────┘
                                            ▼
                                       DELIVERED (closed)
                                            │
                                            ▼
                             Settlement: shop payout reflects kept items only

Payment rules by method:

Card with pre-authorization: the full amount is held at placement. At lock time, only kept items are captured. The hold on returned items is released.
UPI (if no hold is supported): the full amount is charged at placement. Returned items are refunded within the timeline stated at checkout, for example two to three working days after the shop receives them back.
Required copy at checkout: “You can try items at your door. Items you don’t keep go back with the rider, and you pay only for what you keep.” Show the authorization-or-charge difference beneath it, with the exact refund timing.

Timer rules:

TRIAL-01: The trial window at the door is 15 minutes by default. The rider can wait up to this limit. The buyer can request an extension, subject to the rider’s waiting policy.
TRIAL-02: If the buyer closes the app or doesn’t respond, the timer still runs, and the rider can confirm decisions with the buyer by phone.
TRIAL-03: Every decision, timestamp, and photo is logged. These records are the evidence in any dispute.
8.3 Shopkeeper: listing and stock sync
  Snap & List (camera)
      │
      ▼
  Auto-fill (category, colour, fabric from image, editable)
      │
      ▼
  Enter sizes and quantities ──► Save offline? ──Yes──► Draft queue
      │ No                                                  │
      ▼                                                     │
  Preview and publish ◄─────────── Connection returns ──────┘
      │
      ▼
  Live listing (stock by size)
      │
      ├──────────────────────────────────────────┐
      │                                          │
  Online order placed                     Counter sale
  (stock reserved 10 min,                 "Sold in shop" tapped
   shop must accept)                             │
      │                                          ▼
      │                                  Stock decremented
      │                                  Item removed from online
      │                                  sale instantly
      │                                          │
      │                                          ▼
      │                          Conflict? (online order already placed)
      │                             │                      │
      │                            No                     Yes
      │                             │                      │
      ▼                             ▼                      ▼
  Shop accepts ──► Packed     Stock updated       Admin conflict queue
                                                  → buyer offered
                                                    alternative or refund
8.4 Rider: delivery and handover
  Go online
      │
      ▼
  Assigned task (pickup first)
      │
      ▼
  Navigate to shop ──► Arrive ──► Scan items ──► Shop confirms
      │                                              │
      │                                    Pickup photo taken
      │                                              │
      ▼◄─────────────────────────────────────────────┘
  Navigate to buyer ──► Arrive
      │
      ├── Buyer not responding? ──► Call buyer ──► Waiting timer starts
      │                                        │
      │                              Past threshold? ──Yes──► Compensation claim
      │                                        │
      ▼◄───────────────────────────────────────┘
  Buyer OTP entered
      │
      ▼
  Handover photo taken ──► Trial timer (if try-at-door)
      │
      ▼
  Decisions confirmed ──► Returned items collected
      │
      ▼
  Trip closed ──► Earnings updated ──► Next task

  Safety overlay (always available):
  SOS ──► Admin alert with live location
  Late-night ──► Safe-zone guidance shown before drop
8.5 Returns and disputes
  Buyer raises return OR shop raises issue OR rider reports problem
      │
      ▼
  Reason and evidence submitted (photos, timestamps)
      │
      ▼
  Auto-check against event log
      │
      ├── Evidence matches standard policy ──► Auto-approve return
      │                                              │
      │                                              ▼
      │                                    Schedule doorstep pickup
      │                                              │
      │                                              ▼
      │                                    Shop receives and inspects
      │                                              │
      │                                    ┌─────────┴──────────┐
      │                                    │                    │
      │                              Accepted             Shop disputes
      │                                    │                    │
      │                                    ▼                    ▼
      │                              Refund issued         Admin reviews
      │                                                  with photos and log
      │                                                          │
      ├── Evidence unclear or high value ──────────────────────►│
      │                                                          ▼
      │                                                  Decision within 24 h
      │                                                  (SLA)
      │                                                          │
      │                                          ┌───────────────┼────────────┐
      │                                          │               │            │
      │                                    Buyer favoured   Shop favoured  Split
      │                                          │               │            │
      │                                          ▼               ▼            ▼
      │                                    Refund         Payout kept   Partial
      │                                    buyer          with shop     settlement
      │                                          │               │            │
      ▼◄─────────────────────────────────────────┴───────────────┴────────────┘
  Outcome notified to all parties; reason tagged for return analytics
8.6 Shop onboarding and verification (admin)
  Shop signs up
      │
      ▼
  Submit: owner ID, shop address, GST (if applicable), bank details, product categories
      │
      ▼
  Automated checks (ID format, GST validity, bank account name match)
      │
      ├── Fail ──► Request correction ──► back to submit
      │
      ▼
  Sample visit scheduled (photos of shop, stock room, staff)
      │
      ▼
  Verifier decision
      │
      ├── Reject ──► Reason sent to shop; can reapply after fix
      │
      ▼
  Approve ──► "Verified shop" badge enabled
      │
      ▼
  Shop can list items
      │
      ▼
  Ongoing: product authenticity flags, buyer ratings, return rate monitored
      │
      ▼
  Threshold breached? ──Yes──► Review ──► Warn / suspend / remove badge
8.7 Payouts and settlements
  Order DELIVERED or RETURN_RECEIVED
      │
      ▼
  Ledger entry: sale amount, commission, return deductions, disputes
      │
      ▼
  Settlement cycle closes (weekly by default)
      │
      ▼
  Finance review: holds for open disputes
      │
      ▼
  Payout released to shop bank account
      │
      ▼
  Settlement report visible in Shop Console
  (sales, returns, deductions, payout date)
9. End-to-end connected flow

This diagram shows how the four roles connect through one order.

  BUYER                    SHOP                       RIDER                     ADMIN
    │                        │                          │                         │
  Places order ──────────► Receives order               │                         │
    │                    Accepts (SLA timer)            │                         │
    │                        │                          │                         │
    │                    Packs items                    │                         │
    │                        │                          │                         │
    │                        ├────── Assigns ─────────► Rider accepts task         │
    │                        │                          │                         │
    │                    Hands over ◄──── Scan + photo ─┤                         │
    │                        │                          │                         │
  Tracks live ◄──────────────┼──────── GPS ────────────┤                         │
    │                        │                          │                         │
  Receives ◄─────────────────┼──── OTP + photo ────────┤                         │
    │                        │                          │                         │
  Trial (keep / return)      │                   Waits (timer)                    │
    │                        │                          │                         │
  Confirms decisions ────────┼───────────────────────► Collects returns          │
    │                        │                          │                         │
    │                    Receives returns ◄─────────────┤                         │
    │                    Inspects                       │                         │
    │                        │                          │                         │
    │                        │                          │                         │
  Dispute? ────────────────────────────────────────────────────────────────────► Reviews evidence
    │                        │                          │                         │
    │                        │                          │                         │
  Refund / payment ◄─────────┼──────────────────────────┼──────────────────────── Decides refund
    │                        │                          │                         │
    │                    Settlement ◄──────────────────────────────────────────── Payout run
10. Order states
State	Triggered by	Next states
PLACED	Buyer, after payment or hold	SHOP_ACCEPTED, SHOP_DECLINED, CANCELLED
SHOP_ACCEPTED	Shop	PACKED, CANCELLED_BY_SHOP
PACKED	Shop	RIDER_ASSIGNED
RIDER_ASSIGNED	System or admin	PICKED_UP, REASSIGNED
PICKED_UP	Rider, with scan and photo	IN_TRANSIT
IN_TRANSIT	System (GPS)	ARRIVED
ARRIVED	Rider	OTP_VERIFIED, FAILED_DELIVERY
TRIAL_ACTIVE	Buyer OTP entry (try-at-door only)	DECISIONS_LOCKED
DECISIONS_LOCKED	Buyer confirmation or timer	DELIVERED, RETURN_IN_PROGRESS
DELIVERED	Rider, with photo	RETURN_REQUESTED, SETTLED
RETURN_REQUESTED	Buyer or auto-approve	RETURN_PICKED, RETURN_REJECTED
RETURN_PICKED	Rider with scan	RETURN_RECEIVED
RETURN_RECEIVED	Shop inspection	REFUNDED, DISPUTED
DISPUTED	Shop or buyer	RESOLVED
SETTLED	Finance	Terminal

Every transition writes a timestamped event with the actor’s identity and, where relevant, GPS and photos.

11. Data model overview
User (buyer, shop staff, rider, admin): identity, role(s), consents, language, locations
Shop: verification status, service radius, hours, bank and tax details, rating
Product: shop, category, photos, fit tags, size guide, authenticity flag
Variant (stock unit): product, size, colour, quantity, reserved quantity, price
Cart and bag line: user, variant, quantity, try-at-door flag, reservation expiry
Order: buyer, address, shops involved, payment method, state, promised ETA window
Order line: variant, decision (keep, return, pending), price, swap reference
Delivery task: order, rider, type (pickup, drop, return pickup), state, timestamps
Event log: entity, action, actor, timestamp, GPS, photo references
Payment and ledger: captures, holds, refunds, commissions, deductions, payouts
Dispute: order, parties, evidence, SLA timer, decision, reason tags
Audit log: admin actions, configuration changes, role changes
12. Non-functional requirements

Performance and reliability:

NFR-01: Checkout and order status updates feel instant. Any wait shows progress.
NFR-02: Peak evenings and festival weekends get load testing at 3 to 5 times normal volume before launch.
NFR-03: Stock reservation and counter-sale updates propagate to buyer screens within a few seconds.
NFR-04: Offline mode on the shop app and rider app: saved actions sync when the connection returns, with clear pending indicators.

Accessibility and usability:

NFR-05: Text meets readable contrast and size standards. Tap targets are large.
NFR-06: Status is never shown by colour alone. Icons and text labels are used too.
NFR-07: Local language support for all screens, notifications, and OTP messages.

Privacy and security:

NFR-08: Explicit consent for live location, marketing, and data use. Each is revocable.
NFR-09: Retain only the personal data needed for orders, payments, disputes, and legal records. Set retention periods per data type.
NFR-10: Handover photos are visible only to the parties on that order and to admins during disputes.
NFR-11: Payment data is handled by the gateway (tokenized). The platform does not store card numbers.
NFR-12: Admin access is role-based, uses two-factor authentication, and is fully logged.
NFR-13: Compliance review for India’s data protection law and GST invoicing, with legal review before launch. This document is not legal advice.

Support:

NFR-14: Support is reachable from every order screen in the local language, with a human fallback.
13. Acceptance criteria for key features

Try-at-door terms:

Given a buyer has selected try-at-door, when they reach checkout, then the default outcome and refund timing are shown before the pay button is enabled.
Given the trial timer ends with an item unmarked, when the lock occurs, then that item is marked as a return and its hold is released or refund initiated.

Stock sync:

Given a shop marks an item as sold in shop, when a buyer is viewing that item, then the item shows out of stock within a few seconds.
Given an online order was placed before the counter sale, when the shop accepts, then the admin conflict queue receives the item and the buyer is notified.

Rider handover:

Given the buyer’s OTP is wrong three times, when the rider tries again, then a support path opens and the attempts are logged.
Given the rider has waited beyond the threshold, when they tap “claim compensation,” then the claim is created with the timer evidence attached.

Shop listing:

* Given a shopkeeper takes a photo with no connection, when they save the listing, then it appears in the draft queue and publishes automatically when the connection returns.

Disputes:

* Given a dispute is opened, when it reaches 24 hours without a decision, then the case is escalated to a senior admin.

14. Open items and next steps
Items to confirm with the business team before design freeze:

1. Approve or change the proposed defaults in Section 2, especially COD rules and the trial outcome wording.
2. Confirm which payment gateway and methods support authorization holds.
3. Set the commission rate, the trial window length (proposed 15 minutes), and the waiting compensation threshold.
4. Confirm the service-radius rules and how they are displayed to buyers.
5. Verify competitor features before finalizing the design, since the source document notes that feature sets change often.
6. Legal review of the trial terms, returns policy, data consent screens, and GST handling.

Suggested next steps:

* Build low-fidelity wireframes for the buyer checkout and try window first, since these carry the most risk.
* Run a shopkeeper usability test with the Snap & List flow on a basic Android phone.
* Define the admin SLA targets and staffing needed for the beta city.

If you’d like, I can turn this into a Word document or a Claude Doc for sharing with your team, or expand any single section into detailed acceptance tests or wireframe notes.