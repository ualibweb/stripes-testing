import uuid from 'uuid';
import { HTML, including } from '@interactors/html';
import {
  Button,
  MultiColumnListCell,
  MultiColumnListHeader,
  MultiSelect,
  Pane,
  IconButton,
  TextArea,
  ValueChipRoot,
  Checkbox,
  TextField,
  Badge,
  Section,
  Heading,
  Spinner
} from '../../../../interactors';
import users from '../users/users';
import inventoryHoldings from '../inventory/holdings/inventoryHoldings';
import ServicePoints from '../settings/tenant/servicePoints/servicePoints';
import Helper from '../finance/financeHelper';

const requestsResultsSection = Section({ id: 'pane-results' });
const appsButton = Button({ id: 'app-list-dropdown-toggle' });

const waitContentLoading = () => {
  cy.expect(Pane({ id:'pane-filter' }).exists());
  cy.expect(Pane({ id:'pane-results' }).find(HTML(including('Choose a filter or enter a search query to show results.'))).exists());
};

/**
 * Creates a request with associated item (instance) and user.
 * Returns created request, item (instance) and user details.
 * @param {string} [itemStatus=Available] - {@link https://s3.amazonaws.com/foliodocs/api/mod-inventory/inventory.html#inventory_items_post}
 * @param {('Page'|'Hold'|'Recall')} [requestType=Page]
 * @param {('Item'|'Title')} [requestLevel=Item]
 * @returns {Object}
 */
function createRequestApi(
  itemStatus = 'Available',
  requestType = 'Page',
  requestLevel = 'Item',
) {
  const userData = {
    active: true,
    barcode: uuid(),
    personal: {
      preferredContactTypeId: '002',
      lastName: `testUser-${uuid()}`,
      email: 'test@folio.org',
      addresses: [{ addressTypeId: null, primaryAddress: true }]
    },
    departments: [],
    patronGroup: null,
  };
  const userRequestPreferences = {
    id: uuid(),
    fulfillment: 'Delivery',
    defaultDeliveryAddressTypeId: null,
    defaultServicePointId: null,
    delivery: true,
    holdShelf: true,
    userId: null,
  };
  const instanceRecordData = {
    instanceTitle: `autoTestInstanceTitle ${Helper.getRandomBarcode()}`,
    itemBarcode: `item-barcode-${uuid()}`,
    instanceId: uuid(),
    itemId: uuid(),
    holdingId: uuid(),
    instanceTypeId: null,
    holdingsTypeId: null,
    permanentLocationId: null,
    sourceId: null,
    permanentLoanTypeId: null,
    materialTypeId: null
  };
  const requestData = {
    id: uuid(),
    requestType,
    requesterId: null,
    holdingsRecordId: instanceRecordData.holdingId,
    instanceId: instanceRecordData.instanceId,
    requestLevel,
    itemId: instanceRecordData.itemId,
    requestDate: new Date().toISOString(),
    fulfilmentPreference: 'Hold Shelf',
    pickupServicePointId: null,
  };
  let createdUser;
  let cancellationReasonId;

  return cy.wrap(Promise.resolve(true))
    .then(() => {
      ServicePoints.getViaApi({ limit: 1, query: 'pickupLocation=="true"' }).then(servicePoints => {
        requestData.pickupServicePointId = servicePoints[0].id;
      });
      cy.getAddressTypesApi({ limit: 1 }).then(addressTypes => {
        userData.personal.addresses[0].addressTypeId = addressTypes[0].id;
        userRequestPreferences.defaultDeliveryAddressTypeId = addressTypes[0].id;
      });
      cy.getUserGroups({ limit: 1 }).then(patronGroup => {
        userData.patronGroup = patronGroup;
      });
      cy.getLoanTypes({ limit: 1 }).then(loanTypes => {
        instanceRecordData.permanentLoanTypeId = loanTypes[0].id;
      });
      cy.getMaterialTypes({ limit: 1 }).then(materialType => {
        instanceRecordData.materialTypeId = materialType.id;
      });
      cy.getLocations({ limit: 1 }).then(location => {
        instanceRecordData.permanentLocationId = location.id;
      });
      cy.getHoldingTypes({ limit: 1 }).then(holdingsTypes => {
        instanceRecordData.holdingsTypeId = holdingsTypes[0].id;
      });
      inventoryHoldings.getHoldingSources({ limit: 1 }).then(holdingsSources => {
        instanceRecordData.sourceId = holdingsSources[0].id;
      });
      cy.getInstanceTypes({ limit: 1 }).then(instanceTypes => {
        instanceRecordData.instanceTypeId = instanceTypes[0].id;
      });
      cy.getCancellationReasonsApi({ limit: 1 }).then(cancellationReasons => {
        cancellationReasonId = cancellationReasons[0].id;
      });
    })
    .then(() => {
      users.createViaApi(userData).then(user => {
        createdUser = user;
        requestData.requesterId = user.id;
        userRequestPreferences.userId = user.id;
      });
    })
    .then(() => {
      cy.createUserRequestPreferencesApi(userRequestPreferences);
    })
    .then(() => {
      cy.createInstance({
        instance: {
          instanceId: instanceRecordData.instanceId,
          instanceTypeId: instanceRecordData.instanceTypeId,
          title: instanceRecordData.instanceTitle,
        },
        holdings: [{
          holdingId: instanceRecordData.holdingId,
          holdingsTypeId: instanceRecordData.holdingsTypeId,
          permanentLocationId: instanceRecordData.permanentLocationId,
          sourceId: instanceRecordData.sourceId,
        }],
        items: [
          [{
            itemId: instanceRecordData.itemId,
            barcode: instanceRecordData.itemBarcode,
            status: { name: itemStatus },
            permanentLoanType: { id: instanceRecordData.permanentLoanTypeId },
            materialType: { id: instanceRecordData.materialTypeId },
          }],
        ],
      });
    })
    .then(() => {
      cy.createItemRequestApi(requestData).then(createdRequest => {
        return {
          createdUser,
          createdRequest,
          instanceRecordData,
          cancellationReasonId
        };
      });
    });
}

function deleteRequestApi(requestId) {
  return cy.okapiRequest({
    method: 'DELETE',
    path: `circulation/requests/${requestId}`,
    isDefaultSearchParamsRequired: false,
  });
}

function getRequestApi(searchParams) {
  return cy
    .okapiRequest({
      path: 'circulation/requests',
      searchParams,
    })
    .then(({ body }) => {
      return body.requests;
    });
}

function updateCirculationRulesApi(ruleText) {
  return cy.okapiRequest({
    method: 'PUT',
    path: 'circulation/rules',
    body: { rulesAsText: ruleText },
    isDefaultSearchParamsRequired: false,
  });
}

function setRequestPolicyApi(requestTypes = ['Page', 'Hold', 'Recall']) {
  /**
   * rule comes in bespoke text format, and we need to update 'r <someId>' part.
   * rulesAsText: "priority: number-of-criteria, criterium (t, s, c, b, a, m, g), last-line\n
                  fallback-policy: ... r 334e5a9e-94f9-4673-8d1d-ab552863886b ..."
   */
  const regexp = /(?<=\s)r\s+[a-zA-Z0-9-]+(?=\s)/;
  let oldRulesAsText;

  return cy.okapiRequest({
    path: 'circulation/rules',
    isDefaultSearchParamsRequired: false,
  })
    .then(({ body: rule }) => {
      oldRulesAsText = rule.rulesAsText;
      cy.okapiRequest({
        method: 'POST',
        path: 'request-policy-storage/request-policies',
        body: { id: uuid(), name: `test_all_${uuid().substring(0, 6)}`, requestTypes },
      })
        .then(({ body: policy }) => {
          rule.rulesAsText = rule.rulesAsText.replace(regexp, `r ${policy.id}`);
          updateCirculationRulesApi(rule.rulesAsText).then(() => ({ oldRulesAsText, policy }));
        });
    });
}

function deleteRequestPolicyApi(policyId) {
  return cy.okapiRequest({
    method: 'DELETE',
    path: `request-policy-storage/request-policies/${policyId}`,
    isDefaultSearchParamsRequired: false,
  });
}

export default {
  createRequestApi,
  deleteRequestApi,
  setRequestPolicyApi,
  deleteRequestPolicyApi,
  updateCirculationRulesApi,
  getRequestApi,
  waitContentLoading,

  removeCreatedRequest() {
    cy.do([
      Pane({ title: 'Request Detail' }).find(Button('Actions')).click(),
      Button({ id: 'clickable-cancel-request' }).click(),
      TextArea('Additional information for patron *').fillIn('test'),
      Button('Confirm').click(),
    ]);
  },

  findCreatedRequest(title) {
    cy.do(TextField({ id: 'input-request-search' }).fillIn(title));
    cy.do(Pane({ title: 'Search & filter' }).find(Button('Search')).click());
  },

  resetAllFilters() {
    cy.do(Button('Reset all').click());
  },

  selectAwaitingDeliveryRequest() {
    cy.do(Checkbox({ name: 'Open - Awaiting delivery' }).click());
  },

  selectAwaitingPickupRequest() {
    cy.do(Checkbox({ name: 'Open - Awaiting pickup' }).click());
  },

  selectInTransitRequest() {
    cy.do(Checkbox({ name: 'Open - In transit' }).click());
  },

  selectNotYetFilledRequest() {
    cy.do(Checkbox({ name: 'Open - Not yet filled' }).click());
  },

  selectAllOpenRequests() {
    this.selectAwaitingDeliveryRequest();
    this.selectAwaitingPickupRequest();
    this.selectInTransitRequest();
    this.selectNotYetFilledRequest();
  },

  selectFirstRequest(title) {
    cy.do(Pane({ title: 'Requests' }).find(MultiColumnListCell({ row: 0, content: title })).click());
  },

  openTagsPane() {
    cy.do(Button({ id: 'clickable-show-tags' }).click());
  },

  selectTags(tag) {
    this.waitLoadingTags();
    cy.do(Pane({ title: 'Tags' }).find(MultiSelect()).select(tag));
  },

  closePane(title) {
    cy.do(Pane({ title }).find(IconButton({ ariaLabel: 'Close ' })).click());
  },

  verifyAssignedTags(tag) {
    cy.expect(Spinner().absent());
    cy.expect(Button({ id: 'clickable-show-tags' }).find(Badge()).has({ value: '1' }));
    cy.expect(Pane({ title: 'Tags' }).find(ValueChipRoot(tag)).exists());
  },

  waitLoadingTags() {
    cy.expect(Pane({ title: 'Tags' }).exists());
    cy.intercept({
      method: 'GET',
      url: '/tags?limit=10000',
    }).as('getTags');
    cy.wait('@getTags');
  },

  requestTypes: { PAGE: 'Page', HOLD: 'Hold', RECALL: 'Recall' },

  selectHoldsRequestType() {
    cy.do(Checkbox({ name: 'Hold' }).click());
  },

  selectPagesRequestType() {
    cy.do(Checkbox({ name: 'Page' }).click());
  },

  selectRecallsRequestType() {
    cy.do(Checkbox({ name: 'Recall' }).click());
  },

  REQUEST_TYPE_CELL: { columnIndex: 5 },
  verifyIsFilteredByRequestType(requestType) {
    const values = [];
    cy.get('[data-row-index]').each($row => {
      cy.get(`[class*="mclCell-"]:nth-child(${this.REQUEST_TYPE_CELL.columnIndex})`, { withinSubject: $row })
        .invoke('text')
        .then(cellValue => {
          values.push(cellValue);
        });
    })
      .then(() => {
        const isFiltered = values.every(value => value === requestType);
        expect(isFiltered).to.equal(true);
      });
  },

  waitUIFilteredByRequestType() {
    cy.intercept('GET', 'circulation/requests*').as('getFilteredRequests');
    cy.wait('@getFilteredRequests');
  },

  verifyCreatedRequest(title) {
    cy.expect(Pane({ title: 'Requests' }).find(MultiColumnListCell({ row: 0, content: title })).exists());
  },

  verifyNoResultMessage(noResultMessage) {
    cy.expect(requestsResultsSection.find(HTML(including(noResultMessage))).exists());
  },

  navigateToApp(appName) {
    cy.do([appsButton.click(), Button(appName).click()]);
  },

  checkRequestType(requestType) {
    if (requestType === this.requestTypes.PAGE) {
      this.selectPagesRequestType();
    } else if (requestType === this.requestTypes.HOLD) {
      this.selectHoldsRequestType();
    } else if (requestType === this.requestTypes.RECALL) {
      this.selectRecallsRequestType();
    }
  },

  verifyRequestTypeChecked(requestType) {
    if (requestType === this.requestTypes.PAGE) {
      cy.expect(Checkbox({ name: 'Page' }).has({ checked: true }));
    } else if (requestType === this.requestTypes.HOLD) {
      cy.expect(Checkbox({ name: 'Hold' }).has({ checked: true }));
    } else if (requestType === this.requestTypes.RECALL) {
      cy.expect(Checkbox({ name: 'Recall' }).has({ checked: true }));
    }
  },

  sortingColumns: [
    {
      title: 'Title',
      id: 'title',
      columnIndex: 2,
    },
    {
      title: 'Type',
      id: 'type',
      columnIndex: 5,
    },
    {
      title: 'Item barcode',
      id: 'itembarcode',
      columnIndex: 4,
    },
    {
      title: 'Requester',
      id: 'requester',
      columnIndex: 8,
    },
    {
      title: 'Requester Barcode',
      id: 'requesterbarcode',
      columnIndex: 9,
    },
  ],

  checkAllRequestTypes() {
    Object.values(this.requestTypes).forEach(requestType => {
      cy.do(Checkbox({ name: requestType }).click());
      cy.wait('@getRequests');
    });
  },

  validateRequestTypesChecked() {
    cy.expect(Checkbox({ name: 'Recall' }).checked);
    cy.expect(Checkbox({ name: 'Page' }).checked);
    cy.expect(Checkbox({ name: 'Hold' }).checked);
  },

  validateNumsAscendingOrder(prev) {
    const itemsClone = [...prev];
    itemsClone.sort((a, b) => a - b);
    cy.expect(itemsClone).to.deep.equal(prev);
  },

  validateNumsDescendingOrder(prev) {
    const itemsClone = [...prev];
    itemsClone.sort((a, b) => b - a);
    cy.expect(itemsClone).to.deep.equal(prev);
  },

  validateStringsAscendingOrder(prev) {
    const itemsClone = [...prev];

    itemsClone.sort((a, b) => {
      // when sorting move falsy values to the end and localeCompare truthy values
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b);
    });

    expect(prev).to.deep.equal(itemsClone);
  },

  validateStringsDescendingOrder(prev) {
    const itemsClone = [...prev];
    // when sorting move falsy values to the beginning and localeCompare truthy values
    itemsClone.sort((a, b) => {
      if (!a) return -1;
      if (!b) return 1;
      return b.localeCompare(a);
    });
    expect(prev).to.deep.equal(itemsClone);
  },

  // TODO: redesign to interactors
  getMultiColumnListCellsValues(cell) {
    const cells = [];
    // get MultiColumnList rows and loop over
    return cy.get('[data-row-index]').each($row => {
      // from each row, choose specific cell
      cy.get(`[class*="mclCell-"]:nth-child(${cell})`, { withinSubject: $row })
      // extract its text content
        .invoke('text')
        .then(cellValue => {
          cells.push(cellValue);
        });
    })
      .then(() => cells);
  },

  getSortOrder(headerId) {
    let order;
    return cy.do(MultiColumnListHeader({ id: 'list-column-' + headerId }).perform(el => {
      order = el.attributes.getNamedItem('aria-sort').value;
    })).then(() => order);
  },

  validateRequestsDateSortingOrder(order) {
    this.getMultiColumnListCellsValues(1).then(cells => {
      const dates = cells.map(cell => new Date(cell));
      if (order === 'ascending') this.validateNumsAscendingOrder(dates);
      else if (order === 'descending') this.validateNumsDescendingOrder(dates);
    });
  },

  validateRequestsSortingOrder({ headerId, columnIndex }) {
    this.waitLoadingRequests();

    this.getSortOrder(headerId).then(order => {
      this.getMultiColumnListCellsValues(columnIndex).then(cells => {
        if (order === 'ascending') this.validateStringsAscendingOrder(cells);
        else if (order === 'descending') this.validateStringsDescendingOrder(cells);
      });
    });
  },

  verifyRequestsPage() {
    cy.expect(Heading({ level: 2, text: 'Requests' }).exists());
  },

  verifyFulfillmentPreference() {
    cy.expect(cy.get('[name="fulfilmentPreference"]').find('option:selected').should('have.text', 'Hold Shelf'));
  },

  waitLoadingRequests() {
    cy.wait('@getRequests');
    /*
      ***
        - REASON: cy.wait(300)
        It awaits for the api to resolve but as previous MultiColumnCellValues are already present
        It does not wait for UI to update cellValues and some test fails randomly.
        cy.wait(300) awaits for UI to update.
      ***
    */

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
  },

  getRequestIdViaApi: (searchParams) => cy.okapiRequest({
    path: 'circulation/requests',
    searchParams
  }).then(res => res.body.requests[0].id)
};
