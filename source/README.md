# From pilot to portfolio: a savings model for building automation

An editable model of what building operators keep, and what a performance priced building automation vendor earns, for one site or an entire portfolio. It is built around one story: pilot, then verified value, then portfolio rollout.

Open `index.html` in a browser, or use the hosted page. It stores nothing and sends no data anywhere.

This is an independent prototype prepared by Tugce Simsek King as preparation for a conversation with Cosysense. It is not an official Cosysense tool, and it is not affiliated with or endorsed by Cosysense.

## What it does

- **Two scopes:** single site and portfolio.
- **Two views:** a customer view, and an internal view that adds a prospect priority score and fee revenue.
- **Three editable scenarios:** conservative, base, and high HVAC reduction.
- **Pilot to rollout:** shows pilot sites, modeled value per location, and the value of a full rollout, with a ramp.
- **Sensitivity analysis:** reduction, HVAC share, electricity price, and number of sites.
- **Scale ladder:** the same economics at 1, 10, 100, and 500 sites.
- **Examples:** quick service restaurant, hotel, fitness center, and big box retail. All values are illustrative placeholders.

## What it does not do

- It does not know Cosysense's pricing. The fee is blank by default and the user enters one.
- It does not guarantee savings.
- It does not include utility rates. The user enters the customer's own tariff.
- It does not model cost to serve, so the internal view shows revenue, not profit.

## Formulas

All formulas live in `source/src/lib/calc.ts` and `score.ts`. They have no dependency on the interface, so they can be ported to Python or an API.

Notation: E is annual electricity spend per site, D is annual demand charges, s is the HVAC share, r is the HVAC reduction, tau is the time of use value factor, G is annual gas cost, g is the gas reduction, d is the demand reduction, e is annual escalation, f is the fee share, F is a fixed fee per site, and K is one time implementation cost per site.

| Quantity | Formula |
|---|---|
| Annual electricity spend | monthly bill times 12, or the annual figure, or kWh times price |
| Demand charges | min(peak kW times rate times 12, E) |
| HVAC spend | (E minus D) times s |
| Gross energy savings | HVAC spend times r times tau |
| Gas savings | G times g |
| Demand savings | D times d |
| Gross savings, year 1 | energy plus gas plus demand savings |
| Fee, share of savings | gross times f |
| Fee, fixed | F per site per year |
| Net savings | gross minus fee |
| Gross in year y | gross in year 1 times (1 plus e) to the power (y minus 1). A fixed fee does not escalate. |
| Cumulative site value | sum of net savings over the years, minus K |
| Payback in months | K divided by annual net savings, times 12 |
| Sites rolled out, T | round(locations times rollout share) |
| Sites live in year y | P plus (T minus P) times min(1, y divided by R), where P is pilot sites and R is rollout years |
| Portfolio gross in year y | sites live times gross per site in year y |
| Implementation cost in year y | (sites live in y minus sites live in y minus 1) times K |
| Value of expansion | (T minus P) times annual net savings per site, at steady state |

Demand charges are removed from the base that HVAC energy savings apply to, and are modeled separately. This prevents counting the same dollars twice.

### Sensitivity

One at a time. Each driver moves to a low and a high value while the others stay put, and the output is five year net customer value for the chosen scope.

- HVAC reduction: the conservative and high scenario values.
- HVAC share: plus or minus 10 percentage points.
- Electricity price: plus or minus 20 percent, applied to every price input.
- Number of sites: plus or minus 50 percent.

### Internal opportunity score

Six factors, each scored in a straight line from 0 up to its "full score at" value, then multiplied by its weight. Weights are rescaled to total 100.

| Factor | Starting weight | Starting full score at |
|---|---|---|
| Number of sites in the account | 20 | 500 sites |
| Annual electricity spend, all sites | 15 | $5,000,000 |
| Estimated annual HVAC spend, rollout sites | 15 | $1,500,000 |
| Expansion potential (rollout sites per pilot site) | 15 | 50 times |
| Operating hours per year | 10 | 6,000 hours |
| Expected annual net savings at full rollout | 25 | $1,000,000 |

Categories: below 30 is LOW PRIORITY, 30 and up is PROMISING, 55 and up is HIGH VALUE, 75 and up is STRATEGIC ACCOUNT.

All of these weights, full score values, and cut offs are placeholders for discussion. They have not been validated against real accounts, and every one is editable in the internal view. This is an internal prioritization model, not a customer facing metric.

## Every assumption and its source

| Assumption | Starting value | Type | Source |
|---|---|---|---|
| Conservative, base, and high HVAC reduction | 20%, 30%, 38% | Modeling assumption | Chosen for modeling. The high case equals the top of the company reported range. All three are editable. |
| Reference range for HVAC savings | 27% to 38% | Company reported reference | Cosysense website. Self reported. The method and sample are not public. Not a guarantee. |
| Selected scenario at load | Conservative | Modeling assumption | Chosen so the first view is cautious. |
| Cosysense fee or share of savings | Not set | Left blank | No public figure. The user enters one, or leaves it blank and sees gross savings only. |
| Implementation cost per site | $0 | Modeling assumption | Cosysense states no upfront cost for customers. This is not a confirmed contractual term. Editable. |
| Annual electricity spend per site | $60,000 (QSR example) | Illustrative placeholder | Placeholder for the example. Replace with the customer bill. |
| HVAC share of electricity | 35% to 40% | Illustrative placeholder | Placeholder. Real shares vary by building. Use sub metering or an audit where available. |
| Square feet, hours, days per year | Per example | Illustrative placeholder | Placeholders for each example facility. Used for context and for the internal score. |
| Locations, pilot sites, rollout share, rollout years | 250, 5, 100%, 2 years | Illustrative placeholder | Example scale only. Not a Cosysense pipeline. |
| Gas or heating reduction | 0% | Modeling assumption | No public figure for gas savings, so none is assumed. |
| Peak demand reduction | 0% | Modeling assumption | No public figure, so none is assumed. Demand charges stay out of HVAC energy savings. |
| Time of use value factor | 1.00 | Modeling assumption | Neutral. Raise it if savings concentrate in expensive hours. |
| Annual electricity cost escalation | 0% | Modeling assumption | Neutral. No forecast is assumed. |
| Electricity price, demand rate, peak kW | Blank | Left blank | No utility rates are hard coded. Enter the customer tariff. |
| Internal score weights, full score values, category cut offs | See above | Modeling assumption | Placeholders for discussion. Not validated against real accounts. Editable. |

## Illustrative examples

These are placeholders for discussion. They are not Cosysense customer data.

| Example | Square feet | Hours per day | Days per year | Annual electricity | HVAC share | Locations | Pilot sites |
|---|---|---|---|---|---|---|---|
| Quick service restaurant | 2,500 | 18 | 365 | $60,000 | 35% | 250 | 5 |
| Hotel | 60,000 | 24 | 365 | $450,000 | 35% | 40 | 3 |
| Fitness center | 20,000 | 18 | 360 | $140,000 | 40% | 60 | 4 |
| Big box retail | 120,000 | 14 | 360 | $600,000 | 35% | 100 | 5 |

## Run it locally

```
cd source
npm install
npm run dev       # development server
npm test          # unit tests for the calculation logic
npm run build     # type check, then build a single file in dist/index.html
```

The hosted `index.html` at the repository root is the single file build.

## Technology

React and TypeScript, built with Vite into one static file so it can be hosted anywhere. The calculation logic is in plain TypeScript functions with no interface dependency, and it has 42 unit tests.

## Disclaimer

This calculator provides modeled estimates based on user-provided assumptions and is intended for preliminary financial analysis. Actual savings depend on building conditions, equipment, operating patterns, energy tariffs, weather, occupancy, and deployment configuration.

No savings are guaranteed.

Prepared by Tugce Simsek King.
