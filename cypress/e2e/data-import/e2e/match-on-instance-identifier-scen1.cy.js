import TestTypes from '../../../support/dictionary/testTypes';
import DevTeams from '../../../support/dictionary/devTeams';
import { FOLIO_RECORD_TYPE,
  INSTANCE_STATUS_TERM_NAMES,
  ACCEPTED_DATA_TYPE_NAMES,
  EXISTING_RECORDS_NAMES,
  JOB_STATUS_NAMES } from '../../../support/constants';
import TopMenu from '../../../support/fragments/topMenu';
import getRandomPostfix from '../../../support/utils/stringTools';
import DataImport from '../../../support/fragments/data_import/dataImport';
import JobProfiles from '../../../support/fragments/data_import/job_profiles/jobProfiles';
import Logs from '../../../support/fragments/data_import/logs/logs';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';
import SettingsMenu from '../../../support/fragments/settingsMenu';
import MatchProfiles from '../../../support/fragments/data_import/match_profiles/matchProfiles';
import FieldMappingProfiles from '../../../support/fragments/data_import/mapping_profiles/fieldMappingProfiles';
import NewFieldMappingProfile from '../../../support/fragments/data_import/mapping_profiles/newFieldMappingProfile';
import ActionProfiles from '../../../support/fragments/data_import/action_profiles/actionProfiles';
import InstanceRecordView from '../../../support/fragments/inventory/instanceRecordView';
import InventorySearchAndFilter from '../../../support/fragments/inventory/inventorySearchAndFilter';
import permissions from '../../../support/dictionary/permissions';
import FileDetails from '../../../support/fragments/data_import/logs/fileDetails';
import Users from '../../../support/fragments/users/users';

describe('ui-data-import', () => {
  let userId;
  const fileNameForCreateInstance = `C347828autotestFile.${getRandomPostfix()}.mrc`;
  const fileNameForUpdateInstance = `C347828autotestFile.${getRandomPostfix()}.mrc`;
  const jobProfileToRun = 'Default - Create instance and SRS MARC Bib';
  const instanceGeneralNote = 'IDENTIFIER UPDATE 1';
  const resourceIdentifiers = [
    { type: 'UPC', value: 'ORD32671387-4' },
    { type: 'OCLC', value: '(OCoLC)84714376518561876438' },
    { type: 'Invalid UPC', value: 'ORD32671387-4' },
    { type: 'System control number', value: '(AMB)84714376518561876438' },
  ];
  const matchProfile = {
    profileName: `autotestMatchProf${getRandomPostfix()}`,
    incomingRecordFields: {
      field: '024',
      in1: '1',
      in2: '*',
      subfield: 'a'
    },
    matchCriterion: 'Exactly matches',
    existingRecordType: EXISTING_RECORDS_NAMES.INSTANCE,
    instanceOption: 'Identifier: UPC',
  };
  const mappingProfile = {
    name: `autotestMappingProf${getRandomPostfix()}`,
    typeValue: FOLIO_RECORD_TYPE.INSTANCE,
    suppressFromDiscavery: 'Mark for all affected records',
    catalogedDate: '"2021-12-01"',
    catalogedDateUI: '2021-12-01',
    instanceStatus: INSTANCE_STATUS_TERM_NAMES.BATCH_LOADED,
  };
  const actionProfile = {
    name: `autotestActionProf${getRandomPostfix()}`,
    typeValue: FOLIO_RECORD_TYPE.INSTANCE,
    action: 'Update (all record types except Orders, Invoices, or MARC Holdings)'
  };
  const jobProfile = {
    profileName: `autotestJobProf${getRandomPostfix()}`,
    acceptedType: ACCEPTED_DATA_TYPE_NAMES.MARC
  };

  before('create test data', () => {
    cy.createTempUser([
      permissions.moduleDataImportEnabled.gui,
      permissions.dataImportDeleteLogs.gui,
      permissions.inventoryAll.gui,
      permissions.settingsDataImportEnabled.gui,
      permissions.viewEditDeleteInvoiceInvoiceLine.gui,
      permissions.viewEditCreateInvoiceInvoiceLine.gui,
      permissions.assignAcqUnitsToNewInvoice.gui,
      permissions.invoiceSettingsAll.gui,
    ])
      .then(userProperties => {
        userId = userProperties.userId;
        cy.login(userProperties.username, userProperties.password, {
          path: TopMenu.dataImportPath,
          waiter: DataImport.waitLoading
        });

        InventorySearchAndFilter.getInstancesByIdentifierViaApi(resourceIdentifiers[0].value)
          .then(instances => {
            instances.forEach(({ id }) => {
              InventoryInstance.deleteInstanceViaApi(id);
            });
          });
      });
  });

  after('delete test data', () => {
    Users.deleteViaApi(userId);
    // delete profiles
    JobProfiles.deleteJobProfile(jobProfile.profileName);
    MatchProfiles.deleteMatchProfile(matchProfile.profileName);
    ActionProfiles.deleteActionProfile(actionProfile.name);
    FieldMappingProfiles.deleteFieldMappingProfile(mappingProfile.name);
  });

  it('C347828 MODDICORE-231 "Match on Instance identifier match meets both the Identifier type and Data requirements" Scenario 1 (folijet)',
    { tags: [TestTypes.criticalPath, DevTeams.folijet] }, () => {
      // TODO delete function after fix https://issues.folio.org/browse/MODDATAIMP-691
      DataImport.verifyUploadState();
      DataImport.uploadFile('marcFileForMatchOnIdentifierForCreate.mrc', fileNameForCreateInstance);
      JobProfiles.searchJobProfileForImport(jobProfileToRun);
      JobProfiles.runImportFile();
      JobProfiles.waitFileIsImported(fileNameForCreateInstance);
      Logs.checkStatusOfJobProfile(JOB_STATUS_NAMES.COMPLETED);
      Logs.openFileDetails(fileNameForCreateInstance);
      Logs.clickOnHotLink(0, 3, 'Created');
      InventoryInstance.verifyResourceIdentifier(resourceIdentifiers[0].type, resourceIdentifiers[0].value, 6);
      InventoryInstance.verifyResourceIdentifier(resourceIdentifiers[1].type, resourceIdentifiers[1].value, 4);
      cy.go('back');
      Logs.clickOnHotLink(1, 3, 'Created');
      InventoryInstance.verifyResourceIdentifier(resourceIdentifiers[2].type, resourceIdentifiers[2].value, 0);
      InventoryInstance.verifyResourceIdentifier(resourceIdentifiers[3].type, resourceIdentifiers[3].value, 3);

      cy.visit(SettingsMenu.matchProfilePath);
      MatchProfiles.createMatchProfile(matchProfile);
      MatchProfiles.checkMatchProfilePresented(matchProfile.profileName);

      cy.visit(SettingsMenu.mappingProfilePath);
      FieldMappingProfiles.openNewMappingProfileForm();
      NewFieldMappingProfile.fillSummaryInMappingProfile(mappingProfile);
      NewFieldMappingProfile.addSuppressFromDiscovery(mappingProfile.suppressFromDiscavery);
      NewFieldMappingProfile.fillCatalogedDate(mappingProfile.catalogedDate);
      NewFieldMappingProfile.fillInstanceStatusTerm(mappingProfile.instanceStatus);
      FieldMappingProfiles.saveProfile();
      FieldMappingProfiles.closeViewModeForMappingProfile(mappingProfile.name);
      FieldMappingProfiles.checkMappingProfilePresented(mappingProfile.name);

      cy.visit(SettingsMenu.actionProfilePath);
      ActionProfiles.create(actionProfile, mappingProfile.name);
      ActionProfiles.checkActionProfilePresented(actionProfile.name);

      cy.visit(SettingsMenu.jobProfilePath);
      JobProfiles.createJobProfileWithLinkingProfiles(jobProfile, actionProfile.name, matchProfile.profileName);
      JobProfiles.checkJobProfilePresented(jobProfile.profileName);

      cy.visit(TopMenu.dataImportPath);
      // TODO delete function after fix https://issues.folio.org/browse/MODDATAIMP-691
      DataImport.verifyUploadState();
      DataImport.uploadFile('marcFileForMatchOnIdentifierForUpdate_1.mrc', fileNameForUpdateInstance);
      JobProfiles.searchJobProfileForImport(jobProfile.profileName);
      JobProfiles.runImportFile();
      JobProfiles.waitFileIsImported(fileNameForUpdateInstance);
      Logs.checkStatusOfJobProfile(JOB_STATUS_NAMES.COMPLETED);
      Logs.openFileDetails(fileNameForUpdateInstance);
      Logs.verifyInstanceStatus(0, 3, 'Updated');
      Logs.verifyInstanceStatus(1, 3, FileDetails.status.noAction);
      Logs.clickOnHotLink(0, 3, 'Updated');
      InstanceRecordView.verifyMarkAsSuppressedFromDiscovery();
      InstanceRecordView.verifyInstanceStatusTerm(mappingProfile.instanceStatus);
      InstanceRecordView.verifyCatalogedDate(mappingProfile.catalogedDateUI);
      InstanceRecordView.verifyGeneralNoteContent(instanceGeneralNote);
    });
});
