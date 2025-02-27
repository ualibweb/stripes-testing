import getRandomPostfix from '../../../support/utils/stringTools';
import TestTypes from '../../../support/dictionary/testTypes';
import DevTeams from '../../../support/dictionary/devTeams';
import Permissions from '../../../support/dictionary/permissions';
import TopMenu from '../../../support/fragments/topMenu';
import DataImport from '../../../support/fragments/data_import/dataImport';
import Users from '../../../support/fragments/users/users';
import JobProfiles from '../../../support/fragments/data_import/job_profiles/jobProfiles';
import Logs from '../../../support/fragments/data_import/logs/logs';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';
import InventorySearchAndFilter from '../../../support/fragments/inventory/inventorySearchAndFilter';
import { JOB_STATUS_NAMES } from '../../../support/constants';
import MarcAuthority from '../../../support/fragments/marcAuthority/marcAuthority';
import MarcAuthorities from '../../../support/fragments/marcAuthority/marcAuthorities';
import InventoryInstances from '../../../support/fragments/inventory/inventoryInstances';
import QuickMarcEditor from '../../../support/fragments/quickMarcEditor';

describe('Search in Inventory', () => {
  const testData = {
    tag130: '130',
    tag240: '240',
    tag010: '010',
    querySearchOption: 'Query search',
    searchQueries: {
      allRecords: 'alternativeTitles.alternativeTitle = "bible"',
      secondLinkedRecord: 'alternativeTitles.alternativeTitle = "Hosanna Bible"',
      bothLinkedRecords: 'alternativeTitles.alternativeTitle = "Hosanna Bible" OR alternativeTitles.alternativeTitle = "Bible. Polish."',
      linkedAndFirstNotLinkedRecords: 'alternativeTitles.alternativeTitle = "Hosanna Bible" OR alternativeTitles.alternativeTitle = "Bible. Polish." OR alternativeTitles.alternativeTitle = "Bible1"'
    },
    searchResults: {
      firstLinkedRecord: 'Prayer Bible (Test record with 130 linked field).',
      secondLinkedRecord: 'Prayer Bible (Test record with 240 linked field).',
      firstNotLinkedRecord: 'Prayer Bible (Test record without linked field: 246).',
      secondNotLinkedRecord: 'Prayer Bible (Test record without linked field: 270).',
    }
  };

  const marcFiles = [
    {
      marc: 'marcBibFileC375256.mrc',
      fileName: `testMarcFile.${getRandomPostfix()}.mrc`,
      jobProfileToRun: 'Default - Create instance and SRS MARC Bib',
      numberOfRecords: 4
    },
    {
      marc: 'marcAuthFileC375256_1.mrc',
      fileName: `testMarcFile.${getRandomPostfix()}.mrc`,
      jobProfileToRun: 'Default - Create SRS MARC Authority',
      authorityHeading: 'Bible. Polish. Biblia Płocka C375256',
      authority010FieldValue: 'n92085235375256',
      numberOfRecords: 1
    },
    {
      marc: 'marcAuthFileC375256_2.mrc',
      fileName: `testMarcFile.${getRandomPostfix()}.mrc`,
      jobProfileToRun: 'Default - Create SRS MARC Authority',
      authorityHeading: 'Abraham, Angela, C375256 Hosanna Bible',
      authority010FieldValue: 'n99036055375256',
      numberOfRecords: 1
    },
  ];

  const createdRecordIDs = [];

  before('Importing data, linking Bib fields', () => {
    cy.createTempUser([
      Permissions.inventoryAll.gui,
    ]).then(createdUserProperties => {
      testData.userProperties = createdUserProperties;
      marcFiles.forEach(marcFile => {
        cy.loginAsAdmin({ path: TopMenu.dataImportPath, waiter: DataImport.waitLoading }).then(() => {
          DataImport.uploadFile(marcFile.marc, marcFile.fileName);
          JobProfiles.waitLoadingList();
          JobProfiles.searchJobProfileForImport(marcFile.jobProfileToRun);
          JobProfiles.runImportFile();
          JobProfiles.waitFileIsImported(marcFile.fileName);
          Logs.checkStatusOfJobProfile(JOB_STATUS_NAMES.COMPLETED);
          Logs.openFileDetails(marcFile.fileName);
          for (let i = 0; i < marcFile.numberOfRecords; i++) {
            Logs.getCreatedItemsID(i).then(link => {
              createdRecordIDs.push(link.split('/')[5]);
            });
          }
        });
      });
      // linking fields in MARC Bib records
      cy.visit(TopMenu.inventoryPath).then(() => {
        InventoryInstances.waitContentLoading();
        InventoryInstance.searchByTitle(createdRecordIDs[0]);
        InventoryInstances.selectInstance();
        InventoryInstance.editMarcBibliographicRecord();
        InventoryInstance.verifyAndClickLinkIcon(testData.tag130);
        MarcAuthorities.switchToSearch();
        InventoryInstance.verifySelectMarcAuthorityModal();
        InventoryInstance.searchResults(marcFiles[1].authorityHeading);
        MarcAuthorities.checkFieldAndContentExistence(testData.tag010, `‡a ${marcFiles[1].authority010FieldValue}`);
        InventoryInstance.clickLinkButton();
        QuickMarcEditor.verifyAfterLinkingAuthority(testData.tag130);
        QuickMarcEditor.pressSaveAndClose();
        QuickMarcEditor.checkAfterSaveAndClose();
        InventoryInstance.searchByTitle(createdRecordIDs[1]);
        InventoryInstances.selectInstance();
        InventoryInstance.editMarcBibliographicRecord();
        InventoryInstance.verifyAndClickLinkIcon(testData.tag240);
        MarcAuthorities.switchToSearch();
        InventoryInstance.verifySelectMarcAuthorityModal();
        InventoryInstance.searchResults(marcFiles[2].authorityHeading);
        MarcAuthorities.checkFieldAndContentExistence(testData.tag010, `‡a ${marcFiles[2].authority010FieldValue}`);
        InventoryInstance.clickLinkButton();
        QuickMarcEditor.verifyAfterLinkingAuthority(testData.tag240);
        QuickMarcEditor.pressSaveAndClose();
        QuickMarcEditor.checkAfterSaveAndClose();

        cy.login(testData.userProperties.username, testData.userProperties.password, { path: TopMenu.inventoryPath, waiter: InventoryInstances.waitContentLoading });
      });
    });
  });

  after('Deleting user, records', () => {
    Users.deleteViaApi(testData.userProperties.userId);
    createdRecordIDs.forEach((id, index) => {
      if (index > marcFiles[0].numberOfRecords - 1) MarcAuthority.deleteViaAPI(id);
      else InventoryInstance.deleteInstanceViaApi(id);
    });
    cy.loginAsAdmin({ path: TopMenu.dataImportPath, waiter: DataImport.waitLoading });
    for (let i = 0; i < marcFiles.length; i++) {
      DataImport.selectLog(i);
    }
    DataImport.openDeleteImportLogsModal();
    DataImport.confirmDeleteImportLogs();
  });

  it('C375256 Query search | Search by "Alternative title" field of linked "MARC Bib" records (spitfire)', { tags: [TestTypes.criticalPath, DevTeams.spitfire] }, () => {
    InventorySearchAndFilter.selectSearchOptions(testData.querySearchOption, testData.searchQueries.allRecords);
    InventorySearchAndFilter.clickSearch();
    InventorySearchAndFilter.verifySearchResult(testData.searchResults.firstLinkedRecord);
    InventorySearchAndFilter.verifySearchResult(testData.searchResults.secondLinkedRecord);
    InventorySearchAndFilter.verifySearchResult(testData.searchResults.firstNotLinkedRecord);
    InventorySearchAndFilter.verifySearchResult(testData.searchResults.secondNotLinkedRecord);
    InventorySearchAndFilter.checkRowsCount(4);

    InventorySearchAndFilter.selectSearchOptions(testData.querySearchOption, testData.searchQueries.secondLinkedRecord);
    InventorySearchAndFilter.clickSearch();
    InventorySearchAndFilter.verifySearchResult(testData.searchResults.secondLinkedRecord);
    InventorySearchAndFilter.checkRowsCount(1);

    InventorySearchAndFilter.selectSearchOptions(testData.querySearchOption, testData.searchQueries.bothLinkedRecords);
    InventorySearchAndFilter.clickSearch();
    InventorySearchAndFilter.verifySearchResult(testData.searchResults.firstLinkedRecord);
    InventorySearchAndFilter.verifySearchResult(testData.searchResults.secondLinkedRecord);
    InventorySearchAndFilter.checkRowsCount(2);

    InventorySearchAndFilter.selectSearchOptions(testData.querySearchOption, testData.searchQueries.linkedAndFirstNotLinkedRecords);
    InventorySearchAndFilter.clickSearch();
    InventorySearchAndFilter.verifySearchResult(testData.searchResults.firstLinkedRecord);
    InventorySearchAndFilter.verifySearchResult(testData.searchResults.secondLinkedRecord);
    InventorySearchAndFilter.verifySearchResult(testData.searchResults.firstNotLinkedRecord);
    InventorySearchAndFilter.checkRowsCount(3);
  });
});
