export interface AssumptionRow {
  name: string;
  value: string;
  kind: 'User input' | 'Modeling assumption' | 'Illustrative placeholder' | 'Company reported reference' | 'Left blank';
  source: string;
}

/** Every assumption in the model and where it comes from. Mirrored in the README. */
export const assumptionRows: AssumptionRow[] = [
  { name: 'Conservative, base, and high HVAC reduction', value: '20%, 30%, 38%', kind: 'Modeling assumption', source: 'Chosen for modeling. The high case equals the top of the company reported range. All three are editable.' },
  { name: 'Reference range for HVAC savings', value: '27% to 38%', kind: 'Company reported reference', source: 'Cosysense website. Self reported. The method and sample are not public. Not a guarantee.' },
  { name: 'Selected scenario at load', value: 'Conservative', kind: 'Modeling assumption', source: 'Chosen so the first view is cautious.' },
  { name: 'Cosysense fee or share of savings', value: 'Not set', kind: 'Left blank', source: 'No public figure. The user enters one, or leaves it blank and sees gross savings only.' },
  { name: 'Implementation cost per site', value: '$0', kind: 'Modeling assumption', source: 'Cosysense states no upfront cost for customers. This is not a confirmed contractual term. Editable.' },
  { name: 'Annual electricity spend per site', value: '$60,000 (QSR example)', kind: 'Illustrative placeholder', source: 'Placeholder for the example. Replace with the customer bill.' },
  { name: 'HVAC share of electricity', value: '35% to 40%', kind: 'Illustrative placeholder', source: 'Placeholder. Real shares vary by building. Use sub metering or an audit where available.' },
  { name: 'Square feet, hours, days per year', value: 'Per example', kind: 'Illustrative placeholder', source: 'Placeholders for each example facility. Used for context and for the internal score.' },
  { name: 'Locations, pilot sites, rollout share, rollout years', value: '250, 5, 100%, 2 years', kind: 'Illustrative placeholder', source: 'Example scale only. Not a Cosysense pipeline.' },
  { name: 'Gas or heating reduction', value: '0%', kind: 'Modeling assumption', source: 'No public figure for gas savings, so none is assumed.' },
  { name: 'Peak demand reduction', value: '0%', kind: 'Modeling assumption', source: 'No public figure, so none is assumed. Demand charges stay out of HVAC energy savings.' },
  { name: 'Time of use value factor', value: '1.00', kind: 'Modeling assumption', source: 'Neutral. Raise it if savings concentrate in expensive hours.' },
  { name: 'Annual electricity cost escalation', value: '0%', kind: 'Modeling assumption', source: 'Neutral. No forecast is assumed.' },
  { name: 'Electricity price, demand rate, peak kW', value: 'Blank', kind: 'Left blank', source: 'No utility rates are hard coded. Enter the customer tariff.' },
  { name: 'Internal score weights, full score values, category cut offs', value: 'See internal view', kind: 'Modeling assumption', source: 'Placeholders for discussion. Not validated against real accounts. Editable.' },
];
