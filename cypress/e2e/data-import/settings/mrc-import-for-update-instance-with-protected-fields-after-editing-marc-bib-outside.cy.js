import getRandomPostfix from '../../../support/utils/stringTools';
import permissions from '../../../support/dictionary/permissions';
import TestTypes from '../../../support/dictionary/testTypes';
import DevTeams from '../../../support/dictionary/devTeams';
import {
  FOLIO_RECORD_TYPE,
  INSTANCE_STATUS_TERM_NAMES,
  ACCEPTED_DATA_TYPE_NAMES,
  EXISTING_RECORDS_NAMES
} from '../../../support/constants';
import SettingsMenu from '../../../support/fragments/settingsMenu';
import FieldMappingProfiles from '../../../support/fragments/data_import/mapping_profiles/fieldMappingProfiles';
import NewMatchProfile from '../../../support/fragments/data_import/match_profiles/newMatchProfile';
import MatchProfiles from '../../../support/fragments/data_import/match_profiles/matchProfiles';
import NewFieldMappingProfile from '../../../support/fragments/data_import/mapping_profiles/newFieldMappingProfile';
import MarcFieldProtection from '../../../support/fragments/settings/dataImport/marcFieldProtection';
import ActionProfiles from '../../../support/fragments/data_import/action_profiles/actionProfiles';
import NewJobProfile from '../../../support/fragments/data_import/job_profiles/newJobProfile';
import JobProfiles from '../../../support/fragments/data_import/job_profiles/jobProfiles';
import TopMenu from '../../../support/fragments/topMenu';
import DataImport from '../../../support/fragments/data_import/dataImport';
import Logs from '../../../support/fragments/data_import/logs/logs';
import FileDetails from '../../../support/fragments/data_import/logs/fileDetails';
import InventoryViewSource from '../../../support/fragments/inventory/inventoryViewSource';
import FileManager from '../../../support/utils/fileManager';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';
import InstanceRecordView from '../../../support/fragments/inventory/instanceRecordView';
import Users from '../../../support/fragments/users/users';

describe('ui-data-import', () => {
  let user;
  let instanceHrid = null;
  const marcFieldProtectionId = [];
  const jobProfileToRun = 'Default - Create instance and SRS MARC Bib';
  const quantityOfItems = '1';
  // unique file names
  const nameMarcFileForCreate = `C356830 autotestFile.${getRandomPostfix()}.mrc`;
  const editedMarcFileName = `C356830 marcFileForMatch.${getRandomPostfix()}.mrc`;

  const protectedFields = {
    firstField: '*',
    secondField: '920'
  };
  const matchProfile = {
    profileName: `C356830 001 to Instance HRID ${getRandomPostfix()}`,
    incomingRecordFields: {
      field: '001'
    },
    matchCriterion: 'Exactly matches',
    existingRecordType: EXISTING_RECORDS_NAMES.INSTANCE,
    instanceOption: NewMatchProfile.optionsList.instanceHrid
  };
  const mappingProfile = {
    name: `C356830 Update instance and check field protections ${getRandomPostfix()}`,
    typeValue: FOLIO_RECORD_TYPE.INSTANCE,
    catalogedDate: '###TODAY###',
    instanceStatus: INSTANCE_STATUS_TERM_NAMES.BATCH_LOADED
  };
  const actionProfile = {
    typeValue: FOLIO_RECORD_TYPE.INSTANCE,
    name: `C356830 Update instance and check field protections ${getRandomPostfix()}`,
    action: 'Update (all record types except Orders, Invoices, or MARC Holdings)'
  };
  const jobProfile = {
    profileName: `C356830 Update instance and check field protections ${getRandomPostfix()}`,
    acceptedType: ACCEPTED_DATA_TYPE_NAMES.MARC
  };

  before('create test user', () => {
    cy.createTempUser([
      permissions.moduleDataImportEnabled.gui,
      permissions.settingsDataImportEnabled.gui,
      permissions.inventoryAll.gui,
      permissions.uiInventorySingleRecordImport.gui,
      permissions.uiInventoryViewCreateEditInstances.gui,
      permissions.uiInventorySettingsConfigureSingleRecordImport.gui,
      permissions.dataExportEnableApp.gui,
      permissions.uiQuickMarcQuickMarcBibliographicEditorAll.gui
    ])
      .then(userProperties => {
        user = userProperties;
        cy.login(user.username, user.password, { path: SettingsMenu.mappingProfilePath, waiter: FieldMappingProfiles.waitLoading });
      });
  });

  after('delete test data', () => {
    JobProfiles.deleteJobProfile(jobProfile.profileName);
    MatchProfiles.deleteMatchProfile(matchProfile.profileName);
    ActionProfiles.deleteActionProfile(actionProfile.name);
    FieldMappingProfiles.deleteFieldMappingProfile(mappingProfile.name);
    // delete created files
    FileManager.deleteFile(`cypress/fixtures/${editedMarcFileName}`);
    Users.deleteViaApi(user.userId);
    marcFieldProtectionId.forEach(field => MarcFieldProtection.deleteMarcFieldProtectionViaApi(field));
    cy.getInstance({ limit: 1, expandAll: true, query: `"hrid"=="${instanceHrid}"` })
      .then((instance) => {
        InventoryInstance.deleteInstanceViaApi(instance.id);
      });
  });

  it('C356830 Test field protections when importing to update instance, after editing the MARC Bib outside of FOLIO (folijet)',
    { tags: [TestTypes.criticalPath, DevTeams.folijet] }, () => {
      MarcFieldProtection.createMarcFieldProtectionViaApi({
        indicator1: '*',
        indicator2: '*',
        subfield: '5',
        data: 'amb',
        source: 'USER',
        field: protectedFields.firstField
      })
        .then((resp) => {
          const id = resp.id;
          marcFieldProtectionId.push = id;
        });
      MarcFieldProtection.createMarcFieldProtectionViaApi({
        indicator1: '*',
        indicator2: '*',
        subfield: '*',
        data: '*',
        source: 'USER',
        field: protectedFields.secondField
      })
        .then((resp) => {
          const id = resp.id;
          marcFieldProtectionId.push = id;
        });

      // create match profile
      cy.visit(SettingsMenu.matchProfilePath);
      MatchProfiles.createMatchProfile(matchProfile);
      MatchProfiles.checkMatchProfilePresented(matchProfile.profileName);

      // create mapping profile
      cy.visit(SettingsMenu.mappingProfilePath);
      FieldMappingProfiles.openNewMappingProfileForm();
      NewFieldMappingProfile.fillSummaryInMappingProfile(mappingProfile);
      NewFieldMappingProfile.fillCatalogedDate(mappingProfile.catalogedDate);
      NewFieldMappingProfile.fillInstanceStatusTerm(mappingProfile.statusTerm);
      FieldMappingProfiles.saveProfile();
      FieldMappingProfiles.closeViewModeForMappingProfile(mappingProfile.name);
      FieldMappingProfiles.checkMappingProfilePresented(mappingProfile.name);

      // create action profile
      cy.visit(SettingsMenu.actionProfilePath);
      ActionProfiles.create(actionProfile, mappingProfile.name);
      ActionProfiles.checkActionProfilePresented(actionProfile.name);

      // create job profile
      cy.visit(SettingsMenu.jobProfilePath);
      JobProfiles.createJobProfile(jobProfile);
      NewJobProfile.linkMatchAndActionProfiles(matchProfile.profileName, actionProfile.name);
      NewJobProfile.saveAndClose();
      JobProfiles.checkJobProfilePresented(jobProfile.profileName);

      // upload a marc file for creating of the new instance
      cy.visit(TopMenu.dataImportPath);
      // TODO delete function after fix https://issues.folio.org/browse/MODDATAIMP-691
      DataImport.verifyUploadState();
      DataImport.uploadFile('marcFileForC356830.mrc', nameMarcFileForCreate);
      JobProfiles.searchJobProfileForImport(jobProfileToRun);
      JobProfiles.runImportFile();
      JobProfiles.waitFileIsImported(nameMarcFileForCreate);
      Logs.openFileDetails(nameMarcFileForCreate);
      [FileDetails.columnNameInResultList.srsMarc, FileDetails.columnNameInResultList.instance].forEach(columnName => {
        FileDetails.checkStatusInColumn(FileDetails.status.created, columnName);
      });
      FileDetails.checkSrsRecordQuantityInSummaryTable(quantityOfItems, 0);
      FileDetails.checkInstanceQuantityInSummaryTable(quantityOfItems, 0);
      FileDetails.openInstanceInInventory('Created');

      // in cypress we can't delete fields in the file that's why using already created file
      // need to get instance hrid and uuids for 999 field for changing file
      InstanceRecordView.getAssignedHRID().then(initialInstanceHrId => {
        instanceHrid = initialInstanceHrId;

        InventoryInstance.viewSource();
        InventoryViewSource.extructDataFrom999Field()
          .then(uuid => {
            // change file using uuid for 999 field
            DataImport.editMarcFile(
              'marcFileForC356830_rev.mrc',
              editedMarcFileName,
              ['instanceHrid', 'srsUuid', 'instanceUuid'],
              [instanceHrid, uuid[0], uuid[1]]
            );
          });
      });

      // upload .mrc file
      cy.visit(TopMenu.dataImportPath);
      // TODO delete function after fix https://issues.folio.org/browse/MODDATAIMP-691
      DataImport.verifyUploadState();
      DataImport.checkIsLandingPageOpened();
      DataImport.uploadFile(editedMarcFileName);
      JobProfiles.searchJobProfileForImport(jobProfile.profileName);
      JobProfiles.runImportFile();
      JobProfiles.waitFileIsImported(editedMarcFileName);
      Logs.checkStatusOfJobProfile();
      Logs.openFileDetails(editedMarcFileName);
      [FileDetails.columnNameInResultList.srsMarc, FileDetails.columnNameInResultList.instance].forEach(columnName => {
        FileDetails.checkStatusInColumn(FileDetails.status.updated, columnName);
      });
      FileDetails.checkSrsRecordQuantityInSummaryTable(quantityOfItems, 1);
      FileDetails.checkInstanceQuantityInSummaryTable(quantityOfItems, 1);

      FileDetails.openInstanceInInventory('Updated');
      InventoryInstance.viewSource();
      InventoryViewSource.verifyFieldInMARCBibSource('650\t', 'Drawing, Dutch ‡y 21st century ‡v Exhibitions. ‡5 amb');
      InventoryViewSource.verifyFieldInMARCBibSource('920\t', 'This field should be protected');
    });
});
