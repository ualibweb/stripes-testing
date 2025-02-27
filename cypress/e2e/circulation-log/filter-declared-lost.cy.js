import uuid from 'uuid';
import moment from 'moment';
import TopMenu from '../../support/fragments/topMenu';
import TestTypes from '../../support/dictionary/testTypes';
import Users from '../../support/fragments/users/users';
import SearchPane from '../../support/fragments/circulation-log/searchPane';
import getRandomPostfix from '../../support/utils/stringTools';
import permissions from '../../support/dictionary/permissions';
import devTeams from '../../support/dictionary/devTeams';
import UserEdit from '../../support/fragments/users/userEdit';
import ServicePoints from '../../support/fragments/settings/tenant/servicePoints/servicePoints';
import Checkout from '../../support/fragments/checkout/checkout';
import InventoryInstances from '../../support/fragments/inventory/inventoryInstances';
import UserLoans from '../../support/fragments/users/loans/userLoans';
import UsersOwners from '../../support/fragments/settings/users/usersOwners';
import PaymentMethods from '../../support/fragments/settings/users/paymentMethods';
import Location from '../../support/fragments/settings/tenant/locations/newLocation';
import CheckInActions from '../../support/fragments/check-in-actions/checkInActions';
import SearchResults from '../../support/fragments/circulation-log/searchResults';
import LoansPage from '../../support/fragments/loans/loansPage';
import ItemRecordView from '../../support/fragments/inventory/item/itemRecordView';
import TopMenuNavigation from '../../support/fragments/topMenuNavigation';

let user;
const item = {
  instanceName: `instance-name-${getRandomPostfix()}`,
  barcode: `barcode-${getRandomPostfix()}`,
};
const testData = {
  userServicePoint: ServicePoints.getDefaultServicePointWithPickUpLocation('autotest lost items', uuid()),
};
const ownerBody = {
  owner: 'AutotestOwner' + getRandomPostfix(),
  servicePointOwner: [{
    value: testData.userServicePoint.id,
    label: testData.userServicePoint.name,
  }],
};

describe('circulation-log', () => {
  before('create test data', () => {
    cy.createTempUser([
      permissions.circulationLogAll.gui,
    ])
      .then(userProperties => {
        user = userProperties;

        ServicePoints.createViaApi(testData.userServicePoint);
        testData.defaultLocation = Location.getDefaultLocation(testData.userServicePoint.id);
        Location.createViaApi(testData.defaultLocation);
        UserEdit.addServicePointViaApi(testData.userServicePoint.id, user.userId);

        item.instanceId = InventoryInstances.createInstanceViaApi(item.instanceName, item.barcode);
        cy.getHoldings({ limit: 1, query: `"instanceId"="${item.instanceId}"` })
          .then((holdings) => {
            cy.updateHoldingRecord(holdings[0].id, {
              ...holdings[0],
              permanentLocationId: testData.defaultLocation.id
            });
          });

        Checkout.checkoutItemViaApi({
          itemBarcode: item.barcode,
          userBarcode: user.barcode,
          servicePointId: testData.userServicePoint.id,
        });

        UsersOwners.createViaApi(ownerBody).then((ownerResponse) => {
          testData.ownerId = ownerResponse.id;
          PaymentMethods.createViaApi(testData.ownerId).then((paymentMethod) => {
            testData.paymentMethodId = paymentMethod.id;
          });
        });
        UserLoans.getUserLoansIdViaApi(user.userId).then((userLoans) => {
          UserLoans.declareLoanLostViaApi({
            servicePointId: testData.userServicePoint.id,
            declaredLostDateTime: moment.utc().format(),
          }, userLoans.loans[0].id);
        });
      });
    cy.loginAsAdmin({ path: TopMenu.circulationLogPath, waiter: SearchPane.waitLoading });
  });

  after('delete test data', () => {
    CheckInActions.checkinItemViaApi({
      itemBarcode: item.barcode,
      servicePointId: testData.userServicePoint.id,
      checkInDate: new Date().toISOString(),
    });
    InventoryInstances.deleteInstanceAndHoldingRecordAndAllItemsViaApi(item.barcode);
    PaymentMethods.deleteViaApi(testData.paymentMethodId);
    Users.deleteViaApi(user.userId);
    UsersOwners.deleteViaApi(testData.ownerId);
  });

  it('C17135 Filter circulation log by declared lost (firebird)', { tags: [TestTypes.criticalPath, devTeams.firebird] }, () => {
    SearchPane.setFilterOptionFromAccordion('loan', 'Declared lost');
    SearchPane.verifyResultCells();
    SearchPane.checkResultSearch({
      itemBarcode: item.barcode,
      circAction: 'Declared lost',
    });
    SearchPane.resetResults();

    SearchPane.searchByItemBarcode(item.barcode);
    SearchPane.checkResultSearch({
      itemBarcode: item.barcode,
      circAction: 'Declared lost',
    });
  });

  it('C45934 Check the Actions button from filtering Circulation log by declared lost (firebird)', { tags: [TestTypes.criticalPath, devTeams.firebird] }, () => {
    SearchPane.setFilterOptionFromAccordion('loan', 'Declared lost');
    SearchResults.chooseActionByRow(0, 'Loan details');
    LoansPage.waitLoading();
    TopMenuNavigation.navigateToApp('Circulation log');

    SearchResults.chooseActionByRow(0, 'User details');
    Users.verifyFirstNameOnUserDetailsPane(user.firstName);
    TopMenuNavigation.navigateToApp('Circulation log');

    SearchResults.clickOnCell(item.barcode, 0);
    ItemRecordView.waitLoading();
  });
});
