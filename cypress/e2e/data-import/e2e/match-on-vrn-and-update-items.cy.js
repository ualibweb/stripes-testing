/* eslint-disable cypress/no-unnecessary-waiting */
import uuid from 'uuid';
import getRandomPostfix from '../../../support/utils/stringTools';
import TestTypes from '../../../support/dictionary/testTypes';
import TopMenu from '../../../support/fragments/topMenu';
import Logs from '../../../support/fragments/data_import/logs/logs';
import MatchOnVRN from '../../../support/fragments/data_import/matchOnVRN';
import FileManager from '../../../support/utils/fileManager';
import SettingsMenu from '../../../support/fragments/settingsMenu';
import Orders from '../../../support/fragments/orders/orders';
import Users from '../../../support/fragments/users/users';
import permissions from '../../../support/dictionary/permissions';
import DevTeams from '../../../support/dictionary/devTeams';
import JobProfiles from '../../../support/fragments/data_import/job_profiles/jobProfiles';
import BasicOrderLine from '../../../support/fragments/orders/basicOrderLine';
import NewOrder from '../../../support/fragments/orders/newOrder';
import Organizations from '../../../support/fragments/organizations/organizations';
import OrderView from '../../../support/fragments/orders/orderView';
import OrderLines from '../../../support/fragments/orders/orderLines';
import Receiving from '../../../support/fragments/receiving/receiving';
import DataImport from '../../../support/fragments/data_import/dataImport';
import FileDetails from '../../../support/fragments/data_import/logs/fileDetails';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';
import MatchProfiles from '../../../support/fragments/data_import/match_profiles/matchProfiles';
import ActionProfiles from '../../../support/fragments/data_import/action_profiles/actionProfiles';
import FieldMappingProfiles from '../../../support/fragments/data_import/mapping_profiles/fieldMappingProfiles';
import InventoryInstances from '../../../support/fragments/inventory/inventoryInstances';
import {
  ACCEPTED_DATA_TYPE_NAMES,
  EXISTING_RECORDS_NAMES,
  ORDER_STATUSES,
  VENDOR_NAMES,
  ACQUISITION_METHOD_NAMES_IN_PROFILE
} from '../../../support/constants';

describe('ui-data-import', () => {
  const item = {
    title: 'Agrarianism and capitalism in early Georgia, 1732-1743 / Jay Jordan Butler.',
    productId: `xyz${getRandomPostfix()}`,
    vrn: uuid(),
    vrnType: 'Vendor order reference number',
    physicalUnitPrice: '20',
    quantityPhysical: '1',
    createInventory: 'Instance, holdings, item'
  };
  const itemBarcode = uuid();
  let vendorId;
  let locationId;
  let acquisitionMethodId;
  let productIdTypeId;
  let materialTypeId;
  let user = null;
  let orderNumber;

  const instanceMappingProfileName = `C350591 Update Instance by VRN match ${getRandomPostfix()}`;
  const holdingsMappingProfileName = `C350591 Update Holdings by VRN match ${getRandomPostfix()}`;
  const itemMappingProfileName = `C350591 Update Item by VRN match ${getRandomPostfix()}`;
  const instanceActionProfileName = `C350591 Action for Instance ${getRandomPostfix()}`;
  const holdingsActionProfileName = `C350591 Action for Holdings ${getRandomPostfix()}`;
  const itemActionProfileName = `C350591 Action for Item ${getRandomPostfix()}`;
  const instanceMatchProfileName = `C350591 Match for Instance ${getRandomPostfix()}`;
  const holdingsMatchProfileName = `C350591 Match for Holdings ${getRandomPostfix()}`;
  const itemMatchProfileName = `C350591 Match for Item ${getRandomPostfix()}`;
  const editedMarcFileName = `marcFileForC350591.${getRandomPostfix()}.mrc`;

  const matchProfiles = [
    {
      name: instanceMatchProfileName,
      existingRecordType: EXISTING_RECORDS_NAMES.INSTANCE,
    },
    {
      name: holdingsMatchProfileName,
      existingRecordType: EXISTING_RECORDS_NAMES.HOLDINGS,
    },
    {
      name: itemMatchProfileName,
      existingRecordType: EXISTING_RECORDS_NAMES.ITEM,
    },
  ];

  const jobProfilesData = {
    name: `C350591 Job profile ${getRandomPostfix()}`,
    dataType: ACCEPTED_DATA_TYPE_NAMES.MARC,
    matches: [
      {
        matchName: instanceMatchProfileName,
        actionName: instanceActionProfileName,
      },
      {
        matchName: holdingsMatchProfileName,
        actionName: holdingsActionProfileName,
      },
      {
        matchName: itemMatchProfileName,
        actionName: itemActionProfileName,
      },
    ]
  };

  before('create test data', () => {
    cy.createTempUser([
      permissions.uiOrdersView.gui,
      permissions.uiOrdersCreate.gui,
      permissions.uiOrdersEdit.gui,
      permissions.uiOrdersDelete.gui,
      permissions.inventoryAll.gui,
      permissions.moduleDataImportEnabled.gui,
      permissions.settingsDataImportEnabled.gui,
      permissions.dataImportDeleteLogs.gui,
      permissions.uiReceivingViewEditCreate.gui,
      permissions.uiInventoryViewInstances.gui,
      permissions.uiQuickMarcQuickMarcBibliographicEditorView.gui,
      permissions.uiInventoryStorageModule.gui,
      permissions.remoteStorageView.gui
    ]).then(userProperties => {
      user = userProperties;
    })
      .then(() => {
        cy.getAdminToken()
          .then(() => {
            Organizations.getOrganizationViaApi({ query: `name="${VENDOR_NAMES.GOBI}"` })
              .then(organization => {
                vendorId = organization.id;
              });
            cy.getMaterialTypes({ query: 'name="book"' })
              .then(materialType => {
                materialTypeId = materialType.id;
              });
            cy.getAcquisitionMethodsApi({ query: `value="${ACQUISITION_METHOD_NAMES_IN_PROFILE.PURCHASE_AT_VENDOR_SYSTEM}"` })
              .then(params => {
                acquisitionMethodId = params.body.acquisitionMethods[0].id;
              });
            cy.getProductIdTypes({ query: 'name=="ISSN"' })
              .then(productIdType => {
                productIdTypeId = productIdType.id;
              });
            cy.getLocations({ query: 'name="Main Library"' })
              .then(res => {
                locationId = res.id;
              });
          })
          .then(() => {
            cy.login(user.username, user.password, { path: TopMenu.ordersPath, waiter: Orders.waitLoading });
          });
      });
  });

  after('delete test data', () => {
    Orders.getOrdersApi({ limit: 1, query: `"poNumber"=="${orderNumber}"` })
      .then(order => {
        Orders.deleteOrderViaApi(order[0].id);
      });
    Users.deleteViaApi(user.userId);
    FileManager.deleteFile(`cypress/fixtures/${editedMarcFileName}`);
    // delete generated profiles
    JobProfiles.deleteJobProfile(jobProfilesData.name);
    MatchProfiles.deleteMatchProfile(instanceMatchProfileName);
    MatchProfiles.deleteMatchProfile(holdingsMatchProfileName);
    MatchProfiles.deleteMatchProfile(itemMatchProfileName);
    ActionProfiles.deleteActionProfile(instanceActionProfileName);
    ActionProfiles.deleteActionProfile(holdingsActionProfileName);
    ActionProfiles.deleteActionProfile(itemActionProfileName);
    FieldMappingProfiles.deleteFieldMappingProfile(instanceMappingProfileName);
    FieldMappingProfiles.deleteFieldMappingProfile(holdingsMappingProfileName);
    FieldMappingProfiles.deleteFieldMappingProfile(itemMappingProfileName);
    InventoryInstances.deleteInstanceAndHoldingRecordAndAllItemsViaApi(itemBarcode);
  });

  it('C350591 Match on VRN and update related Instance, Holdings, Item (folijet)',
    { tags: [TestTypes.smoke, DevTeams.folijet] }, () => {
    // create order with POL
      Orders.createOrderWithOrderLineViaApi(NewOrder.getDefaultOrder(vendorId),
        BasicOrderLine.getDefaultOrderLine(
          item.quantityPhysical,
          item.title,
          locationId,
          materialTypeId,
          acquisitionMethodId,
          item.physicalUnitPrice,
          item.physicalUnitPrice,
          [{
            productId: item.productId,
            productIdType: productIdTypeId
          }],
          [{
            refNumberType: item.vrnType,
            refNumber: item.vrn
          }]
        ))
        .then(res => {
          orderNumber = res;

          Orders.checkIsOrderCreated(orderNumber);
          // open the first PO with POL
          Orders.searchByParameter('PO number', orderNumber);
          Orders.selectFromResultsList(orderNumber);
          Orders.openOrder();
          OrderView.checkIsOrderOpened(ORDER_STATUSES.OPEN);
          OrderView.checkIsItemsInInventoryCreated(item.title, 'Main Library');
          // check receiving pieces are created
          cy.visit(TopMenu.ordersPath);
          Orders.resetFilters();
          Orders.searchByParameter('PO number', orderNumber);
          Orders.selectFromResultsList(orderNumber);
          OrderView.openPolDetails(item.title);
          OrderLines.openReceiving();
          Receiving.checkIsPiecesCreated(item.title);
        });

      DataImport.editMarcFile('marcFileForC350591.mrc', editedMarcFileName, ['14567-1', 'xyzt124245271818912626262'], [item.vrn, itemBarcode]);

      // create field mapping profiles
      cy.visit(SettingsMenu.mappingProfilePath);
      MatchOnVRN.creatMappingProfilesForInstance(instanceMappingProfileName)
        .then(() => {
          MatchOnVRN.creatMappingProfilesForHoldings(holdingsMappingProfileName);
        }).then(() => {
          MatchOnVRN.creatMappingProfilesForItem(itemMappingProfileName);
        });

      // create action profiles
      cy.visit(SettingsMenu.actionProfilePath);
      MatchOnVRN.createActionProfileForVRN(instanceActionProfileName, 'Instance', instanceMappingProfileName);
      MatchOnVRN.createActionProfileForVRN(holdingsActionProfileName, 'Holdings', holdingsMappingProfileName);
      MatchOnVRN.createActionProfileForVRN(itemActionProfileName, 'Item', itemMappingProfileName);

      // create match profiles
      cy.visit(SettingsMenu.matchProfilePath);
      MatchOnVRN.waitJSONSchemasLoad();
      matchProfiles.forEach(match => {
        MatchOnVRN.createMatchProfileForVRN(match);
      });

      // create job profiles
      cy.visit(SettingsMenu.jobProfilePath);
      MatchOnVRN.createJobProfileForVRN(jobProfilesData);

      // import a file
      cy.visit(TopMenu.dataImportPath);
      // TODO delete function after fix https://issues.folio.org/browse/MODDATAIMP-691
      DataImport.verifyUploadState();
      DataImport.checkIsLandingPageOpened();
      DataImport.uploadFile(editedMarcFileName);
      JobProfiles.searchJobProfileForImport(jobProfilesData.name);
      JobProfiles.runImportFile();
      JobProfiles.waitFileIsImported(editedMarcFileName);
      Logs.checkStatusOfJobProfile();
      Logs.openFileDetails(editedMarcFileName);
      FileDetails.checkItemsStatusesInResultList(0, [FileDetails.status.created, FileDetails.status.updated, FileDetails.status.updated, FileDetails.status.updated]);
      FileDetails.checkItemsStatusesInResultList(1, [FileDetails.status.dash, FileDetails.status.noAction, FileDetails.status.noAction, FileDetails.status.noAction]);

      // verify Instance, Holdings and Item details
      MatchOnVRN.clickOnUpdatedHotlink();
      InventoryInstance.waitInstanceRecordViewOpened(item.title);
      MatchOnVRN.verifyInstanceUpdated();
      MatchOnVRN.verifyHoldingsUpdated();
      MatchOnVRN.verifyItemUpdated(itemBarcode);
      MatchOnVRN.verifyMARCBibSource(itemBarcode);
    });
});
