import getRandomPostfix from '../../../support/utils/stringTools';
import TestTypes from '../../../support/dictionary/testTypes';
import DevTeams from '../../../support/dictionary/devTeams';
import permissions from '../../../support/dictionary/permissions';
import Z3950TargetProfiles from '../../../support/fragments/settings/inventory/integrations/z39.50TargetProfiles';
import TopMenu from '../../../support/fragments/topMenu';
import InventoryInstances from '../../../support/fragments/inventory/inventoryInstances';
import SettingsMenu from '../../../support/fragments/settingsMenu';
import ViewTargetProfile from '../../../support/fragments/settings/inventory/integrations/viewTargetProfile';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';
import DataImport from '../../../support/fragments/data_import/dataImport';
import JobProfiles from '../../../support/fragments/data_import/job_profiles/jobProfiles';
import Logs from '../../../support/fragments/data_import/logs/logs';
import FileDetails from '../../../support/fragments/data_import/logs/fileDetails';
import InventorySearchAndFilter from '../../../support/fragments/inventory/inventorySearchAndFilter';
import ReImportModal from '../../../support/fragments/inventory/reImportModal';
import InteractorsTools from '../../../support/utils/interactorsTools';
import InstanceRecordView from '../../../support/fragments/inventory/instanceRecordView';
import Users from '../../../support/fragments/users/users';

describe('ui-inventory', () => {
  let user;
  let instanceHRID;
  let profileId;
  const fileName = `C375126 autotestFile.${getRandomPostfix()}.mrc`;
  const targetProfileName = `C375126 autotest profile${getRandomPostfix()}`;
  const defaultTargetProfileName = 'OCLC WorldCat';
  const profileForOverlay = 'Inventory Single Record - Default Update Instance (Default)';
  const targetProfile = {
    name: 'OCLC WorldCat',
    url: 'zcat.oclc.org/OLUCWorldCat',
    authentification: '100473910/PAOLF',
    externalId: '@attr 1=1211 $identifier',
    internalId: '999ff$i'
  };
  const testIdentifier = '1234567';
  const successCalloutMessage = 'Record 1234567 updated. Results may take a few moments to become visible in Inventory';
  const instanceTitle = 'The Gospel according to Saint Mark : Evangelistib Markusib aglangit.';

  before('create test data', () => {
    cy.loginAsAdmin({ path: TopMenu.dataImportPath, waiter: DataImport.waitLoading });
    cy.getAdminToken().then(() => {
      DataImport.uploadFileViaApi('oneMarcBib.mrc', fileName);
      JobProfiles.waitFileIsImported(fileName);
      Logs.openFileDetails(fileName);
      FileDetails.openInstanceInInventory('Created');
      InventoryInstance.getAssignedHRID().then(initialInstanceHrId => {
        instanceHRID = initialInstanceHrId;
      });
      Z3950TargetProfiles.changeOclcWorldCatValueViaApi('100473910/PAOLF');
      Z3950TargetProfiles.createNewZ3950TargetProfileViaApi(targetProfileName)
        .then(initialId => { profileId = initialId; });
      cy.visit(SettingsMenu.targetProfilesPath);
      Z3950TargetProfiles.openTargetProfile();
      ViewTargetProfile.verifyTargetProfileForm(
        targetProfile.name,
        targetProfile.url,
        targetProfile.authentification,
        targetProfile.externalId,
        targetProfile.internalId
      );
      Z3950TargetProfiles.openTargetProfile(profileId);
      ViewTargetProfile.verifyTargetProfileForm(
        targetProfile.name,
        targetProfile.url,
        targetProfile.authentification,
        targetProfile.externalId,
        targetProfile.internalId
      );
    });
    cy.logout();

    cy.createTempUser([
      permissions.inventoryAll.gui,
      permissions.uiInventorySingleRecordImport.gui,
      permissions.settingsDataImportEnabled.gui
    ])
      .then(userProperties => {
        user = userProperties;

        cy.login(user.username, user.password,
          { path: TopMenu.inventoryPath, waiter: InventoryInstances.waitContentLoading });
      });
  });

  after('delete test data', () => {
    Users.deleteViaApi(user.userId);
    cy.getInstance({ limit: 1, expandAll: true, query: `"hrid"=="${instanceHRID}"` })
      .then((instance) => {
        InventoryInstance.deleteInstanceViaApi(instance.id);
      });
  });

  it('C375126 Verify the modal window for ISRI In inventory instance details menu for multiple target profiles (folijet)',
    { tags: [TestTypes.criticalPath, DevTeams.folijet] }, () => {
      InventorySearchAndFilter.searchInstanceByHRID(instanceHRID);
      InventoryInstance.startOverlaySourceBibRecord();
      ReImportModal.verifyModalWithSeveralTargetProfiles();
      ReImportModal.verifyExternalTargetField(targetProfileName);
      ReImportModal.selectExternalTarget(defaultTargetProfileName);
      ReImportModal.selectTheProfileToBeUsedToOverlayTheCurrentData(profileForOverlay);
      ReImportModal.fillEnterTheTargetIdentifier(testIdentifier);
      ReImportModal.import();
      // need to wait because after the import the data in the instance is displayed for a long time
      // https://issues.folio.org/browse/MODCPCT-73
      cy.wait(10000);
      InteractorsTools.checkCalloutMessage(successCalloutMessage);
      InstanceRecordView.verifyIsInstanceOpened(instanceTitle);
    });
});
