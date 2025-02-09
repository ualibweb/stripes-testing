import permissions from '../../../support/dictionary/permissions';
import TopMenu from '../../../support/fragments/topMenu';
import InventoryInstances from '../../../support/fragments/inventory/inventoryInstances';
import FileManager from '../../../support/utils/fileManager';
import getRandomPostfix from '../../../support/utils/stringTools';
import testTypes from '../../../support/dictionary/testTypes';
import devTeams from '../../../support/dictionary/devTeams';
import BulkEditSearchPane from '../../../support/fragments/bulk-edit/bulk-edit-search-pane';
import BulkEditActions from '../../../support/fragments/bulk-edit/bulk-edit-actions';
import BulkEditFiles from '../../../support/fragments/bulk-edit/bulk-edit-files';
import Users from '../../../support/fragments/users/users';
import InventorySearchAndFilter from '../../../support/fragments/inventory/inventorySearchAndFilter';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';

let user;
let hrid;
const itemBarcode = getRandomPostfix();
const validHoldingUUIDsFileName = `validHoldingUUIDs_${getRandomPostfix()}.csv`;
const validHoldingHRIDsFileName = `validHoldingHRIDs_${getRandomPostfix()}.csv`;
const matchedRecordsFileName = `Matched-Records-${validHoldingUUIDsFileName}`;
const item = {
  instanceName: `testBulkEdit_${getRandomPostfix()}`,
  itemBarcode1: itemBarcode,
  itemBarcode2: `secondBarcode_${itemBarcode}`
};

describe('bulk-edit', () => {
  describe('in-app approach', () => {
    before('create test data', () => {
      cy.createTempUser([
        permissions.bulkEditView.gui,
        permissions.bulkEditEdit.gui,
      ])
        .then(userProperties => {
          user = userProperties;
          cy.login(user.username, user.password, {
            path: TopMenu.bulkEditPath,
            waiter: BulkEditSearchPane.waitLoading
          });

          const instanceId = InventoryInstances.createInstanceViaApi(item.instanceName, item.itemBarcode1);
          cy.getHoldings({
            limit: 1,
            query: `"instanceId"="${instanceId}"`
          })
            .then(holdings => {
              hrid = holdings[0].hrid;
              FileManager.createFile(`cypress/fixtures/${validHoldingUUIDsFileName}`, holdings[0].id);
              FileManager.createFile(`cypress/fixtures/${validHoldingHRIDsFileName}`, hrid);
            });
        });
    });

    beforeEach('select holdings', () => {
      BulkEditSearchPane.checkHoldingsRadio();
      BulkEditSearchPane.selectRecordIdentifier('Holdings UUIDs');
    });

    after('delete test data', () => {
      Users.deleteViaApi(user.userId);
      InventoryInstances.deleteInstanceAndHoldingRecordAndAllItemsViaApi(item.itemBarcode1);
      FileManager.deleteFile(`cypress/fixtures/${validHoldingUUIDsFileName}`);
      FileManager.deleteFile(`cypress/fixtures/${validHoldingHRIDsFileName}`);
      FileManager.deleteFileFromDownloadsByMask(`*${matchedRecordsFileName}`);
    });

    afterEach('open new bulk edit', () => {
      cy.visit(TopMenu.bulkEditPath);
    });

    it('C357052 Verify Downloaded matched records if identifiers return more than one item (firebird)', { tags: [testTypes.smoke, devTeams.firebird] }, () => {
      BulkEditSearchPane.uploadFile(validHoldingUUIDsFileName);
      BulkEditSearchPane.waitFileUploading();
      BulkEditSearchPane.verifyMatchedResults(hrid);

      BulkEditActions.downloadMatchedResults();
      BulkEditFiles.verifyMatchedResultFileContent(`*${matchedRecordsFileName}`, [hrid], 'hrid');
    });

    it('C356810 Verify uploading file with holdings UUIDs (firebird)', { tags: [testTypes.smoke, devTeams.firebird], retries: 1 }, () => {
      BulkEditSearchPane.uploadFile(validHoldingUUIDsFileName);
      BulkEditSearchPane.waitFileUploading();
      BulkEditSearchPane.verifyMatchedResults(hrid);

      const location = 'Online';

      BulkEditActions.openActions();
      BulkEditActions.openInAppStartBulkEditFrom();
      BulkEditActions.replaceTemporaryLocation(location, 'holdings');
      BulkEditActions.confirmChanges();
      BulkEditActions.commitChanges();
      BulkEditSearchPane.waitFileUploading();
      BulkEditSearchPane.verifyChangedResults(location);
      BulkEditActions.verifySuccessBanner(1);
    });

    it('C360120 Verify that User can trigger bulk of holdings with file containing Holdings identifiers (firebird)', { tags: [testTypes.smoke, devTeams.firebird] }, () => {
      BulkEditSearchPane.selectRecordIdentifier('Holdings HRIDs');

      BulkEditSearchPane.uploadFile(validHoldingHRIDsFileName);
      BulkEditSearchPane.waitFileUploading();
      BulkEditSearchPane.verifyMatchedResults(hrid);

      const tempLocation = 'Annex';
      const permLocation = 'Main Library';

      BulkEditActions.openActions();
      BulkEditActions.openInAppStartBulkEditFrom();

      BulkEditActions.replaceTemporaryLocation(tempLocation, 'holdings', 0);
      BulkEditActions.addNewBulkEditFilterString();
      BulkEditActions.replacePermanentLocation(permLocation, 'holdings', 1);

      BulkEditActions.confirmChanges();
      BulkEditActions.clickKeepEditingBtn();

      BulkEditActions.confirmChanges();
      BulkEditActions.clickX();

      BulkEditActions.confirmChanges();
      BulkEditActions.verifyAreYouSureForm(1, hrid);

      BulkEditActions.commitChanges();
      BulkEditSearchPane.waitFileUploading();

      BulkEditSearchPane.verifyChangedResults(tempLocation);
      BulkEditSearchPane.verifyChangedResults(permLocation);
      BulkEditActions.verifySuccessBanner(1);
    });

    it('C367975 Verify Bulk edit Holdings records with empty Electronic access Relationship type (firebird)', { tags: [testTypes.criticalPath, devTeams.firebird] }, () => {
      BulkEditSearchPane.selectRecordIdentifier('Holdings HRIDs');

      BulkEditSearchPane.uploadFile(validHoldingHRIDsFileName);
      BulkEditSearchPane.waitFileUploading();
      BulkEditSearchPane.verifyMatchedResults(hrid);

      const tempLocation = 'Main Library';

      BulkEditActions.openActions();
      BulkEditActions.openInAppStartBulkEditFrom();
      BulkEditActions.replaceTemporaryLocation(tempLocation, 'holdings');
      BulkEditActions.confirmChanges();
      BulkEditActions.commitChanges();
      BulkEditSearchPane.waitFileUploading();

      BulkEditSearchPane.verifyChangedResults(tempLocation);
      BulkEditActions.verifySuccessBanner(1);

      cy.loginAsAdmin({ path: TopMenu.inventoryPath, waiter: InventoryInstances.waitContentLoading });
      InventorySearchAndFilter.switchToHoldings();
      InventorySearchAndFilter.searchByParameter('Holdings HRID', hrid);
      InventorySearchAndFilter.selectSearchResultItem();
      InventoryInstance.openHoldings(['']);
      InventoryInstance.verifyHoldingLocation(tempLocation);
    });
  });
});
