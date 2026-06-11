import "../index";
import "@ssq/ui-tokens/styles.css";

import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = `
    <section class="theme theme--light" data-ssq-theme="light" aria-labelledby="light-heading">
      <h1 id="light-heading">Light theme</h1>
      <ssq-alert tone="info">Your application has been saved.</ssq-alert>
      <ssq-button id="primary-action" variant="primary">Continue</ssq-button>
      <ssq-text-input
        hint="Use the name on your official document."
        id="full-name"
        label="Full name"
        name="fullName"
        required
      ></ssq-text-input>
      <ssq-select
        hint="Choose one option."
        id="card-type"
        label="Card type"
        options='[{"label":"Seniors Card","value":"seniors"},{"label":"Seniors Business Discount Card","value":"business"}]'
        required
      ></ssq-select>
      <ssq-checkbox id="terms" label="I confirm the information is correct" required></ssq-checkbox>
      <ssq-radio-group
        id="contact-method"
        label="Preferred contact"
        options='[{"label":"Email","value":"email"},{"label":"Phone","value":"phone"}]'
        required
      ></ssq-radio-group>
    </section>

    <section class="theme theme--dark" data-ssq-theme="dark" aria-labelledby="dark-heading">
      <h2 id="dark-heading">Dark theme</h2>
      <ssq-alert tone="success">Identity details verified.</ssq-alert>
      <ssq-button id="secondary-action" variant="secondary">Back</ssq-button>
    </section>
  `;
}
