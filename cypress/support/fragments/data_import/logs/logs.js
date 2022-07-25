import {
  Button,
  MultiColumnListCell,
  Accordion,
  Selection,
  SelectionList,
  Link,
  MultiColumnList
} from '../../../../../interactors';

const anyProfileAccordion = Accordion({ id: 'profileIdAny' });

const quantityRecordsInInvoice = {
  firstQuantity: '18',
};

export default {
  checkImportFile(jobProfileName) {
    cy.do(Button('Actions').click());
    cy.do(Button('View all logs').click());
    cy.do([
      anyProfileAccordion.clickHeader(),
      anyProfileAccordion.find(Selection({ singleValue: 'Choose job profile' })).open()]);
    cy.do(SelectionList().select(jobProfileName));
    cy.expect(MultiColumnListCell(jobProfileName).exists());
  },

  checkStatusOfJobProfile:() => {
    cy.do(MultiColumnListCell({ row: 0, content: 'Completed' }).exists());
  },

  openFileDetails:(fileName) => {
    cy.do(Link(fileName).click());
  },

  checkQuantityRecordsInFile:(quantityRecords) => {
    cy.do(MultiColumnListCell({ row: 0, content: quantityRecords }).exists());
  },

  clickOnHotLink: (row = 0, columnIndex = 3, status = 'Created') => {
    cy.do(MultiColumnList({ id: 'search-results-list' })
      .find(MultiColumnListCell({ row, columnIndex }))
      .find(Link(status)).click());
  },

  quantityRecordsInInvoice,
};
