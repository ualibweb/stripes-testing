/* eslint-disable cypress/no-unnecessary-waiting */
import TopMenu from '../../../support/fragments/topMenu';
import testTypes from '../../../support/dictionary/testTypes';
import permissions from '../../../support/dictionary/permissions';
import Users from '../../../support/fragments/users/users';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';
import InventorySearchAndFilter from '../../../support/fragments/inventory/inventorySearchAndFilter';
import Z3950TargetProfiles from '../../../support/fragments/settings/inventory/integrations/z39.50TargetProfiles';
import DevTeams from '../../../support/dictionary/devTeams';
import InventoryViewSource from '../../../support/fragments/inventory/inventoryViewSource';
import InstanceRecordView from '../../../support/fragments/inventory/instanceRecordView';
import { INSTANCE_SOURCE_NAMES } from '../../../support/constants';

let user;
let instanceRecord;
const OCLCAuthentication = '100481406/PAOLF';
const oclcRecordData = {
  title: 'Cooking Light Soups & Stew [electronic resource].',
  language: 'English',
  publisher: 'TI Inc. Books',
  placeOfPublication: 'Chicago',
  publicationDate: '2020',
  physicalDescription: '1 online resource (142 p.)',
  isbn1: '154785474X',
  isbn2: '9781547854745',
  oclc: '1202462670',
  subject: 'Soups',
  notes: { noteType: 'General note', noteContent: 'Description based upon print version of record' }
};

describe('inventory', () => {
  describe('Single record import', () => {
    before('create test data', () => {
      cy.getAdminToken()
        .then(() => {
          Z3950TargetProfiles.changeOclcWorldCatValueViaApi(OCLCAuthentication);
          InventorySearchAndFilter.createInstanceViaApi()
            .then(({ instanceData }) => {
              instanceRecord = instanceData;
            });
        });

      cy.createTempUser([
        permissions.uiInventoryViewCreateEditInstances.gui,
        permissions.uiInventorySingleRecordImport.gui,
        permissions.uiInventorySettingsConfigureSingleRecordImport.gui,
        permissions.uiQuickMarcQuickMarcBibliographicEditorAll.gui,
        permissions.remoteStorageView.gui,
        permissions.settingsDataImportEnabled.gui
      ])
        .then(userProperties => {
          user = userProperties;
          cy.login(user.username, user.password);
        });
    });

    after('delete test data', () => {
      InventoryInstance.deleteInstanceViaApi(instanceRecord.instanceId);
      Users.deleteViaApi(user.userId);
      Z3950TargetProfiles.changeOclcWorldCatToDefaultViaApi();
    });

    it('C343349 Overlay existing Source = FOLIO Instance by import of single MARC Bib record from OCLC (folijet)',
      { tags: [testTypes.smoke, DevTeams.folijet] }, () => {
        cy.visit(TopMenu.inventoryPath);
        InventorySearchAndFilter.searchByParameter('Keyword (title, contributor, identifier, HRID, UUID)', instanceRecord.instanceTitle);
        InventorySearchAndFilter.selectSearchResultItem();
        InventoryInstance.startOverlaySourceBibRecord();
        InventoryInstance.importWithOclc(oclcRecordData.oclc);
        InventoryInstance.checkCalloutMessage(`Record ${oclcRecordData.oclc} updated. Results may take a few moments to become visible in Inventory`);

        // need to wait because after the import the data in the instance is displayed for a long time
        // https://issues.folio.org/browse/MODCPCT-73
        cy.wait(10000);
        InventoryInstance.waitInstanceRecordViewOpened(oclcRecordData.title);
        InventoryInstance.verifyLastUpdatedDate();
        InstanceRecordView.verifyInstanceSource(INSTANCE_SOURCE_NAMES.MARC);
        InventoryInstance.verifyInstanceTitle(oclcRecordData.title);
        InventoryInstance.verifyInstanceLanguage(oclcRecordData.language);
        InventoryInstance.verifyInstancePublisher(0, 0, oclcRecordData.publisher);
        InventoryInstance.verifyInstancePublisher(0, 2, oclcRecordData.placeOfPublication);
        InventoryInstance.verifyInstancePublisher(0, 3, oclcRecordData.publicationDate);
        InventoryInstance.verifyInstancePhysicalcyDescription(oclcRecordData.physicalDescription);
        InventoryInstance.verifyResourceIdentifier('ISBN', oclcRecordData.isbn1, 4);
        InventoryInstance.verifyResourceIdentifier('ISBN', oclcRecordData.isbn2, 5);
        InventoryInstance.verifyInstanceSubject(0, 0, oclcRecordData.subject);
        InventoryInstance.checkInstanceNotes(oclcRecordData.notes.noteType, oclcRecordData.notes.noteContent);

        InventoryInstance.viewSource();
        InventoryViewSource.contains('020\t');
        InventoryViewSource.contains(oclcRecordData.isbn1);
        InventoryViewSource.contains('020\t');
        InventoryViewSource.contains(oclcRecordData.isbn2);
        InventoryViewSource.contains('245\t');
        InventoryViewSource.contains(oclcRecordData.title);
        InventoryViewSource.contains('300\t');
        InventoryViewSource.contains(oclcRecordData.physicalDescription);
        InventoryViewSource.contains('650\t');
        InventoryViewSource.contains(oclcRecordData.subject);
      });
  });
});
