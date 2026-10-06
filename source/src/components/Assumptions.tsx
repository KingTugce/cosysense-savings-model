import { assumptionRows } from '../lib/assumptions';

export function Assumptions() {
  return (
    <section className="block" aria-label="Assumptions and sources">
      <h2>Every assumption and its source</h2>
      <p className="sub">Example values are illustrative placeholders. They are not Cosysense customer data and not Cosysense prices.</p>
      <div className="table-scroll">
        <table className="atable">
          <thead>
            <tr><th scope="col">Assumption</th><th scope="col">Starting value</th><th scope="col">Type</th><th scope="col">Source</th></tr>
          </thead>
          <tbody>
            {assumptionRows.map((r) => (
              <tr key={r.name}>
                <th scope="row">{r.name}</th>
                <td>{r.value}</td>
                <td>{r.kind}</td>
                <td className="wrap">{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
