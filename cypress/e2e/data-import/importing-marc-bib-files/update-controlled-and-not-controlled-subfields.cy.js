import FieldMappingProfiles from '../../../support/fragments/data_import/mapping_profiles/fieldMappingProfiles';
import ActionProfiles from '../../../support/fragments/data_import/action_profiles/actionProfiles';
import NewJobProfile from '../../../support/fragments/data_import/job_profiles/newJobProfile';
import MatchProfiles from '../../../support/fragments/data_import/match_profiles/matchProfiles';
import DataImport from '../../../support/fragments/data_import/dataImport';
import Logs from '../../../support/fragments/data_import/logs/logs';
import JobProfiles from '../../../support/fragments/data_import/job_profiles/jobProfiles';
import TestTypes from '../../../support/dictionary/testTypes';
import InventorySearchAndFilter from '../../../support/fragments/inventory/inventorySearchAndFilter';
import ExportFile from '../../../support/fragments/data-export/exportFile';
import FileManager from '../../../support/utils/fileManager';
import getRandomPostfix from '../../../support/utils/stringTools';
import SettingsMenu from '../../../support/fragments/settingsMenu';
import TopMenu from '../../../support/fragments/topMenu';
import Permissions from '../../../support/dictionary/permissions';
import DevTeams from '../../../support/dictionary/devTeams';
import Users from '../../../support/fragments/users/users';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';
import MarcAuthority from '../../../support/fragments/marcAuthority/marcAuthority';
import InventoryInstances from '../../../support/fragments/inventory/inventoryInstances';
import MarcAuthorities from '../../../support/fragments/marcAuthority/marcAuthorities';
import QuickMarcEditor from '../../../support/fragments/quickMarcEditor';
import { LOCATION_NAMES, FOLIO_RECORD_TYPE, ACCEPTED_DATA_TYPE_NAMES, EXISTING_RECORDS_NAMES } from '../../../support/constants';

describe('Importing MARC Bib files', () => {
  const testData = {};
  // unique file name to upload
  const nameForUpdatedMarcFile = `C375098autotestFile${getRandomPostfix()}.mrc`;
  const nameForExportedMarcFile = `C375098autotestFile${getRandomPostfix()}.mrc`;
  const nameForCSVFile = `C375098autotestFile${getRandomPostfix()}.csv`;
  const mappingProfile = {
    name: 'Update MARC Bib records by matching 999 ff $s subfield value',
    typeValue: FOLIO_RECORD_TYPE.MARCBIBLIOGRAPHIC,
    update: true,
    permanentLocation: `"${LOCATION_NAMES.ANNEX}"`
  };
  const actionProfile = {
    typeValue: FOLIO_RECORD_TYPE.MARCBIBLIOGRAPHIC,
    name: 'Update MARC Bib records by matching 999 ff $s subfield value',
    action: 'Update (all record types except Orders, Invoices, or MARC Holdings)'
  };
  const matchProfile = {
    profileName: 'Update MARC Bib records by matching 999 ff $s subfield value',
    incomingRecordFields: {
      field: '999',
      in1: 'f',
      in2: 'f',
      subfield: 's'
    },
    existingRecordFields: {
      field: '999',
      in1: 'f',
      in2: 'f',
      subfield: 's'
    },
    matchCriterion: 'Exactly matches',
    existingRecordType: EXISTING_RECORDS_NAMES.MARC_BIBLIOGRAPHIC
  };
  const jobProfile = {
    ...NewJobProfile.defaultJobProfile,
    profileName: 'Update MARC Bib records by matching 999 ff $s subfield value',
    acceptedType: ACCEPTED_DATA_TYPE_NAMES.MARC
  };
  const marcFiles = [
    {
      marc: 'marcBibFileForC375098.mrc',
      fileName: `testMarcFile.${getRandomPostfix()}.mrc`,
      jobProfileToRun: 'Default - Create instance and SRS MARC Bib',
      numOfRecords: 1
    },
    {
      marc: 'marcFileForC375098.mrc',
      fileName: `testMarcFile.${getRandomPostfix()}.mrc`,
      jobProfileToRun: 'Default - Create SRS MARC Authority',
      numOfRecords: 1
    }
  ];
  const createdAuthorityIDs = [];

  before('Creating user', () => {
    cy.createTempUser([
      Permissions.moduleDataImportEnabled.gui,
      Permissions.inventoryAll.gui,
      Permissions.uiMarcAuthoritiesAuthorityRecordView.gui,
      Permissions.uiQuickMarcQuickMarcAuthoritiesEditorAll.gui,
      Permissions.uiQuickMarcQuickMarcBibliographicEditorAll.gui,
      Permissions.uiCanLinkUnlinkAuthorityRecordsToBibRecords.gui,
      Permissions.uiQuickMarcQuickMarcAuthorityLinkUnlink.gui,
      Permissions.dataExportEnableApp.gui,
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

      cy.loginAsAdmin().then(() => {
        // create Match profile
        cy.visit(SettingsMenu.matchProfilePath);
        MatchProfiles.createMatchProfile(matchProfile);
        // create Field mapping profile
        cy.visit(SettingsMenu.mappingProfilePath);
        FieldMappingProfiles.createMappingProfileForUpdatesMarc(mappingProfile);
        FieldMappingProfiles.closeViewModeForMappingProfile(mappingProfile.name);
        FieldMappingProfiles.checkMappingProfilePresented(mappingProfile.name);
        // create Action profile and link it to Field mapping profile
        cy.visit(SettingsMenu.actionProfilePath);
        ActionProfiles.create(actionProfile, mappingProfile.name);
        ActionProfiles.checkActionProfilePresented(actionProfile.name);
        // create Job profile
        cy.visit(SettingsMenu.jobProfilePath);
        JobProfiles.openNewJobProfileForm();
        NewJobProfile.fillJobProfile(jobProfile);
        NewJobProfile.linkMatchProfile(matchProfile.profileName);
        NewJobProfile.linkActionProfileByName(actionProfile.name);
        // wait for the action profile to be linked
        cy.wait(1000);
        NewJobProfile.saveAndClose();
        JobProfiles.waitLoadingList();
        JobProfiles.checkJobProfilePresented(jobProfile.profileName);
      });

      cy.login(testData.userProperties.username, testData.userProperties.password, { path: TopMenu.inventoryPath, waiter: InventoryInstances.waitContentLoading });
    });
  });

  after('delete test data', () => {
    Users.deleteViaApi(testData.userProperties.userId);
    InventoryInstance.deleteInstanceViaApi(createdAuthorityIDs[0]);
    MarcAuthority.deleteViaAPI(createdAuthorityIDs[1]);
    // clean up generated profiles
    JobProfiles.deleteJobProfile(jobProfile.profileName);
    MatchProfiles.deleteMatchProfile(matchProfile.profileName);
    ActionProfiles.deleteActionProfile(actionProfile.name);
    FieldMappingProfiles.deleteFieldMappingProfile(mappingProfile.name);
    // delete created files in fixtures
    FileManager.deleteFile(`cypress/fixtures/${nameForExportedMarcFile}`);
    FileManager.deleteFile(`cypress/fixtures/${nameForCSVFile}`);
    FileManager.deleteFile(`cypress/fixtures/${nameForUpdatedMarcFile}`);
  });

  it('C375098 Update controlled and not controlled subfields of linked "MARC Bib" field which is controlled by "MARC Authority" record (spitfire)', { tags: [TestTypes.criticalPath, DevTeams.spitfire] }, () => {
    InventoryInstance.searchByTitle(createdAuthorityIDs[0]);
    InventoryInstances.selectInstance();
    InventoryInstance.editMarcBibliographicRecord();
    InventoryInstance.verifyAndClickLinkIcon('100');
    MarcAuthorities.switchToSearch();
    InventoryInstance.verifySelectMarcAuthorityModal();
    InventoryInstance.verifySearchOptions();
    InventoryInstance.searchResults('Chin, Staceyann, 1972-');
    InventoryInstance.clickLinkButton();
    QuickMarcEditor.verifyAfterLinkingAuthority('100');
    QuickMarcEditor.pressSaveAndClose();
    QuickMarcEditor.checkAfterSaveAndClose();

    // download .csv file
    InventorySearchAndFilter.saveUUIDs();
    ExportFile.downloadCSVFile(nameForCSVFile, 'SearchInstanceUUIDs*');
    FileManager.deleteFolder(Cypress.config('downloadsFolder'));
    cy.visit(TopMenu.dataExportPath);
    // download exported marc file
    ExportFile.uploadFile(nameForCSVFile);
    ExportFile.exportWithDefaultJobProfile(nameForCSVFile);
    ExportFile.downloadExportedMarcFile(nameForExportedMarcFile);
    FileManager.deleteFolder(Cypress.config('downloadsFolder'));
    cy.log('#####End Of Export#####');

    DataImport.editMarcFile(
      nameForExportedMarcFile,
      nameForUpdatedMarcFile,
      ['aChin, Staceyann,', 'eauthor', 'aThe other side of paradise :'],
      ['aChin, S-nn', 'eProducereNarratorctestutest4prf', 'aParadise of other side (updated title) :']
    );

    // upload the exported marc file with 999.f.f.s fields
    cy.visit(TopMenu.dataImportPath);
    DataImport.uploadFile(nameForUpdatedMarcFile, nameForUpdatedMarcFile);
    JobProfiles.waitLoadingList();
    JobProfiles.searchJobProfileForImport(jobProfile.profileName);
    JobProfiles.runImportFile();
    JobProfiles.waitFileIsImported(nameForUpdatedMarcFile);
    Logs.checkStatusOfJobProfile('Completed');
    Logs.openFileDetails(nameForUpdatedMarcFile);

    cy.visit(TopMenu.inventoryPath);
    InventoryInstance.searchByTitle('Paradise of other side (updated title)');
    InventoryInstances.selectInstance();
    InventoryInstance.checkExistanceOfAuthorityIconInInstanceDetailPane('Contributor');
    InventoryInstance.editMarcBibliographicRecord();
    QuickMarcEditor.verifyTagFieldAfterLinking(19, '100', '1', '\\', '$a Chin, Staceyann, $d 1972-', '$e Producer $e Narrator $u test', '$0 id.loc.gov/authorities/names/n2008052404', '$4 prf.');
    QuickMarcEditor.verifyTagFieldAfterUnlinking(20, '245', '1', '4', '$a Paradise of other side (updated title) : $b a memoir / $c Staceyann Chin.');
  });
});
