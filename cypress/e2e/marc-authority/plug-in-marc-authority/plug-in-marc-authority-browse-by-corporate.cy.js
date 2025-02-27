import TestTypes from '../../../support/dictionary/testTypes';
import DevTeams from '../../../support/dictionary/devTeams';
import Permissions from '../../../support/dictionary/permissions';
import TopMenu from '../../../support/fragments/topMenu';
import Users from '../../../support/fragments/users/users';
import InventoryInstances from '../../../support/fragments/inventory/inventoryInstances';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';
import DataImport from '../../../support/fragments/data_import/dataImport';
import Logs from '../../../support/fragments/data_import/logs/logs';
import JobProfiles from '../../../support/fragments/data_import/job_profiles/jobProfiles';
import getRandomPostfix from '../../../support/utils/stringTools';
import MarcAuthority from '../../../support/fragments/marcAuthority/marcAuthority';
import MarcAuthorities from '../../../support/fragments/marcAuthority/marcAuthorities';

describe('plug-in MARC authority | Browse', () => {
    const testData = {
      searchOption: 'Corporate/Conference name',
      typeA: 'Authorized',
      typeB: 'Reference',
      typeOfHeadingA: 'Corporate Name',
      typeOfHeadingB: 'Conference Name',
      title: 'Apple Academic Press',
    };
    
    const marcFiles = [
      {
        marc: 'oneMarcBib.mrc', 
        fileName: `testMarcFile.${getRandomPostfix()}.mrc`, 
        jobProfileToRun: 'Default - Create instance and SRS MARC Bib',
        numOfRecords: 1,
      }, 
      {
        marc: 'marcFileForC359228.mrc', 
        fileName: `testMarcFile.${getRandomPostfix()}.mrc`,
        jobProfileToRun: 'Default - Create SRS MARC Authority',
        numOfRecords: 5,
      },
    ]

    let createdAuthorityIDs = [];

  before('Creating user', () => {
    cy.createTempUser([
      Permissions.inventoryAll.gui,
      Permissions.uiMarcAuthoritiesAuthorityRecordView.gui,
      Permissions.uiQuickMarcQuickMarcAuthoritiesEditorAll.gui,
      Permissions.uiQuickMarcQuickMarcBibliographicEditorAll.gui,
      Permissions.uiQuickMarcQuickMarcAuthorityLinkUnlink.gui,
    ]).then(createdUserProperties => {
      testData.userProperties = createdUserProperties;

      marcFiles.forEach(marcFile => {
        cy.loginAsAdmin({ path: TopMenu.dataImportPath, waiter: DataImport.waitLoading }).then(() => {
          DataImport.uploadFile(marcFile.marc, marcFile.fileName);
          JobProfiles.waitLoadingList();
          JobProfiles.searchJobProfileForImport(marcFile.jobProfileToRun);
          JobProfiles.runImportFile();
          JobProfiles.waitFileIsImported(marcFile.fileName);
          Logs.checkStatusOfJobProfile('Completed');
          Logs.openFileDetails(marcFile.fileName);
          for (let i = 0; i < marcFile.numOfRecords; i++) {
            Logs.getCreatedItemsID(i).then(link => {
              createdAuthorityIDs.push(link.split('/')[5]);
            });
          }
        });
      });
    });
  });

  beforeEach('Login to the application', () => {
    cy.login(testData.userProperties.username, testData.userProperties.password, { path: TopMenu.inventoryPath, waiter: InventoryInstances.waitContentLoading });
  });

  after('Deleting created user', () => {
    Users.deleteViaApi(testData.userProperties.userId);
    InventoryInstance.deleteInstanceViaApi(createdAuthorityIDs[0]);
    createdAuthorityIDs.forEach((id, index) => {
      if (index) MarcAuthority.deleteViaAPI(id);
    });

    cy.loginAsAdmin({ path: TopMenu.dataImportPath, waiter: DataImport.waitLoading });
    DataImport.selectLog();
    DataImport.openDeleteImportLogsModal();
    DataImport.confirmDeleteImportLogs();
  });

  it('C380552 MARC Authority plug-in | Browse using "Corporate/Conference name" option returns only records with the same "Type of heading" (spitfire)', { tags: [TestTypes.criticalPath, DevTeams.spitfire] }, () => {
    InventoryInstance.searchByTitle(createdAuthorityIDs[0]);
    InventoryInstances.selectInstance();
    InventoryInstance.editMarcBibliographicRecord();
    InventoryInstance.verifyAndClickLinkIcon('700');
    MarcAuthorities.searchByParameter(testData.searchOption, testData.title);
    // wait for the results to be loaded.
    cy.wait(1000);
    MarcAuthorities.checkAuthorizedReferenceColumn(testData.typeA, testData.typeB);
    MarcAuthorities.checkAfterSearchHeadingType(testData.typeA, testData.typeOfHeadingA, testData.typeOfHeadingB);
    MarcAuthorities.selectTitle(testData.title);
    MarcAuthorities.checkRecordDetailPageMarkedValue(testData.title);
    MarcAuthorities.chooseTypeOfHeadingAndCheck(testData.typeOfHeadingB, testData.typeOfHeadingA, testData.typeOfHeadingB);
  });
});