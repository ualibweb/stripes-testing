import TransferFeeFine from '../../../../support/fragments/users/transferFeeFine';
import settingsMenu from '../../../../support/fragments/settingsMenu';


describe('Build the Cornell bursar transfer file', () => {
  let testData;
  before('Preconditions', () => {
    testData = TransferFeeFine.setUpTransferCriteriaTestData();
    testData.fileContent = 'LIB02\n' +
      'testPermFirst\t25.00\t2023\n' +
      '20000000-0000-1000-9000-000000000000\n';

    cy.loginAsAdmin({
      path: settingsMenu.usersTransferCriteria,
      waiter: TransferFeeFine.waitLoadingTransferCriteria,
    });
  });


  after('Delete created entities', () => {
    TransferFeeFine.cleanUpCreatedEntities(testData);
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

  it('should be able to set criteria to filter by owner', () => {
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
    TransferFeeFine.setTransferAccount(testData.feeFineOwnerTwo.owner, testData.transferAccount.accountName);
    TransferFeeFine.verifyTransferAccount(testData.feeFineOwnerTwo.id, testData.transferAccount.id);
  });

  it('should be able to run manually', () => {
    TransferFeeFine.runManually();
    TransferFeeFine.verifyRunManually();

    // check file content
    TransferFeeFine.checkFileContent(testData.fileContent);
  });
});
