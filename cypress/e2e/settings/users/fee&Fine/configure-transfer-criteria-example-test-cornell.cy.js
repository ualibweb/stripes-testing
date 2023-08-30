import TransferFeeFine from '../../../../support/fragments/users/transferFeeFine';
import TransferAccounts from '../../../../support/fragments/settings/users/transferAccounts';
import ServicePoints from '../../../../support/fragments/settings/tenant/servicePoints/servicePoints';
import getRandomPostfix from '../../../../support/utils/stringTools';
import UsersOwners from '../../../../support/fragments/settings/users/usersOwners';
import NewFeeFine from '../../../../support/fragments/users/newFeeFine';
import settingsMenu from '../../../../support/fragments/settingsMenu';


describe('Build the Cornell bursar transfer file', () => {
  const testData = {
    servicePoint: ServicePoints.getDefaultServicePointWithPickUpLocation(
      'Test Service Point',
      '00000000-0000-1000-8000-000000000000'
    ),
    feeFineOwnerOne: {
      id: '00000000-0000-1000-9000-000000000000',
      owner: 'FeeFineOwner' + getRandomPostfix()
    },
    feeFineOwnerTwo: {
      id: '10000000-0000-1000-9000-000000000000',
      owner: 'FeeFineOwner' + getRandomPostfix()
    },
    transferAccount: TransferAccounts.getDefaultNewTransferAccount(
      'a0000000-0000-1000-8000-000000000000',
      'Test Transfer account'
    )
  };

  const feeFineOwnerOne = {
    id: testData.feeFineOwnerOne.id,
    owner: testData.feeFineOwnerOne.owner,
    servicePointOwner: [
      {
        value: testData.servicePoint.id,
        label: testData.servicePoint.name,
      },
    ],
  };

  const feeFineOwnerTwo = {
    id: testData.feeFineOwnerTwo.id,
    owner: testData.feeFineOwnerTwo.owner,
    servicePointOwner: [
      {
        value: testData.servicePoint.id,
        label: testData.servicePoint.name,
      },
    ],
  };


  // todo: need user and feeFine. see fine-amount-link-absent-in-while-checkout.cy.js
  const feeFineAccount = {
    id: 'bbc0f7f6-7419-4ff7-aed9-fdae0c5b7d64',
    ownerId: testData.feeFineOwnerOne.id,
    amount: 10,
    feeFineType: 'Test',
  };



  before('Preconditions', () => {
    cy.getAdminToken();

    // create test service point
    ServicePoints.createViaApi(testData.servicePoint);

    // create fee fine owner
    UsersOwners.createViaApi(feeFineOwnerOne);
    UsersOwners.createViaApi(feeFineOwnerTwo);

    // Create fee/fine
    NewFeeFine.createViaApi(feeFineAccount).then((feeFineAccountId) => {
      console.log('feeFineAccountId', feeFineAccountId);
      feeFineAccount.id = feeFineAccountId;
    });


    // create test transfer account
    TransferAccounts.createViaApi({ ...testData.transferAccount, ownerId: feeFineOwnerTwo.id });

    cy.loginAsAdmin({
      path: settingsMenu.usersTransferCriteria,
      waiter: TransferFeeFine.waitLoadingTransferCriteria,
    });
  });


  after('Deleting created entities', () => {
    ServicePoints.deleteViaApi(testData.servicePoint.id);
    UsersOwners.deleteViaApi(feeFineOwnerOne.id);
    UsersOwners.deleteViaApi(feeFineOwnerTwo.id);
    NewFeeFine.deleteFeeFineAccountViaApi(feeFineAccount.id);
    TransferAccounts.deleteViaApi(testData.transferAccount.id);
  });

  it('should be able to open all the panes', () => {
    TransferFeeFine.openAllPanes();
    TransferFeeFine.verifyOpenAllPanes();
  });


  it('should be able to set scheduling', () => {
    TransferFeeFine.setTransferCriteriaScheduling(
      'Weeks',
      '1',
      '11:00 P',
      ['Monday']
    );
    TransferFeeFine.verifyTransferCriteriaScheduling(
      'WEEK',
      '1',
      '11:00 PM',
      ['Monday']
    );
  });

  it('should be able to set criteria to filter by service point', () => {
    TransferFeeFine.setCriteriaFeeFineOwner(testData.feeFineOwnerOne.owner);
    TransferFeeFine.verifyCriteriaFeeFineOwner(testData.feeFineOwnerOne.id);
  });

  // Aggregate by patron: Box unchecked
  it('should be able to set aggregate by patron', () => {
    TransferFeeFine.setAggregateByPatron(false);
    TransferFeeFine.verifyAggregateByPatron(false);
  });

  // Header Format
  it('should be able to set header format', () => {
    TransferFeeFine.clearFormat('header');
    TransferFeeFine.verifyClearFormat('header');
    TransferFeeFine.addCornellHeaderFormat();
    TransferFeeFine.verifyAddCornellHeaderFormat();
  });

  // Account Data Format
  it('should be able to set account data format', () => {
    TransferFeeFine.clearFormat('data');
    TransferFeeFine.verifyClearFormat('data');
    TransferFeeFine.addCornellDataFormat();
    TransferFeeFine.verifyAddCornellDataFormat();
  });

  // Footer Format
  it('should be able to set footer format', () => {
    TransferFeeFine.clearFormat('footer');
    TransferFeeFine.verifyClearFormat('footer');
  });


  // Transfer account data to
  it('should be able to set transfer account data to', () => {
    TransferFeeFine.setTransferAccount(feeFineOwnerTwo.owner, testData.transferAccount.accountName);
    TransferFeeFine.verifyTransferAccount(feeFineOwnerTwo.id, testData.transferAccount.id);
  });

  it('should be able to run manually', () => {
    TransferFeeFine.runManually();
    TransferFeeFine.verifyRunManually();
  });

  // todo: go to export manager
  // maybe get job id from intercept api request on 'run manually'
  // select job link using job id
  // read downloaded file and check that it has the expected content
});
