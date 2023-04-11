import {
  Button,
  SearchField,
  PaneHeader,
  Select,
  Accordion,
  Checkbox,
  MultiColumnList,
  MultiColumnListCell,
  MultiColumnListRow,
  Modal,
  TextField,
  SelectionOption,
  Pane,
  Link,
  including,
  PaneContent,
  Section,
  KeyValue
} from '../../../../interactors';
import SearchHelper from '../finance/financeHelper';
import getRandomPostfix from '../../utils/stringTools';
import SelectInstanceModal from './selectInstanceModal';
const path = require('path');
const saveAndClose = Button('Save & close');
const actionsButton = Button('Actions');
const searhInputId = 'input-record-search';
const searchButton = Button('Search');
const searchField = SearchField({ id: 'input-record-search' });
const buttonLocationFilter = Button({ id: 'accordion-toggle-button-pol-location-filter' });
const buttonFundCodeFilter = Button({ id: 'accordion-toggle-button-fundCode' });
const buttonOrderFormatFilter = Button({ id: 'accordion-toggle-button-orderFormat' });
const buttonFVendorFilter = Button({ id: 'accordion-toggle-button-purchaseOrder.vendor' });
const buttonRushFilter = Button({ id: 'accordion-toggle-button-rush' });
const buttonSubscriptionFromFilter = Button({ id: 'accordion-toggle-button-subscriptionFrom' });
const physicalUnitPrice = '10';
const quantityPhysical = '5';
const electronicUnitPrice = '10';
const quantityElectronic = '5';
const physicalUnitPriceTextField = TextField({ name: 'cost.listUnitPrice' });
const quantityPhysicalTextField = TextField({ name: 'cost.quantityPhysical' });
const electronicUnitPriceTextField = TextField({ name: 'cost.listUnitPriceElectronic' });
const quantityElectronicTextField = TextField({ name: 'cost.quantityElectronic' });
const searchForm = SearchField({ id: 'input-record-search' });
const contibutor = 'Autotest,Contributor_name';
const orderLineTitle = `Autotest Tetle_${getRandomPostfix()}`;
const orderLineTitleField = TextField({ name: 'titleOrPackage' });
const orderFormatSelect = Select({ name: 'orderFormat' });
const acquisitionMethodButton = Button({ id: 'acquisition-method' });
const receivingWorkflowSelect = Select({ name: 'checkinItems' });
const materialTypeSelect = Select({ name: 'physical.materialType' });
const addLocationButton = Button({ text: 'Add location' });
const locationSelect = Button({ id: 'field-locations[0].locationId' });
const onlineLocationOption = SelectionOption('Online (E)');
const quantityPhysicalLocationField = TextField({ name: 'locations[0].quantityPhysical' });
const addFundDistributionButton = Button({ id: 'fundDistribution-add-button' });
const fundDistributionSelect = Button({ id: 'fundDistribution[0].fundId' });
const fundDistributionField = TextField({ name: 'fundDistribution[0].value' });
const orderLineInfoPage = Section({ id: 'order-lines-details' });
const itemDetailsSection = Section({ id: 'ItemDetails' });
const poLineInfoSection = Section({ id: 'poLine' });
const fundDistributionSection = Section({ id: 'FundDistribution' });
const locationSection = Section({ id: 'location' });
const selectInstanceModal = Modal('Select instance');

export default {

  searchByParameter: (parameter, value) => {
    cy.do([
      searchForm.selectIndex(parameter),
      searchForm.fillIn(value),
      Button('Search').click(),
    ]);
  },

  waitLoading() {
    cy.expect([
      Pane({ id: 'order-lines-filters-pane' }).exists(),
      Pane({ id: 'order-lines-results-pane' }).exists(),
    ]);
  },

  resetFilters: () => {
    cy.do(Button('Reset all').click());
  },


  checkOrderlineSearchResults: (orderLineNumber) => {
    cy.expect(MultiColumnList({ id: 'order-line-list' })
      .find(MultiColumnListRow({ index: 0 }))
      .find(MultiColumnListCell({ columnIndex: 0 }))
      .has({ content: orderLineNumber }));
  },

  checkCreatedPOLinePhysicalResource: (orderLineTitleName, fund) => {
    cy.expect([
      orderLineInfoPage.exists(),
      itemDetailsSection.find(KeyValue({ value: orderLineTitleName })).exists(),
      poLineInfoSection.find(KeyValue({ value: 'Physical Resource' })).exists(),
      fundDistributionSection
        .find(MultiColumnListRow({ index: 0 }))
        .find(MultiColumnListCell({ columnIndex: 0 }))
        .has({ content: `${fund.name}(${fund.code})` }),
      locationSection.find(KeyValue({ value: quantityPhysical })).exists(),
    ]);
  },

  checkCreatedPOLineElectronicResource: (orderLineTitleName, fund) => {
    cy.expect([
      orderLineInfoPage.exists(),
      itemDetailsSection.find(KeyValue({ value: orderLineTitleName })).exists(),
      poLineInfoSection.find(KeyValue({ value: 'Electronic Resource' })).exists(),
      fundDistributionSection
        .find(MultiColumnListRow({ index: 0 }))
        .find(MultiColumnListCell({ columnIndex: 0 }))
        .has({ content: `${fund.name}(${fund.code})` }),
      locationSection.find(KeyValue({ value: quantityElectronic })).exists(),
    ]);
  },

  closeThirdPane: () => {
    cy.do(PaneHeader({ id: 'paneHeaderorder-details' }).find(Button({ icon: 'times' })).click());
  },

  getSearchParamsMap(orderNumber, currentDate) {
    const searchParamsMap = new Map();
    // 'date opened' parameter verified separately due to different condition
    searchParamsMap.set('PO number', orderNumber)
      .set('Keyword', orderNumber)
      .set('Date created', currentDate);
    return searchParamsMap;
  },
  checkPoSearch(searchParamsMap, orderNumber) {
    for (const [key, value] of searchParamsMap.entries()) {
      cy.do([
        searchField.selectIndex(key),
        searchField.fillIn(value),
        Button('Search').click(),
      ]);
      // verify that first row in the result list contains related order line title
      this.checkSearchResults(orderNumber);
      this.resetFilters();
      // TODO: remove waiter - currenty it's a workaround for incorrect selection from search list
      cy.wait(1000);
    }
  },

  addPOLine: () => {
    cy.do([
      Accordion({ id: 'POListing' })
        .find(Button('Actions'))
        .click(),
      Button('Add PO line').click()
    ]);
  },

  backToEditingOrder: () => {
    cy.do(Button({ id: 'clickable-backToPO' }).click());
  },

  deleteOrderLine: () => {
    cy.do([
      PaneHeader({ id: 'paneHeaderorder-lines-details' }).find(actionsButton).click(),
      Button('Delete').click(),
      Button({ id: 'clickable-delete-line-confirmation-confirm' }).click()
    ]);
  },

  POLineInfodorPhysicalMaterial: (orderLineTitleName) => {
    cy.do([
      orderLineTitleField.fillIn(orderLineTitleName),
      orderFormatSelect.choose('Physical resource'),
      acquisitionMethodButton.click(),
      SelectionOption('Depository').click(),
      receivingWorkflowSelect.choose('Synchronized order and receipt quantity'),
      physicalUnitPriceTextField.fillIn(physicalUnitPrice),
      quantityPhysicalTextField.fillIn(quantityPhysical),
      materialTypeSelect.choose('book'),
      addLocationButton.click(),
      locationSelect.click(),
      onlineLocationOption.click(),
      quantityPhysicalLocationField.fillIn(quantityPhysical),
      saveAndClose.click()
    ]);
  },

  POLineInfodorPhysicalMaterialWithFund: (orderLineTitleName, fund) => {
    cy.do([
      orderLineTitleField.fillIn(orderLineTitleName),
      orderFormatSelect.choose('Physical resource'),
      acquisitionMethodButton.click(),
      SelectionOption('Depository').click(),
      receivingWorkflowSelect.choose('Independent order and receipt quantity'),
      physicalUnitPriceTextField.fillIn(physicalUnitPrice),
      quantityPhysicalTextField.fillIn(quantityPhysical),
      materialTypeSelect.choose('book'),
      addFundDistributionButton.click(),
      fundDistributionSelect.click(),
      SelectionOption(`${fund.name} (${fund.code})`).click(),
      fundDistributionField.fillIn('100'),
      addLocationButton.click(),
      locationSelect.click(),
      onlineLocationOption.click(),
      quantityPhysicalLocationField.fillIn(quantityPhysical),
      saveAndClose.click()
    ]);
  },

  rolloverPOLineInfoforPhysicalMaterialWithFund( fund, unitPrice, quantity, value, institutionId) {
    cy.do([
      orderFormatSelect.choose('Physical resource'),
      acquisitionMethodButton.click(),
    ]);
    cy.wait(2000);
    cy.do([
      SelectionOption('Depository').click(),
      receivingWorkflowSelect.choose('Synchronized order and receipt quantity'),
      physicalUnitPriceTextField.fillIn(unitPrice),
      quantityPhysicalTextField.fillIn(quantity),
      addFundDistributionButton.click(),
      fundDistributionSelect.click(),
      SelectionOption(`${fund.name} (${fund.code})`).click(),
      Section({ id: 'fundDistributionAccordion' }).find(Button('$')).click(),
      fundDistributionField.fillIn(value),
      materialTypeSelect.choose('book'),
      addLocationButton.click(),
      Button('Create new holdings for location').click(),
    ]);
    cy.get('form[id=location-form] select[name=institutionId]').select(institutionId);
        cy.do([
      Modal('Select permanent location').find(Button('Save and close')).click(),
      quantityPhysicalLocationField.fillIn(quantity),
      saveAndClose.click()
    ]);
    cy.wait(4000);
    this.submitOrderLine();
  },

  editFundInPOL( fund, unitPrice, value) {
    cy.do([
      physicalUnitPriceTextField.fillIn(unitPrice),
      fundDistributionSelect.click(),
      SelectionOption(`${fund.name} (${fund.code})`).click(),
      fundDistributionField.fillIn(value),
      saveAndClose.click()
    ]);
    cy.wait(6000);
    this.submitOrderLine();
  },

  rolloverPOLineInfoforElectronicResourceWithFund: (orderLineTitleName, fund, unitPrice, quantity, value) => {
    cy.do([
      orderLineTitleField.fillIn(orderLineTitleName),
      orderFormatSelect.choose('Electronic resource'),
      acquisitionMethodButton.click(),
      SelectionOption('Other').click(),
      receivingWorkflowSelect.choose('Synchronized order and receipt quantity'),
      electronicUnitPriceTextField.fillIn(unitPrice),
      quantityElectronicTextField.fillIn(quantity),
      addFundDistributionButton.click(),
      fundDistributionSelect.click(),
      SelectionOption(`${fund.name} (${fund.code})`).click(),
      Section({ id: 'fundDistributionAccordion' }).find(Button('$')).click(),
      fundDistributionField.fillIn(value),
      addLocationButton.click(),
      locationSelect.click(),
      onlineLocationOption.click(),
      TextField({ name: 'locations[0].quantityElectronic' }).fillIn(quantity),
      saveAndClose.click()
    ]);
  },

  POLineInfoforElectronicResource: (orderLineTitleName, fund) => {
    cy.do([
      orderLineTitleField.fillIn(orderLineTitleName),
      orderFormatSelect.choose('Electronic resource'),
      acquisitionMethodButton.click(),
      SelectionOption('Other').click(),
      receivingWorkflowSelect.choose('Synchronized order and receipt quantity'),
      electronicUnitPriceTextField.fillIn(electronicUnitPrice),
      quantityElectronicTextField.fillIn(quantityElectronic),
      addFundDistributionButton.click(),
      fundDistributionSelect.click(),
      SelectionOption(`${fund.name} (${fund.code})`).click(),
      fundDistributionField.fillIn('100'),
      addLocationButton.click(),
      locationSelect.click(),
      onlineLocationOption.click(),
      TextField({ name: 'locations[0].quantityElectronic' }).fillIn(quantityElectronic),
      saveAndClose.click()
    ]);
  },

  fillInPOLineInfoWithFund: (fund) => {
    cy.do([
      orderLineTitleField.fillIn(orderLineTitle),
      orderFormatSelect.choose('Physical resource'),
      acquisitionMethodButton.click(),
      SelectionOption('Depository').click(),
      physicalUnitPriceTextField.fillIn(physicalUnitPrice),
      quantityPhysicalTextField.fillIn('2'),
      materialTypeSelect.choose('book'),
      addLocationButton.click(),
      locationSelect.click(),
      SelectionOption('Main Library (KU/CC/DI/M)').click(),
      quantityPhysicalLocationField.fillIn('2'),
      addFundDistributionButton.click(),
      fundDistributionSelect.click(),
      SelectionOption(`${fund.name} (${fund.code})`).click(),
      fundDistributionField.fillIn('100'),
      saveAndClose.click()
    ]);
  },

  fillInPOLineInfoViaUi: () => {
    cy.do([
      orderLineTitleField.fillIn(orderLineTitle),
      orderFormatSelect.choose('P/E mix'),
      acquisitionMethodButton.click(),
      acquisitionMethodButton.click(),
      SelectionOption('Depository').click(),
      receivingWorkflowSelect.choose('Independent order and receipt quantity'),
      physicalUnitPriceTextField.fillIn(physicalUnitPrice),
      quantityPhysicalTextField.fillIn(quantityPhysical),
      electronicUnitPriceTextField.fillIn(electronicUnitPrice),
      quantityElectronicTextField.fillIn(quantityElectronic),
      materialTypeSelect.choose('book'),
      addLocationButton.click(),
      locationSelect.click(),
      onlineLocationOption.click(),
      quantityPhysicalLocationField.fillIn(quantityPhysical),
      TextField({ name: 'locations[0].quantityElectronic' }).fillIn(quantityElectronic),
    ]);
    cy.expect([
      physicalUnitPriceTextField.has({ value: physicalUnitPrice }),
      quantityPhysicalTextField.has({ value: quantityPhysical }),
      electronicUnitPriceTextField.has({ value: electronicUnitPrice }),
      quantityElectronicTextField.has({ value: quantityElectronic }),
    ]);
    cy.do(saveAndClose.click());
  },

  fillInPOLineInfoForExport(accountNumber, AUMethod) {
    cy.do([
      orderLineTitleField.fillIn(orderLineTitle),
      orderFormatSelect.choose('P/E mix'),
      acquisitionMethodButton.click(),
      acquisitionMethodButton.click(),
      SelectionOption(AUMethod).click(),
      receivingWorkflowSelect.choose('Independent order and receipt quantity'),
      Select({ name: 'vendorDetail.vendorAccount' }).choose(accountNumber),
    ]);
    cy.do([
      physicalUnitPriceTextField.fillIn(physicalUnitPrice),
      quantityPhysicalTextField.fillIn(quantityPhysical),
      electronicUnitPriceTextField.fillIn(electronicUnitPrice),
      quantityElectronicTextField.fillIn(quantityElectronic),
      materialTypeSelect.choose('book'),
      addLocationButton.click(),
      locationSelect.click(),
      onlineLocationOption.click(),
      quantityPhysicalLocationField.fillIn(quantityPhysical),
      TextField({ name: 'locations[0].quantityElectronic' }).fillIn(quantityElectronic),
    ]);
    cy.expect([
      physicalUnitPriceTextField.has({ value: physicalUnitPrice }),
      quantityPhysicalTextField.has({ value: quantityPhysical }),
      electronicUnitPriceTextField.has({ value: electronicUnitPrice }),
      quantityElectronicTextField.has({ value: quantityElectronic }),
    ]);
    cy.do(saveAndClose.click());
  },

  fillInPOLineInfoForExportWithLocation(accountNumber, AUMethod, institutionId) {
    cy.do([
      orderFormatSelect.choose('Electronic resource'),
      acquisitionMethodButton.click(),
      acquisitionMethodButton.click(),
      SelectionOption(AUMethod).click(),
      Select({ name: 'vendorDetail.vendorAccount' }).choose(accountNumber),
    ]);
    cy.do([
      electronicUnitPriceTextField.fillIn(electronicUnitPrice),
      quantityElectronicTextField.fillIn(quantityElectronic),
      Select({ name: 'eresource.materialType' }).choose('book'),
      addLocationButton.click(),
      Button('Create new holdings for location').click(),
    ]);
    cy.get('form[id=location-form] select[name=institutionId]').select(institutionId);
        cy.do([
      Modal('Select permanent location').find(Button('Save and close')).click(),
      TextField({ name: 'locations[0].quantityElectronic' }).fillIn(quantityElectronic),
    ]);
    cy.expect([
      electronicUnitPriceTextField.has({ value: electronicUnitPrice }),
      quantityElectronicTextField.has({ value: quantityElectronic }),
    ]);
    cy.do(saveAndClose.click());
    // If purchase order line will be dublicate, Modal with button 'Submit' will be activated 
    cy.wait(2000);
    this.submitOrderLine();
  },

  submitOrderLine:() => {
    const submitButton = Button('Submit');
    cy.get('body').then($body => {
      if ($body.find('[id=line-is-not-unique-confirmation]').length) {   
        cy.wait(4000);
        cy.do(Modal({ id: 'line-is-not-unique-confirmation' }).find(submitButton).click());
      } else {
        // do nothing if modal is not displayed
      }
    });
  },

  fillInPOLineInfoForExportWithLocationForPhisicalResource(accountNumber, AUMethod, institutionName, quantity) {
    cy.do([
      orderFormatSelect.choose('Physical resource'),
      acquisitionMethodButton.click(),
      acquisitionMethodButton.click(),
      SelectionOption(AUMethod).click(),
      Select({ name: 'vendorDetail.vendorAccount' }).choose(accountNumber),
    ]);
    cy.do([
      physicalUnitPriceTextField.fillIn(physicalUnitPrice),
      quantityPhysicalTextField.fillIn(quantity),
      materialTypeSelect.choose('book'),
      addLocationButton.click(),
      Button('Create new holdings for location').click(),
    ]);
    cy.get('form[id=location-form] select[name=institutionId]').select(institutionName);
    cy.do([
      Modal('Select permanent location').find(Button('Save and close')).click(),
      quantityPhysicalLocationField.fillIn(quantity),
    ]);
    cy.expect([
      physicalUnitPriceTextField.has({ value: physicalUnitPrice }),
      quantityPhysicalLocationField.has({ value: quantity }),
    ]);
    cy.do(saveAndClose.click());
    // If purchase order line will be dublicate, Modal with button 'Submit' will be activated 
    cy.wait(2000);
    this.submitOrderLine();
  },

  selectFilterMainLibraryLocationsPOL: () => {
    cy.do([
      buttonLocationFilter.click(),
      Button('Location look-up').click(),
      Select({ name: 'campusId' }).choose('City Campus'),
      Button({ id: 'locationId' }).click(),
      SelectionOption('Main Library (KU/CC/DI/M) ').click(),
      Button('Save and close').click(),
      buttonLocationFilter.click(),
    ]);
  },

  selectFilterFundCodeUSHISTPOL: () => {
    cy.do([
      buttonFundCodeFilter.click(),
      Button({ id: 'fundCode-selection' }).click(),
      SelectionOption('USHIST').click(),
      buttonFundCodeFilter.click(),
    ]);
  },

  selectFilterOrderFormatPhysicalResourcePOL: () => {
    cy.do([
      buttonOrderFormatFilter.click(),
      Checkbox({ id: 'clickable-filter-orderFormat-physical-resource' }).click(),
      buttonOrderFormatFilter.click(),
    ]);
  },

  selectFilterVendorPOL: (invoice) => {
    cy.do([
      buttonFVendorFilter.click(),
      Button({ id: 'purchaseOrder.vendor-button' }).click(),
      Modal('Select Organization').find(SearchField({ id: searhInputId })).fillIn(invoice.vendorName),
      searchButton.click(),
    ]);
    SearchHelper.selectFromResultsList();
    cy.do(buttonFVendorFilter.click());
  },

  selectFilterNoInRushPOL: () => {
    cy.do([
      buttonRushFilter.click(),
      Checkbox({ id: 'clickable-filter-rush-false' }).click(),
      buttonRushFilter.click(),
    ]);
  },

  selectFilterOngoingPaymentStatus: () => {
    cy.do(Checkbox({ id: 'clickable-filter-paymentStatus-ongoing' }).click());
  },

  selectFilterSubscriptionFromPOL: (newDate) => {
    cy.do([
      buttonSubscriptionFromFilter.click(),
      TextField('From').fillIn(newDate),
      TextField('To').fillIn(newDate),
      Button('Apply').click(),
      buttonSubscriptionFromFilter.click(),
    ]);
  },

  selectPOLInOrder: () => {
    cy.do(Accordion({ id: 'POListing' })
      .find(MultiColumnListRow({ index: 0 }))
      .find(MultiColumnListCell({ columnIndex: 0 }))
      .click());
  },

  editPOLInOrder: () => {
    cy.do([
      Pane({ id: 'order-lines-details' })
        .find(PaneHeader({ id: 'paneHeaderorder-lines-details' })
          .find(actionsButton)).click(),
      Button('Edit').click(),
    ]);
  },

  addContributorToPOL: () => {
    cy.do([
      Button('Add contributor').click(),
      TextField('Contributor*').fillIn(contibutor),
      Select('Contributor type*').choose('Personal name')
    ]);
  },

  saveOrderLine: () => {
    cy.do(Button({ id: 'clickable-updatePoLine' }).click());
  },

  openInstance:() => {
    cy.do(PaneContent({ id:'order-lines-details-content' }).find(Link({ href: including('/inventory/view/') })).click());
  },

  openReceiving:() => {
    cy.do([
      PaneHeader({ id: 'paneHeaderorder-lines-details' }).find(actionsButton).click(),
      Button('Receive').click()
    ]);
  },

  fillPolByLinkTitle:(instanceTitle) => {
    cy.do(Button('Title look-up').click());
    SelectInstanceModal.searchByName(instanceTitle);
    SelectInstanceModal.selectInstance(instanceTitle);
  },

  addAcquisitionMethod:(method) => {
    cy.do(acquisitionMethodButton.click());
    cy.do(SelectionOption(method).click());
  },

  addOrderFormat:(format) => {
    cy.do(orderFormatSelect.choose(format));
  },

  fillPhysicalUnitPrice:(price) => {
    cy.do(physicalUnitPriceTextField.fillIn(price));
  },

  fillPhysicalUnitQuantity:(quantity) => {
    cy.do(quantityPhysicalTextField.fillIn(quantity));
  },

  addCreateInventory:(inventory) => {
    cy.do(Select('Create inventory*').choose(inventory));
  },

  addMaterialType:(type) => {
    cy.do(Select({ name:'physical.materialType' }).choose(type));
    // need to wait upload product types
    cy.wait(1000);
  },

  savePol:() => {
    cy.do(saveAndClose.click());
    cy.do(Pane({ id:'pane-poLineForm' }).absent());
  },

  fillPOLWithTitleLookUp:() => {
    cy.do([
      orderFormatSelect.choose('Other'),
      acquisitionMethodButton.click(),
      SelectionOption('Depository').click(),
      receivingWorkflowSelect.choose('Synchronized order and receipt quantity'),
      physicalUnitPriceTextField.fillIn(physicalUnitPrice),
      quantityPhysicalTextField.fillIn(quantityPhysical),
      materialTypeSelect.choose('book'),
      addLocationButton.click(),
      locationSelect.click(),
      onlineLocationOption.click(),
      quantityPhysicalLocationField.fillIn(quantityPhysical),
      saveAndClose.click()
    ]);
  },

  selectRandomInstanceInTitleLookUP:(instanceName, rowNumber = 0) => {
    cy.do([
      Button({ id: 'find-instance-trigger' }).click(),
      selectInstanceModal.find(TextField({ name: 'query' })).fillIn(instanceName),
      selectInstanceModal.find(searchButton).click(),
      selectInstanceModal.find(MultiColumnListRow({ index: rowNumber })).click()
    ]);
    // Need to wait,while entering data loading on page
    cy.wait(2000);
  },

  fillInInvalidDataForPublicationDate:() => {
    cy.do(TextField({ text: 'Publication date' }).fillIn('Invalid date'));
  },

  clickNotConnectionInfoButton:() => {
    cy.do(Section({ id: 'itemDetails' }).find(Button({ icon: 'info' })).click());
  },

  selectCurrentEncumbrance:(currentEncumbrance) => {
    cy.do(Section({ id: 'FundDistribution' }).find(Link(currentEncumbrance)).click());
  },

  cancelPOL:() => {
    cy.do([
      Pane({ id: 'order-lines-details' })
      .find(PaneHeader({ id: 'paneHeaderorder-lines-details' })
        .find(actionsButton)).click(),
        Button('Cancel').click(),
        Button('Cancel order line').click()
    ]);
  },

  changeFundInPOL:(fund) => {
    cy.do([
      fundDistributionSelect.click(),
      SelectionOption(`${fund.name} (${fund.code})`).click(),
      saveAndClose.click()
    ]);
  },

  checkFundInPOL:(fund) => {
    cy.expect(Section({ id: 'FundDistribution'}).find(Link(`${fund.name}(${fund.code})`)).exists());
  },

  checkDownloadedFile() {
    cy.wait(10000);
    // Get the path to the Downloads folder
    const downloadsFolder = Cypress.config('downloadsFolder') || Cypress.env('downloadsFolder') || 'Downloads';

    // Find the most recently downloaded file
    cy.task('findFiles', `${downloadsFolder}/*.csv`, {
      sortBy: 'modified',
      sortOrder: 'desc',
      recursive: true,
      timeout: 15000
    }).then((files) => {
      if (files.length === 0) {
          throw new Error(`No files found in ${downloadsFolder}`);
      }
      const fileName = path.basename(files[0]);
      const filePath = `${downloadsFolder}\\${fileName}`;
      cy.readFile(filePath).then(fileContent => {
          const fileRows = fileContent.split('\n');
          expect(fileRows[0].trim()).to.equal('"PO number prefix","PO number","PO number suffix","Vendor","Organization type","Order type","Acquisitions units","Approval date","Assigned to","Bill to","Ship to","Manual","Re-encumber","Created by","Created on","Note","Workflow status","Approved","Renewal interval","Subscription","Manual renewal","Ongoing notes","Review period","Renewal date","Review date","PO tags","POLine number","Title","Instance UUID","Subscription from","Subscription to","Subscription interval","Receiving note","Publisher","Edition","Linked package","Contributor, Contributor type","Product ID, Qualifier, Product ID type","Internal note","Acquisition method","Order format","Created on (PO Line)","Receipt date","Receipt status","Payment status","Source","Donor","Selector","Requester","Cancellation restriction","Cancellation description","Rush","Collection","Line description","Vendor reference number, reference type","Instructions to vendor","Account number","Physical unit price","Quantity physical","Electronic unit price","Quantity electronic","Discount","Estimated price","Currency","Fund code, Expense class, Value, Amount","Location, Quantity P, Quantity E","Material supplier","Receipt due","Expected receipt date","Volumes","Create inventory","Material type","Access provider","Activation status","Activation due","Create inventory E","Material type E","Trial","Expected activation","User limit","URL","POLine tags","Renewal note"');
      });
    });
  },

  deleteAllDownloadedFiles() {
    cy.exec('del cypress\\downloads\\*.csv', { failOnNonZeroExit: false });
  },
  
};

