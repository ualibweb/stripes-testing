import {
  Button,
  Modal,
  TextField,
  Select,
  Pane,
  MultiSelect,
  Checkbox
} from '../../../../interactors';

const rootModal = Modal({ id: 'transfer-modal' });
const amountTextfield = rootModal.find(TextField({ id: 'amount' }));
const ownerSelect = rootModal.find(Select({ id: 'ownerId' }));
const transferAccountSelect = rootModal.find(Select({ name: 'method' }));
const transferButton = rootModal.find(Button({ id: 'submit-button' }));
const confirmModal = Modal('Confirm fee/fine transfer');
const confirmButton = confirmModal.find(Button('Confirm'));
const transferPane = Pane('Transfer configuration');

export default {
  waitLoading: () => {
    cy.expect(rootModal.exists());
  },

  waitLoadingTransferCriteria() {
    cy.expect(transferPane.exists());
  },

  setTransferCriteriaScheduling(frequency, interval, time, weekDays) {
    cy.do(Select({ name: 'scheduling.frequency' }).choose(frequency));

    if (frequency === 'Weeks') {
      cy.do(TextField({ name: 'scheduling.time' }).fillIn(time));
      cy.do(TextField({ name: 'scheduling.interval' }).fillIn(interval));

      // clear all the options
      cy.get('li[id$=_multiselect_selected]').each(($li) => {
        cy.wrap($li).find('button').click();
      });

      cy.do(MultiSelect({ label: 'Run on weekdays*' }).select(weekDays));
    } else if (frequency === 'Days') {
      cy.do(Select({ name: 'scheduling.interval' }).choose(interval));
    } else if (frequency === 'Hours') {
      cy.do(TextField({ name: 'scheduling.interval' }).fillIn(interval));
    } else ;
  },

  setAggregateByPatron(aggregate) {
    if (!aggregate) {
      cy.get('input[name="aggregate"]').uncheck({ force: true });
    }
    // Currently don't have any test cases for aggregate by patron
  },

  runManually() {
    cy.do([Button({ text: 'Run manually' }).click()]);
  },

  typeScheduleTime(time) {
    // time: string like 9:15 AM
    cy.do([
      TextField({ name: 'scheduleTime' }).fillIn(time),
      Button({ icon: 'clock' }).click(),
      Button('Set time').click(),
    ]);
  },

  verifyScheduleTime(time) {
    cy.expect(TextField({ name: 'scheduleTime', value: time }).exists());
  },

  setCriteria(criteria) {
    if (!criteria) {
      cy.do(
        Select({ name: 'criteria.type' }).choose('No criteria (always run)')
      );
    }
    // Currently don't have any test cases for criteria
  },

  setTransferAccount(feeFineOwner, transferAccount) {
    cy.do([
      Select({ name: 'transferInfo.else.owner' }).choose(feeFineOwner),
      Select({ name: 'transferInfo.else.account' }).choose(transferAccount),
    ]);
  },

  setLengthControl(item, length, character, truncate, direction) {
    cy.get(`select[name="${item}.type"]`).parents('div.header---ynqPZ').find('button[icon="gear"]').click();
    cy.expect(TextField({ name: `${item}.lengthControl.length` }).exists());
    cy.do(TextField({ name: `${item}.lengthControl.length` }).fillIn(length));
    cy.do(TextField({ name: `${item}.lengthControl.character` }).fillIn(character));
    if (truncate) {
      cy.do(Checkbox({ name: `${item}.lengthControl.truncate` }).click());
    }
    cy.do(Select({ name: `${item}.lengthControl.direction` }).choose(direction));
  },

  openAllPanes() {
    if (!Button({ text: 'Collapse all' }).exists()) {
      cy.do([Button({ text: 'Expand all' }).click()]);
    }
  },

  clearFormat(format) {
    let sectionName = '';
    if (format === 'header') {
      sectionName = 'section[id="accordion_10"]';
    } else if (format === 'data') {
      sectionName = 'section[id="accordion_11"]';
    } else {
      sectionName = 'section[id="accordion_12"]';
    }

    // if section is empty, skip
    cy.get(sectionName).then(($section) => {
      if ($section.find('button[icon="trash"]').length !== 0) {
        cy.get(sectionName).within(() => {
          cy.get('button[icon="trash"]').then(($btn) => {
            for (let i = 0; i < $btn.length; i++) {
              cy.get('button[icon="trash"]').eq(0).click();
            }
          });
        });
      }
    });
  },

  verifyClearFormat(format) {
    let sectionName = '';
    if (format === 'header') {
      sectionName = 'section[id="accordion_10"]';
    } else if (format === 'data') {
      sectionName = 'section[id="accordion_11"]';
    } else {
      sectionName = 'section[id="accordion_12"]';
    }

    cy.get(sectionName).then(($section) => {
      cy.expect($section.find('button[icon="trash"]').length).to.equal(0);
    });
  },

  verifyOpenAllPanes() {
    cy.expect(Button({ text: 'Collapse all' }).exists());
  },


  verifyTransferCriteriaScheduling(frequency, interval, time, weekDays) {
    // should equal
    cy.expect(
      Select({ name: 'scheduling.frequency', value: frequency }).exists()
    );

    if (frequency === 'WEEK') {
      cy.expect(TextField({ name: 'scheduling.time', value: time }).exists());
      cy.expect(TextField({ name: 'scheduling.interval', value: interval }).exists());
      cy.expect(MultiSelect({ label: 'Run on weekdays*', selected: weekDays }).exists());
    } else if (frequency === 'DAY') {
      cy.expect(
        Select({ name: 'scheduling.interval', value: interval }).exists()
      );
    } else if (frequency === 'HOUR') {
      cy.expect(TextField({ name: 'scheduling.interval', value: interval }).exists());
    } else;
  },

  verifyCriteria(criteria) {
    if (!criteria) {
      cy.expect(Select({ name: 'criteria.type', value: 'Pass' }).exists());
    }
  },

  verifyTransferAccount(feeFineOwner, transferAccount) {
    cy.expect(
      Select({ name: 'transferInfo.else.owner', value: feeFineOwner }).exists()
    );
    cy.expect(
      Select({
        name: 'transferInfo.else.account',
        value: transferAccount,
      }).exists()
    );
  },

  verifyRunManually() {
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Job has been scheduled');
    });
  },

  verifyAggregateByPatron(aggregate) {
    if (!aggregate) {
      cy.get('input[name="aggregate"]').should('not.be.checked');
    }
  },

  verifyLengthControl(item, length, character, truncate, direction) {
    cy.expect(TextField({ name: `${item}.lengthControl.length`, value: length }).exists());
    cy.expect(TextField({ name: `${item}.lengthControl.character`, value: character }).exists());
    cy.expect(Checkbox({ name: `${item}.lengthControl.truncate`, checked: truncate }).exists());
    cy.expect(Select({ name: `${item}.lengthControl.direction`, value: direction }).exists());
  },

  // Cornell format Helper functions

  addCornellHeaderFormat() {
    cy.get('section[id="accordion_10"]').within(() => {
      const numItems = 2;
      for (let i = 0; i < numItems; i++) {
        cy.get('button:contains("Add")').click();
      }

      cy.do(Select({ name: 'header[0].type' }).choose('Text'));
      cy.do(TextField({ name: 'header[0].text' }).fillIn('LIB02'));

      cy.do(Select({ name: 'header[1].type' }).choose('Newline (LF)'));
    });
  },

  addCornellDataFormat() {
    cy.get('section[id="accordion_11"]').within(() => {
      const numItems = 8;
      for (let i = 0; i < numItems; i++) {
        cy.get('button:contains("Add")').click();
      }
    });

    cy.do(Select({ name: 'data[0].type' }).choose('User info'));
    cy.do(Select({ name: 'data[0].userAttribute' }).choose('First name'));
    cy.do(TextField({ name: 'data[0].placeholder' }).fillIn('No name'));

    cy.do(Select({ name: 'data[1].type' }).choose('Tab'));

    cy.do(Select({ name: 'data[2].type' }).choose('Account amount'));
    cy.get('input[name="data[2].decimal"]').check();

    cy.do(Select({ name: 'data[3].type' }).choose('Tab'));

    cy.do(Select({ name: 'data[4].type' }).choose('Account date'));
    cy.do(Select({ name: 'data[4].dateProperty' }).choose('Creation date'));
    cy.do(Select({ name: 'data[4].format' }).choose('Year (4-digit)'));
    cy.get('select[name="data[4].timezone"]').find('option[value="America/New_York"]').eq(1).then($option => {
      const $select = $option.prevObject.prevObject;
      cy.wrap($select).select($option.index());
    });

    cy.do(TextField({ name: 'data[4].placeholder' }).fillIn(''));

    cy.do(Select({ name: 'data[5].type' }).choose('Newline (LF)'));

    cy.do(Select({ name: 'data[6].type' }).choose('Fee/fine type'));
    cy.do(Select({ name: 'data[6].feeFineAttribute' }).choose('Type ID'));

    cy.do(Select({ name: 'data[7].type' }).choose('Newline (LF)'));
  },

  verifyAddCornellHeaderFormat() {
    cy.get('section[id="accordion_10"]').within(() => {
      cy.expect(Select({ name: 'header[0].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'header[0].text', value: 'LIB02' }).exists());

      cy.expect(Select({ name: 'header[1].type', value: 'Newline' }).exists());
    });
  },

  verifyAddCornellDataFormat() {
    cy.get('section[id="accordion_11"]').within(() => {
      cy.expect(Select({ name: 'data[0].type', value: 'UserData' }).exists());
      cy.expect(Select({ name: 'data[0].userAttribute', value: 'FIRST_NAME' }).exists());
      cy.expect(TextField({ name: 'data[0].placeholder', value: 'No name' }).exists());

      cy.expect(Select({ name: 'data[1].type', value: 'Tab' }).exists());

      cy.expect(Select({ name: 'data[2].type', value: 'FeeAmount' }).exists());
      cy.get('input[name="data[2].decimal"]').should('be.checked');

      cy.expect(Select({ name: 'data[3].type', value: 'Tab' }).exists());

      cy.expect(Select({ name: 'data[4].type', value: 'FeeDate' }).exists());
      cy.expect(Select({ name: 'data[4].dateProperty', value: 'CREATED' }).exists());
      cy.expect(Select({ name: 'data[4].format', value: 'YEAR_LONG' }).exists());
      cy.expect(Select({ name: 'data[4].timezone', value: 'America/New_York' }).exists());
      cy.expect(TextField({ name: 'data[4].placeholder', value: '' }).exists());

      cy.expect(Select({ name: 'data[5].type', value: 'Newline' }).exists());

      cy.expect(Select({ name: 'data[6].type', value: 'FeeFineMetadata' }).exists());
      cy.expect(Select({ name: 'data[6].feeFineAttribute', value: 'FEE_FINE_TYPE_ID' }).exists());

      cy.expect(Select({ name: 'data[7].type', value: 'Newline' }).exists());
    });
  },

  // Duke format Helper functions

  addDukeHeaderFormat() {
    cy.get('section[id="accordion_10"]').within(() => {
      const numItems = 11;
      for (let i = 0; i < numItems; i++) {
        cy.get('button:contains("Add")').click();
      }

      cy.do(Select({ name: 'header[0].type' }).choose('Text'));
      cy.do(TextField({ name: 'header[0].text' }).fillIn('Batch'));

      cy.do(Select({ name: 'header[1].type' }).choose('Whitespace'));
      // fill text in the input named header[1].repeat
      cy.do(TextField({ name: 'header[1].repeat' }).fillIn('1'));

      cy.do(Select({ name: 'header[2].type' }).choose('Current date'));
      cy.do(Select({ name: 'header[2].format' }).choose('YYYYMMDD'));
      cy.get('select[name="header[2].timezone"]').find('option[value="America/New_York"]').eq(1).then($option => {
        const $select = $option.prevObject.prevObject;
        cy.wrap($select).select($option.index());
      });

      cy.do(Select({ name: 'header[3].type' }).choose('Whitespace'));
      cy.do(TextField({ name: 'header[3].repeat' }).fillIn('1'));

      cy.do(Select({ name: 'header[4].type' }).choose('Text'));
      cy.do(TextField({ name: 'header[4].text' }).fillIn('DU LIBRARY'));

      cy.do(Select({ name: 'header[5].type' }).choose('Whitespace'));
      cy.do(TextField({ name: 'header[5].repeat' }).fillIn('1'));


      cy.do(Select({ name: 'header[6].type' }).choose('Current date'));
      cy.do(Select({ name: 'header[6].format' }).choose('Quarter'));
      cy.get('select[name="header[6].timezone"]').find('option[value="America/New_York"]').eq(1).then($option => {
        const $select = $option.prevObject.prevObject;
        cy.wrap($select).select($option.index());
      });

      cy.do(Select({ name: 'header[7].type' }).choose('Total amount'));
      cy.get('input[name="header[7].decimal"]').check();

      cy.do(Select({ name: 'header[8].type' }).choose('Text'));
      cy.do(TextField({ name: 'header[8].text' }).fillIn('TXT_CNT'));

      cy.do(Select({ name: 'header[9].type' }).choose('Text'));
      cy.do(TextField({ name: 'header[9].text' }).fillIn('DU LIBRARIES DEBITS'));

      cy.do(Select({ name: 'header[10].type' }).choose('Newline (LF)'));
    });
  },

  addDukeDataFormat() {
    cy.get('section[id="accordion_11"]').within(() => {
      const numItems = 14;
      for (let i = 0; i < numItems; i++) {
        cy.get('button:contains("Add")').click();
      }
    });

    cy.do(Select({ name: 'data[0].type' }).choose('User info'));
    cy.do(Select({ name: 'data[0].userAttribute' }).choose('External ID'));

    cy.do(Select({ name: 'data[1].type' }).choose('Tab'));

    cy.do(Select({ name: 'data[2].type' }).choose('User info'));
    cy.do(Select({ name: 'data[2].userAttribute' }).choose('Username'));
    this.setLengthControl('data[2]', '30', ' ', true, 'End');

    cy.do(Select({ name: 'data[3].type' }).choose('Tab'));

    cy.do(Select({ name: 'data[4].type' }).choose('Account date'));
    cy.do(Select({ name: 'data[4].dateProperty' }).choose('Item due date'));
    cy.do(Select({ name: 'data[4].format' }).choose('YYYYMMDD'));
    cy.get('select[name="data[4].timezone"]').find('option[value="America/New_York"]').eq(1).then($option => {
      const $select = $option.prevObject.prevObject;
      cy.wrap($select).select($option.index());
    });

    cy.do(Select({ name: 'data[5].type' }).choose('Tab'));

    cy.do(Select({ name: 'data[6].type' }).choose('Current date'));
    cy.do(Select({ name: 'data[6].format' }).choose('Quarter'));
    cy.get('select[name="data[6].timezone"]').find('option[value="America/New_York"]').eq(1).then($option => {
      const $select = $option.prevObject.prevObject;
      cy.wrap($select).select($option.index());
    });

    cy.do(Select({ name: 'data[7].type' }).choose('Tab'));

    cy.do(Select({ name: 'data[8].type' }).choose('Fee/fine type'));
    cy.do(Select({ name: 'data[8].feeFineAttribute' }).choose('Type name'));
    this.setLengthControl('data[8]', '12', ' ', true, 'End');

    cy.do(Select({ name: 'data[9].type' }).choose('Tab'));

    cy.do(Select({ name: 'data[10].type' }).choose('Account amount'));
    cy.get('input[name="data[10].decimal"]').check({ force: true });

    cy.do(Select({ name: 'data[11].type' }).choose('Tab'));

    cy.do(Select({ name: 'data[12].type' }).choose('Fee/fine type'));
    cy.do(Select({ name: 'data[12].feeFineAttribute' }).choose('Type ID'));

    cy.do(Select({ name: 'data[13].type' }).choose('Newline (LF)'));
  },

  verifyAddDukeHeaderFormat() {
    cy.get('section[id="accordion_10"]').within(() => {
      cy.expect(Select({ name: 'header[0].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'header[0].text', value: 'Batch' }).exists());

      cy.expect(Select({ name: 'header[1].type', value: 'Space' }).exists());
      cy.expect(TextField({ name: 'header[1].repeat', value: '1' }).exists());

      cy.expect(Select({ name: 'header[2].type', value: 'CurrentDate' }).exists());
      cy.expect(Select({ name: 'header[2].format', value: 'YYYYMMDD' }).exists());
      cy.expect(Select({ name: 'header[2].timezone', value: 'America/New_York' }).exists());

      cy.expect(Select({ name: 'header[3].type', value: 'Space' }).exists());
      cy.expect(TextField({ name: 'header[3].repeat', value: '1' }).exists());

      cy.expect(Select({ name: 'header[4].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'header[4].text', value: 'DU LIBRARY' }).exists());

      cy.expect(Select({ name: 'header[5].type', value: 'Space' }).exists());
      cy.expect(TextField({ name: 'header[5].repeat', value: '1' }).exists());

      cy.expect(Select({ name: 'header[6].type', value: 'CurrentDate' }).exists());
      cy.expect(Select({ name: 'header[6].format', value: 'QUARTER' }).exists());
      cy.expect(Select({ name: 'header[6].timezone', value: 'America/New_York' }).exists());

      cy.expect(Select({ name: 'header[7].type', value: 'AggregateTotal' }).exists());
      cy.get('input[name="header[7].decimal"]').should('be.checked');

      cy.expect(Select({ name: 'header[8].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'header[8].text', value: 'TXT_CNT' }).exists());

      cy.expect(Select({ name: 'header[9].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'header[9].text', value: 'DU LIBRARIES DEBITS' }).exists());

      cy.expect(Select({ name: 'header[10].type', value: 'Newline' }).exists());
    });
  },

  verifyAddDukeDataFormat() {
    cy.get('section[id="accordion_11"]').within(() => {
      cy.expect(Select({ name: 'data[0].type', value: 'UserData' }).exists());
      cy.expect(Select({ name: 'data[0].userAttribute', value: 'EXTERNAL_SYSTEM_ID' }).exists());

      cy.expect(Select({ name: 'data[1].type', value: 'Tab' }).exists());

      cy.expect(Select({ name: 'data[2].type', value: 'UserData' }).exists());
      cy.expect(Select({ name: 'data[2].userAttribute', value: 'USERNAME' }).exists());
      this.verifyLengthControl('data[2]', '30', ' ', true, 'BACK');

      cy.expect(Select({ name: 'data[3].type', value: 'Tab' }).exists());

      cy.expect(Select({ name: 'data[4].type', value: 'FeeDate' }).exists());
      cy.expect(Select({ name: 'data[4].dateProperty', value: 'DUE' }).exists());
      cy.expect(Select({ name: 'data[4].format', value: 'YYYYMMDD' }).exists());
      cy.expect(Select({ name: 'data[4].timezone', value: 'America/New_York' }).exists());

      cy.expect(Select({ name: 'data[5].type', value: 'Tab' }).exists());

      cy.expect(Select({ name: 'data[6].type', value: 'CurrentDate' }).exists());
      cy.expect(Select({ name: 'data[6].format', value: 'QUARTER' }).exists());
      cy.expect(Select({ name: 'data[6].timezone', value: 'America/New_York' }).exists());

      cy.expect(Select({ name: 'data[7].type', value: 'Tab' }).exists());

      cy.expect(Select({ name: 'data[8].type', value: 'FeeFineMetadata' }).exists());
      cy.expect(Select({ name: 'data[8].feeFineAttribute', value: 'FEE_FINE_TYPE_NAME' }).exists());
      this.verifyLengthControl('data[8]', '12', ' ', true, 'BACK');

      cy.expect(Select({ name: 'data[9].type', value: 'Tab' }).exists());

      cy.expect(Select({ name: 'data[10].type', value: 'FeeAmount' }).exists());
      cy.get('input[name="data[10].decimal"]').should('be.checked');

      cy.expect(Select({ name: 'data[11].type', value: 'Tab' }).exists());

      cy.expect(Select({ name: 'data[12].type', value: 'FeeFineMetadata' }).exists());
      cy.expect(Select({ name: 'data[12].feeFineAttribute', value: 'FEE_FINE_TYPE_ID' }).exists());

      cy.expect(Select({ name: 'data[13].type', value: 'Newline' }).exists());
    });
  },

  // Alabama format Helper functions

  addAlabamaHeaderFormat() {
    cy.get('section[id="accordion_10"]').within(() => {
      const numItems = 13;
      for (let i = 0; i < numItems; i++) {
        cy.get('button:contains("Add")').click();
      }

      cy.do(Select({ name: 'header[0].type' }).choose('Text'));
      cy.do(TextField({ name: 'header[0].text' }).fillIn('$$$LIB'));

      cy.do(Select({ name: 'header[1].type' }).choose('Current date'));
      cy.do(Select({ name: 'header[1].format' }).choose('Day of year'));
      cy.get('select[name="header[1].timezone"]').find('option[value="America/Chicago"]').eq(1).then($option => {
        const $select = $option.prevObject.prevObject;
        cy.wrap($select).select($option.index());
      });

      cy.do(Select({ name: 'header[2].type' }).choose('Current date'));
      cy.do(Select({ name: 'header[2].format' }).choose('MMDDYYYY'));
      cy.get('select[name="header[2].timezone"]').find('option[value="America/Chicago"]').eq(1).then($option => {
        const $select = $option.prevObject.prevObject;
        cy.wrap($select).select($option.index());
      });

      cy.do(Select({ name: 'header[3].type' }).choose('Text'));
      cy.do(TextField({ name: 'header[3].text' }).fillIn('Library B&F'));

      cy.do(Select({ name: 'header[4].type' }).choose('Tab'));

      cy.do(Select({ name: 'header[5].type' }).choose('Text'));
      cy.do(TextField({ name: 'header[5].text' }).fillIn('YBR'));

      cy.do(Select({ name: 'header[6].type' }).choose('Number of accounts'));
      this.setLengthControl('header[6]', '5', '0', true, 'Start');

      cy.do(Select({ name: 'header[7].type' }).choose('Total amount'));
      cy.get('input[name="header[7].decimal"]').check();

      cy.do(Select({ name: 'header[8].type' }).choose('Current date'));
      cy.do(Select({ name: 'header[8].format' }).choose('Year (4-digit)'));
      cy.get('select[name="header[8].timezone"]').find('option[value="America/Chicago"]').eq(1).then($option => {
        const $select = $option.prevObject.prevObject;
        cy.wrap($select).select($option.index());
      });

      cy.do(Select({ name: 'header[9].type' }).choose('Current date'));
      cy.do(Select({ name: 'header[9].format' }).choose('Quarter'));
      cy.get('select[name="header[9].timezone"]').find('option[value="America/Chicago"]').eq(1).then($option => {
        const $select = $option.prevObject.prevObject;
        cy.wrap($select).select($option.index());
      });

      cy.do(Select({ name: 'header[10].type' }).choose('Whitespace'));
      cy.do(TextField({ name: 'header[10].repeat' }).fillIn('1'));

      cy.do(Select({ name: 'header[11].type' }).choose('Text'));
      cy.do(TextField({ name: 'header[11].text' }).fillIn('WMURPHY'));

      cy.do(Select({ name: 'header[12].type' }).choose('Newline (LF)'));
    });
  },

  addAlabamaDataFormat() {
    cy.get('section[id="accordion_11"]').within(() => {
      const numItems = 8;
      for (let i = 0; i < numItems; i++) {
        cy.get('button:contains("Add")').click();
      }
    });

    cy.do(Select({ name: 'data[0].type' }).choose('Text'));
    cy.do(TextField({ name: 'data[0].text' }).fillIn('64A'));

    cy.do(Select({ name: 'data[1].type' }).choose('User info'));
    cy.do(Select({ name: 'data[1].userAttribute' }).choose('External ID'));

    cy.do(Select({ name: 'data[2].type' }).choose('Text'));
    cy.do(TextField({ name: 'data[2].text' }).fillIn('00000'));

    cy.do(Select({ name: 'data[3].type' }).choose('Whitespace'));
    cy.do(TextField({ name: 'data[3].repeat' }).fillIn('16'));

    cy.do(Select({ name: 'data[4].type' }).choose('Account amount'));
    cy.get('input[name="data[4].decimal"]').check({ force: true });
    this.setLengthControl('data[4]', '9', '0', true, 'Start');

    cy.do(Select({ name: 'data[5].type' }).choose('Whitespace'));
    cy.do(TextField({ name: 'data[5].repeat' }).fillIn('48'));

    cy.do(Select({ name: 'data[6].type' }).choose('Text'));
    cy.do(TextField({ name: 'data[6].text' }).fillIn('N'));

    cy.do(Select({ name: 'data[7].type' }).choose('Newline (LF)'));
  },

  verifyAddAlabamaHeaderFormat() {
    cy.get('section[id="accordion_10"]').within(() => {
      cy.expect(Select({ name: 'header[0].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'header[0].text', value: '$$$LIB' }).exists());

      cy.expect(Select({ name: 'header[1].type', value: 'CurrentDate' }).exists());
      cy.expect(Select({ name: 'header[1].format', value: 'DAY_OF_YEAR' }).exists());
      cy.expect(Select({ name: 'header[1].timezone', value: 'America/Chicago' }).exists());

      cy.expect(Select({ name: 'header[2].type', value: 'CurrentDate' }).exists());
      cy.expect(Select({ name: 'header[2].format', value: 'MMDDYYYY' }).exists());
      cy.expect(Select({ name: 'header[2].timezone', value: 'America/Chicago' }).exists());

      cy.expect(Select({ name: 'header[3].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'header[3].text', value: 'Library B&F' }).exists());

      cy.expect(Select({ name: 'header[4].type', value: 'Tab' }).exists());

      cy.expect(Select({ name: 'header[5].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'header[5].text', value: 'YBR' }).exists());

      cy.expect(Select({ name: 'header[6].type', value: 'AggregateCount' }).exists());
      this.verifyLengthControl('header[6]', '5', '0', true, 'FRONT');

      cy.expect(Select({ name: 'header[7].type', value: 'AggregateTotal' }).exists());
      cy.get('input[name="header[7].decimal"]').should('be.checked');

      cy.expect(Select({ name: 'header[8].type', value: 'CurrentDate' }).exists());
      cy.expect(Select({ name: 'header[8].format', value: 'YEAR_LONG' }).exists());

      cy.expect(Select({ name: 'header[9].type', value: 'CurrentDate' }).exists());
      cy.expect(Select({ name: 'header[9].format', value: 'QUARTER' }).exists());

      cy.expect(Select({ name: 'header[10].type', value: 'Space' }).exists());
      cy.expect(TextField({ name: 'header[10].repeat', value: '1' }).exists());

      cy.expect(Select({ name: 'header[11].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'header[11].text', value: 'WMURPHY' }).exists());

      cy.expect(Select({ name: 'header[12].type', value: 'Newline' }).exists());
    });
  },

  verifyAddAlabamaDataFormat() {
    cy.get('section[id="accordion_11"]').within(() => {
      cy.expect(Select({ name: 'data[0].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'data[0].text', value: '64A' }).exists());

      cy.expect(Select({ name: 'data[1].type', value: 'UserData' }).exists());
      cy.expect(Select({ name: 'data[1].userAttribute', value: 'EXTERNAL_SYSTEM_ID' }).exists());

      cy.expect(Select({ name: 'data[2].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'data[2].text', value: '00000' }).exists());

      cy.expect(Select({ name: 'data[3].type', value: 'Space' }).exists());
      cy.expect(TextField({ name: 'data[3].repeat', value: '16' }).exists());

      cy.expect(Select({ name: 'data[4].type', value: 'FeeAmount' }).exists());
      cy.get('input[name="data[4].decimal"]').should('be.checked');
      this.verifyLengthControl('data[4]', '9', '0', true, 'FRONT');

      cy.expect(Select({ name: 'data[5].type', value: 'Space' }).exists());
      cy.expect(TextField({ name: 'data[5].repeat', value: '48' }).exists());

      cy.expect(Select({ name: 'data[6].type', value: 'Constant' }).exists());
      cy.expect(TextField({ name: 'data[6].text', value: 'N' }).exists());

      cy.expect(Select({ name: 'data[7].type', value: 'Newline' }).exists());
    });
  }
};
