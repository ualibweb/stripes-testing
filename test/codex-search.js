/* global it describe */

const Nightmare = require('nightmare');
const config = require('../folio-ui.config.js');
const helpers = require('../helpers.js');

describe('Load test-codexsearch', function runMain() {
  this.timeout(Number(config.test_timeout));

  const nightmare = new Nightmare(config.nightmare);
  const title = 'Bridget';
  // const pageLoadPeriod = 2000;
  const actionLoadPeriod = 222;
  const searchResultsTitleSelector = `#list-search div[role="gridcell"][title*="${title}"]`;
  const resultCountSelector = `#paneHeaderpane-results-subtitle span`;
  const filterCheckBoxSelector = `#clickable-filter-type-Audio`;
  const resetButtonLabel = 'Reset all';
  const resetButtonSelector = 'button > span';

  describe('Login > Codex Search > Confirm Results > Reset Search > Confirm Reset > Logout\n', () => {
    it(`should login as ${config.username}/${config.password}`, (done) => {
      helpers.login(nightmare, config, done);
    });

    it('should open codex search and execute search', (done) => {
      nightmare
        .click('#clickable-search-module')
        .wait('#input-record-search')
        .type('#input-record-search', title)
        .wait(searchResultsTitleSelector)
        .then(done)
        .catch(done);
    });

    /* it('should confirm search results', (done) => {
      nightmare
        .wait(searchResultsTitleSelector)
        .evaluate(function csearch(selector, itemTitle) {
          const firstResult = document.querySelector(selector).title; // the entered title should be the first result
          if (firstResult !== itemTitle) {
            throw new Error(`Title not found in first position. Title found is (${firstResult})`);
          }
        }, searchResultsTitleSelector, title)
        .then((result) => { done(); })
        .catch(done);
    }); */

    it('should filter results', (done) => {

      nightmare
        .evaluate(resultSelectorBeforeClick=>{
          const matchBeforClick = document.querySelector(resultSelectorBeforeClick);
          const countTextBeforeClick = matchBeforClick.innerText;
          return parseInt(countTextBeforeClick.substr(0, countTextBeforeClick.indexOf(' ')));
        }, resultCountSelector)
        .then((resultCountBeforeClick)=>{

          nightmare
            .click(filterCheckBoxSelector)
            .wait(10000)
            .evaluate((filterCheckBoxSelector, resultSelectorAfterClick)=>{

              const filterCheckBox = document.querySelector(filterCheckBoxSelector);

              if(!filterCheckBox.checked) {
                throw new Error(`Filter not activated: filterCheckBox.checked = ${filterCheckBox.checked}`);
              }

              const matchAfterClick = document.querySelector(resultSelectorAfterClick);
              const countTextAfterClick = matchAfterClick.innerText;
              return parseInt(countTextAfterClick.substr(0, countTextAfterClick.indexOf(' ')));
            }, filterCheckBoxSelector, resultCountSelector)
            .then(resultCountAfterClick=>{
              if(resultCountBeforeClick <= resultCountAfterClick) {
                throw new Error(`Results were not reduced by filtering: resultCountBeforeClick: ${resultCountBeforeClick}, resultCountAfterClick: ${resultCountAfterClick}`);
              }
              done();
            })
            .catch(done);
        })
        .catch(done);

    });

    it('should reset search', (done) => {
      nightmare
        .evaluate(function rsearch(resetLabel, resetSelector) {
          const matches = document.querySelectorAll(resetSelector);
          let found = false;
          if (matches.length === 0) {
            throw new Error('No buttons found');
          }
          matches.forEach(function codexClick(currentValue, currentIndex, listObj) {
            if (currentValue.textContent === resetLabel) {
              currentValue.click();
              found = true;
            }
          });
          if (!found) {
            throw new Error('Reset all button not found');
          }
        }, resetButtonLabel, resetButtonSelector)
        .then((result) => { done(); })
        .catch(done);
    });

    it('should confirm reset search', (done) => {
      // #input-record-search should be empty and Reset all disappears
      nightmare
        .wait(actionLoadPeriod)
        .evaluate(function confReset(selector) {
          const searchField = document.querySelector(selector);
          if (searchField.value.length > 0) {
            throw new Error('Input field not cleared on reset');
          }
        }, '#input-record-search')
        .evaluate(function confResetAgain(resetLabel, resetSelector) {
          const matches = document.querySelectorAll(resetSelector);
          matches.forEach(function confResetEach(currentValue, currentIndex, listObj) {
            if (currentValue.textContent === resetLabel) {
              throw new Error('Reset all button is visible');
            }
          });
        }, resetButtonLabel, resetButtonSelector)
        .then((result) => { done(); })
        .catch(done);
    });

    it('should logout', (done) => {
      helpers.logout(nightmare, config, done);
    });
  });
});
