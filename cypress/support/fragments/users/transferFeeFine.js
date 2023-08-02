import { Button, Modal, TextField, Select, Pane, MultiSelect } from '../../../../interactors';

const rootModal = Modal({ id: 'transfer-modal' });
const amountTextfield = rootModal.find(TextField({ id: 'amount' }));
const ownerSelect = rootModal.find(Select({ id: 'ownerId' }));
const transferAccountSelect = rootModal.find(Select({ name: 'method' }));
const transferButton = rootModal.find(Button({ id: 'submit-button' }));
const confirmModal = Modal('Confirm fee/fine transfer');
const confirmButton = confirmModal.find(Button('Confirm'));
const transferPane = Pane('Transfer criteria');

export default {
  waitLoading: () => {
    cy.expect(rootModal.exists());
  },

  waitLoadingTransferCriteria() {
    cy.expect(transferPane.exists());
  },

  selectTransferCriteriaSchedulePeriod(period = 'Days') {
    cy.do(Select({ name: 'schedulePeriod' }).choose(period));
  },

  setTransferCriteriaScheduling(frequency = 'Never (run manually)', interval, time, weekDays) {
    cy.do(Select({ name: 'scheduling.frequency' }).choose(frequency));

    if (frequency !== 'Never (run manually)') {
      cy.do([
        Select({ name: 'scheduling.interval' }).choose(interval),
        TextField({ name: 'scheduling.time' }).fillIn(time)
      ]);
    }

    if (frequency === 'Weekly') {
      if (weekDays === undefined) {
        cy.do(MultiSelect({ name: 'scheduling.weekDay' }).choose('Monday'));
      } else {
        weekDays.map((day) => cy.do(MultiSelect({ name: 'scheduling.weekDay' }).choose(day)));
      }
    }
  },

  typeScheduleTime(time) {
    // time: string like 9:15 AM
    cy.do([
      TextField({ name: 'scheduleTime' }).fillIn(time),
      Button({ icon: 'clock' }).click(),
      Button('Set time').click()
    ]);
  },

  verifyScheduleTime(time) {
    cy.expect(TextField({ name: 'scheduleTime', value: time }).exists());
  },

  setAmount: (amount) => cy.do(amountTextfield.fillIn(amount.toFixed(2))),
  setOwner: (owner) => cy.do(ownerSelect.choose(owner)),
  setTransferAccount: (account) => cy.do(transferAccountSelect.choose(account)),
  transferAndConfirm: () => {
    cy.do([
      transferButton.click(),
      confirmButton.click(),
    ]);
  },

  transferFeeFineViaApi:(apiBody, feeFineId) => cy.okapiRequest({
    method: 'POST',
    path: `accounts/${feeFineId}/transfer`,
    body: apiBody,
    isDefaultSearchParamsRequired: false
  }),
};
